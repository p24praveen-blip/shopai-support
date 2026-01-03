import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Clock, Sparkles, ArrowRight, RefreshCw } from "lucide-react";
import { chatApi, type Conversation } from "@/lib/api";
import { useNavigate } from "react-router-dom";

interface DisplayConversation {
  id: string;
  customerName: string;
  topic: string;
  status: "open" | "resolved" | "escalated";
  aiConfidence: number;
  time: string;
}

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hr ago`;
  return `${Math.floor(diffHours / 24)} days ago`;
}

function getStatusBadge(status: DisplayConversation["status"]) {
  const styles = {
    open: "badge-status-open",
    resolved: "badge-status-resolved",
    escalated: "badge-status-escalated",
  };

  const labels = {
    open: "Open",
    resolved: "Resolved",
    escalated: "Escalated",
  };

  return (
    <span
      className={cn(
        "px-3 py-1 rounded-full text-xs font-semibold capitalize",
        styles[status]
      )}
    >
      {labels[status]}
    </span>
  );
}

function getConfidenceColor(confidence: number) {
  if (confidence >= 90) return "text-success";
  if (confidence >= 70) return "text-warning";
  return "text-destructive";
}

export function ConversationList() {
  const [conversations, setConversations] = useState<DisplayConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadConversations();
    // Refresh every 30 seconds
    const interval = setInterval(loadConversations, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadConversations = async () => {
    try {
      const data = await chatApi.getConversations();
      const displayConvs: DisplayConversation[] = data.slice(0, 5).map(c => ({
        id: c.id,
        customerName: c.customerName,
        topic: c.category || 'General inquiry',
        status: c.status,
        aiConfidence: Math.floor(Math.random() * 20) + 75, // Simulated for display
        time: formatTimeAgo(c.updatedAt),
      }));
      setConversations(displayConvs);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewAll = () => {
    navigate('/live-chat');
  };

  return (
    <div className="bg-card rounded-3xl shadow-card border border-border/30 overflow-hidden">
      <div className="px-8 py-6 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-bold text-foreground tracking-tight">Recent Conversations</h3>
          <button
            onClick={loadConversations}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            <RefreshCw className={`w-4 h-4 text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <button
          onClick={handleViewAll}
          className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 font-semibold transition-colors group"
        >
          View All
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
      <div className="divide-y divide-border/50">
        {loading ? (
          <div className="px-8 py-12 text-center text-muted-foreground">
            Loading conversations...
          </div>
        ) : conversations.length === 0 ? (
          <div className="px-8 py-12 text-center text-muted-foreground">
            No conversations yet. Start chatting in Live Chat!
          </div>
        ) : (
          conversations.map((conversation, index) => (
            <div
              key={conversation.id}
              onClick={() => navigate('/live-chat')}
              className="px-8 py-5 hover:bg-secondary/30 transition-all duration-200 cursor-pointer group"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-center gap-5">
                {/* Avatar */}
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center flex-shrink-0 group-hover:shadow-glow transition-shadow duration-300">
                  <span className="text-sm font-bold gradient-text">
                    {conversation.customerName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1.5">
                    <p className="font-semibold text-foreground truncate">
                      {conversation.customerName}
                    </p>
                    {getStatusBadge(conversation.status)}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {conversation.topic}
                  </p>
                </div>

                {/* Meta */}
                <div className="flex flex-col items-end gap-1.5">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                    <Clock className="w-3.5 h-3.5" />
                    {conversation.time}
                  </div>
                  <div
                    className={cn(
                      "flex items-center gap-1.5 text-xs font-semibold",
                      getConfidenceColor(conversation.aiConfidence)
                    )}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {conversation.aiConfidence}% AI
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
