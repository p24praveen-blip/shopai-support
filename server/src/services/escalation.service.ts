import { v4 as uuidv4 } from 'uuid';
import db from '../database/db';
import { Ticket } from '../types';

export class EscalationService {
    /**
     * Get all escalated tickets
     */
    getEscalations(filters?: { priority?: string; category?: string; status?: string }): Ticket[] {
        let query = `
      SELECT t.id, t.ticket_id as ticketId, t.conversation_id as conversationId,
             t.customer, t.category, t.priority, t.escalation_reason as escalationReason,
             t.assigned_agent as assignedAgent, t.status,
             t.created_at as createdAt, t.updated_at as updatedAt,
             CASE 
               WHEN julianday('now') - julianday(t.created_at) < 0.0104 THEN 'Just now'
               WHEN julianday('now') - julianday(t.created_at) < 0.0417 THEN CAST(ROUND((julianday('now') - julianday(t.created_at)) * 24 * 60) AS TEXT) || ' min'
               ELSE CAST(ROUND((julianday('now') - julianday(t.created_at)) * 24) AS TEXT) || ' hr'
             END as waitTime
      FROM tickets t
      WHERE 1=1
    `;
        const params: string[] = [];

        if (filters?.priority) {
            query += ` AND t.priority = ?`;
            params.push(filters.priority);
        }
        if (filters?.category) {
            query += ` AND t.category = ?`;
            params.push(filters.category);
        }
        if (filters?.status) {
            query += ` AND t.status = ?`;
            params.push(filters.status);
        }

        query += ` ORDER BY 
      CASE t.priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
      t.created_at ASC`;

        return db.prepare(query).all(...params) as Ticket[];
    }

    /**
     * Get a single ticket by ID
     */
    getTicket(ticketId: string): Ticket | undefined {
        const row = db.prepare(`
      SELECT t.id, t.ticket_id as ticketId, t.conversation_id as conversationId,
             t.customer, t.category, t.priority, t.escalation_reason as escalationReason,
             t.assigned_agent as assignedAgent, t.status,
             t.created_at as createdAt, t.updated_at as updatedAt
      FROM tickets t WHERE t.ticket_id = ?
    `).get(ticketId) as Ticket | undefined;
        return row;
    }

    /**
     * Assign a ticket to an agent
     */
    assignTicket(ticketId: string, agentName: string): Ticket | undefined {
        db.prepare(`
      UPDATE tickets SET assigned_agent = ?, status = 'in_progress', updated_at = CURRENT_TIMESTAMP
      WHERE ticket_id = ?
    `).run(agentName, ticketId);

        // Log analytics
        db.prepare(`
      INSERT INTO analytics_events (id, event_type, data)
      VALUES (?, 'ticket_assigned', ?)
    `).run(uuidv4(), JSON.stringify({ ticketId, agent: agentName }));

        return this.getTicket(ticketId);
    }

    /**
     * Resolve a ticket
     */
    resolveTicket(ticketId: string): Ticket | undefined {
        const ticket = this.getTicket(ticketId);
        if (!ticket) return undefined;

        db.prepare(`
      UPDATE tickets SET status = 'resolved', updated_at = CURRENT_TIMESTAMP
      WHERE ticket_id = ?
    `).run(ticketId);

        // Also resolve the conversation
        db.prepare(`
      UPDATE conversations SET status = 'resolved', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(ticket.conversationId);

        // Log analytics
        db.prepare(`
      INSERT INTO analytics_events (id, event_type, data)
      VALUES (?, 'ticket_resolved', ?)
    `).run(uuidv4(), JSON.stringify({ ticketId }));

        return this.getTicket(ticketId);
    }

    /**
     * Update ticket priority
     */
    updateTicketPriority(ticketId: string, priority: 'high' | 'medium' | 'low'): Ticket | undefined {
        db.prepare(`
      UPDATE tickets SET priority = ?, updated_at = CURRENT_TIMESTAMP
      WHERE ticket_id = ?
    `).run(priority, ticketId);
        return this.getTicket(ticketId);
    }

    /**
     * Get escalation statistics
     */
    getStats(): { open: number; inProgress: number; resolved: number; avgWaitTime: string } {
        const stats = db.prepare(`
      SELECT 
        SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as inProgress,
        SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved,
        AVG(CASE WHEN status IN ('open', 'in_progress') 
            THEN (julianday('now') - julianday(created_at)) * 24 * 60 
            ELSE NULL END) as avgWaitMinutes
      FROM tickets
    `).get() as { open: number; inProgress: number; resolved: number; avgWaitMinutes: number | null };

        const avgWait = stats.avgWaitMinutes ? `${Math.round(stats.avgWaitMinutes)} min` : '0 min';

        return {
            open: stats.open || 0,
            inProgress: stats.inProgress || 0,
            resolved: stats.resolved || 0,
            avgWaitTime: avgWait,
        };
    }
}

export const escalationService = new EscalationService();
