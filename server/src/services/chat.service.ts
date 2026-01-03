import { v4 as uuidv4 } from 'uuid';
import db from '../database/db';
import { aiService } from './ai.service';
import { Conversation, Message, ChatRequest, ChatResponse, Order, Customer } from '../types';

// Mock customer and order data (in production, this would come from your e-commerce database)
const mockCustomers: Record<string, Customer> = {
    'cust-001': {
        id: 'cust-001',
        name: 'Sarah Mitchell',
        email: 'sarah.m@email.com',
        phone: '+1 (555) 123-4567',
        location: 'San Francisco, CA',
        createdAt: '2022-03-15',
    },
    'cust-002': {
        id: 'cust-002',
        name: 'James Wilson',
        email: 'james.w@email.com',
        phone: '+1 (555) 234-5678',
        location: 'New York, NY',
        createdAt: '2023-01-20',
    },
    // Demo personas
    'cust-sarah-001': {
        id: 'cust-sarah-001',
        name: 'Sarah Johnson',
        email: 'sarah.j@email.com',
        phone: '+1 (555) 867-5309',
        location: 'Austin, TX',
        createdAt: '2024-06-10',
    },
    'cust-mike-002': {
        id: 'cust-mike-002',
        name: 'Mike Chen',
        email: 'mike.chen@email.com',
        phone: '+1 (555) 234-8910',
        location: 'Seattle, WA',
        createdAt: '2024-03-22',
    },
    'cust-emily-003': {
        id: 'cust-emily-003',
        name: 'Emily Davis',
        email: 'emily.d@email.com',
        phone: '+1 (555) 456-7890',
        location: 'Chicago, IL',
        createdAt: '2024-09-05',
    },
    'cust-james-004': {
        id: 'cust-james-004',
        name: 'James Wilson',
        email: 'j.wilson@email.com',
        phone: '+1 (555) 321-0987',
        location: 'Miami, FL',
        createdAt: '2023-11-18',
    },
    'cust-lisa-005': {
        id: 'cust-lisa-005',
        name: 'Lisa Martinez',
        email: 'lisa.m@email.com',
        phone: '+1 (555) 654-3210',
        location: 'Denver, CO',
        createdAt: '2024-01-30',
    },
};

const mockOrders: Record<string, Order[]> = {
    'cust-001': [
        { id: '#12847', customerId: 'cust-001', status: 'in_transit', trackingNumber: 'TRK-9847362', amount: 89.99, createdAt: '2024-12-15', updatedAt: '2024-12-16' },
        { id: '#12653', customerId: 'cust-001', status: 'delivered', amount: 145.00, createdAt: '2024-11-28', updatedAt: '2024-12-02' },
    ],
    'cust-002': [
        { id: '#12901', customerId: 'cust-002', status: 'processing', amount: 234.50, createdAt: '2024-12-18', updatedAt: '2024-12-18' },
    ],
    // Demo persona orders
    'cust-sarah-001': [
        { id: '#13001', customerId: 'cust-sarah-001', status: 'in_transit', trackingNumber: 'TRK-5551234', amount: 156.99, createdAt: '2024-12-20', updatedAt: '2024-12-21' },
        { id: '#12890', customerId: 'cust-sarah-001', status: 'delivered', amount: 79.50, createdAt: '2024-11-15', updatedAt: '2024-11-20' },
    ],
    'cust-mike-002': [
        { id: '#13045', customerId: 'cust-mike-002', status: 'processing', amount: 312.00, createdAt: '2024-12-22', updatedAt: '2024-12-22' },
        { id: '#12756', customerId: 'cust-mike-002', status: 'delivered', amount: 89.99, createdAt: '2024-10-30', updatedAt: '2024-11-05' },
    ],
    'cust-emily-003': [
        { id: '#13078', customerId: 'cust-emily-003', status: 'pending', amount: 245.00, createdAt: '2024-12-23', updatedAt: '2024-12-23' },
    ],
    'cust-james-004': [
        { id: '#13102', customerId: 'cust-james-004', status: 'shipped', trackingNumber: 'TRK-8889999', amount: 499.99, createdAt: '2024-12-19', updatedAt: '2024-12-21' },
        { id: '#12601', customerId: 'cust-james-004', status: 'delivered', amount: 124.50, createdAt: '2024-09-10', updatedAt: '2024-09-15' },
        { id: '#12345', customerId: 'cust-james-004', status: 'delivered', amount: 67.00, createdAt: '2024-07-22', updatedAt: '2024-07-28' },
    ],
    'cust-lisa-005': [
        { id: '#13156', customerId: 'cust-lisa-005', status: 'in_transit', trackingNumber: 'TRK-7776543', amount: 189.00, createdAt: '2024-12-18', updatedAt: '2024-12-20' },
    ],
};

