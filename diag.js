const http = require('http');

const checkPort = (port) => {
    return new Promise((resolve) => {
        const req = http.get(`http://localhost:${port}/`, (res) => {
            resolve({ port, status: 'OPEN', statusCode: res.statusCode });
        });
        req.on('error', (err) => {
            resolve({ port, status: 'CLOSED', error: err.message });
        });
        req.setTimeout(2000, () => {
            req.destroy();
            resolve({ port, status: 'TIMEOUT' });
        });
    });
};

async function run() {
    console.log('--- Port Diagnostic ---');
    const backend = await checkPort(5000);
    const frontend = await checkPort(3000);
    console.log('Backend (5000):', JSON.stringify(backend));
    console.log('Frontend (3000):', JSON.stringify(frontend));
}

run();
