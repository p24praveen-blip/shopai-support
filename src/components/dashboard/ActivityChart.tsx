import { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { analyticsApi } from "@/lib/api";

export function ActivityChart() {
  const [data, setData] = useState<Array<{ time: string; conversations: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    // Refresh every 60 seconds
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const volume = await analyticsApi.getVolume();
      setData(volume);
    } catch (error) {
      console.error('Failed to load activity data:', error);
      // Fallback to default data
      setData([
        { time: "00:00", conversations: 12 },
        { time: "04:00", conversations: 8 },
        { time: "08:00", conversations: 45 },
        { time: "12:00", conversations: 78 },
        { time: "16:00", conversations: 92 },
        { time: "20:00", conversations: 56 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-card rounded-3xl shadow-card border border-border/30 p-8 relative overflow-hidden">
      {/* Subtle decorative element */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="mb-8 relative">
        <h3 className="text-xl font-bold text-foreground tracking-tight">Conversation Activity</h3>
        <p className="text-sm text-muted-foreground mt-1">Last 24 hours</p>
      </div>
      <div className="h-[280px] relative">
        {loading ? (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            Loading...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorConversations" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(340, 82%, 52%)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="hsl(340, 82%, 52%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(260, 15%, 88%)" vertical={false} />
              <XAxis
                dataKey="time"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(240, 15%, 45%)", fontSize: 12, fontWeight: 500 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(240, 15%, 45%)", fontSize: 12, fontWeight: 500 }}
                dx={-10}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(0, 0%, 100%)",
                  border: "none",
                  borderRadius: "16px",
                  boxShadow: "0 8px 30px -4px rgb(0 0 0 / 0.15)",
                  padding: "12px 16px",
                }}
                labelStyle={{ color: "hsl(240, 30%, 16%)", fontWeight: 600, marginBottom: 4 }}
                itemStyle={{ color: "hsl(340, 82%, 52%)" }}
              />
              <Area
                type="monotone"
                dataKey="conversations"
                stroke="hsl(340, 82%, 52%)"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorConversations)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
