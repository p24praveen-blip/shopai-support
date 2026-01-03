// API Configuration and Service Layer for ShopAI Support

// Use environment variable for API URL, fallback to localhost for development
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Generic fetch wrapper with error handling
async function apiCall<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const defaultOptions: RequestInit = {
        headers: {
            'Content-Type': 'application/json',
        },
    };

    const response = await fetch(url, { ...defaultOptions, ...options });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
}

// Types

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
    score: number;
    indicators: string[];
    trend: 'improving' | 'stable' | 'declining';
    empathyNeeded: boolean;
    // LLM-Powered Extended Fields
    primaryEmotion?: PrimaryEmotion;
    secondaryEmotions?: string[];
    escalationRisk?: EscalationRisk;
    contextualInsights?: string;
    recommendedTone?: RecommendedTone;
}

// === SMART RESOLUTION TYPES ===
export interface QuickAction {
    id: string;
    type: 'refund' | 'discount' | 'replacement' | 'expedite_shipping' | 'callback' | 'manual_review';
    label: string;
    description: string;
    eligible: boolean;
    reason?: string;
    estimatedValue?: number;
    autoApproved: boolean;
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

export interface Customer {
    id: string;
    name: string;
    email: string;
    phone?: string;
    location?: string;
    createdAt: string;
}

export interface Order {
    id: string;
    customerId: string;
    status: string;
    trackingNumber?: string;
    amount: number;
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
    // === MVDPDF: Source citations ===
    sourceCitations?: SourceCitation[];
}

export interface SourceCitation {
    articleId: string;
    articleTitle: string;
    relevanceScore: number;
    excerpt: string;
}

// === MVDPDF Metrics Types ===
export interface MVDPDFMetrics {
    // Operational Metrics (5.1)
    deflectionRate: number;
    firstResponseTime: number;
    resolutionRate: number;
    sentimentDrift: number;
    
    // AdTech Metrics (5.2)
    intentCaptureRate: number;
    zeroPartyEnrichment: number;
    identityResolutionRate: number;
    
    // AI Evaluation (5.3)
    faithfulnessScore: number;
    answerRelevancy: number;
}

export interface Ticket {
    id: string;
    ticketId: string;
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

// Chat API
export const chatApi = {
    sendMessage: async (message: string, conversationId?: string, customerName?: string, customerId?: string): Promise<ChatResponse> => {
        return apiCall<ChatResponse>('/chat/message', {
            method: 'POST',
            body: JSON.stringify({ message, conversationId, customerName, customerId }),
        });
    },

    getConversations: async (): Promise<Conversation[]> => {
        return apiCall<Conversation[]>('/chat/conversations');
    },

    getConversation: async (id: string): Promise<{ conversation: Conversation; messages: Message[] }> => {
        return apiCall<{ conversation: Conversation; messages: Message[] }>(`/chat/conversations/${id}`);
    },

    escalateConversation: async (id: string, reason?: string): Promise<void> => {
        return apiCall('/chat/conversations/' + id + '/escalate', {
            method: 'POST',
            body: JSON.stringify({ reason }),
        });
    },

    resolveConversation: async (id: string): Promise<void> => {
        return apiCall('/chat/conversations/' + id + '/resolve', {
            method: 'POST',
        });
    },
};

// Escalations API
export const escalationsApi = {
    getAll: async (filters?: { priority?: string; category?: string; status?: string }): Promise<Ticket[]> => {
        const params = new URLSearchParams();
        if (filters?.priority) params.append('priority', filters.priority);
        if (filters?.category) params.append('category', filters.category);
        if (filters?.status) params.append('status', filters.status);
        const query = params.toString();
        return apiCall<Ticket[]>(`/escalations${query ? '?' + query : ''}`);
    },

    getStats: async (): Promise<{ open: number; inProgress: number; resolved: number; avgWaitTime: string }> => {
        return apiCall('/escalations/stats');
    },

    assignTicket: async (ticketId: string, agentName: string): Promise<Ticket> => {
        return apiCall<Ticket>(`/escalations/${ticketId}/assign`, {
            method: 'PUT',
            body: JSON.stringify({ agentName }),
        });
    },

    resolveTicket: async (ticketId: string): Promise<Ticket> => {
        return apiCall<Ticket>(`/escalations/${ticketId}/resolve`, {
            method: 'PUT',
        });
    },
};

// Knowledge Base API
export const knowledgeBaseApi = {
    getCategories: async (): Promise<Array<{ category: string; articleCount: number; lastUpdated: string }>> => {
        return apiCall('/knowledge-base/categories');
    },

    getArticles: async (category?: string): Promise<Article[]> => {
        const query = category ? `?category=${encodeURIComponent(category)}` : '';
        return apiCall<Article[]>(`/knowledge-base/articles${query}`);
    },

    searchArticles: async (query: string): Promise<Article[]> => {
        return apiCall<Article[]>(`/knowledge-base/articles?search=${encodeURIComponent(query)}`);
    },

    createArticle: async (category: string, title: string, content: string): Promise<Article> => {
        return apiCall<Article>('/knowledge-base/articles', {
            method: 'POST',
            body: JSON.stringify({ category, title, content }),
        });
    },

    trainAI: async (): Promise<{ status: string; articlesProcessed: number; timestamp: string }> => {
        return apiCall('/knowledge-base/train', { method: 'POST' });
    },
};

// Analytics API
export const analyticsApi = {
    getStats: async (): Promise<AnalyticsStats> => {
        return apiCall<AnalyticsStats>('/analytics/stats');
    },

    getResolutionTime: async (): Promise<Array<{ date: string; time: number }>> => {
        return apiCall('/analytics/resolution-time');
    },

    getTopIssues: async (): Promise<Array<{ issue: string; count: number }>> => {
        return apiCall('/analytics/issues');
    },

    getAiVsHuman: async (): Promise<Array<{ name: string; value: number; color: string }>> => {
        return apiCall('/analytics/ai-vs-human');
    },

    getSatisfaction: async (): Promise<Array<{ date: string; score: number }>> => {
        return apiCall('/analytics/satisfaction');
    },

    getEscalationReasons: async (): Promise<Array<{ name: string; value: number; color: string }>> => {
        return apiCall('/analytics/escalation-reasons');
    },

    getVolume: async (): Promise<Array<{ time: string; conversations: number }>> => {
        return apiCall('/analytics/volume');
    },

    // MVDPDF Metrics
    getMVDPDFMetrics: async (): Promise<MVDPDFMetrics> => {
        return apiCall<MVDPDFMetrics>('/analytics/mvdpdf-metrics');
    },
};

// Health check
export const healthApi = {
    check: async (): Promise<{ status: string; timestamp: string }> => {
        return apiCall('/health');
    },
};

// Settings API - Model management
export type AIModelType = 'gemini-2.5-pro' | 'gemini-2.5-flash';

export interface ModelSettings {
    currentModel: AIModelType;
    availableModels: AIModelType[];
}

export const settingsApi = {
    getModel: async (): Promise<ModelSettings> => {
        return apiCall('/settings/model');
    },

    setModel: async (model: AIModelType): Promise<{ success: boolean; currentModel: AIModelType }> => {
        return apiCall('/settings/model', {
            method: 'POST',
            body: JSON.stringify({ model }),
        });
    },

    clearChats: async (): Promise<{ success: boolean; message: string }> => {
        return apiCall('/settings/clear-chats', {
            method: 'POST',
        });
    },

    seedDemos: async (): Promise<{ success: boolean; message: string; personas: Array<{ name: string; category: string }> }> => {
        return apiCall('/settings/seed-demos', {
            method: 'POST',
        });
    },
};
