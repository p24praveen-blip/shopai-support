import { MessageSquarePlus, AlertTriangle, Brain, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const actions = [
  {
    icon: MessageSquarePlus,
    label: "Start New Chat",
    description: "Begin a new customer conversation",
    path: "/live-chat",
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
  return (
    <div className="bg-card rounded-3xl shadow-card border border-border/30 p-8">
      <h3 className="text-xl font-bold text-foreground mb-6 tracking-tight">Quick Actions</h3>
      <div className="space-y-4">
        {actions.map((action, index) => (
          <Link
            key={action.label}
            to={action.path}
            className="flex items-center gap-4 p-4 rounded-2xl bg-secondary/50 hover:bg-secondary transition-all duration-300 group hover:shadow-card"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shadow-glow">
              <action.icon className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground">{action.label}</p>
              <p className="text-sm text-muted-foreground">
                {action.description}
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-300" />
          </Link>
        ))}
      </div>
    </div>
  );
}
