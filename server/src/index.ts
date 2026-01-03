import express from 'express';
import cors from 'cors';
import config from './config/environment';
import { initializeDatabase } from './database/db';
import chatRoutes from './routes/chat.routes';
import escalationsRoutes from './routes/escalations.routes';
import knowledgeBaseRoutes from './routes/knowledge-base.routes';
import analyticsRoutes from './routes/analytics.routes';

const app = express();

// Allowed origins for CORS
const allowedOrigins = [
    config.cors.origin,
    'http://localhost:8080',
    'http://localhost:8081', 
    'http://localhost:8082',
    'http://localhost:8083',
    'http://localhost:5173',
    // Production URLs (will be set after deployment)
    process.env.FRONTEND_URL,
].filter(Boolean);

// Also allow any Vercel preview deployments
const corsOptions = {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin) return callback(null, true);
        
        // Allow if in allowedOrigins list
        if (allowedOrigins.includes(origin)) return callback(null, true);
        
        // Allow Vercel preview deployments
        if (origin.endsWith('.vercel.app')) return callback(null, true);
        
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Request logging
app.use((req, _res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
    next();
});

// Health check
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Model management endpoints
import { getCurrentModel, setCurrentModel, AIModelType, aiService } from './services/ai.service';
import db from './database/db';

app.get('/api/settings/model', (_req, res) => {
    res.json({ 
        currentModel: getCurrentModel(),
        availableModels: ['gemini-2.5-pro', 'gemini-2.5-flash']
    });
});

// MVDPDF Metrics endpoint
app.get('/api/analytics/mvdpdf-metrics', (_req, res) => {
    try {
        const metrics = aiService.calculateMVDPDFMetrics();
        res.json(metrics);
    } catch (error) {
        console.error('Failed to get MVDPDF metrics:', error);
        res.status(500).json({ error: 'Failed to calculate metrics' });
    }
});

app.post('/api/settings/model', (req, res) => {
    const { model } = req.body;
    const validModels: AIModelType[] = ['gemini-2.5-pro', 'gemini-2.5-flash'];
    
    if (!validModels.includes(model)) {
        return res.status(400).json({ error: 'Invalid model. Must be gemini-2.5-pro or gemini-2.5-flash' });
    }
    
    setCurrentModel(model);
    res.json({ success: true, currentModel: model });
});

// Clear chat history (keeps knowledge base and articles)
app.post('/api/settings/clear-chats', (_req, res) => {
    try {
        db.exec('DELETE FROM messages');
        db.exec('DELETE FROM tickets');
        db.exec('DELETE FROM conversations');
        db.exec('DELETE FROM analytics_events');
        console.log('🗑️  Chat history cleared (knowledge base preserved)');
        res.json({ success: true, message: 'Chat history cleared' });
    } catch (error) {
        console.error('Failed to clear chats:', error);
        res.status(500).json({ error: 'Failed to clear chat history' });
    }
});

// Seed demo personas with sample conversations
app.post('/api/settings/seed-demos', (_req, res) => {
    try {
        const { v4: uuidv4 } = require('uuid');
        
        // Demo personas
        const personas = [
            { id: uuidv4(), customerId: 'cust-sarah-001', name: 'Sarah Johnson', email: 'sarah.j@email.com', category: 'Order Issue' },
            { id: uuidv4(), customerId: 'cust-mike-002', name: 'Mike Chen', email: 'mike.chen@email.com', category: 'Return Request' },
            { id: uuidv4(), customerId: 'cust-emily-003', name: 'Emily Davis', email: 'emily.d@email.com', category: 'Payment Question' },
            { id: uuidv4(), customerId: 'cust-james-004', name: 'James Wilson', email: 'j.wilson@email.com', category: 'Shipping Inquiry' },
            { id: uuidv4(), customerId: 'cust-lisa-005', name: 'Lisa Martinez', email: 'lisa.m@email.com', category: 'Product Question' },
        ];

        const insertConv = db.prepare(`
            INSERT INTO conversations (id, customer_id, customer_name, customer_email, status, category)
            VALUES (?, ?, ?, ?, 'open', ?)
        `);

        for (const p of personas) {
            insertConv.run(p.id, p.customerId, p.name, p.email, p.category);
        }

        console.log('🎭 Demo personas seeded:', personas.map(p => p.name).join(', '));
        res.json({ success: true, message: `Created ${personas.length} demo personas`, personas: personas.map(p => ({ name: p.name, category: p.category })) });
    } catch (error) {
        console.error('Failed to seed demos:', error);
        res.status(500).json({ error: 'Failed to seed demo personas' });
    }
});

// API Routes
app.use('/api/chat', chatRoutes);
app.use('/api/escalations', escalationsRoutes);
app.use('/api/knowledge-base', knowledgeBaseRoutes);
app.use('/api/analytics', analyticsRoutes);

// Error handling middleware
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
});

// Initialize database and start server
const startServer = async () => {
    try {
        // Initialize database
        initializeDatabase();

        // Start server
        app.listen(config.port, () => {
            console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🤖 ShopAI Support Backend                               ║
║                                                           ║
║   Server running on: http://localhost:${config.port}               ║
║   GCP Project: ${config.googleCloud.project.slice(0, 25).padEnd(25)}          ║
║   AI Model: ${config.googleCloud.model.padEnd(25)}              ║
║                                                           ║
║   API Endpoints:                                          ║
║   • POST /api/chat/message                                ║
║   • GET  /api/chat/conversations                          ║
║   • GET  /api/escalations                                 ║
║   • GET  /api/knowledge-base/articles                     ║
║   • GET  /api/analytics/stats                             ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
      `);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
