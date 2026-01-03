import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Handle GCP credentials from Railway environment
// Try base64 encoded version first (more reliable), then raw JSON
if (process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64) {
    try {
        const credentialsPath = '/tmp/gcp-credentials.json';
        const credentialsJson = Buffer.from(process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64, 'base64').toString('utf-8');
        JSON.parse(credentialsJson); // Validate
        fs.writeFileSync(credentialsPath, credentialsJson);
        process.env.GOOGLE_APPLICATION_CREDENTIALS = credentialsPath;
        console.log('✅ GCP credentials loaded from base64 environment variable');
    } catch (error) {
        console.error('❌ Failed to decode base64 GCP credentials:', error);
    }
} else if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
    try {
        const credentialsPath = '/tmp/gcp-credentials.json';
        let credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
        
        // Fix escaped characters if Railway double-escaped the JSON
        if (credentialsJson.includes('\\n') || credentialsJson.includes('\\"')) {
            credentialsJson = credentialsJson
                .replace(/\\n/g, '\n')
                .replace(/\\"/g, '"')
                .replace(/\\\\/g, '\\');
        }
        
        // Validate it's valid JSON before writing
        JSON.parse(credentialsJson);
        
        fs.writeFileSync(credentialsPath, credentialsJson);
        process.env.GOOGLE_APPLICATION_CREDENTIALS = credentialsPath;
        console.log('✅ GCP credentials loaded from JSON environment variable');
    } catch (error) {
        console.error('❌ Failed to write GCP credentials:', error);
        console.error('Raw credentials preview:', process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON?.substring(0, 100));
    }
}

export const config = {
    port: parseInt(process.env.PORT || '3001', 10),
    googleCloud: {
        project: process.env.GCP_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || '',
        location: process.env.GCP_LOCATION || process.env.GOOGLE_CLOUD_LOCATION || 'us-central1',
        model: process.env.VERTEX_AI_MODEL || 'gemini-2.5-pro',
    },
    cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:8080',
    },
};

// Validate required config
if (!config.googleCloud.project) {
    console.error('❌ GOOGLE_CLOUD_PROJECT environment variable is required');
    process.exit(1);
}

export default config;
