import { useState, useEffect, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { cn } from "@/lib/utils";
import { 
  Search, 
  Filter, 
  Clock, 
  User, 
  RefreshCw,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  Flame,
  Zap,
} from "lucide-react";
import { escalationsApi, type Ticket } from "@/lib/api";
import { toast } from "sonner";

function getPriorityBadge(priority: Ticket["priority"]) {
  const styles = {
    high: "badge-priority-high",
    medium: "badge-priority-medium",
    low: "badge-priority-low",
  };

  const icons = {
    high: <Flame className="w-3 h-3" />,
    medium: <AlertTriangle className="w-3 h-3" />,
    low: <AlertCircle className="w-3 h-3" />,
  };

  return (
    <span
      className={cn(
        "px-2.5 py-1 rounded-full text-xs font-medium capitalize flex items-center gap-1.5",
        styles[priority]
      )}
    >
      {icons[priority]}
      {priority}
    </span>
  );
}

// === MVDPDF: Calculate urgency score based on wait time and priority ===
function getUrgencyScore(waitTime: string, priority: Ticket["priority"]): number {
  const priorityWeights = { high: 3, medium: 2, low: 1 };
  const waitMinutes = parseWaitTime(waitTime);
  return priorityWeights[priority] * Math.min(waitMinutes / 10, 10);
}

function parseWaitTime(waitTime: string): number {
  const match = waitTime.match(/(\d+)/);
  if (!match) return 0;
  const value = parseInt(match[1]);
  if (waitTime.includes('hr') || waitTime.includes('hour')) return value * 60;
  if (waitTime.includes('day')) return value * 1440;
  return value; // minutes
}

export default function Escalations() {
  const [escalations, setEscalations] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    priority: "",
    category: "",
    status: "",
  });
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadEscalations();
  }, []);

  const loadEscalations = async () => {
    try {
      setLoading(true);
      const data = await escalationsApi.getAll();
      setEscalations(data);
    } catch (error) {
      console.error("Failed to load escalations:", error);
      toast.error("Failed to load escalations");
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (ticketId: string) => {
    const agentName = prompt("Enter agent name to assign:");
    if (!agentName) return;

    try {
      await escalationsApi.assignTicket(ticketId, agentName);
      toast.success(`Ticket assigned to ${agentName}`);
      loadEscalations();
    } catch (error) {
      toast.error("Failed to assign ticket");
    }
  };

  const handleResolve = async (ticketId: string) => {
    try {
      await escalationsApi.resolveTicket(ticketId);
      toast.success("Ticket resolved");
      loadEscalations();
    } catch (error) {
      toast.error("Failed to resolve ticket");
    }
  };

  const applyFilters = async () => {
    try {
      setLoading(true);
      const activeFilters: Record<string, string> = {};
      if (filters.priority) activeFilters.priority = filters.priority;
      if (filters.category) activeFilters.category = filters.category;
      if (filters.status) activeFilters.status = filters.status;

      const data = await escalationsApi.getAll(
        Object.keys(activeFilters).length > 0 ? activeFilters : undefined
      );
      setEscalations(data);
    } catch (error) {
      toast.error("Failed to apply filters");
    } finally {
      setLoading(false);
    }
  };

  const filteredEscalations = escalations.filter(e =>
    e.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.ticketId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // === MVDPDF: Calculate queue statistics ===
  const queueStats = useMemo(() => {
    const openTickets = escalations.filter(e => e.status !== 'resolved');
    const highPriority = escalations.filter(e => e.priority === 'high' && e.status !== 'resolved');
    const unassigned = escalations.filter(e => !e.assignedAgent && e.status !== 'resolved');
    const resolvedToday = escalations.filter(e => e.status === 'resolved');
    
    // Average wait time calculation
    let totalWaitMinutes = 0;
    openTickets.forEach(e => {
      totalWaitMinutes += parseWaitTime(e.waitTime);
    });
    const avgWaitTime = openTickets.length > 0 ? totalWaitMinutes / openTickets.length : 0;

    return {
      total: openTickets.length,
      highPriority: highPriority.length,
      unassigned: unassigned.length,
      resolvedToday: resolvedToday.length,
      avgWaitTime: avgWaitTime,
    };
  }, [escalations]);

  // === MVDPDF: Sort by urgency (high priority + long wait first) ===
  const sortedEscalations = useMemo(() => {
    return [...filteredEscalations].sort((a, b) => {
      // Resolved tickets go to the bottom
      if (a.status === 'resolved' && b.status !== 'resolved') return 1;
      if (b.status === 'resolved' && a.status !== 'resolved') return -1;
      
      // Sort by urgency score (priority * wait time)
      const urgencyA = getUrgencyScore(a.waitTime, a.priority);
      const urgencyB = getUrgencyScore(b.waitTime, b.priority);
      return urgencyB - urgencyA;
    });
  }, [filteredEscalations]);

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Escalation Queue
            </h1>
            <p className="text-muted-foreground">
              Manage tickets that require human intervention
            </p>
          </div>
          <button
            onClick={loadEscalations}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/90 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* === MVDPDF: Queue Statistics Cards === */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-card rounded-xl shadow-card border border-border/30 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Zap className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Open Tickets</p>
                <p className="text-xl font-bold text-foreground">{queueStats.total}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-card rounded-xl shadow-card border border-border/30 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10">
                <Flame className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">High Priority</p>
                <p className="text-xl font-bold text-red-500">{queueStats.highPriority}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-card rounded-xl shadow-card border border-border/30 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <User className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Unassigned</p>
                <p className="text-xl font-bold text-yellow-500">{queueStats.unassigned}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-card rounded-xl shadow-card border border-border/30 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Avg Wait Time</p>
                <p className="text-xl font-bold text-foreground">
                  {queueStats.avgWaitTime < 60 
                    ? `${Math.round(queueStats.avgWaitTime)}m` 
                    : `${Math.round(queueStats.avgWaitTime / 60)}h`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-card rounded-xl shadow-card border border-border/30 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search tickets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary transition-all"
              />
            </div>
            <select
              value={filters.priority}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
              className="px-4 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary transition-all"
            >
              <option value="">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="px-4 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary transition-all"
            >
              <option value="">All Categories</option>
              <option value="Returns">Returns</option>
              <option value="Billing">Billing</option>
              <option value="Orders">Orders</option>
              <option value="Shipping">Shipping</option>
              <option value="Account">Account</option>
            </select>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="px-4 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary transition-all"
            >
              <option value="">All Status</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
            <button
              onClick={applyFilters}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/90 transition-colors"
            >
              <Filter className="w-4 h-4" />
              Apply Filters
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-card rounded-xl shadow-card border border-border/30 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Ticket ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Escalation Reason
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Waiting
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Assigned To
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-muted-foreground">
                      Loading escalations...
                    </td>
                  </tr>
                ) : sortedEscalations.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-muted-foreground">
                      No escalations found. Great job! 🎉
                    </td>
                  </tr>
                ) : (
                  sortedEscalations.map((escalation) => (
                    <tr
                      key={escalation.id}
                      className={cn(
                        "hover:bg-muted/30 transition-colors",
                        escalation.priority === 'high' && escalation.status !== 'resolved' && "bg-red-500/5 border-l-2 border-l-red-500",
                        escalation.status === 'resolved' && "opacity-60"
                      )}
                    >
                      <td className="px-6 py-4">
                        <span className="font-medium text-secondary">
                          {escalation.ticketId}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center">
                            <span className="text-xs font-medium text-secondary">
                              {escalation.customer.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                            </span>
                          </div>
                          <span className="text-foreground">{escalation.customer}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {escalation.category}
                      </td>
                      <td className="px-6 py-4">
                        {getPriorityBadge(escalation.priority)}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground max-w-[200px] truncate">
                        {escalation.escalationReason}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          {escalation.waitTime}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {escalation.assignedAgent ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center">
                              <User className="w-3 h-3 text-accent" />
                            </div>
                            <span className="text-foreground text-sm">
                              {escalation.assignedAgent}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">Unassigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {!escalation.assignedAgent ? (
                            <button
                              onClick={() => handleAssign(escalation.ticketId)}
                              className="px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/90 transition-colors"
                            >
                              Assign
                            </button>
                          ) : escalation.status !== 'resolved' ? (
                            <button
                              onClick={() => handleResolve(escalation.ticketId)}
                              className="px-3 py-1.5 rounded-lg bg-success text-white text-sm font-medium hover:bg-success/90 transition-colors"
                            >
                              Resolve
                            </button>
                          ) : (
                            <span className="px-3 py-1.5 text-sm text-success">Resolved</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
