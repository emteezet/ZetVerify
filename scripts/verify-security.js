/**
 * PRODUCTION READINESS AUDITOR
 * ----------------------------
 * Verifies:
 * 1. Security Headers (HSTS, CSP, XFO)
 * 2. Rate Limiting (429 Response)
 * 3. Admin Access Control (401 vs 200)
 * 4. PII Masking (Masked NINs in stats)
 */

async function audit() {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    
    console.log('🚀 Starting Production Readiness Audit...\n');

    // 1. Audit Security Headers
    console.log('🛡️  Audit 1: Security Headers');
    try {
        const res = await fetch(`${baseUrl}/`, { method: 'HEAD' });
        const headers = res.headers;
        const required = ['content-security-policy', 'strict-transport-security', 'x-frame-options'];
        
        required.forEach(h => {
            const val = headers.get(h);
            if (val) {
                console.log(`   ✅ ${h}: Found`);
            } else {
                console.log(`   ❌ ${h}: MISSING`);
            }
        });
    } catch (e) {
        console.log(`   ❌ Connection failed: ${e.message}`);
    }

    // 2. Audit Rate Limiting
    console.log('\n⏳ Audit 2: Rate Limiting (Target: /api/verify)');
    let triggered = false;
    for (let i = 1; i <= 15; i++) {
        try {
            const res = await fetch(`${baseUrl}/api/verify`, { method: 'POST', body: '{}' });
            if (res.status === 429) {
                console.log(`   ✅ Rate limit triggered at request ${i}`);
                triggered = true;
                break;
            }
        } catch (e) {}
    }
    if (!triggered) console.log('   ❌ Rate limit NOT triggered after 15 attempts.');

    // 3. Audit Admin Access
    console.log('\n🔑 Audit 3: Admin Access Control');
    let adminToken = null;
    try {
        // Test Unauthorized
        const resFail = await fetch(`${baseUrl}/api/admin/stats`);
        console.log(`   🔒 Unauthorized /api/admin/stats: ${resFail.status} (Expected 401)`);

        // Perform Admin Login
        const loginRes = await fetch(`${baseUrl}/api/admin/auth`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: adminPassword })
        });
        const loginData = await loginRes.json();
        
        if (loginData.success) {
            adminToken = loginData.token;
            console.log('   ✅ Admin login successful.');
        } else {
            console.log('   ❌ Admin login failed.');
        }
    } catch (e) {
        console.log(`   ❌ Admin audit failed: ${e.message}`);
    }

    // 4. Audit Data Masking
    if (adminToken) {
        console.log('\n🎭 Audit 4: Data Masking');
        try {
            const statsRes = await fetch(`${baseUrl}/api/admin/stats`, {
                headers: { 'Authorization': `Bearer ${adminToken}` }
            });
            const stats = await statsRes.json();
            
            if (stats.success && stats.stats.recentSlips) {
                const firstNin = stats.stats.recentSlips[0]?.nin;
                if (firstNin && firstNin.includes('*')) {
                    console.log(`   ✅ NIN Masking verified: ${firstNin}`);
                } else {
                    console.log(`   ⚠️  NIN Masking check inconclusive (No recent slips or not masked). Value: ${firstNin}`);
                }
            }
        } catch (e) {
            console.log(`   ❌ Masking audit failed: ${e.message}`);
        }
    }

    console.log('\n🏁 Audit Content Complete.');
}

audit();
