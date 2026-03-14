import { NextResponse } from 'next/server';
import { generateAdminToken } from '@/lib/auth/admin';

export async function POST(request) {
    try {
        const { password } = await request.json();
        const adminPassword = process.env.ADMIN_PASSWORD;

        if (!adminPassword) {
            console.error('[Admin Auth] ADMIN_PASSWORD environment variable is not set.');
            return NextResponse.json(
                { error: 'Admin authentication is not configured on the server.' },
                { status: 500 }
            );
        }

        if (password === adminPassword) {
            const token = generateAdminToken();
            return NextResponse.json({ success: true, token });
        }

        return NextResponse.json(
            { error: 'Invalid password.' },
            { status: 401 }
        );
    } catch (err) {
        return NextResponse.json(
            { error: 'Authentication failed.' },
            { status: 500 }
        );
    }
}
