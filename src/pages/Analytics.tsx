import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Calendar, RefreshCw, Target, Zap, Brain, TrendingUp, Users, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { analyticsApi, type MVDPDFMetrics } from "@/lib/api";
import { toast } from "sonner";

// MVDPDF Metric Card Component
function MetricCard({ 
  label, 
  value, 
  target, 
  unit = '', 
  icon: Icon, 
  color,
  description,
  lowerIsBetter = false
}: { 
  label: string; 
  value: number; 
  target: number; 
  unit?: string; 
  icon: any; 
  color: string;
  description: string;
  lowerIsBetter?: boolean;
}) {
  // For lowerIsBetter metrics (like response time), being under target is good
  const isOnTarget = lowerIsBetter ? value <= target : value >= target;
  const percentage = lowerIsBetter 
    ? Math.min((target / value) * 100, 100)  // Inverted for lower-is-better
    : Math.min((value / target) * 100, 100);
  
  return (
    <div className="bg-card rounded-xl shadow-card border border-border/30 p-4">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
          isOnTarget ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'
        }`}>
          {isOnTarget ? '✓ On Target' : 'Below Target'}
        </span>
      </div>
      <p className="text-2xl font-bold text-foreground">
        {value}{unit}
      </p>
      <p className="text-sm text-muted-foreground mb-2">{label}</p>
      <div className="w-full bg-muted rounded-full h-2 mb-1">
        <div 
          className={`h-2 rounded-full transition-all ${isOnTarget ? 'bg-green-500' : 'bg-yellow-500'}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{description}</span>
        <span>Target: {target}{unit}</span>
      </div>
    </div>
  );
}

