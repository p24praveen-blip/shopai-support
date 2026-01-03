// Type definitions for ShopAI Support Backend

// === EMOTIONAL INTELLIGENCE TYPES (LLM-Powered) ===
export type SentimentLevel = 'positive' | 'neutral' | 'concerned' | 'frustrated' | 'angry';

export type PrimaryEmotion = 
    | 'happy' | 'grateful' | 'confused' | 'anxious' | 'impatient' 
    | 'frustrated' | 'angry' | 'disappointed' | 'hopeful' | 'neutral';

export type EscalationRisk = 'low' | 'medium' | 'high';

export type RecommendedTone = 
    | 'warm' | 'professional' | 'apologetic' | 'reassuring' | 'celebratory' | 'empathetic';

export interface SentimentAnalysis {
    level: SentimentLevel;
    score: number; // -1 (very negative) to 1 (very positive)
    indicators: string[]; // Keywords/phrases that triggered this sentiment
    trend: 'improving' | 'stable' | 'declining'; // Sentiment change over conversation
    empathyNeeded: boolean; // Should AI respond with extra empathy?
    
    // === LLM-Powered Extended Fields ===
    primaryEmotion?: PrimaryEmotion; // Main detected emotion
    secondaryEmotions?: string[]; // Other emotions present
    escalationRisk?: EscalationRisk; // Risk of customer escalating/churning
    contextualInsights?: string; // WHY the customer feels this way
    recommendedTone?: RecommendedTone; // How agent should respond
}

// === SMART RESOLUTION TYPES ===
export interface QuickAction {
    id: string;
    type: 'refund' | 'discount' | 'replacement' | 'expedite_shipping' | 'callback' | 'manual_review';
    label: string;
    description: string;
    eligible: boolean;
    reason?: string; // Why eligible/not eligible
    estimatedValue?: number; // Dollar value if applicable
    autoApproved: boolean; // Can be executed without human approval
}

export interface ResolutionSuggestion {
    primaryAction: QuickAction;
    alternativeActions: QuickAction[];
    confidence: number;
    reasoning: string;
}

// === PROACTIVE SUPPORT TYPES ===
export interface ProactiveAlert {
    id: string;
    type: 'delivery_delay' | 'payment_issue' | 'stock_update' | 'price_drop' | 'review_request';
    priority: 'high' | 'medium' | 'low';
    title: string;
    message: string;
    suggestedAction: string;
    relatedOrderId?: string;
    expiresAt?: string;
}

// === CUSTOMER MEMORY TYPES ===
export interface CustomerMemory {
    preferences: {
        communicationStyle: 'formal' | 'casual' | 'friendly';
        preferredResolution: 'refund' | 'replacement' | 'store_credit';
        timezone?: string;
    };
    history: {
        totalOrders: number;
        totalSpent: number;
        returnRate: number;
        avgSatisfaction: number;
        pastIssues: Array<{
            date: string;
            category: string;
            resolution: string;
            satisfied: boolean;
        }>;
    };
    riskScore: number; // Churn risk 0-100
    lifetimeValue: number;
    vipStatus: boolean;
}

export interface Customer {
    id: string;
    name: string;
    email: string;
    phone?: string;
    location?: string;
    createdAt: string;
    memory?: CustomerMemory; // NEW: Persistent customer memory
}

export interface Order {
    id: string;
    customerId: string;
    status: 'pending' | 'processing' | 'shipped' | 'in_transit' | 'delivered' | 'returned';
    trackingNumber?: string;
    amount: number;
    createdAt: string;
    updatedAt: string;
}

export interface Conversation {
    id: string;
    customerId: string;
    customerName: string;
    customerEmail?: string;
    status: 'open' | 'resolved' | 'escalated';
    category?: string;
    createdAt: string;
    updatedAt: string;
}

export interface Message {
    id: string;
    conversationId: string;
    role: 'customer' | 'ai' | 'agent' | 'system';
    content: string;
    confidenceScore?: number;
    createdAt: string;
}

