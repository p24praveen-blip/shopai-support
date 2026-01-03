import { Router, Request, Response } from 'express';
import { escalationService } from '../services/escalation.service';

const router = Router();

/**
 * GET /api/escalations
 * Get all escalated tickets
 */
router.get('/', (req: Request, res: Response) => {
    try {
        const { priority, category, status } = req.query;
        const escalations = escalationService.getEscalations({
            priority: priority as string,
            category: category as string,
            status: status as string,
        });
        res.json(escalations);
    } catch (error) {
        console.error('Error getting escalations:', error);
        res.status(500).json({ error: 'Failed to get escalations' });
    }
});

/**
 * GET /api/escalations/stats
 * Get escalation statistics
 */
router.get('/stats', (_req: Request, res: Response) => {
    try {
        const stats = escalationService.getStats();
        res.json(stats);
    } catch (error) {
        console.error('Error getting escalation stats:', error);
        res.status(500).json({ error: 'Failed to get escalation stats' });
    }
});

/**
 * GET /api/escalations/:ticketId
 * Get a single ticket
 */
router.get('/:ticketId', (req: Request, res: Response) => {
    try {
        const { ticketId } = req.params;
        const ticket = escalationService.getTicket(ticketId);

        if (!ticket) {
            return res.status(404).json({ error: 'Ticket not found' });
        }

        res.json(ticket);
    } catch (error) {
        console.error('Error getting ticket:', error);
        res.status(500).json({ error: 'Failed to get ticket' });
    }
});

/**
 * PUT /api/escalations/:ticketId/assign
 * Assign a ticket to an agent
 */
router.put('/:ticketId/assign', (req: Request, res: Response) => {
    try {
        const { ticketId } = req.params;
        const { agentName } = req.body;

        if (!agentName) {
            return res.status(400).json({ error: 'Agent name is required' });
        }

        const ticket = escalationService.assignTicket(ticketId, agentName);

        if (!ticket) {
            return res.status(404).json({ error: 'Ticket not found' });
        }

        res.json(ticket);
    } catch (error) {
        console.error('Error assigning ticket:', error);
        res.status(500).json({ error: 'Failed to assign ticket' });
    }
});

/**
 * PUT /api/escalations/:ticketId/resolve
 * Resolve a ticket
 */
router.put('/:ticketId/resolve', (req: Request, res: Response) => {
    try {
        const { ticketId } = req.params;
        const ticket = escalationService.resolveTicket(ticketId);

        if (!ticket) {
            return res.status(404).json({ error: 'Ticket not found' });
        }

        res.json(ticket);
    } catch (error) {
        console.error('Error resolving ticket:', error);
        res.status(500).json({ error: 'Failed to resolve ticket' });
    }
});

/**
 * PUT /api/escalations/:ticketId/priority
 * Update ticket priority
 */
router.put('/:ticketId/priority', (req: Request, res: Response) => {
    try {
        const { ticketId } = req.params;
        const { priority } = req.body;

        if (!['high', 'medium', 'low'].includes(priority)) {
            return res.status(400).json({ error: 'Invalid priority. Must be high, medium, or low' });
        }

        const ticket = escalationService.updateTicketPriority(ticketId, priority);

        if (!ticket) {
            return res.status(404).json({ error: 'Ticket not found' });
        }

        res.json(ticket);
    } catch (error) {
        console.error('Error updating priority:', error);
        res.status(500).json({ error: 'Failed to update priority' });
    }
});

export default router;
