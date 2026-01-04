import Database, { Database as DatabaseType } from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const DB_PATH = path.join(__dirname, '../../data/shopai.db');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Create database connection
const db: DatabaseType = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Initialize schema
export function initializeDatabase(): void {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    // Execute each statement separately
    const statements = schema.split(';').filter(s => s.trim());
    for (const statement of statements) {
        if (statement.trim()) {
            try {
                db.exec(statement);
            } catch (error) {
                // Ignore errors for INSERT OR IGNORE statements
                if (!statement.includes('INSERT OR IGNORE')) {
                    console.error('Error executing statement:', statement.substring(0, 50), error);
                }
            }
        }
    }

    console.log('✅ Database initialized successfully');
    
    // Auto-seed demo data if database is empty
    seedDemoDataIfEmpty();
}

// Seed demo personas automatically if no conversations exist
function seedDemoDataIfEmpty(): void {
    try {
        const count = db.prepare('SELECT COUNT(*) as count FROM conversations').get() as { count: number };
        
        if (count.count === 0) {
            console.log('📦 No conversations found, seeding demo data...');
            
            // Demo personas with realistic customer data
            const personas = [
                { id: uuidv4(), customerId: 'cust-sarah-001', name: 'Sarah Johnson', email: 'sarah.j@email.com', phone: '+1 (555) 123-4567', location: 'New York, NY', category: 'Order Issue' },
                { id: uuidv4(), customerId: 'cust-mike-002', name: 'Mike Chen', email: 'mike.chen@email.com', phone: '+1 (555) 234-5678', location: 'San Francisco, CA', category: 'Return Request' },
                { id: uuidv4(), customerId: 'cust-emily-003', name: 'Emily Davis', email: 'emily.d@email.com', phone: '+1 (555) 345-6789', location: 'Chicago, IL', category: 'Payment Question' },
                { id: uuidv4(), customerId: 'cust-james-004', name: 'James Wilson', email: 'j.wilson@email.com', phone: '+1 (555) 456-7890', location: 'Austin, TX', category: 'Shipping Inquiry' },
                { id: uuidv4(), customerId: 'cust-lisa-005', name: 'Lisa Martinez', email: 'lisa.m@email.com', phone: '+1 (555) 567-8901', location: 'Miami, FL', category: 'Product Question' },
            ];

            const insertConv = db.prepare(`
                INSERT INTO conversations (id, customer_id, customer_name, customer_email, status, category)
                VALUES (?, ?, ?, ?, 'open', ?)
            `);

            for (const p of personas) {
                insertConv.run(p.id, p.customerId, p.name, p.email, p.category);
            }

            console.log('🎭 Demo personas auto-seeded:', personas.map(p => p.name).join(', '));
        } else {
            console.log(`📊 Database has ${count.count} existing conversations`);
        }
    } catch (error) {
        console.error('⚠️ Failed to seed demo data:', error);
    }
}

export default db;
