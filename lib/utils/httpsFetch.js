/**
 * A specialized fetch implementation using native Node.js https.request
 * to bypass issues with built-in fetch in certain environments (e.g. timeouts).
 * This is designed to be compatible with supabase-js requirements.
 */
export async function httpsFetch(url, options = {}) {
    const https = await import('https');
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const { method = 'GET', body } = options;
        
        // Normalize headers: handle both plain objects and Headers instances
        let headers = {};
        if (options.headers) {
            if (typeof options.headers.forEach === 'function') {
                options.headers.forEach((value, key) => {
                    headers[key] = value;
                });
            } else if (typeof options.headers === 'object') {
                headers = options.headers;
            }
        }

        const reqOptions = {
            method,
            headers,
            timeout: options.timeout || 15000,
            family: 4, // Force IPv4 to avoid AggregateError in some environments
        };

        const req = https.request(urlObj, reqOptions, (res) => {
            const chunks = [];
            res.on('data', (chunk) => chunks.push(chunk));
            res.on('end', () => {
                const buffer = Buffer.concat(chunks);
                const text = buffer.toString();
                
                resolve({
                    ok: res.statusCode >= 200 && res.statusCode < 300,
                    status: res.statusCode,
                    statusText: res.statusMessage,
                    text: async () => text,
                    json: async () => JSON.parse(text),
                    blob: async () => new Blob([buffer]),
                    arrayBuffer: async () => buffer.buffer,
                    headers: {
                        get: (name) => res.headers[name.toLowerCase()],
                        entries: () => Object.entries(res.headers),
                    }
                });
            });
        });

        req.on('error', (err) => {
            let errorMsg = err.message;
            if (err.name === 'AggregateError' && err.errors) {
                errorMsg = `AggregateError: ${err.errors.map(e => e.message).join(', ')}`;
            }
            
            console.error(`[httpsFetch] Error fetching ${url}:`, errorMsg);
            console.error('[httpsFetch] Request Headers:', {
                ...headers,
                'apikey': headers['apikey'] ? 'PRESENT' : 'MISSING',
                'authorization': headers['authorization'] ? 'PRESENT' : 'MISSING'
            });
            reject(err);
        });

        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timed out'));
        });

        if (body) {
            if (typeof body === 'string') {
                req.write(body);
            } else if (Buffer.isBuffer(body)) {
                req.write(body);
            } else {
                req.write(JSON.stringify(body));
            }
        }
        
        req.end();
    });
}
