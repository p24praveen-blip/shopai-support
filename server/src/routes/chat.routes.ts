import { Router, Request, Response } from 'express';
import { chatService } from '../services/chat.service';
import { ChatRequest } from '../types';

const router = Router();

/**
 * POST /api/chat/message
 * Send a message and get AI response
 */
router.post('/message', async (req: Request, res: Response) => {
    try {
        const chatRequest: ChatRequest = req.body;

        if (!chatRequest.message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        const response = await chatService.processMessage(chatRequest);
        res.json(response);
    } catch (error) {
        console.error('Error processing message:', error);
        res.status(500).json({ error: 'Failed to process message' });
    }
});

/**
 * GET /api/chat/conversations
 * Get all conversations
 */
router.get('/conversations', (_req: Request, res: Response) => {
    try {
        const conversations = chatService.getAllConversations();
        res.json(conversations);
    } catch (error) {
        console.error('Error getting conversations:', error);
        res.status(500).json({ error: 'Failed to get conversations' });
    }
});

/**
 * GET /api/chat/conversations/:id
 * Get a single conversation with messages
 */
router.get('/conversations/:id', (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const result = chatService.getConversationWithMessages(id);

        if (!result) {
            return res.status(404).json({ error: 'Conversation not found' });
        }

        res.json(result);
    } catch (error) {
        console.error('Error getting conversation:', error);
        res.status(500).json({ error: 'Failed to get conversation' });
    }
});

/**
 * POST /api/chat/conversations/:id/escalate
 * Manually escalate a conversation
 */
router.post('/conversations/:id/escalate', (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        chatService.escalateConversation(id, reason || 'Manual escalation by agent');
        res.json({ success: true, message: 'Conversation escalated' });
    } catch (error) {
        console.error('Error escalating conversation:', error);
        res.status(500).json({ error: 'Failed to escalate conversation' });
    }
});

/**
 * POST /api/chat/conversations/:id/resolve
 * Resolve a conversation
 */
router.post('/conversations/:id/resolve', (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        chatService.resolveConversation(id);
        res.json({ success: true, message: 'Conversation resolved' });
    } catch (error) {
        console.error('Error resolving conversation:', error);
        res.status(500).json({ error: 'Failed to resolve conversation' });
    }
});

export default router;
