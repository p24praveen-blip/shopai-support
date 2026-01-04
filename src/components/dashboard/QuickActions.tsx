import { MessageSquarePlus, AlertTriangle, Brain, ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

const actions = [
  {
    icon: MessageSquarePlus,
    label: "Start New Chat",
    description: "Begin a new customer conversation",
    path: "/live-chat",
    isHighlighted: true,
  },
  {
    icon: AlertTriangle,
    label: "View Escalations",
    description: "Check pending escalations",
    path: "/escalations",
  },
  {
    icon: Brain,
    label: "Train AI",
    description: "Improve AI responses",
    path: "/knowledge-base",
  },
];

export function QuickActions() {
  const [showNudge, setShowNudge] = useState(false);

  useEffect(() => {
    // Check if user has interacted before
    const hasInteracted = localStorage.getItem('shopai_has_started_chat');
    if (!hasInteracted) {
      setShowNudge(true);
    }
  }, []);

  const handleStartChatClick = () => {
    localStorage.setItem('shopai_has_started_chat', 'true');
    setShowNudge(false);
  };

  return (
    <div className="bg-card rounded-3xl shadow-card border border-border/30 p-8">
      <h3 className="text-xl font-bold text-foreground mb-6 tracking-tight">Quick Actions</h3>
      <div className="space-y-4">
        {actions.map((action, index) => {
          const isStartChat = action.isHighlighted;
          const shouldHighlight = isStartChat && showNudge;

          return (
            <Link
              key={action.label}
              to={action.path}
              onClick={isStartChat ? handleStartChatClick : undefined}
              className={`flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 group hover:shadow-card relative ${
                shouldHighlight 
                  ? 'bg-primary/10 border-2 border-primary shadow-glow animate-pulse-subtle' 
                  : 'bg-secondary/50 hover:bg-secondary'
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Nudge tooltip */}
              {shouldHighlight && (
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-primary text-white px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap shadow-elevated animate-bounce z-10 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Try it out! Click here to start
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-primary" />
                </div>
              )}
              
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${
                shouldHighlight ? 'gradient-bg shadow-glow animate-pulse' : 'gradient-bg shadow-glow'
              }`}>
                <action.icon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className={`font-semibold ${shouldHighlight ? 'text-primary' : 'text-foreground'}`}>
                  {action.label}
                  {shouldHighlight && <span className="ml-2 text-xs bg-primary text-white px-2 py-0.5 rounded-full">New</span>}
                </p>
                <p className="text-sm text-muted-foreground">
                  {action.description}
                </p>
              </div>
              <ArrowRight className={`w-5 h-5 transition-all duration-300 ${
                shouldHighlight 
                  ? 'text-primary animate-bounce-x' 
                  : 'text-muted-foreground group-hover:text-primary group-hover:translate-x-1'
              }`} />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
