const fetch = require('node-fetch');

async function testSecurity() {
    const baseUrl = 'http://localhost:3000/api';
    console.log('--- Security Verification Start ---');

    // 1. Test Admin Stats - Expected: 401
    console.log('\n1. Testing /api/admin/stats (Unauthorized)...');
    try {
        const res = await fetch(`${baseUrl}/admin/stats`);
        console.log(`Status: ${res.status} (Expected 401)`);
    } catch (e) {
        console.log('Error:', e.message);
    }

    // 2. Test Admin Users - Expected: 401
    console.log('\n2. Testing /api/admin/users (Unauthorized)...');
    try {
        const res = await fetch(`${baseUrl}/admin/users`);
        console.log(`Status: ${res.status} (Expected 401)`);
    } catch (e) {
        console.log('Error:', e.message);
    }

    // 3. Test Admin Auth
    console.log('\n3. Testing Admin Login...');
    let token = null;
    try {
        const res = await fetch(`${baseUrl}/admin/auth`, {
            method: 'POST',
            body: JSON.stringify({ password: process.env.ADMIN_PASSWORD || 'admin123' }),
            headers: { 'Content-Type': 'application/json' }
        });
        const data = await res.json();
        if (data.success) {
            token = data.token;
            console.log('Login Success! Token received.');
        } else {
            console.log('Login Failed:', data.error);
        }
    } catch (e) {
        console.log('Error:', e.message);
    }

    if (token) {
        // 4. Test Admin Stats with Token - Expected: 200
        console.log('\n4. Testing /api/admin/stats (Authorized)...');
        try {
            const res = await fetch(`${baseUrl}/admin/stats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log(`Status: ${res.status} (Expected 200)`);
        } catch (e) {
            console.log('Error:', e.message);
        }
    }

    console.log('\n--- Security Verification End ---');
}

testSecurity();