export class ChatService {
    /**
     * Process an incoming chat message and generate AI response
     */
    async processMessage(request: ChatRequest): Promise<ChatResponse> {
        const { message, conversationId: existingConversationId, customerId, customerName, customerEmail } = request;

        // Get or create conversation
        let conversationId = existingConversationId;
        let conversation: Conversation | undefined;

        if (conversationId) {
            conversation = this.getConversation(conversationId);
        }

        if (!conversation) {
            // Create new conversation
            conversationId = uuidv4();
            const custId = customerId || `cust-${uuidv4().slice(0, 8)}`;
            const custName = customerName || 'Guest Customer';

            db.prepare(`
        INSERT INTO conversations (id, customer_id, customer_name, customer_email, status)
        VALUES (?, ?, ?, ?, 'open')
      `).run(conversationId, custId, custName, customerEmail || null);

            conversation = this.getConversation(conversationId)!;

            // Log analytics event
            this.logAnalyticsEvent('conversation_started', conversationId);
        }

        // Save customer message
        const customerMessageId = uuidv4();
        db.prepare(`
      INSERT INTO messages (id, conversation_id, role, content)
      VALUES (?, ?, 'customer', ?)
    `).run(customerMessageId, conversationId, message);

        // Get conversation history for context
        const history = this.getConversationHistory(conversationId!);

        // Get customer context
        const customerContext = this.getCustomerContext(conversation!.customerId);

        // === LLM-Powered Sentiment Analysis ===
        // Use Gemini for deep semantic understanding of customer emotions
        const sentiment = await aiService.analyzeSentimentWithLLM(
            message, 
            history.map(m => ({ role: m.role, content: m.content }))
        );

        // Log sentiment insights for debugging
        if (sentiment.primaryEmotion) {
            console.log(`🎭 Emotion: ${sentiment.primaryEmotion} | Risk: ${sentiment.escalationRisk} | Tone: ${sentiment.recommendedTone}`);
            if (sentiment.contextualInsights) {
                console.log(`   💡 Insight: ${sentiment.contextualInsights}`);
            }
        }

        // Generate AI response with sentiment context
        const aiResponse = await aiService.generateResponse({
            message,
            conversationHistory: history.map(m => ({ role: m.role, content: m.content })),
            customerContext: customerContext ? {
                name: customerContext.customer.name,
                email: customerContext.customer.email,
                recentOrders: customerContext.recentOrders.map(o => ({
                    id: o.id,
                    status: o.status,
                    amount: o.amount.toString(),
                })),
            } : undefined,
            currentSentiment: sentiment,
        });

        // === LLM-Powered Smart Actions ===
        const quickActions = await aiService.generateSmartActionsWithLLM(
            message,
            history.map(m => ({ role: m.role, content: m.content })),
            customerContext ? {
                recentOrders: customerContext.recentOrders.map(o => ({
                    id: o.id,
                    status: o.status,
                    amount: o.amount.toString(),
                })),
            } : undefined,
            sentiment
        );

        // Log smart actions for debugging
        if (quickActions.length > 0) {
            console.log(`⚡ Smart Actions: ${quickActions.map(a => a.label).join(', ')}`);
        }

        // === NEW: Generate resolution suggestion ===
        const resolutionSuggestion = aiService.generateResolutionSuggestion(
            message,
            quickActions,
            sentiment
        );

        // === NEW: Generate proactive alerts ===
        const proactiveAlerts = aiService.generateProactiveAlerts(
            customerContext ? {
                recentOrders: customerContext.recentOrders.map(o => ({
                    id: o.id,
                    status: o.status,
                    amount: o.amount.toString(),
                })),
            } : undefined
        );

        // Check for escalation (enhanced with sentiment)
        const escalationTrigger = aiService.detectEscalation(message, aiResponse.content, aiResponse.confidenceScore);

        // Auto-escalate if sentiment is angry and declining
        const shouldAutoEscalate = sentiment.level === 'angry' && sentiment.trend === 'declining';

        // Save AI response
        const aiMessageId = uuidv4();
        db.prepare(`
      INSERT INTO messages (id, conversation_id, role, content, confidence_score)
      VALUES (?, ?, 'ai', ?, ?)
    `).run(aiMessageId, conversationId, aiResponse.content, aiResponse.confidenceScore);

        const aiMessage: Message = {
            id: aiMessageId,
            conversationId: conversationId!,
            role: 'ai',
            content: aiResponse.content,
            confidenceScore: aiResponse.confidenceScore,
            createdAt: new Date().toISOString(),
        };

        // Handle escalation if needed
        if (escalationTrigger || shouldAutoEscalate) {
            const trigger = escalationTrigger || {
                type: 'negative_sentiment' as const,
                reason: 'Customer sentiment is angry and declining - proactive escalation',
                priority: 'high' as const,
            };
            this.createEscalation(conversationId!, conversation!, message, trigger);
        }

        // Log analytics with enhanced data
        this.logAnalyticsEvent('message_processed', conversationId!, {
            confidenceScore: aiResponse.confidenceScore,
            escalated: !!(escalationTrigger || shouldAutoEscalate),
            sentimentLevel: sentiment.level,
            sentimentScore: sentiment.score,
            quickActionsCount: quickActions.length,
        });

        // === MVDPDF: Extract Intent Signals for AdTech (async, non-blocking) ===
        aiService.extractIntentSignals(
            message,
            history.map(m => ({ role: m.role, content: m.content })),
            conversationId!
        ).then(({ intentSignals, zeroPartyData }) => {
            if (intentSignals.length > 0) {
                console.log(`🎯 AdTech: ${intentSignals.length} intent signals captured`);
            }
            if (Object.keys(zeroPartyData.preferences || {}).length > 0) {
                console.log(`👤 Zero-Party Data: ${JSON.stringify(zeroPartyData.preferences)}`);
            }
        }).catch(err => console.error('Intent extraction background error:', err));

        // === MVDPDF: Get RAG source citations ===
        const { citations: sourceCitations } = aiService.searchKnowledgeBaseWithCitations(message);

        return {
            conversationId: conversationId!,
            message: aiMessage,
            suggestedResponses: aiResponse.suggestedResponses,
            shouldEscalate: !!(escalationTrigger || shouldAutoEscalate),
            escalationReason: escalationTrigger?.reason || (shouldAutoEscalate ? 'Proactive escalation due to declining sentiment' : undefined),
            customerContext,
            // === NEW: Enhanced response data ===
            sentiment,
            quickActions,
            resolutionSuggestion,
            proactiveAlerts,
            // === MVDPDF: Source citations for RAG transparency ===
            sourceCitations,
        };
    }