export default function Analytics() {
  const [resolutionData, setResolutionData] = useState<Array<{ date: string; time: number }>>([]);
  const [issuesData, setIssuesData] = useState<Array<{ issue: string; count: number }>>([]);
  const [aiVsHumanData, setAiVsHumanData] = useState<Array<{ name: string; value: number; color: string }>>([]);
  const [satisfactionData, setSatisfactionData] = useState<Array<{ date: string; score: number }>>([]);
  const [escalationReasons, setEscalationReasons] = useState<Array<{ name: string; value: number; color: string }>>([]);
  const [mvdpdfMetrics, setMvdpdfMetrics] = useState<MVDPDFMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [resolution, issues, aiHuman, satisfaction, escalations, mvdpdf] = await Promise.all([
        analyticsApi.getResolutionTime(),
        analyticsApi.getTopIssues(),
        analyticsApi.getAiVsHuman(),
        analyticsApi.getSatisfaction(),
        analyticsApi.getEscalationReasons(),
        analyticsApi.getMVDPDFMetrics(),
      ]);

      setResolutionData(resolution);
      setIssuesData(issues);
      setAiVsHumanData(aiHuman);
      setSatisfactionData(satisfaction);
      setEscalationReasons(escalations);
      setMvdpdfMetrics(mvdpdf);
    } catch (error) {
      console.error("Failed to load analytics:", error);
      toast.error("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Analytics Dashboard
            </h1>
            <p className="text-muted-foreground">
              Insights into your support performance
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadAllData}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <RefreshCw className={`w-5 h-5 text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card text-foreground font-medium hover:bg-muted transition-colors">
              <Calendar className="w-5 h-5" />
              Last 7 Days
            </button>
          </div>
        </div>

        {/* MVDPDF Metrics Section */}
        <div className="mt-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Performance Metrics</h2>
              <p className="text-sm text-muted-foreground">Conversational Intent Engine KPIs</p>
            </div>
          </div>

          {/* Operational Metrics (5.1) */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Operational Metrics
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {mvdpdfMetrics && (
                <>
                  <MetricCard
                    label="Deflection Rate"
                    value={mvdpdfMetrics.deflectionRate}
                    target={40}
                    unit="%"
                    icon={Users}
                    color="bg-blue-500"
                    description="Resolved without human"
                  />
                  <MetricCard
                    label="First Response Time"
                    value={mvdpdfMetrics.firstResponseTime}
                    target={2000}
                    unit="ms"
                    icon={Clock}
                    color="bg-green-500"
                    description="Time to first token"
                    lowerIsBetter={true}
                  />
                  <MetricCard
                    label="Resolution Rate"
                    value={mvdpdfMetrics.resolutionRate}
                    target={75}
                    unit="%"
                    icon={CheckCircle}
                    color="bg-emerald-500"
                    description="Issues fully solved"
                  />
                  <MetricCard
                    label="Sentiment Drift"
                    value={Math.round(mvdpdfMetrics.sentimentDrift * 100)}
                    target={10}
                    unit="%"
                    icon={TrendingUp}
                    color="bg-purple-500"
                    description="Positive change"
                  />
                </>
              )}
            </div>
          </div>

          {/* AdTech Metrics (5.2) */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              AdTech & CDP Metrics
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {mvdpdfMetrics && (
                <>
                  <MetricCard
                    label="Intent Capture Rate"
                    value={mvdpdfMetrics.intentCaptureRate}
                    target={60}
                    unit="%"
                    icon={Target}
                    color="bg-orange-500"
                    description="Sessions with classified intent"
                  />
                  <MetricCard
                    label="Zero-Party Enrichment"
                    value={mvdpdfMetrics.zeroPartyEnrichment}
                    target={150}
                    unit=" attrs"
                    icon={Users}
                    color="bg-pink-500"
                    description="Per 1000 interactions"
                  />
                  <MetricCard
                    label="Identity Resolution"
                    value={mvdpdfMetrics.identityResolutionRate}
                    target={20}
                    unit="%"
                    icon={CheckCircle}
                    color="bg-indigo-500"
                    description="Anonymous → identified"
                  />
                </>
              )}
            </div>
          </div>

          {/* AI Evaluation Metrics (5.3) */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
              <Brain className="w-4 h-4" />
              AI Evaluation Metrics
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mvdpdfMetrics && (
                <>
                  <MetricCard
                    label="Faithfulness Score"
                    value={Math.round(mvdpdfMetrics.faithfulnessScore * 100)}
                    target={90}
                    unit="%"
                    icon={Brain}
                    color="bg-cyan-500"
                    description="Answers from context only"
                  />
                  <MetricCard
                    label="Answer Relevancy"
                    value={Math.round(mvdpdfMetrics.answerRelevancy * 100)}
                    target={85}
                    unit="%"
                    icon={Target}
                    color="bg-teal-500"
                    description="Semantic match to query"
                  />
                </>
              )}
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Resolution Time Trends */}
          <div className="bg-card rounded-xl shadow-card border border-border/30 p-6">
            <h3 className="font-semibold text-foreground mb-6">
              Resolution Time Trends
            </h3>
            <div className="h-[280px]">
              {loading ? (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  Loading...
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={resolutionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 90%)" />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "hsl(215, 16%, 47%)", fontSize: 12 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "hsl(215, 16%, 47%)", fontSize: 12 }}
                      unit=" min"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(0, 0%, 100%)",
                        border: "1px solid hsl(214, 20%, 90%)",
                        borderRadius: "12px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="time"
                      stroke="hsl(203, 68%, 54%)"
                      strokeWidth={3}
                      dot={{ fill: "hsl(203, 68%, 54%)", strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Top Customer Issues */}
          <div className="bg-card rounded-xl shadow-card border border-border/30 p-6">
            <h3 className="font-semibold text-foreground mb-6">
              Top Customer Issues
            </h3>
            <div className="h-[280px]">
              {loading ? (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  Loading...
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={issuesData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 90%)" />
                    <XAxis
                      type="number"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "hsl(215, 16%, 47%)", fontSize: 12 }}
                    />
                    <YAxis
                      type="category"
                      dataKey="issue"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "hsl(215, 16%, 47%)", fontSize: 12 }}
                      width={100}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(0, 0%, 100%)",
                        border: "1px solid hsl(214, 20%, 90%)",
                        borderRadius: "12px",
                      }}
                    />
                    <Bar dataKey="count" fill="hsl(200, 80%, 36%)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* AI vs Human Resolution */}
          <div className="bg-card rounded-xl shadow-card border border-border/30 p-6">
            <h3 className="font-semibold text-foreground mb-6">
              AI vs Human Resolution
            </h3>
            <div className="h-[280px] flex items-center justify-center">
              {loading ? (
                <div className="text-muted-foreground">Loading...</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={aiVsHumanData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {aiVsHumanData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(0, 0%, 100%)",
                        border: "1px solid hsl(214, 20%, 90%)",
                        borderRadius: "12px",
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Customer Satisfaction */}
          <div className="bg-card rounded-xl shadow-card border border-border/30 p-6">
            <h3 className="font-semibold text-foreground mb-6">
              Customer Satisfaction Over Time
            </h3>
            <div className="h-[280px]">
              {loading ? (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  Loading...
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={satisfactionData}>
                    <defs>
                      <linearGradient id="colorSatisfaction" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(142, 69%, 58%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(142, 69%, 58%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 90%)" />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "hsl(215, 16%, 47%)", fontSize: 12 }}
                    />
                    <YAxis
                      domain={[80, 100]}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "hsl(215, 16%, 47%)", fontSize: 12 }}
                      unit="%"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(0, 0%, 100%)",
                        border: "1px solid hsl(214, 20%, 90%)",
                        borderRadius: "12px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="score"
                      stroke="hsl(142, 69%, 58%)"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorSatisfaction)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Escalation Reasons - Full Width */}
          <div className="bg-card rounded-xl shadow-card border border-border/30 p-6 lg:col-span-2">
            <h3 className="font-semibold text-foreground mb-6">
              Escalation Reasons Breakdown
            </h3>
            <div className="h-[300px] flex items-center">
              {loading ? (
                <div className="w-full text-center text-muted-foreground">Loading...</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={escalationReasons}
                      cx="50%"
                      cy="50%"
                      outerRadius={120}
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      labelLine
                    >
                      {escalationReasons.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(0, 0%, 100%)",
                        border: "1px solid hsl(214, 20%, 90%)",
                        borderRadius: "12px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
