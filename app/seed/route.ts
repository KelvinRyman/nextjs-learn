import bcrypt from 'bcrypt';
import { db } from '@vercel/postgres';
import { invoices, customers, revenue, users } from '../lib/placeholder-data';

const client = await db.connect();

async function seedUsers() {
  await client.sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
  await client.sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL
    );
  `;

  const insertedUsers = await Promise.all(
    users.map(async (user) => {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      return client.sql`
        INSERT INTO users (id, name, email, password)
        VALUES (${user.id}, ${user.name}, ${user.email}, ${hashedPassword})
        ON CONFLICT (id) DO NOTHING;
      `;
    }),
  );

  return insertedUsers;
}

async function seedInvoices() {
  await client.sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;

  await client.sql`
    CREATE TABLE IF NOT EXISTS invoices (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      customer_id UUID NOT NULL,
      amount INT NOT NULL,
      status VARCHAR(255) NOT NULL,
      date DATE NOT NULL,
      user_id UUID NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users (id)
    );
  `;

  const insertedInvoices = await Promise.all(
    invoices.map(
      (invoice) => client.sql`
        INSERT INTO invoices (customer_id, amount, status, date, user_id)
        VALUES (${invoice.customer_id}, ${invoice.amount}, ${invoice.status}, ${invoice.date}, ${invoice.user})
        ON CONFLICT (id) DO NOTHING;
      `,
    ),
  );

  return insertedInvoices;
}

async function seedCustomers() {
  await client.sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;

  await client.sql`
    CREATE TABLE IF NOT EXISTS customers (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      image_url VARCHAR(255) NOT NULL,
      user_id UUID NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users (id)
    );
  `;

  const insertedCustomers = await Promise.all(
    customers.map(
      (customer) => client.sql`
        INSERT INTO customers (id, name, email, image_url, user_id)
        VALUES (${customer.id}, ${customer.name}, ${customer.email}, ${customer.image_url}, ${customer.user})
        ON CONFLICT (id) DO NOTHING;
      `,
    ),
  );

  return insertedCustomers;
}

async function seedRevenue() {
  await client.sql`
    CREATE TABLE IF NOT EXISTS revenue (
      month VARCHAR(4) NOT NULL UNIQUE,
      revenue INT NOT NULL,
      user_id UUID NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users (id)
    );
  `;

  const insertedRevenue = await Promise.all(
    revenue.map(
      (rev) => client.sql`
        INSERT INTO revenue (month, revenue, user_id)
        VALUES (${rev.month}, ${rev.revenue}, ${rev.user})
        ON CONFLICT (month) DO NOTHING;
      `,
    ),
  );

  return insertedRevenue;
}

export async function GET() {
  return Response.json({
    message:
      'Uncomment this file and remove this line. You can delete this file when you are finished.',
  });

  /* 种子数据 */
  // try {
  //   await client.sql`BEGIN`;
  //   await seedUsers();
  //   await seedCustomers();
  //   await seedInvoices();
  //   await seedRevenue();
  //   await client.sql`COMMIT`;

  //   return Response.json({ message: 'Database seeded successfully' });
  // } catch (error) {
  //   await client.sql`ROLLBACK`;
  //   return Response.json({ error }, { status: 500 });
  // }

  /* 清除数据库 */
  // try {
  //   await client.sql`BEGIN`;
  //   await clearDatabase();
  //   await client.sql`COMMIT`;

  //   return Response.json({ message: 'Table dropped successfully' });
  // } catch (error) {
  //   await client.sql`ROLLBACK`;
  //   return Response.json({ error }, { status: 500 });
  // }

  /* 查询所有用户 */
  // try {
  //   await client.sql`BEGIN`;

  //   const users = await getAllUser();
  //   console.log(users); // 打印所有用户

  //   await client.sql`COMMIT`;

  //   return new Response(JSON.stringify(users), {
  //     headers: { 'Content-Type': 'application/json' }
  //   });
  // } catch (error) {
  //   await client.sql`ROLLBACK`;
  //   return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
  //     status: 500,
  //     headers: { 'Content-Type': 'application/json' }
  //   });
  // }

  /* 查询所有表 */
  // try {
  //   await client.sql`BEGIN`;
  //   const tables = await getAllTable();
  //   console.log(tables); // 打印所有表
  //   await client.sql`COMMIT`;
  //   return new Response(JSON.stringify(tables), {
  //     headers: { 'Content-Type': 'application/json' }
  //   });
  // } catch (error) {
  //   await client.sql`ROLLBACK`;
  //   return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
  //     status: 500,
  //     headers: { 'Content-Type': 'application/json' }
  //   });
  // }
}

async function clearDatabase() {
  await client.sql`
    DROP TABLE IF EXISTS users, invoices, customers, revenue
    CASCADE
  `;
}

async function getAllUser() {
  const result = await client.sql`SELECT * FROM users`;
  return result.rows;
}

async function getAllTable() {
  const result = await client.sql`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name;
  `;
  return result.rows;
}