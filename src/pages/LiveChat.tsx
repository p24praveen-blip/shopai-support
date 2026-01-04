import { useState, useEffect, useRef } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  Search,
  Send,
  User,
  Package,
  Sparkles,
  AlertTriangle,
  Phone,
  Mail,
  MapPin,
  RefreshCw,
  Smile,
  Meh,
  Frown,
  AlertCircle,
  Zap,
  Gift,
  DollarSign,
  Truck,
  PhoneCall,
  TrendingUp,
  TrendingDown,
  Minus,
  Heart,
  Bot,
  UserCircle,
  BookOpen,
  ExternalLink,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { chatApi, type Message, type Conversation, type ChatResponse, type Customer, type Order, type SentimentAnalysis, type QuickAction, type SentimentLevel, type SourceCitation } from "@/lib/api";
import { toast } from "sonner";

interface DisplayMessage {
  id: string;
  role: "customer" | "ai" | "system" | "agent";
  content: string;
  time: string;
}

interface DisplayConversation {
  id: string;
  customerName: string;
  lastMessage: string;
  status: "open" | "resolved" | "escalated";
  unread: boolean;
  time: string;
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hr`;
  return `${Math.floor(diffHours / 24)} day`;
}

export default function LiveChat() {
  const [conversations, setConversations] = useState<DisplayConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [message, setMessage] = useState("");
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [suggestedResponses, setSuggestedResponses] = useState<string[]>([]);
  const [customerContext, setCustomerContext] = useState<{ customer: Customer; recentOrders: Order[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // === NEW: Emotional Intelligence State ===
  const [currentSentiment, setCurrentSentiment] = useState<SentimentAnalysis | null>(null);
  const [quickActions, setQuickActions] = useState<QuickAction[]>([]);
  // === MVDPDF: Source Citations from RAG ===
  const [sourceCitations, setSourceCitations] = useState<SourceCitation[]>([]);
  const [showAiDisclosure, setShowAiDisclosure] = useState(true);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // === NEW: Sentiment Helper Functions ===
  const getSentimentIcon = (level: SentimentLevel) => {
    switch (level) {
      case 'positive': return <Smile className="w-5 h-5" />;
      case 'neutral': return <Meh className="w-5 h-5" />;
      case 'concerned': return <Meh className="w-5 h-5" />;
      case 'frustrated': return <Frown className="w-5 h-5" />;
      case 'angry': return <AlertCircle className="w-5 h-5" />;
    }
  };

  const getSentimentColor = (level: SentimentLevel) => {
    switch (level) {
      case 'positive': return 'text-green-500 bg-green-500/10';
      case 'neutral': return 'text-gray-500 bg-gray-500/10';
      case 'concerned': return 'text-yellow-500 bg-yellow-500/10';
      case 'frustrated': return 'text-orange-500 bg-orange-500/10';
      case 'angry': return 'text-red-500 bg-red-500/10';
    }
  };

  const getSentimentLabel = (level: SentimentLevel) => {
    switch (level) {
      case 'positive': return 'Happy';
      case 'neutral': return 'Neutral';
      case 'concerned': return 'Concerned';
      case 'frustrated': return 'Frustrated';
      case 'angry': return 'Upset';
    }
  };

  const getTrendIcon = (trend: 'improving' | 'stable' | 'declining') => {
    switch (trend) {
      case 'improving': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'stable': return <Minus className="w-4 h-4 text-gray-500" />;
      case 'declining': return <TrendingDown className="w-4 h-4 text-red-500" />;
    }
  };

  const getActionIcon = (type: QuickAction['type']) => {
    switch (type) {
      case 'refund': return <DollarSign className="w-4 h-4" />;
      case 'discount': return <Gift className="w-4 h-4" />;
      case 'replacement': return <Package className="w-4 h-4" />;
      case 'expedite_shipping': return <Truck className="w-4 h-4" />;
      case 'callback': return <PhoneCall className="w-4 h-4" />;
      default: return <Zap className="w-4 h-4" />;
    }
  };

  const handleQuickAction = async (action: QuickAction) => {
    toast.success(`${action.label} initiated`, {
      description: action.description,
    });
    // In production, this would call an API to execute the action
  };

  const loadConversations = async () => {
    try {
      setLoading(true);
      const convs = await chatApi.getConversations();
      const displayConvs: DisplayConversation[] = convs.map(c => ({
        id: c.id,
        customerName: c.customerName,
        lastMessage: c.category || 'New conversation',
        status: c.status,
        unread: c.status === 'open',
        time: formatTimeAgo(c.updatedAt),
      }));
      setConversations(displayConvs);

      // Select first conversation if available
      if (displayConvs.length > 0 && !selectedConversation) {
        selectConversation(displayConvs[0].id);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectConversation = async (convId: string) => {
    setSelectedConversation(convId);
    try {
      const data = await chatApi.getConversation(convId);
      const displayMsgs: DisplayMessage[] = data.messages.map(m => ({
        id: m.id,
        role: m.role,
        content: m.content,
        time: formatTime(m.createdAt),
      }));
      setMessages(displayMsgs);
    } catch (error) {
      console.error('Failed to load conversation:', error);
      setMessages([]);
    }
  };

  const sendMessage = async () => {
    if (!message.trim()) return;

    const userMessage = message.trim();
    const isFirstMessageInSession = messages.filter(m => m.role === 'customer').length === 0;
    setMessage("");
    setIsAiTyping(true);

    // Add user message immediately
    const tempUserMsg: DisplayMessage = {
      id: `temp-${Date.now()}`,
      role: "customer",
      content: userMessage,
      time: formatTime(new Date().toISOString()),
    };
    setMessages(prev => [...prev, tempUserMsg]);

    // === IMMEDIATE ACKNOWLEDGMENT MESSAGE ===
    // Show acknowledgment while LLM is processing (for first message in session)
    const ackMsgId = `ack-${Date.now()}`;
    if (isFirstMessageInSession) {
      const ackMsg: DisplayMessage = {
        id: ackMsgId,
        role: "ai",
        content: "Thank you for contacting ShopAI! 👋 Let me review your account and find the best way to help you...",
        time: formatTime(new Date().toISOString()),
      };
      // Add acknowledgment immediately (small delay for natural feel)
      setTimeout(() => {
        setMessages(prev => [...prev, ackMsg]);
      }, 300);
    }

    try {
      const response: ChatResponse = await chatApi.sendMessage(
        userMessage,
        selectedConversation || undefined,
        "Support Agent"
      );

      // Update conversation ID if new
      if (!selectedConversation) {
        setSelectedConversation(response.conversationId);
      }

      // Add AI response
      const aiMsg: DisplayMessage = {
        id: response.message.id,
        role: "ai",
        content: response.message.content,
        time: formatTime(response.message.createdAt),
      };
      
      // Update messages: keep user message, remove ack if exists, add real AI response
      setMessages(prev => {
        // Filter out temp user message and ack message
        const filtered = prev.filter(m => !m.id.startsWith('temp-') && !m.id.startsWith('ack-'));
        // Add confirmed user message and AI response
        return [...filtered, { ...tempUserMsg, id: `user-${Date.now()}` }, aiMsg];
      });

      // Update suggested responses
      setSuggestedResponses(response.suggestedResponses);

      // Update customer context if available
      if (response.customerContext) {
        setCustomerContext(response.customerContext);
      }

      // === NEW: Update emotional intelligence state ===
      if (response.sentiment) {
        setCurrentSentiment(response.sentiment);
        
        // Show empathy alert if needed
        if (response.sentiment.empathyNeeded && response.sentiment.level !== 'positive') {
          toast.info("💡 Empathy Recommended", {
            description: `Customer seems ${response.sentiment.level}. Consider a more empathetic approach.`,
          });
        }
      }
      
      // Update quick actions
      if (response.quickActions) {
        setQuickActions(response.quickActions);
      }

      // === MVDPDF: Update source citations from RAG ===
      if (response.sourceCitations && response.sourceCitations.length > 0) {
        setSourceCitations(response.sourceCitations);
      }

      // Show escalation toast if needed
      if (response.shouldEscalate) {
        toast.warning("Escalation Triggered", {
          description: response.escalationReason,
        });
      }

      // Refresh conversations list
      loadConversations();
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error("Failed to send message");
      setMessages(prev => prev.slice(0, -1)); // Remove temp message
    } finally {
      setIsAiTyping(false);
    }
  };

  const handleEscalate = async () => {
    if (!selectedConversation) return;
    try {
      await chatApi.escalateConversation(selectedConversation, "Manual escalation by agent");
      toast.success("Conversation escalated to human agent");
      loadConversations();
    } catch (error) {
      toast.error("Failed to escalate conversation");
    }
  };

  // Resolve conversation (AI successfully handled - counts toward deflection rate)
  const handleResolve = async () => {
    if (!selectedConversation) return;
    try {
      await chatApi.resolveConversation(selectedConversation);
      toast.success("Conversation resolved", {
        description: "This counts toward AI deflection rate.",
      });
      // Update local state
      setConversations(prev => prev.map(c => 
        c.id === selectedConversation ? { ...c, status: 'resolved' as const } : c
      ));
      loadConversations();
    } catch (error) {
      toast.error("Failed to resolve conversation");
    }
  };

  // === MVDPDF: Break-Glass Human Agent Request ===
  const handleRequestHuman = async () => {
    if (!selectedConversation) {
      toast.error("No conversation selected");
      return;
    }
    
    try {
      // Add system message
      const systemMsg: DisplayMessage = {
        id: `system-${Date.now()}`,
        role: "system",
        content: "Customer requested to speak with a human agent. Escalating...",
        time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      };
      setMessages(prev => [...prev, systemMsg]);
      
      // Trigger escalation
      await chatApi.escalateConversation(selectedConversation, "Customer explicitly requested human agent");
      
      toast.success("Human Agent Requested", {
        description: "A support specialist will join shortly.",
      });
      
      loadConversations();
    } catch (error) {
      console.error('Failed to request human:', error);
      toast.error("Failed to connect to human agent");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const filteredConversations = conversations.filter(c =>
    c.customerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedConv = conversations.find(c => c.id === selectedConversation);

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-0px)] flex">
        {/* Conversation List */}
        <div className="w-80 border-r border-border bg-card flex flex-col">
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-2 mb-3">
              <h2 className="font-semibold text-foreground flex-1">Conversations</h2>
              <button
                onClick={loadConversations}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary transition-all"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-muted-foreground">Loading...</div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                No conversations yet. Start a new chat below!
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => selectConversation(conv.id)}
                  className={cn(
                    "w-full p-4 text-left border-b border-border hover:bg-muted/50 transition-colors",
                    selectedConversation === conv.id && "bg-muted"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-semibold text-secondary">
                        {conv.customerName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-foreground truncate">
                          {conv.customerName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {conv.time}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-muted-foreground truncate flex-1">
                          {conv.lastMessage}
                        </p>
                        {conv.status === 'escalated' && (
                          <span className="px-2 py-0.5 rounded-full bg-warning/10 text-warning text-xs">
                            Escalated
                          </span>
                        )}
                        {conv.unread && conv.status === 'open' && (
                          <span className="w-2 h-2 rounded-full bg-secondary flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-background">
          {/* Chat Header with Sentiment Indicator */}
          <div className="px-6 py-4 border-b border-border bg-card flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
                <span className="text-sm font-semibold text-secondary">
                  {selectedConv?.customerName?.split(" ").map((n) => n[0]).join("").slice(0, 2) || "?"}
                </span>
              </div>
              <div>
                <h2 className="font-semibold text-foreground">
                  {selectedConv?.customerName || "New Conversation"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {selectedConv?.status === 'escalated' ? 'Escalated' : selectedConv?.lastMessage || 'Start typing to begin'}
                </p>
              </div>
              {/* === NEW: Sentiment Indicator === */}
              {currentSentiment && (
                <div className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full ml-3",
                  getSentimentColor(currentSentiment.level)
                )}>
                  {getSentimentIcon(currentSentiment.level)}
                  <span className="text-sm font-medium">{getSentimentLabel(currentSentiment.level)}</span>
                  {getTrendIcon(currentSentiment.trend)}
                  {currentSentiment.empathyNeeded && (
                    <Heart className="w-4 h-4 text-pink-500 animate-pulse" title="Empathy recommended" />
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleResolve}
                disabled={selectedConv?.status === 'resolved' || selectedConv?.status === 'escalated'}
                className={cn(
                  "px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2",
                  selectedConv?.status === 'resolved' || selectedConv?.status === 'escalated'
                    ? "bg-muted text-muted-foreground cursor-not-allowed"
                    : "bg-green-500 text-white hover:bg-green-600"
                )}
              >
                <CheckCircle className="w-4 h-4" />
                {selectedConv?.status === 'resolved' ? 'Resolved' : 'Resolve'}
              </button>
              <button
                onClick={handleEscalate}
                disabled={selectedConv?.status === 'resolved' || selectedConv?.status === 'escalated'}
                className={cn(
                  "px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2",
                  selectedConv?.status === 'resolved' || selectedConv?.status === 'escalated'
                    ? "bg-muted text-muted-foreground cursor-not-allowed"
                    : "bg-warning text-warning-foreground hover:bg-warning/90"
                )}
              >
                <AlertTriangle className="w-4 h-4" />
                {selectedConv?.status === 'escalated' ? 'Escalated' : 'Escalate'}
              </button>
            </div>
          </div>

          {/* === NEW: Quick Actions Bar === */}
          {quickActions.length > 0 && (
            <div className="px-6 py-3 border-b border-border bg-gradient-to-r from-secondary/5 to-primary/5">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-secondary" />
                <span className="text-sm font-medium text-foreground">Smart Actions Available</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {quickActions.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => handleQuickAction(action)}
                    disabled={!action.eligible}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                      action.eligible
                        ? action.autoApproved
                          ? "bg-green-500/10 text-green-600 hover:bg-green-500/20 border border-green-500/30"
                          : "bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20 border border-yellow-500/30"
                        : "bg-muted text-muted-foreground cursor-not-allowed opacity-60"
                    )}
                    title={action.description}
                  >
                    {getActionIcon(action.type)}
                    <span>{action.label}</span>
                    {action.estimatedValue && (
                      <span className="text-xs opacity-70">
                        {action.type === 'discount' ? `${action.estimatedValue}%` : `$${action.estimatedValue}`}
                      </span>
                    )}
                    {action.autoApproved && (
                      <span className="text-xs bg-green-500 text-white px-1.5 py-0.5 rounded">Auto</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* === MVDPDF: AI Disclosure Banner === */}
            {showAiDisclosure && (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 flex items-start gap-3">
                <Bot className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-blue-400 font-medium">AI-Powered Support</p>
                  <p className="text-xs text-blue-300/80 mt-1">
                    I'm ShopAI, an AI assistant. I can help with orders, returns, and product questions.
                    Type <span className="font-mono bg-blue-500/20 px-1 rounded">"human"</span> or click the button below to speak with a specialist.
                  </p>
                </div>
                <button 
                  onClick={() => setShowAiDisclosure(false)}
                  className="text-blue-400 hover:text-blue-300 text-xs"
                >
                  ✕
                </button>
              </div>
            )}
            
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Start a conversation by typing a message below</p>
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex",
                    msg.role === "customer" && "justify-start",
                    msg.role === "ai" && "justify-end",
                    msg.role === "agent" && "justify-end",
                    msg.role === "system" && "justify-center"
                  )}
                >
                  {msg.role === "system" ? (
                    <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                      {msg.content}
                    </span>
                  ) : (
                    <div
                      className={cn(
                        msg.role === "customer" && "chat-bubble-customer",
                        (msg.role === "ai" || msg.role === "agent") && "chat-bubble-ai"
                      )}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      <p
                        className={cn(
                          "text-xs mt-2",
                          msg.role === "customer" ? "text-muted-foreground" : "text-white/70"
                        )}
                      >
                        {msg.time}
                      </p>
                    </div>
                  )}
                </div>
              ))
            )}
            {isAiTyping && (
              <div className="flex justify-end">
                <div className="chat-bubble-ai">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 animate-pulse-subtle" />
                    <span className="text-sm">AI is typing...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Responses */}
          {suggestedResponses.length > 0 && (
            <div className="px-6 py-3 border-t border-border bg-muted/30">
              <p className="text-xs text-muted-foreground mb-2">Suggested responses:</p>
              <div className="flex flex-wrap gap-2">
                {suggestedResponses.map((response) => (
                  <button
                    key={response}
                    onClick={() => setMessage(response)}
                    className="px-3 py-1.5 rounded-full bg-secondary/10 text-secondary text-sm hover:bg-secondary/20 transition-colors"
                  >
                    {response}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-border bg-card">
            {/* === MVDPDF: Break-Glass Human Agent Button === */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Bot className="w-3 h-3" />
                <span>Powered by ShopAI</span>
              </div>
              <button
                onClick={handleRequestHuman}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 transition-colors text-sm font-medium border border-orange-500/30"
              >
                <UserCircle className="w-4 h-4" />
                <span>Chat with Human</span>
              </button>
            </div>
            
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="flex-1 px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary transition-all"
              />
              <button
                onClick={sendMessage}
                disabled={!message.trim() || isAiTyping}
                className="p-3 rounded-xl gradient-bg text-white hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Customer Info Sidebar */}
        <div className="w-80 border-l border-border bg-card overflow-y-auto">
          {/* Info Banner - shows when no customer context */}
          {!customerContext && (
            <div className="p-4 bg-primary/5 border-b border-primary/20">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Customer details appear here</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Start a conversation to see customer profile, order history, and AI-powered insights.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Customer Profile */}
          <div className="p-6 border-b border-border">
            <div className="text-center mb-4">
              <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-3">
                <User className="w-8 h-8 text-secondary" />
              </div>
              <h3 className="font-semibold text-foreground">
                {customerContext?.customer.name || selectedConv?.customerName || "Customer"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {customerContext?.customer.createdAt
                  ? `Customer since ${new Date(customerContext.customer.createdAt).getFullYear()}`
                  : "New customer"}
              </p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {customerContext?.customer.email || "No email"}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {customerContext?.customer.phone || "No phone"}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {customerContext?.customer.location || "Unknown location"}
                </span>
              </div>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="p-6 border-b border-border">
            <h4 className="font-medium text-foreground mb-4 flex items-center gap-2">
              <Package className="w-4 h-4" />
              Recent Orders
            </h4>
            <div className="space-y-3">
              {customerContext?.recentOrders && customerContext.recentOrders.length > 0 ? (
                customerContext.recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="p-3 rounded-lg bg-muted/50 text-sm"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-foreground">{order.id}</span>
                      <span className="text-foreground">${order.amount}</span>
                    </div>
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                      <span
                        className={cn(
                          "text-xs px-2 py-0.5 rounded-full",
                          order.status === "delivered"
                            ? "bg-success/10 text-success"
                            : "bg-secondary/10 text-secondary"
                        )}
                      >
                        {order.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No recent orders</p>
              )}
            </div>
          </div>

          {/* === MVDPDF: Knowledge Sources Panel === */}
          {sourceCitations.length > 0 && (
            <div className="p-6 border-b border-border">
              <h4 className="font-medium text-foreground mb-4 flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Knowledge Sources
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-400 font-normal">
                  RAG
                </span>
              </h4>
              <div className="space-y-2">
                {sourceCitations.slice(0, 3).map((citation, idx) => (
                  <div 
                    key={citation.articleId}
                    className="p-2 rounded-lg bg-muted/50 text-sm border-l-2 border-green-500"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-foreground text-xs line-clamp-2">
                        {citation.articleTitle}
                      </p>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400 font-medium whitespace-nowrap">
                        {Math.round(citation.relevanceScore * 100)}%
                      </span>
                    </div>
                    {citation.excerpt && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        "{citation.excerpt}"
                      </p>
                    )}
                  </div>
                ))}
                {sourceCitations.length > 3 && (
                  <p className="text-xs text-muted-foreground text-center">
                    +{sourceCitations.length - 3} more sources
                  </p>
                )}
              </div>
            </div>
          )}

          {/* === LLM-Powered Emotional Insights Panel === */}
          {currentSentiment && (
            <div className="p-6 border-b border-border">
              <h4 className="font-medium text-foreground mb-4 flex items-center gap-2">
                <Heart className="w-4 h-4" />
                Emotional Insights
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 font-normal">
                  AI-Powered
                </span>
              </h4>
              <div className="space-y-4">
                {/* Primary Emotion Badge */}
                {currentSentiment.primaryEmotion && (
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium",
                      getSentimentColor(currentSentiment.level)
                    )}>
                      {getSentimentIcon(currentSentiment.level)}
                      {currentSentiment.primaryEmotion.charAt(0).toUpperCase() + currentSentiment.primaryEmotion.slice(1)}
                    </span>
                    {getTrendIcon(currentSentiment.trend)}
                    <span className="text-xs text-muted-foreground">
                      {currentSentiment.trend === 'improving' ? 'Getting better' : 
                       currentSentiment.trend === 'declining' ? 'Getting worse' : 'Stable'}
                    </span>
                  </div>
                )}

                {/* Escalation Risk */}
                {currentSentiment.escalationRisk && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Escalation Risk:</span>
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-full font-medium",
                      currentSentiment.escalationRisk === 'high' ? 'bg-red-500/20 text-red-400' :
                      currentSentiment.escalationRisk === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-green-500/20 text-green-400'
                    )}>
                      {currentSentiment.escalationRisk.toUpperCase()}
                    </span>
                  </div>
                )}

                {/* Sentiment Gauge */}
                <div className="relative">
                  <div className="h-2 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full" />
                  <div 
                    className="absolute top-0 w-3 h-3 bg-white border-2 border-gray-800 rounded-full -translate-y-0.5 transition-all duration-500"
                    style={{ left: `calc(${((currentSentiment.score + 1) / 2) * 100}% - 6px)` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Negative</span>
                  <span>Neutral</span>
                  <span>Positive</span>
                </div>

                {/* Contextual Insights (LLM-generated) */}
                {currentSentiment.contextualInsights && (
                  <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <p className="text-xs font-medium text-blue-400 mb-1">🧠 AI Analysis</p>
                    <p className="text-xs text-blue-300/80">{currentSentiment.contextualInsights}</p>
                  </div>
                )}

                {/* Recommended Tone */}
                {currentSentiment.recommendedTone && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Recommended tone:</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 font-medium">
                      {currentSentiment.recommendedTone.charAt(0).toUpperCase() + currentSentiment.recommendedTone.slice(1)}
                    </span>
                  </div>
                )}

                {/* Detected Indicators */}
                {currentSentiment.indicators.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Detected signals:</p>
                    <div className="flex flex-wrap gap-1">
                      {currentSentiment.indicators.slice(0, 5).map((indicator, i) => (
                        <span 
                          key={i}
                          className={cn(
                            "text-xs px-2 py-0.5 rounded-full",
                            currentSentiment.score < 0 
                              ? "bg-red-500/10 text-red-400" 
                              : currentSentiment.score > 0.2
                              ? "bg-green-500/10 text-green-400"
                              : "bg-gray-500/10 text-gray-400"
                          )}
                        >
                          "{indicator}"
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Secondary Emotions */}
                {currentSentiment.secondaryEmotions && currentSentiment.secondaryEmotions.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Also detected:</p>
                    <div className="flex flex-wrap gap-1">
                      {currentSentiment.secondaryEmotions.map((emotion, i) => (
                        <span 
                          key={i}
                          className="text-xs px-2 py-0.5 rounded-full bg-gray-500/10 text-gray-400"
                        >
                          {emotion}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empathy Tips - Enhanced */}
                {currentSentiment.empathyNeeded && (
                  <div className="p-3 rounded-lg bg-pink-500/10 border border-pink-500/20">
                    <p className="text-xs font-medium text-pink-400 mb-1">💡 Empathy Required</p>
                    <ul className="text-xs text-pink-300/80 space-y-1">
                      {currentSentiment.level === 'angry' ? (
                        <>
                          <li>• Apologize sincerely and take responsibility</li>
                          <li>• Offer immediate resolution (refund/replacement)</li>
                          <li>• Consider escalating to supervisor</li>
                        </>
                      ) : currentSentiment.level === 'frustrated' ? (
                        <>
                          <li>• Acknowledge their frustration explicitly</li>
                          <li>• Use "I understand how frustrating..."</li>
                          <li>• Provide a concrete solution quickly</li>
                        </>
                      ) : (
                        <>
                          <li>• Show understanding of their concern</li>
                          <li>• Reassure them you can help</li>
                          <li>• Be patient and thorough</li>
                        </>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* AI Context */}
          <div className="p-6">
            <h4 className="font-medium text-foreground mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              AI Context
            </h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              {customerContext ? (
                <>
                  <p>• Customer: {customerContext.customer.name}</p>
                  {customerContext.recentOrders[0] && (
                    <>
                      <p>• Latest order: {customerContext.recentOrders[0].id}</p>
                      <p>• Order status: {customerContext.recentOrders[0].status}</p>
                    </>
                  )}
                  <p>• Location: {customerContext.customer.location || 'Unknown'}</p>
                </>
              ) : (
                <p>• No context available yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
