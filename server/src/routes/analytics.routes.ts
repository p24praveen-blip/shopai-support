import { Router, Request, Response } from 'express';
import { analyticsService } from '../services/analytics.service';

const router = Router();

/**
 * GET /api/analytics/stats
 * Get dashboard statistics
 */
router.get('/stats', (_req: Request, res: Response) => {
    try {
        const stats = analyticsService.getStats();
        res.json(stats);
    } catch (error) {
        console.error('Error getting stats:', error);
        res.status(500).json({ error: 'Failed to get stats' });
    }
});

/**
 * GET /api/analytics/resolution-time
 * Get resolution time trend data
 */
router.get('/resolution-time', (_req: Request, res: Response) => {
    try {
        const data = analyticsService.getResolutionTimeTrend();
        res.json(data);
    } catch (error) {
        console.error('Error getting resolution time:', error);
        res.status(500).json({ error: 'Failed to get resolution time data' });
    }
});

/**
 * GET /api/analytics/issues
 * Get top issues breakdown
 */
router.get('/issues', (_req: Request, res: Response) => {
    try {
        const data = analyticsService.getTopIssues();
        res.json(data);
    } catch (error) {
        console.error('Error getting issues:', error);
        res.status(500).json({ error: 'Failed to get issues data' });
    }
});

/**
 * GET /api/analytics/ai-vs-human
 * Get AI vs Human resolution split
 */
router.get('/ai-vs-human', (_req: Request, res: Response) => {
    try {
        const data = analyticsService.getAiVsHumanResolution();
        res.json(data);
    } catch (error) {
        console.error('Error getting AI vs Human:', error);
        res.status(500).json({ error: 'Failed to get AI vs Human data' });
    }
});

/**
 * GET /api/analytics/satisfaction
 * Get customer satisfaction trend
 */
router.get('/satisfaction', (_req: Request, res: Response) => {
    try {
        const data = analyticsService.getSatisfactionTrend();
        res.json(data);
    } catch (error) {
        console.error('Error getting satisfaction:', error);
        res.status(500).json({ error: 'Failed to get satisfaction data' });
    }
});

/**
 * GET /api/analytics/escalation-reasons
 * Get escalation reasons breakdown
 */
router.get('/escalation-reasons', (_req: Request, res: Response) => {
    try {
        const data = analyticsService.getEscalationReasons();
        res.json(data);
    } catch (error) {
        console.error('Error getting escalation reasons:', error);
        res.status(500).json({ error: 'Failed to get escalation reasons data' });
    }
});

/**
 * GET /api/analytics/volume
 * Get conversation volume over 24 hours
 */
router.get('/volume', (_req: Request, res: Response) => {
    try {
        const data = analyticsService.getConversationVolume();
        res.json(data);
    } catch (error) {
        console.error('Error getting volume:', error);
        res.status(500).json({ error: 'Failed to get volume data' });
    }
});

export default router;
