import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { cn } from "@/lib/utils";
import { Search, Plus, MessageSquare, Clock, User } from "lucide-react";

interface Ticket {
  id: string;
  subject: string;
  customer: string;
  status: "open" | "pending" | "resolved";
  priority: "high" | "medium" | "low";
  created: string;
  lastUpdate: string;
}

const mockTickets: Ticket[] = [
  {
    id: "TKT-2850",
    subject: "Missing item from order #45123",
    customer: "Amanda Foster",
    status: "open",
    priority: "high",
    created: "1 hour ago",
    lastUpdate: "15 min ago",
  },
  {
    id: "TKT-2849",
    subject: "Request for invoice copy",
    customer: "Kevin Chen",
    status: "pending",
    priority: "low",
    created: "3 hours ago",
    lastUpdate: "1 hour ago",
  },
  {
    id: "TKT-2848",
    subject: "Product warranty inquiry",
    customer: "Jessica Martinez",
    status: "open",
    priority: "medium",
    created: "5 hours ago",
    lastUpdate: "2 hours ago",
  },
  {
    id: "TKT-2847",
    subject: "Discount code not applying",
    customer: "Ryan O'Brien",
    status: "resolved",
    priority: "medium",
    created: "1 day ago",
    lastUpdate: "6 hours ago",
  },
  {
    id: "TKT-2846",
    subject: "Bulk order pricing request",
    customer: "Corporate Supplies Ltd",
    status: "pending",
    priority: "high",
    created: "1 day ago",
    lastUpdate: "12 hours ago",
  },
];

function getStatusBadge(status: Ticket["status"]) {
  const styles = {
    open: "bg-success/10 text-success border border-success/20",
    pending: "bg-warning/10 text-warning border border-warning/20",
    resolved: "bg-muted text-muted-foreground border border-border",
  };

  return (
    <span
      className={cn(
        "px-2.5 py-1 rounded-full text-xs font-medium capitalize",
        styles[status]
      )}
    >
      {status}
    </span>
  );
}

function getPriorityBadge(priority: Ticket["priority"]) {
  const styles = {
    high: "badge-priority-high",
    medium: "badge-priority-medium",
    low: "badge-priority-low",
  };

  return (
    <span
      className={cn(
        "px-2.5 py-1 rounded-full text-xs font-medium capitalize",
        styles[priority]
      )}
    >
      {priority}
    </span>
  );
}

export default function Tickets() {
  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Ticket Queue
            </h1>
            <p className="text-muted-foreground">
              Manage and respond to customer support tickets
            </p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-bg text-white font-medium hover:opacity-90 transition-opacity">
            <Plus className="w-5 h-5" />
            New Ticket
          </button>
        </div>

        {/* Filters */}
        <div className="bg-card rounded-xl shadow-card border border-border/30 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search tickets..."
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary transition-all"
              />
            </div>
            <select className="px-4 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary transition-all">
              <option value="">All Status</option>
              <option value="open">Open</option>
              <option value="pending">Pending</option>
              <option value="resolved">Resolved</option>
            </select>
            <select className="px-4 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary transition-all">
              <option value="">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        {/* Tickets List */}
        <div className="bg-card rounded-xl shadow-card border border-border/30 overflow-hidden">
          <div className="divide-y divide-border">
            {mockTickets.map((ticket) => (
              <div
                key={ticket.id}
                className="p-6 hover:bg-muted/30 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-medium text-secondary">{ticket.id}</span>
                      {getStatusBadge(ticket.status)}
                      {getPriorityBadge(ticket.priority)}
                    </div>
                    <h3 className="font-medium text-foreground mb-2 truncate">
                      {ticket.subject}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <User className="w-4 h-4" />
                        {ticket.customer}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        Created {ticket.created}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-xs text-muted-foreground">
                      Updated {ticket.lastUpdate}
                    </span>
                    <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/10 text-secondary text-sm font-medium hover:bg-secondary/20 transition-colors">
                      <MessageSquare className="w-4 h-4" />
                      Reply
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
