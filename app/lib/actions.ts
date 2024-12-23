'use server';

import bcrypt from 'bcrypt';
import { registerSchema, doesUserExist, addUser } from '@/register';
import { z } from 'zod';
import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { signIn } from '@/auth';
import { AuthError } from 'next-auth';
import { getCurrentUserId } from './auth';
import { writeFile, unlink } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string({
    invalid_type_error: '请选择一个对象。',
  }),
  amount: z.coerce
    .number()
    .gt(0, { message: '请输入大于 $0 的金额。' }),
  status: z.enum(['pending', 'paid', 'income'], {
    invalid_type_error: '请选择状态。',
  }),
  date: z.string(),
  notes: z.string().optional(),
});

// 修改 CustomerSchema
const CustomerSchema = z.object({
  id: z.string(),
  name: z.string({
    invalid_type_error: '请输入对象名称。',
  }).min(1, { message: '名称不能为空' }),
  email: z.string().email({
    message: '请输入有效的邮箱地址。',
  }),
  image_url: z.instanceof(File, { message: "请上传图片文件" }).optional(),
});

const CreateInvoice = FormSchema.omit({ id: true, date: true });
const UpdateInvoice = FormSchema.omit({ date: true, id: true });
const CreateCustomer = CustomerSchema.omit({ id: true });

export type InvoiceState = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};

export type CustomerState = {
  errors?: {
    name?: string[];
    email?: string[];
    image_url?: string[];
  };
  message?: string | null;
}

export async function createInvoice(prevState: InvoiceState, formData: FormData) {
  const validatedFields = CreateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
    notes: formData.get('notes'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: '缺少字段。创建失败。',
    };
  }

  const { customerId, amount, status, notes } = validatedFields.data;
  const amountInCents = amount * 100;
  // 获取表单中的时间
  const reminderTime = formData.get('reminderTime') as string;
  const date = reminderTime ? new Date(reminderTime).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
  const userId = await getCurrentUserId();

  try {
    await sql`BEGIN`;
    await sql`
        INSERT INTO invoices (customer_id, amount, status, date, notes, user_id)
        VALUES (${customerId}, ${amountInCents}, ${status}, ${date}, ${notes}, ${userId})
    `;

    console.log('status:', status);

    // 如果是收入状态，则更新 revenue 表对应月份的收入
    if (status === 'income') {
      const month = (new Date(date).getMonth() + 1).toString();
      await sql`
          UPDATE revenue 
          SET revenue = revenue + ${amountInCents}
          WHERE month = ${month} AND user_id = ${userId}
      `;
    }
    await sql`COMMIT`;
  } catch (error) {
    await sql`ROLLBACK`;
    console.error('Error creating invoice:', error);
    return {
      message: '数据库错误：创建失败。',
    };
  }

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function updateInvoice(
  id: string,
  prevState: InvoiceState,
  formData: FormData,
) {
  const validatedFields = UpdateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
    notes: formData.get('notes'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: '缺少字段。更新开支失败。',
    };
  }

  const { customerId, amount, status, notes } = validatedFields.data;
  const amountInCents = amount * 100;
  const userId = await getCurrentUserId();

  try {
    await sql`BEGIN`;
    
    // 获取原始发票信息
    const oldInvoice = await sql`
      SELECT status, amount, date FROM invoices WHERE id = ${id}
    `;
    const oldStatus = oldInvoice.rows[0].status;
    const oldAmount = oldInvoice.rows[0].amount;
    const date = oldInvoice.rows[0].date;
    const month = (new Date(date).getMonth() + 1).toString();

    // 更新发票
    await sql`
      UPDATE invoices
      SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}, notes = ${notes}
      WHERE id = ${id}
    `;

    // 处理收入表的更新
    if (oldStatus === 'income' && status !== 'income') {
      // 如果从收入改为其他状态，减少收入
      await sql`
        UPDATE revenue 
        SET revenue = revenue - ${oldAmount}
        WHERE month = ${month} AND user_id = ${userId}
      `;
    } else if (oldStatus !== 'income' && status === 'income') {
      // 如果从其他状态改为收入，增加收入
      await sql`
        UPDATE revenue 
        SET revenue = revenue + ${amountInCents}
        WHERE month = ${month} AND user_id = ${userId}
      `;
    } else if (oldStatus === 'income' && status === 'income' && oldAmount !== amountInCents) {
      // 如果状态不变但金额改变，更新差额
      const difference = amountInCents - oldAmount;
      await sql`
        UPDATE revenue 
        SET revenue = revenue + ${difference}
        WHERE month = ${month} AND user_id = ${userId}
      `;
    }

    await sql`COMMIT`;
  } catch (error) {
    await sql`ROLLBACK`;
    return { message: '数据库错误：更新开支失败。' };
  }

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
  try {
    await sql`BEGIN`;

    // 获取发票信息
    const invoice = await sql`
      SELECT status, amount, date, user_id FROM invoices WHERE id = ${id}
    `;
    
    if (invoice.rows[0].status === 'income') {
      // 如果是收入，从收入表中减去相应金额
      const date = invoice.rows[0].date;
      const month = (new Date(date).getMonth() + 1).toString();
      const amount = invoice.rows[0].amount;
      const userId = invoice.rows[0].user_id;

      await sql`
        UPDATE revenue 
        SET revenue = revenue - ${amount}
        WHERE month = ${month} AND user_id = ${userId}
      `;
    }

    // 删除发票
    await sql`DELETE FROM invoices WHERE id = ${id}`;
    
    await sql`COMMIT`;
    revalidatePath('/dashboard/invoices');
    return { message: '删除开支成功' };
  } catch (error) {
    await sql`ROLLBACK`;
    return { message: '数据库错误：删除开支失败。' };
  }
}

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    await signIn('credentials', formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return '无效的用户名或密码。';
        default:
          return '出现未知错误。';
      }
    }
    throw error;
  }
}