export interface Ticket {
    id: string;
    ticketId: string; // Human-readable ID like TKT-2847
    conversationId: string;
    customer: string;
    category: string;
    priority: 'high' | 'medium' | 'low';
    escalationReason: string;
    assignedAgent?: string;
    status: 'open' | 'in_progress' | 'resolved';
    waitTime: string;
    createdAt: string;
    updatedAt: string;
}

export interface Article {
    id: string;
    category: string;
    title: string;
    content: string;
    createdAt: string;
    updatedAt: string;
}

export interface ChatRequest {
    conversationId?: string;
    customerId?: string;
    customerName?: string;
    customerEmail?: string;
    message: string;
}

export interface ChatResponse {
    conversationId: string;
    message: Message;
    suggestedResponses: string[];
    shouldEscalate: boolean;
    escalationReason?: string;
    customerContext?: {
        customer: Customer;
        recentOrders: Order[];
    };
    // === NEW: Enhanced response data ===
    sentiment?: SentimentAnalysis;
    quickActions?: QuickAction[];
    resolutionSuggestion?: ResolutionSuggestion;
    proactiveAlerts?: ProactiveAlert[];
    // === MVDPDF: Source citations for RAG transparency ===
    sourceCitations?: SourceCitation[];
}

export interface EscalationTrigger {
    type: 'low_confidence' | 'customer_request' | 'sensitive_topic' | 'repeated_question' | 'negative_sentiment' | 'policy_exception';
    reason: string;
    priority: 'high' | 'medium' | 'low';
}

export interface AnalyticsStats {
    activeConversations: number;
    avgResolutionTime: string;
    customerSatisfaction: string;
    escalationRate: string;
    resolvedToday: number;
    trends: {
        activeConversations: { value: number; isPositive: boolean };
        avgResolutionTime: { value: number; isPositive: boolean };
        customerSatisfaction: { value: number; isPositive: boolean };
        escalationRate: { value: number; isPositive: boolean };
    };
}

// === MVDPDF: INTENT SIGNAL TYPES (AdTech Integration) ===
export interface IntentSignal {
    id: string;
    sessionId: string;
    userId?: string;
    timestamp: string;
    category: 'product_interest' | 'purchase_intent' | 'support_issue' | 'comparison' | 'price_sensitivity';
    intent: string; // e.g., "running_shoes", "waterproof_jacket"
    confidence: number;
    urgency: 'high' | 'medium' | 'low';
    attributes: Record<string, string>; // e.g., { color: 'blue', size: 'M' }
}

// === MVDPDF: ZERO-PARTY DATA TYPES ===
export interface ZeroPartyData {
    userId: string;
    sessionId: string;
    timestamp: string;
    preferences: {
        size?: string;
        color?: string;
        style?: string;
        priceRange?: string;
        brand?: string;
        category?: string;
    };
    demographics: {
        location?: string;
        activity?: string;
    };
    purchaseIntent: {
        urgency: 'high' | 'medium' | 'low';
        timeline?: string;
        budget?: string;
    };
}

// === MVDPDF: CONVERSATION MEMORY TYPES ===
export interface ConversationMemory {
    conversationId: string;
    summary: string;
    keyTopics: string[];
    unresolvedIssues: string[];
    customerPreferences: Record<string, string>;
    turnCount: number;
    lastUpdated: string;
}

// === MVDPDF: RAG SOURCE CITATION TYPES ===
export interface SourceCitation {
    articleId: string;
    articleTitle: string;
    relevanceScore: number;
    excerpt: string;
}

// === MVDPDF: METRICS TYPES ===
export interface MVDPDFMetrics {
    // Operational Metrics (5.1)
    deflectionRate: number; // % resolved without human (target: >40%)
    firstResponseTime: number; // ms to first token (target: <2000ms)
    resolutionRate: number; // % issues solved (target: >75%)
    sentimentDrift: number; // change from start to end
    
    // AdTech Metrics (5.2)
    intentCaptureRate: number; // % with classified intent (target: >60%)
    zeroPartyEnrichment: number; // attributes per 1000 interactions (target: >150)
    identityResolutionRate: number; // % anonymous -> identified (target: >20%)
    
    // AI Evaluation (5.3)
    faithfulnessScore: number; // answer from context only (target: >0.9)
    answerRelevancy: number; // semantic match (target: >0.85)
}

