import { db } from '@vercel/postgres';

const client = await db.connect();

async function getAllUser() {
  const result = await client.sql`SELECT * FROM users`;
  return result.rows;
}

export async function GET() {
  try {
    await client.sql`BEGIN`;
    
    const users = await getAllUser();
    console.log(users); // 打印所有用户

    await client.sql`COMMIT`;

    return new Response(JSON.stringify(users), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    await client.sql`ROLLBACK`;
    console.error(error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
