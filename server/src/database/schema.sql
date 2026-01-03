-- ShopAI Support Database Schema

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT,
    status TEXT DEFAULT 'open' CHECK(status IN ('open', 'resolved', 'escalated')),
    category TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('customer', 'ai', 'agent', 'system')),
    content TEXT NOT NULL,
    confidence_score REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

-- Tickets/Escalations table
CREATE TABLE IF NOT EXISTS tickets (
    id TEXT PRIMARY KEY,
    ticket_id TEXT UNIQUE NOT NULL,
    conversation_id TEXT NOT NULL,
    customer TEXT NOT NULL,
    category TEXT,
    priority TEXT DEFAULT 'medium' CHECK(priority IN ('high', 'medium', 'low')),
    escalation_reason TEXT,
    assigned_agent TEXT,
    status TEXT DEFAULT 'open' CHECK(status IN ('open', 'in_progress', 'resolved')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

-- Knowledge Base articles table
CREATE TABLE IF NOT EXISTS articles (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Analytics events table (for tracking metrics)
CREATE TABLE IF NOT EXISTS analytics_events (
    id TEXT PRIMARY KEY,
    event_type TEXT NOT NULL,
    conversation_id TEXT,
    data TEXT, -- JSON data
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(priority);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category);

-- Insert default knowledge base articles
INSERT OR IGNORE INTO articles (id, category, title, content) VALUES
('art-001', 'Orders & Tracking', 'How to track your order', 'To track your order, go to your account dashboard and click on "Orders". You will see all your recent orders with tracking information. Click on the tracking number to view real-time delivery status.'),
('art-002', 'Orders & Tracking', 'Order not received', 'If your order has not arrived within the estimated delivery window, please check the tracking status first. If it shows "Delivered" but you haven''t received it, contact us immediately and we will investigate.'),
('art-003', 'Returns & Refunds', 'Return policy', 'We offer a 30-day return policy for most items. Items must be unused and in original packaging. Some categories like electronics have a 15-day return window. Refunds are processed within 5-7 business days.'),
('art-004', 'Returns & Refunds', 'How to initiate a return', 'To start a return: 1) Go to your Orders page 2) Select the item 3) Click "Return Item" 4) Choose a reason 5) Print the return label 6) Ship the item back within 7 days.'),
('art-005', 'Payments & Billing', 'Payment methods accepted', 'We accept all major credit cards (Visa, Mastercard, Amex), debit cards, PayPal, Apple Pay, Google Pay, and Buy Now Pay Later options like Klarna and Afterpay.'),
('art-006', 'Payments & Billing', 'Payment failed', 'If your payment failed, please ensure: 1) Card details are correct 2) You have sufficient funds 3) Your bank hasn''t blocked the transaction. Try a different payment method or contact your bank.'),
('art-007', 'Shipping & Delivery', 'Shipping options', 'We offer Standard (5-7 days), Express (2-3 days), and Next-Day delivery. Free standard shipping on orders over $50. Express and Next-Day have additional charges based on location.'),
('art-008', 'Shipping & Delivery', 'International shipping', 'We ship to over 50 countries. International orders typically take 7-14 business days. Import duties and taxes may apply and are the responsibility of the customer.'),
('art-009', 'Account Management', 'Reset password', 'To reset your password, click "Forgot Password" on the login page. Enter your email and we''ll send a reset link. The link expires in 24 hours.'),
('art-010', 'Account Management', 'Update account details', 'Go to Account Settings to update your name, email, phone, or shipping addresses. You can also manage notification preferences and connected payment methods.');
