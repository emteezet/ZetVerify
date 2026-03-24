import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

/**
 * FINAL HARDENING MIDDLEWARE
 * -------------------------
 * 1. Security Headers (CSP, HSTS, XFO)
 * 2. Rate Limiting (Per-IP / Per-Route)
 * 3. Session Refresh & Access Control
 */

// Simple in-memory rate limiter for Edge Runtime
// NOTE: For true distributed rate limiting in production, use Upstash Redis.
const RATE_LIMIT_MAP = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 10; // 10 requests per minute for identity API

export async function proxy(request) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    const url = new URL(request.url);
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';

    // ── 1. RATE LIMITING (Identity APIs) ──────────────────────────────
    if (url.pathname.startsWith('/api/verify')) {
        const now = Date.now();
        const clientKey = `${ip}:${url.pathname}`;
        const clientData = RATE_LIMIT_MAP.get(clientKey) || { count: 0, firstRequest: now };

        // Reset if window expired
        if (now - clientData.firstRequest > RATE_LIMIT_WINDOW) {
            clientData.count = 1;
            clientData.firstRequest = now;
        } else {
            clientData.count++;
        }

        RATE_LIMIT_MAP.set(clientKey, clientData);

        if (clientData.count > MAX_REQUESTS) {
            return new NextResponse(
                JSON.stringify({ 
                    error: 'Too many requests. Please wait a minute before trying again to protect identity data.',
                    code: 'RATE_LIMIT_EXCEEDED'
                }),
                { 
                    status: 429, 
                    headers: { 'Content-Type': 'application/json', 'Retry-After': '60' } 
                }
            );
        }
    }

    // ── 2. SUPABASE SESSION SYNC ────────────────────────────────────
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // Refresh session if it exists
    await supabase.auth.getUser();

    // ── 3. SECURITY HEADERS ──────────────────────────────────────────
    const headers = response.headers;
    
    // HSTS (Strict-Transport-Security) - 2 years
    headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
    
    // Prevent Clickjacking
    headers.set('X-Frame-Options', 'DENY');
    
    // Prevent MIME-sniffing
    headers.set('X-Content-Type-Options', 'nosniff');
    
    // Referrer Policy
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Content Security Policy (Strict-ish)
    // Adjust this if you use external fonts/scripts like Google Fonts or Paystack
    headers.set('Content-Security-Policy', 
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://checkout.paystack.com; " +
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
        "img-src 'self' data: https://*.supabase.co https://*.paystack.com; " +
        "font-src 'self' https://fonts.gstatic.com; " +
        "connect-src 'self' https://*.supabase.co https://*.paystack.com; " +
        "frame-src 'self' https://checkout.paystack.com;"
    );

    return response;
}

// Config: Filter which routes this middleware runs on
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
