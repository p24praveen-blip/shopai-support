import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Handle GCP credentials from Railway environment
// Railway passes credentials as JSON string in GOOGLE_APPLICATION_CREDENTIALS_JSON
if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
    try {
        const credentialsPath = '/tmp/gcp-credentials.json';
        fs.writeFileSync(credentialsPath, process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
        process.env.GOOGLE_APPLICATION_CREDENTIALS = credentialsPath;
        console.log('✅ GCP credentials loaded from environment variable');
    } catch (error) {
        console.error('❌ Failed to write GCP credentials:', error);
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
