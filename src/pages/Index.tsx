import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { ConversationList } from "@/components/dashboard/ConversationList";
import { ActivityChart } from "@/components/dashboard/ActivityChart";
import { QuickActions } from "@/components/dashboard/QuickActions";
import {
  MessageCircle,
  Clock,
  Smile,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { analyticsApi, type AnalyticsStats } from "@/lib/api";

const Index = () => {
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
    // Refresh stats every 30 seconds
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      const data = await analyticsApi.getStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statsCards = stats ? [
    {
      title: "Active Conversations",
      value: stats.activeConversations,
      icon: MessageCircle,
      trend: stats.trends.activeConversations,
      iconColor: "text-primary",
    },
    {
      title: "Avg Resolution Time",
      value: stats.avgResolutionTime,
      icon: Clock,
      trend: stats.trends.avgResolutionTime,
      iconColor: "text-accent",
    },
    {
      title: "Customer Satisfaction",
      value: stats.customerSatisfaction,
      icon: Smile,
      trend: stats.trends.customerSatisfaction,
      iconColor: "text-success",
    },
    {
      title: "Escalation Rate",
      value: stats.escalationRate,
      icon: AlertTriangle,
      trend: stats.trends.escalationRate,
      iconColor: "text-warning",
    },
    {
      title: "Resolved Today",
      value: stats.resolvedToday,
      icon: CheckCircle2,
      subtitle: "AI-powered resolutions",
      iconColor: "text-success",
    },
  ] : [];

  return (
    <DashboardLayout>
      <div className="p-8 relative overflow-hidden">
        {/* Decorative curves like Media.net */}
        <div className="curve-accent w-[600px] h-[600px] -top-40 -right-40 fixed" />
        <div className="curve-accent w-[400px] h-[400px] bottom-20 -left-20 fixed" />

        {/* Header */}
        <div className="mb-10 relative">
          <h1 className="text-3xl font-bold text-foreground mb-3 tracking-tight">
            Welcome back, Support Team
          </h1>
          <p className="text-lg text-muted-foreground">
            Here's an overview of your customer support performance today.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-10">
          {loading ? (
            // Loading skeleton
            Array(5).fill(0).map((_, i) => (
              <div key={i} className="stat-card animate-pulse">
                <div className="h-20 bg-muted rounded" />
              </div>
            ))
          ) : (
            statsCards.map((stat, index) => (
              <div
                key={stat.title}
                className="animate-fade-up"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <StatCard {...stat} />
              </div>
            ))
          )}
        </div>

        {/* Promo Banner - Media.net style */}
        <div className="mb-10 p-6 rounded-3xl gradient-bg text-white relative overflow-hidden">
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold mb-2">
                Power your support with AI-driven insights
              </h3>
              <p className="text-white/80">
                Train your AI assistant with custom knowledge to improve resolution times.
              </p>
            </div>
            <button className="flex items-center gap-2 px-6 py-3 bg-white text-primary rounded-full font-semibold hover:shadow-elevated transition-all duration-300 hover:scale-105">
              Learn More
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          {/* Decorative circles */}
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full" />
          <div className="absolute -right-5 -bottom-5 w-24 h-24 bg-white/10 rounded-full" />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Activity Chart */}
          <div className="lg:col-span-2">
            <ActivityChart />
          </div>

          {/* Quick Actions */}
          <div>
            <QuickActions />
          </div>

          {/* Recent Conversations */}
          <div className="lg:col-span-3">
            <ConversationList />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;
