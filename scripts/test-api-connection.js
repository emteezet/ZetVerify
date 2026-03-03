// Native fetch is available in modern Node.js
require('dotenv').config({ path: '.env.local' });

async function testConnection() {
    const apiKey = process.env.NIN_BVN_PORTAL_API_KEY;
    const baseUrl = process.env.NIN_BVN_PORTAL_BASE_URL || "https://ninbvnportal.com.ng/api";

    console.log("Testing NinBvnPortal Connectivity...");
    console.log(`Base URL: ${baseUrl}`);
    console.log(`API Key: ${apiKey ? 'Found' : 'Missing'}`);

    if (!apiKey) {
        console.error("Error: NIN_BVN_PORTAL_API_KEY is missing.");
        return;
    }

    try {
        const response = await fetch(`${baseUrl}/balance`, {
            method: 'GET',
            headers: {
                'x-api-key': apiKey
            }
        });

        const data = await response.json();
        console.log("Response Received:", JSON.stringify(data, null, 2));

        if (data.status === "success") {
            console.log("\n✅ SUCCESS: Connection verified.");
            console.log(`Balance: ${data.data.formatted_balance}`);
        } else {
            console.log("\n❌ FAILED: API returned error status.");
        }
    } catch (error) {
        console.error("\n❌ ERROR: Could not connect to API.", error.message);
    }
}

testConnection();
