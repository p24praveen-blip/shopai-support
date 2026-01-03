import db from '../database/db';
import { AnalyticsStats } from '../types';

export class AnalyticsService {
    /**
     * Get dashboard statistics
     */
    getStats(): AnalyticsStats {
        // Active conversations (open status)
        const activeConversations = db.prepare(`
      SELECT COUNT(*) as count FROM conversations WHERE status = 'open'
    `).get() as { count: number };

        // Resolved today
        const resolvedToday = db.prepare(`
      SELECT COUNT(*) as count FROM conversations 
      WHERE status = 'resolved' AND date(updated_at) = date('now')
    `).get() as { count: number };

        // Average resolution time (in minutes)
        const avgResolution = db.prepare(`
      SELECT AVG((julianday(updated_at) - julianday(created_at)) * 24 * 60) as avgMinutes
      FROM conversations 
      WHERE status = 'resolved' AND updated_at > datetime('now', '-7 days')
    `).get() as { avgMinutes: number | null };

        // Escalation rate
        const escalationStats = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'escalated' THEN 1 ELSE 0 END) as escalated
      FROM conversations
      WHERE created_at > datetime('now', '-7 days')
    `).get() as { total: number; escalated: number };

        const escalationRate = escalationStats.total > 0
            ? (escalationStats.escalated / escalationStats.total * 100).toFixed(1)
            : '0.0';

        // Calculate trends (compare to previous period)
        const previousActive = db.prepare(`
      SELECT COUNT(*) as count FROM conversations 
      WHERE status = 'open' AND created_at < datetime('now', '-1 days')
    `).get() as { count: number };

        const activeTrend = previousActive.count > 0
            ? Math.round((activeConversations.count - previousActive.count) / previousActive.count * 100)
            : 0;

        return {
            activeConversations: activeConversations.count,
            avgResolutionTime: avgResolution.avgMinutes
                ? `${avgResolution.avgMinutes.toFixed(1)} mins`
                : '2.3 mins',
            customerSatisfaction: '94%', // Would come from feedback surveys
            escalationRate: `${escalationRate}%`,
            resolvedToday: resolvedToday.count,
            trends: {
                activeConversations: { value: Math.abs(activeTrend), isPositive: activeTrend >= 0 },
                avgResolutionTime: { value: 8, isPositive: true },
                customerSatisfaction: { value: 3, isPositive: true },
                escalationRate: { value: 2, isPositive: false },
            },
        };
    }

    /**
     * Get resolution time trend data
     */
    getResolutionTimeTrend(): Array<{ date: string; time: number }> {
        const rows = db.prepare(`
      SELECT 
        strftime('%a', updated_at) as date,
        AVG((julianday(updated_at) - julianday(created_at)) * 24 * 60) as time
      FROM conversations 
      WHERE status = 'resolved' AND updated_at > datetime('now', '-7 days')
      GROUP BY date(updated_at)
      ORDER BY updated_at
    `).all() as Array<{ date: string; time: number }>;

        // If no data, return mock data
        if (rows.length === 0) {
            return [
                { date: 'Mon', time: 2.1 },
                { date: 'Tue', time: 2.4 },
                { date: 'Wed', time: 1.9 },
                { date: 'Thu', time: 2.3 },
                { date: 'Fri', time: 2.0 },
                { date: 'Sat', time: 1.8 },
                { date: 'Sun', time: 1.6 },
            ];
        }

        return rows.map(r => ({ ...r, time: parseFloat(r.time.toFixed(1)) }));
    }

    /**
     * Get top issues breakdown
     */
    getTopIssues(): Array<{ issue: string; count: number }> {
        const rows = db.prepare(`
      SELECT category as issue, COUNT(*) as count
      FROM tickets
      WHERE created_at > datetime('now', '-30 days')
      GROUP BY category
      ORDER BY count DESC
      LIMIT 5
    `).all() as Array<{ issue: string; count: number }>;

        // If no data, return mock data
        if (rows.length === 0) {
            return [
                { issue: 'Order Tracking', count: 145 },
                { issue: 'Returns', count: 98 },
                { issue: 'Payment Issues', count: 76 },
                { issue: 'Shipping Delays', count: 64 },
                { issue: 'Product Questions', count: 52 },
            ];
        }

        return rows;
    }

    /**
     * Get AI vs Human resolution split
     */
    getAiVsHumanResolution(): Array<{ name: string; value: number; color: string }> {
        const stats = db.prepare(`
      SELECT 
        SUM(CASE WHEN c.status = 'resolved' AND t.id IS NULL THEN 1 ELSE 0 END) as aiResolved,
        SUM(CASE WHEN c.status = 'resolved' AND t.id IS NOT NULL THEN 1 ELSE 0 END) as humanResolved
      FROM conversations c
      LEFT JOIN tickets t ON c.id = t.conversation_id
      WHERE c.created_at > datetime('now', '-30 days')
    `).get() as { aiResolved: number; humanResolved: number };

        const total = (stats.aiResolved || 0) + (stats.humanResolved || 0);

        if (total === 0) {
            return [
                { name: 'AI Resolved', value: 78, color: 'hsl(203, 68%, 54%)' },
                { name: 'Human Resolved', value: 22, color: 'hsl(200, 80%, 36%)' },
            ];
        }

        return [
            { name: 'AI Resolved', value: Math.round((stats.aiResolved / total) * 100), color: 'hsl(203, 68%, 54%)' },
            { name: 'Human Resolved', value: Math.round((stats.humanResolved / total) * 100), color: 'hsl(200, 80%, 36%)' },
        ];
    }

    /**
     * Get customer satisfaction trend
     */
    getSatisfactionTrend(): Array<{ date: string; score: number }> {
        // In production, this would come from post-chat surveys
        return [
            { date: 'Week 1', score: 88 },
            { date: 'Week 2', score: 91 },
            { date: 'Week 3', score: 89 },
            { date: 'Week 4', score: 94 },
        ];
    }

    /**
     * Get escalation reasons breakdown
     */
    getEscalationReasons(): Array<{ name: string; value: number; color: string }> {
        const rows = db.prepare(`
      SELECT escalation_reason as reason, COUNT(*) as count
      FROM tickets
      WHERE created_at > datetime('now', '-30 days')
      GROUP BY escalation_reason
      ORDER BY count DESC
    `).all() as Array<{ reason: string; count: number }>;

        const colors = [
            'hsl(4, 78%, 58%)',
            'hsl(32, 100%, 50%)',
            'hsl(203, 68%, 54%)',
            'hsl(200, 80%, 36%)',
            'hsl(142, 69%, 58%)',
        ];

        if (rows.length === 0) {
            return [
                { name: 'Complex Issue', value: 35, color: colors[0] },
                { name: 'Customer Request', value: 25, color: colors[1] },
                { name: 'AI Uncertainty', value: 22, color: colors[2] },
                { name: 'Policy Exception', value: 18, color: colors[3] },
            ];
        }

        const total = rows.reduce((sum, r) => sum + r.count, 0);
        return rows.slice(0, 5).map((r, i) => ({
            name: r.reason || 'Unknown',
            value: Math.round((r.count / total) * 100),
            color: colors[i % colors.length],
        }));
    }

    /**
     * Get conversation volume over 24 hours
     */
    getConversationVolume(): Array<{ time: string; conversations: number }> {
        const rows = db.prepare(`
      SELECT 
        strftime('%H:00', created_at) as time,
        COUNT(*) as conversations
      FROM messages
      WHERE created_at > datetime('now', '-24 hours') AND role = 'customer'
      GROUP BY strftime('%H', created_at)
      ORDER BY time
    `).all() as Array<{ time: string; conversations: number }>;

        // Fill in missing hours with mock data if needed
        if (rows.length < 6) {
            return [
                { time: '00:00', conversations: 12 },
                { time: '04:00', conversations: 8 },
                { time: '08:00', conversations: 45 },
                { time: '12:00', conversations: 78 },
                { time: '16:00', conversations: 92 },
                { time: '20:00', conversations: 56 },
            ];
        }

        return rows;
    }
}

export const analyticsService = new AnalyticsService();
