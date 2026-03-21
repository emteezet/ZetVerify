// Test httpsFetch against QoreID token endpoint
// This tests the exact same code path as QoreIdProvider uses

async function test() {
    // Dynamically import httpsFetch (same as QoreIdProvider does)
    const https = await import('https');

    const TOKEN_URL = "https://api.qoreid.com/token";
    const CLIENT_ID = "T7X1KG9R8WOXH3D6FQZR";
    const SECRET_KEY = "d07af1d7d2e04d62a2d58cf2f3bde092";
    
    console.log("Testing httpsFetch function against QoreID...\n");
    
    // Replicate httpsFetch logic exactly
    const response = await new Promise((resolve, reject) => {
        const urlObj = new URL(TOKEN_URL);
        const body = JSON.stringify({ clientId: CLIENT_ID, secret: SECRET_KEY });
        
        const reqOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            timeout: 15000,
            family: 4, // Force IPv4 — the key fix
        };

        console.log("URL:", urlObj.href);
        console.log("Options:", reqOptions);
        console.log("Body:", body);

        const req = https.request(urlObj, reqOptions, (res) => {
            const chunks = [];
            res.on('data', (chunk) => chunks.push(chunk));
            res.on('end', () => {
                const buffer = Buffer.concat(chunks);
                const text = buffer.toString();
                console.log("\n✅ Response received!");
                console.log("Status:", res.statusCode);
                
                try {
                    const json = JSON.parse(text);
                    console.log("Has accessToken:", !!json.accessToken);
                    if (json.accessToken) {
                        console.log("Token length:", json.accessToken.length);
                    } else {
                        console.log("Response:", JSON.stringify(json, null, 2));
                    }
                } catch(e) {
                    console.log("Raw response:", text.substring(0, 500));
                }
                
                resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode });
            });
        });

        req.on('error', (err) => {
            console.error("❌ Request error:", {
                name: err.name,
                message: err.message,
                code: err.code,
                cause: err.cause,
            });
            reject(err);
        });

        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timed out'));
        });

        req.write(body);
        req.end();
    });

    console.log("\nDone. Status:", response.status);
}

test().catch(err => console.error("Fatal:", err));
