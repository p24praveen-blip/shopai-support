import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  MessageCircle,
  Inbox,
  BookOpen,
  AlertTriangle,
  BarChart3,
  Settings,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { settingsApi, type AIModelType } from "@/lib/api";
import { toast } from "sonner";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: MessageCircle, label: "Live Conversations", path: "/live-chat" },
  { icon: Inbox, label: "Ticket Queue", path: "/tickets" },
  { icon: BookOpen, label: "Knowledge Base", path: "/knowledge-base" },
  { icon: AlertTriangle, label: "Escalations", path: "/escalations" },
  { icon: BarChart3, label: "Analytics", path: "/analytics" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation();
  const [currentModel, setCurrentModel] = useState<AIModelType>('gemini-2.5-pro');
  const [isToggling, setIsToggling] = useState(false);

  // Fetch current model on mount
  useEffect(() => {
    settingsApi.getModel()
      .then(settings => setCurrentModel(settings.currentModel))
      .catch(err => console.error('Failed to fetch model:', err));
  }, []);

  const toggleModel = async () => {
    if (isToggling) return;
    setIsToggling(true);
    
    const newModel: AIModelType = currentModel === 'gemini-2.5-pro' ? 'gemini-2.5-flash' : 'gemini-2.5-pro';
    
    try {
      await settingsApi.setModel(newModel);
      setCurrentModel(newModel);
      toast.success(`Switched to ${newModel}`, {
        description: newModel === 'gemini-2.5-pro' ? 'Higher quality, slower' : 'Faster responses',
      });
    } catch (error) {
      toast.error('Failed to switch model');
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen bg-sidebar flex flex-col transition-all duration-300 z-50",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-6 border-b border-sidebar-border/50">
        <div className="w-11 h-11 rounded-2xl gradient-bg flex items-center justify-center flex-shrink-0 shadow-glow">
          <MessageSquare className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div className="animate-fade-in">
            <span className="text-xl font-bold text-white tracking-tight">Shop</span>
            <span className="text-xl font-bold gradient-text">AI</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "nav-item",
                isActive && "nav-item-active"
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className={cn(
                "w-5 h-5 flex-shrink-0 transition-colors",
                isActive && "text-primary"
              )} />
              {!collapsed && (
                <span className="animate-fade-in font-medium">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse Button */}
      <button
        onClick={onToggle}
        className="m-4 p-3 rounded-xl bg-sidebar-accent text-sidebar-foreground hover:bg-sidebar-accent/80 transition-all duration-200 flex items-center justify-center hover:scale-105"
      >
        {collapsed ? (
          <ChevronRight className="w-5 h-5" />
        ) : (
          <ChevronLeft className="w-5 h-5" />
        )}
      </button>

      {/* Model Toggle */}
      <div className="px-4 py-3 border-t border-sidebar-border/50">
        <button
          onClick={toggleModel}
          disabled={isToggling}
          className={cn(
            "w-full flex items-center gap-2 p-2 rounded-lg transition-all duration-200",
            "hover:bg-sidebar-accent/60",
            isToggling && "opacity-50 cursor-not-allowed"
          )}
          title={`Current: ${currentModel}. Click to switch.`}
        >
          {currentModel === 'gemini-2.5-pro' ? (
            <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0" />
          ) : (
            <Zap className="w-4 h-4 text-yellow-400 flex-shrink-0" />
          )}
          {!collapsed && (
            <div className="flex flex-col items-start animate-fade-in">
              <span className="text-xs text-sidebar-foreground/50">AI Model</span>
              <span className={cn(
                "text-sm font-medium",
                currentModel === 'gemini-2.5-pro' ? "text-purple-400" : "text-yellow-400"
              )}>
                {currentModel === 'gemini-2.5-pro' ? 'Pro' : 'Flash'}
              </span>
            </div>
          )}
        </button>
      </div>

      {/* Connection Status */}
      <div className="px-5 py-4 border-t border-sidebar-border/50">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-success animate-pulse-subtle shadow-[0_0_8px_hsl(152_69%_45%/0.6)]" />
          {!collapsed && (
            <span className="text-sm text-sidebar-foreground/70 animate-fade-in font-medium">
              Live
            </span>
          )}
        </div>
      </div>
    </aside>
  );
}
