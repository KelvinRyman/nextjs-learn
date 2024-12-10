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

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string({
    invalid_type_error: '请选择一个对象。',
  }),
  amount: z.coerce
    .number()
    .gt(0, { message: '请输入大于 $0 的金额。' }),
  status: z.enum(['pending', 'paid'], {
    invalid_type_error: '请选择开支状态。',
  }),
  date: z.string(),
});

const CustomerSchema = z.object({
  id: z.string(),
  name: z.string({
    invalid_type_error: '请输入对象名称。',
  }),
  email: z.string().email({
    message: '请输入有效的邮箱地址。',
  }),
  image_url: z.string({
    invalid_type_error: '请输入对象电话。',
  }),
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
  // 使用 Zod 验证表单字段
  const validatedFields = CreateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  // 如果表单验证失败，提前返回错误。否则，继续。
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: '缺少字段。创建开支失败。',
    };
  }

  // 准备插入数据库的数据
  const { customerId, amount, status } = validatedFields.data;
  const amountInCents = amount * 100;
  const date = new Date().toISOString().split('T')[0];

  // 将数据插入数据库
  try {
    await sql`
      INSERT INTO invoices (customer_id, amount, status, date, user_id)
      VALUES (${customerId}, ${amountInCents}, ${status}, ${date}, ${await getCurrentUserId()})
    `;
  } catch (error) {
    // 如果发生数据库错误，返回更具体的错误信息。
    return {
      message: '数据库错误：创建开支失败。',
    };
  }

  // 重新验证开支页面的缓存并重定向用户。
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
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: '缺少字段。更新开支失败。',
    };
  }

  const { customerId, amount, status } = validatedFields.data;
  const amountInCents = amount * 100;

  try {
    await sql`
      UPDATE invoices
      SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
      WHERE id = ${id}
    `;
  } catch (error) {
    return { message: '数据库错误：更新开支失败。' };
  }

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
  // throw new Error('删除开支失败');

  try {
    await sql`DELETE FROM invoices WHERE id = ${id}`;
    revalidatePath('/dashboard/invoices');
    return { message: '删除开支成功' };
  } catch (error) {
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

export async function createCustomer(prevState: CustomerState, formData: FormData) {
  // 使用 Zod 验证表单字段
  const validatedFields = CreateCustomer.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    image_url: formData.get('image_url'),
  });

  // 如果表单验证失败，提前返回错误。否则，继续。
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: '缺少字段。创建对象失败。',
    };
  }

  // 准备插入数据库的数据
  const { name, email, image_url } = validatedFields.data;

  // 将数据插入数据库
  try {
    await sql`
      INSERT INTO customers (name, email, image_url, user_id)
      VALUES (${name}, ${email}, ${image_url}, ${await getCurrentUserId()})
    `;
  } catch (error) {
    // 如果发生数据库错误，返回更具体的错误信息。
    return {
      message: '数据库错误：创建对象失败。',
    };
  }

  // 重新验证对象页面的缓存并重定向用户。
  revalidatePath('/dashboard/customers');
  redirect('/dashboard/customers');
}

export async function updateCustomer(
  id: string,
  prevState: CustomerState,
  formData: FormData
) {
  // 使用 Zod 验证表单字段
  const validatedFields = CustomerSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    image_url: formData.get('iamge_url'),
  });

  // 如果表单验证失败，提前返回错误。否则，继续。
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: '缺少字段。更新对象失败。',
    };
  }

  // 准备插入数据库的数据
  const { name, email, image_url } = validatedFields.data;

  // 将数据插入数据库
  try {
    await sql`
      UPDATE customers
      SET name = ${name}, email = ${email}, image_url = ${image_url}
      WHERE id = ${id}
    `;
  } catch (error) {
    // 如果发生数据库错误，返回更具体的错误信息。
    return {
      message: '数据库错误：更新对象失败。',
    };
  }

  // 重新验证对象页面的缓存并重定向用户。
  revalidatePath('/dashboard/customers');
  redirect('/dashboard/customers');
}

export async function deleteCustomer(id: string) {
  try {
    await sql`DELETE FROM customers WHERE id = ${id}`;
    revalidatePath('/dashboard/customers');
    return { message: '删除对象成功' };
  } catch (error) {
    return { message: '数据库错误：删除对象失败。' };
  }
}