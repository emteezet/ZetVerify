import { NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * Validates an admin session token from the Request headers
 * @param {Request} request 
 * @returns {boolean}
 */
export async function validateAdminSession(request) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return false;
    }

    const token = authHeader.slice(7);
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword || !token) return false;

    // Verify token: In this implementation, we expect the token to be an HMAC of the password
    // This allows stateless verification without a database for sessions.
    // In a production app, use JWT or a session store.
    const expectedToken = crypto
        .createHmac('sha256', adminPassword)
        .update('admin-session')
        .digest('hex');

    return token === expectedToken;
}

/**
 * Generates a verifiable admin session token
 * @returns {string}
 */
export function generateAdminToken() {
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) throw new Error('ADMIN_PASSWORD not set');

    return crypto
        .createHmac('sha256', adminPassword)
        .update('admin-session')
        .digest('hex');
}

/**
 * Higher-order response for unauthorized admin access
 */
export function unauthorizedAdminResponse() {
    return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
    );
}
