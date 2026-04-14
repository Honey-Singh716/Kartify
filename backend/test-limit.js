const axios = require('axios');

const API_URL = 'http://localhost:5000/api';
const LOGIN_ENDPOINT = `${API_URL}/auth/login`;

async function testRateLimit() {
    console.log('--- Testing Rate Limiting ---');
    for (let i = 1; i <= 12; i++) {
        try {
            console.log(`Attempt ${i}: Logging in...`);
            const res = await axios.post(LOGIN_ENDPOINT, {
                email: 'test@example.com',
                password: 'wrongpassword'
            });
            console.log(`Attempt ${i} Status: ${res.status}`);
        } catch (err) {
            console.log(`Attempt ${i} Status: ${err.response?.status} - ${err.response?.data?.message}`);
            if (err.response?.status === 429) {
                console.log('✅ Rate limit reached as expected.');
                break;
            }
        }
    }
}

// Note: To test reset, you would need to log in with a valid account.
// Since I don't have a valid account credential handy that I'm sure exists,
// I will just leave the script here as a utility for the user.

testRateLimit().catch(console.error);