export async function register(
  state: { errorMessage?: string } | undefined,
  formData: FormData
): Promise<{ errorMessage?: string } | undefined> {
  try {
    const parsedData = registerSchema.safeParse({
      name: formData.get('name'),
      email: formData.get('email'),
      password: formData.get('password'),
      confirmPassword: formData.get('confirm-password'),
    });

    if (!parsedData.success) {
      return { errorMessage: 'Invalid data' };
    }

    const { name, email, password, confirmPassword } = parsedData.data;

    if (password !== confirmPassword) {
      return { errorMessage: 'Passwords do not match' };
    }

    // 检查用户是否已经存在
    const userExists = await doesUserExist(email);
    if (userExists) {
      return { errorMessage: 'User already exists' };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await addUser(name, email, hashedPassword);

    // 重新验证用户页面的缓存并重定向用户。
    // revalidatePath('/dashboard/users');
    // redirect('/login');
  } catch (error) {
    return { errorMessage: 'Failed to register user' };
  }
}

// 修改 createCustomer 函数
export async function createCustomer(prevState: CustomerState, formData: FormData) {
  const image = formData.get('image_url') as File;

  const validatedFields = CreateCustomer.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    image_url: image,
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: '缺少字段。创建对象失败。',
    };
  }

  try {
    const { name, email } = validatedFields.data;

    // 处理图片保存
    let image_url = '/customers/default-avatar.png'; // 默认头像

    if (image && image.size > 0) {
      // 生成唯一的文件名
      const fileExt = image.name.split('.').pop();
      const randomStr = crypto.randomBytes(8).toString('hex');
      const fileName = `${name.toLowerCase().replace(/\s+/g, '-')}-${randomStr}.${fileExt}`;

      // 直接使用相对路径保存文件
      const filePath = path.join('public', 'customers', fileName);

      // 将文件内容转换为 Buffer
      const bytes = await image.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // 保存文件
      await writeFile(filePath, new Uint8Array(buffer));

      // 设置数据库中存储的路径
      image_url = `/customers/${fileName}`;
    }

    await sql`
      INSERT INTO customers (name, email, image_url, user_id)
      VALUES (${name}, ${email}, ${image_url}, ${await getCurrentUserId()})
    `;
  } catch (error) {
    console.error('Error creating customer:', error);
    return {
      message: '创建对象失败：' + (error instanceof Error ? error.message : String(error)),
    };
  }

  revalidatePath('/dashboard/customers');
  redirect('/dashboard/customers');
}

