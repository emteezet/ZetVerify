
const { NinBvnPortalProvider } = require('./lib/adapters/NinBvnPortalProvider');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

async function testProvider() {
    const provider = new NinBvnPortalProvider();
    
    console.log('Testing Balance...');
    const balance = await provider.getBalance();
    console.log('Balance Result:', JSON.stringify(balance, null, 2));

    // Test NIN (if we have a dummy one, otherwise just check endpoint connectivity)
    /*
    console.log('Testing NIN Fetch...');
    const ninResult = await provider.fetchByNin('12345678901');
    console.log('NIN Result:', JSON.stringify(ninResult, null, 2));
    */
}

testProvider().catch(console.error);