    /**
     * Get a conversation by ID
     */
    getConversation(conversationId: string): Conversation | undefined {
        const row = db.prepare(`
      SELECT id, customer_id as customerId, customer_name as customerName, 
             customer_email as customerEmail, status, category,
             created_at as createdAt, updated_at as updatedAt
      FROM conversations WHERE id = ?
    `).get(conversationId) as Conversation | undefined;
        return row;
    }

    /**
     * Get all conversations
     */
    getAllConversations(): Conversation[] {
        const rows = db.prepare(`
      SELECT id, customer_id as customerId, customer_name as customerName, 
             customer_email as customerEmail, status, category,
             created_at as createdAt, updated_at as updatedAt
      FROM conversations ORDER BY updated_at DESC
    `).all() as Conversation[];
        return rows;
    }

    /**
     * Get conversation with messages
     */
    getConversationWithMessages(conversationId: string): { conversation: Conversation; messages: Message[] } | null {
        const conversation = this.getConversation(conversationId);
        if (!conversation) return null;

        const messages = this.getConversationHistory(conversationId);
        return { conversation, messages };
    }

    /**
     * Get conversation message history
     */
    private getConversationHistory(conversationId: string): Message[] {
        const rows = db.prepare(`
      SELECT id, conversation_id as conversationId, role, content, 
             confidence_score as confidenceScore, created_at as createdAt
      FROM messages WHERE conversation_id = ? ORDER BY created_at ASC
    `).all(conversationId) as Message[];
        return rows;
    }