export async function updateCustomer(
  id: string,
  prevState: CustomerState,
  formData: FormData
) {
  const image = formData.get('image_url') as File;

  // 使用 Zod 验证表单字段（暂时忽略 image_url 的验证）
  const validatedFields = CustomerSchema.omit({ image_url: true }).safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: '缺少字段。更新对象失败。',
    };
  }

  const { name, email } = validatedFields.data;
  try {
    // 获取当前客户信息
    const currentCustomer = await sql`
      SELECT image_url FROM customers WHERE id = ${id}
    `;
    
    let image_url = currentCustomer.rows[0]?.image_url;

    // 如果上传了新图片
    if (image && image.size > 0) {
      // 如果存在旧图片且不是默认头像，则删除
      if (image_url && !image_url.includes('default-avatar')) {
        const oldFilePath = path.join(process.cwd(), 'public', image_url);
        try {
          await unlink(oldFilePath);
        } catch (error) {
          console.error('Error deleting old file:', error);
        }
      }

      // 生成新的文件名
      const fileExt = image.name.split('.').pop();
      const randomStr = crypto.randomBytes(8).toString('hex');
      const fileName = `${name.toLowerCase().replace(/\s+/g, '-')}-${randomStr}.${fileExt}`;

      // 保存新文件
      const publicPath = path.join(process.cwd(), 'public', 'customers');
      const filePath = path.join(publicPath, fileName);

      const bytes = await image.arrayBuffer();
      await writeFile(filePath, new Uint8Array(bytes));

      // 更新图片URL
      image_url = `/customers/${fileName}`;
    }

    // 更新数据库
    await sql`
      UPDATE customers
      SET name = ${name}, email = ${email}, image_url = ${image_url}
      WHERE id = ${id}
    `;

  } catch (error) {
    return {
      message: '数据库错误：更新对象失败。',
    };
  }

  revalidatePath('/dashboard/customers');
  redirect('/dashboard/customers');
}

export async function deleteCustomer(id: string) {
  try {
    // 先检查是否存在关联的发票
    const invoices = await sql`
      SELECT id, amount, status, date 
      FROM invoices 
      WHERE customer_id = ${id}
    `;

    // 如果存在关联发票，返回错误信息
    if (invoices.rows.length > 0) {
      return {
        message: `无法删除该对象。该对象存在 ${invoices.rows.length} 条关联的开支记录，请先删除这些开支记录。`,
        type: 'error'
      };
    }

    // 获取客户信息
    const customer = await sql`
      SELECT name, image_url FROM customers WHERE id = ${id}
    `;

    if (customer.rows.length > 0) {
      const { name, image_url } = customer.rows[0];

      // 如果存在图片且不是默认头像，则删除文件
      if (image_url && !image_url.includes('default-avatar')) {
        const filePath = path.join(process.cwd(), 'public', image_url);
        try {
          await unlink(filePath);
        } catch (error) {
          console.error('Error deleting file:', error);
        }
      }

      // 删除客户记录
      await sql`DELETE FROM customers WHERE id = ${id}`;

      revalidatePath('/dashboard/customers');
      return {
        message: `成功删除对象 ${name}。`,
        type: 'success'
      };
    }

    return {
      message: '未找到要删除的对象。',
      type: 'error'
    };
  } catch (error) {
    return {
      message: '数据库错误：删除对象失败。',
      error: error instanceof Error ? error.message : String(error),
      type: 'error'
    };
  }
}

// 定义设置相关的状态类型
export type SettingState = {
  message: string; // 移除可选和null类型
  errors?: {
    value?: string[];
    password?: string[];
  };
};

// 更新用户名
export async function updateUsername(prevState: SettingState, formData: FormData): Promise<SettingState> {
  const username = formData.get('value') as string;
  const userId = await getCurrentUserId();

  try {
    await sql`
      UPDATE users
      SET name = ${username}
      WHERE id = ${userId}
    `;
    
    revalidatePath('/dashboard/settings');
    return { message: '用户名更新成功' };
  } catch (error) {
    return {
      message: '更新失败：' + (error instanceof Error ? error.message : String(error))
    };
  }
}

// 更新邮箱
export async function updateEmail(prevState: SettingState, formData: FormData): Promise<SettingState> {
  const email = formData.get('value') as string;
  const userId = await getCurrentUserId();

  try {
    await sql`
      UPDATE users
      SET email = ${email}
      WHERE id = ${userId}
    `;
    
    revalidatePath('/dashboard/settings');
    return { message: '邮箱更新成功' };
  } catch (error) {
    return {
      message: '更新失败：' + (error instanceof Error ? error.message : String(error))
    };
  }
}

// 更新密码
export async function updatePassword(prevState: SettingState, formData: FormData): Promise<SettingState> {
  const oldPassword = formData.get('oldPassword') as string;
  const newPassword = formData.get('value') as string;
  const userId = await getCurrentUserId();

  try {
    // 首先验证旧密码
    const user = await sql`
      SELECT password FROM users WHERE id = ${userId}
    `;

    if (!user.rows.length) {
      return { message: '用户不存在' };
    }

    const isValid = await bcrypt.compare(oldPassword, user.rows[0].password);
    if (!isValid) {
      return { message: '旧密码错误' };
    }

    // 对新密码进行加密
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 更新密码
    await sql`
      UPDATE users
      SET password = ${hashedPassword}
      WHERE id = ${userId}
    `;
    
    revalidatePath('/dashboard/settings');
    return { message: '密码更新成功' };
  } catch (error) {
    return {
      message: '更新失败：' + (error instanceof Error ? error.message : String(error))
    };
  }
}