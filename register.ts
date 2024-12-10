import { NextApiRequest, NextApiResponse } from "next";
import { sql } from "@vercel/postgres";
import bcrypt from "bcrypt";
import { z } from 'zod';
import type { User } from '@/app/lib/definitions';

// 用户注册的数据校验
export const registerSchema = z.object({
    name: z.string().min(3),
    email: z.string().email(),
    password: z.string().min(6),
    confirmPassword: z.string().min(6),
});

// 验证用户是否已经存在
export async function doesUserExist(email: string): Promise<boolean> {
    try {
        const user = await sql<User>`SELECT * FROM users WHERE email=${email}`;
        return !!user.rows[0];
    } catch (error) {
        console.error('Error checking user existence:', error);
        throw new Error('Failed to check user existence.');
    }
}

// 添加新用户到数据库
export async function addUser(name: string, email: string, hashedPassword: string): Promise<User> {
    try {
        const user = await sql<User>`
            INSERT INTO users (name, email, password) VALUES
            (${name}, ${email}, ${hashedPassword})
            ON CONFLICT (id) DO NOTHING;
        `;
        return user.rows[0];
    } catch (error) {
        console.error('Failed to creating user:', error);
        throw new Error('Failed to create user.');
    }
}

export default async function Signup(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const parsedData = registerSchema.safeParse(req.body);

        if (!parsedData.success) {
            return res.status(400).json({ message: 'Invalid data', errors: parsedData.error.errors });
        }

        const { name, email, password, confirmPassword } = parsedData.data;

        if (password !== confirmPassword) {
            return res.status(400).json({ message: 'Passwords do not match' });
        }

        // 检查用户是否已经存在
        const userExists = await doesUserExist(email);
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await addUser(name, email, hashedPassword);

        return res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Failed to register user:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}