    /**
     * Get customer context (customer info + recent orders)
     */
    private getCustomerContext(customerId: string): { customer: Customer; recentOrders: Order[] } | undefined {
        // First check mock data
        let customer = mockCustomers[customerId];
        
        // If not in mock data, try to build from conversation info
        if (!customer) {
            const convRow = db.prepare(`
                SELECT customer_id, customer_name, customer_email, created_at
                FROM conversations WHERE customer_id = ? LIMIT 1
            `).get(customerId) as { customer_id: string; customer_name: string; customer_email: string; created_at: string } | undefined;
            
            if (convRow) {
                customer = {
                    id: convRow.customer_id,
                    name: convRow.customer_name,
                    email: convRow.customer_email || '',
                    createdAt: convRow.created_at,
                };
            }
        }
        
        if (!customer) return undefined;

        const orders = mockOrders[customerId] || [];
        return { customer, recentOrders: orders };
    }

    /**
     * Manually escalate a conversation
     */
    escalateConversation(conversationId: string, reason: string): void {
        const conversation = this.getConversation(conversationId);
        if (!conversation) return;

        this.createEscalation(conversationId, conversation, '', {
            type: 'customer_request',
            reason,
            priority: 'high',
        });
    }

    /**
     * Create an escalation ticket
     */
    private createEscalation(
        conversationId: string,
        conversation: Conversation,
        triggerMessage: string,
        escalation: { type: string; reason: string; priority: string }
    ): void {
        const ticketId = `TKT-${Math.floor(1000 + Math.random() * 9000)}`;

        // Determine category from message
        const category = this.categorizeIssue(triggerMessage);

        db.prepare(`
      INSERT INTO tickets (id, ticket_id, conversation_id, customer, category, priority, escalation_reason, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'open')
    `).run(uuidv4(), ticketId, conversationId, conversation.customerName, category, escalation.priority, escalation.reason);

        // Update conversation status
        db.prepare(`UPDATE conversations SET status = 'escalated' WHERE id = ?`).run(conversationId);

        // Add system message
        db.prepare(`
      INSERT INTO messages (id, conversation_id, role, content)
      VALUES (?, ?, 'system', ?)
    `).run(uuidv4(), conversationId, `Conversation escalated: ${escalation.reason}`);

        this.logAnalyticsEvent('escalation_created', conversationId, { ticketId, reason: escalation.reason });
    }

    /**
     * Categorize the issue based on message content
     */
    private categorizeIssue(message: string): string {
        const messageLower = message.toLowerCase();

        if (messageLower.includes('return') || messageLower.includes('refund')) return 'Returns';
        if (messageLower.includes('payment') || messageLower.includes('billing') || messageLower.includes('charge')) return 'Billing';
        if (messageLower.includes('order') || messageLower.includes('track')) return 'Orders';
        if (messageLower.includes('shipping') || messageLower.includes('delivery') || messageLower.includes('package')) return 'Shipping';
        if (messageLower.includes('account') || messageLower.includes('password') || messageLower.includes('login')) return 'Account';
        if (messageLower.includes('product') || messageLower.includes('item') || messageLower.includes('quality')) return 'Product';

        return 'General';
    }

    /**
     * Log analytics event
     */
    private logAnalyticsEvent(eventType: string, conversationId?: string, data?: Record<string, unknown>): void {
        db.prepare(`
      INSERT INTO analytics_events (id, event_type, conversation_id, data)
      VALUES (?, ?, ?, ?)
    `).run(uuidv4(), eventType, conversationId || null, data ? JSON.stringify(data) : null);
    }

    /**
     * Resolve a conversation
     */
    resolveConversation(conversationId: string): void {
        db.prepare(`UPDATE conversations SET status = 'resolved', updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(conversationId);
        this.logAnalyticsEvent('conversation_resolved', conversationId);
    }
}

export const chatService = new ChatService();
