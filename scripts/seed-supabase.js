async function seedSupabase() {
    try {
        console.log('🧪 Running Mock User Preview (DB Bypass Mode)...');

        // Dynamically import the mock users from the lib
        const { mockUsers } = await import('../lib/mockData.js');

        // Output the preview of generated users
        console.log('\n==================================================');
        console.log('            PREVIEW OF MOCK TEST USERS            ');
        console.log('==================================================');
        mockUsers.forEach((u, i) => {
            console.log(`User ${i + 1}: ${u.firstName} ${u.lastName} (${u.type} Profile)`);
            console.log(`  - NIN: ${u.nin || 'N/A'}`);
            console.log(`  - BVN: ${u.bvn || 'N/A'}`);
            console.log(`  - DOB: ${u.dob}`);
            console.log(`  - State: ${u.state}`);
            console.log('--------------------------------------------------');
        });

        console.log('\n✅ Mock users are ready for use in development.');
        console.log('ℹ️  Database insertion bypassed as requested.');

        process.exit(0);
    } catch (err) {
        console.error('❌ Unexpected error during preview:', err.message);
        process.exit(1);
    }
}

seedSupabase();
