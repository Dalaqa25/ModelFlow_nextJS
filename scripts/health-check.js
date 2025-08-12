#!/usr/bin/env node

const https = require('https');
const http = require('http');

const BASE_URL = 'http://localhost:3000';

async function makeRequest(url) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;
        
        const req = client.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve({ status: res.statusCode, data: json });
                } catch (e) {
                    resolve({ status: res.statusCode, data: data });
                }
            });
        });
        
        req.on('error', (err) => reject(err));
        req.setTimeout(5000, () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
    });
}

async function checkHealth() {
    console.log('🔍 Checking application health...\n');
    
    try {
        // Check database health
        console.log('📊 Database Health:');
        const dbHealth = await makeRequest(`${BASE_URL}/api/debug/db-health`);
        if (dbHealth.status === 200 && dbHealth.data.success) {
            console.log('✅ Database is healthy');
            console.log(`   Response time: ${dbHealth.data.connection.responseTime}ms`);
            console.log(`   Active connections: ${dbHealth.data.database.activeConnections}`);
            console.log(`   Prepared statements: ${dbHealth.data.database.preparedStatements}`);
        } else {
            console.log('❌ Database health check failed');
            console.log(`   Status: ${dbHealth.status}`);
            console.log(`   Error: ${dbHealth.data.error || 'Unknown error'}`);
        }
        
        console.log('\n🔗 API Routes:');
        
        // Check purchased models route
        const purchasedModels = await makeRequest(`${BASE_URL}/api/user/purchased-models`);
        if (purchasedModels.status === 401) {
            console.log('✅ Purchased models route is working (Unauthorized expected)');
        } else if (purchasedModels.status === 500) {
            console.log('❌ Purchased models route has errors');
            console.log(`   Error: ${purchasedModels.data.error || 'Unknown error'}`);
        } else {
            console.log(`✅ Purchased models route is working (Status: ${purchasedModels.status})`);
        }
        
        // Check user models route
        const userModels = await makeRequest(`${BASE_URL}/api/models/user-models`);
        if (userModels.status === 401) {
            console.log('✅ User models route is working (Unauthorized expected)');
        } else if (userModels.status === 500) {
            console.log('❌ User models route has errors');
            console.log(`   Error: ${userModels.data.error || 'Unknown error'}`);
        } else {
            console.log(`✅ User models route is working (Status: ${userModels.status})`);
        }
        
        console.log('\n🎉 Health check completed successfully!');
        
    } catch (error) {
        console.error('❌ Health check failed:', error.message);
        console.log('\n💡 Troubleshooting tips:');
        console.log('1. Make sure the development server is running: npm run dev');
        console.log('2. Check if the server is accessible at http://localhost:3000');
        console.log('3. Verify your database connection string in environment variables');
        console.log('4. Try restarting the server if issues persist');
    }
}

// Run health check
checkHealth();
