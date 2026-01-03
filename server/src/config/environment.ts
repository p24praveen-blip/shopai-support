import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

export const config = {
    port: parseInt(process.env.PORT || '3001', 10),
    googleCloud: {
        project: process.env.GOOGLE_CLOUD_PROJECT || '',
        location: process.env.GOOGLE_CLOUD_LOCATION || 'us-central1',
        model: process.env.VERTEX_AI_MODEL || 'gemini-2.0-flash-exp',
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
