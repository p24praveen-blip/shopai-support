import { Router, Request, Response } from 'express';
import { knowledgeBaseService } from '../services/knowledge-base.service';

const router = Router();

/**
 * GET /api/knowledge-base/categories
 * Get all categories with article counts
 */
router.get('/categories', (_req: Request, res: Response) => {
    try {
        const categories = knowledgeBaseService.getCategories();
        res.json(categories);
    } catch (error) {
        console.error('Error getting categories:', error);
        res.status(500).json({ error: 'Failed to get categories' });
    }
});

/**
 * GET /api/knowledge-base/articles
 * Get all articles or filter by category
 */
router.get('/articles', (req: Request, res: Response) => {
    try {
        const { category, search } = req.query;

        if (search) {
            const articles = knowledgeBaseService.searchArticles(search as string);
            return res.json(articles);
        }

        const articles = knowledgeBaseService.getArticles(category as string);
        res.json(articles);
    } catch (error) {
        console.error('Error getting articles:', error);
        res.status(500).json({ error: 'Failed to get articles' });
    }
});

/**
 * GET /api/knowledge-base/articles/:id
 * Get a single article
 */
router.get('/articles/:id', (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const article = knowledgeBaseService.getArticle(id);

        if (!article) {
            return res.status(404).json({ error: 'Article not found' });
        }

        res.json(article);
    } catch (error) {
        console.error('Error getting article:', error);
        res.status(500).json({ error: 'Failed to get article' });
    }
});

/**
 * POST /api/knowledge-base/articles
 * Create a new article
 */
router.post('/articles', (req: Request, res: Response) => {
    try {
        const { category, title, content } = req.body;

        if (!category || !title || !content) {
            return res.status(400).json({ error: 'Category, title, and content are required' });
        }

        const article = knowledgeBaseService.createArticle(category, title, content);
        res.status(201).json(article);
    } catch (error) {
        console.error('Error creating article:', error);
        res.status(500).json({ error: 'Failed to create article' });
    }
});

/**
 * PUT /api/knowledge-base/articles/:id
 * Update an article
 */
router.put('/articles/:id', (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { category, title, content } = req.body;

        const article = knowledgeBaseService.updateArticle(id, { category, title, content });

        if (!article) {
            return res.status(404).json({ error: 'Article not found' });
        }

        res.json(article);
    } catch (error) {
        console.error('Error updating article:', error);
        res.status(500).json({ error: 'Failed to update article' });
    }
});

/**
 * DELETE /api/knowledge-base/articles/:id
 * Delete an article
 */
router.delete('/articles/:id', (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const deleted = knowledgeBaseService.deleteArticle(id);

        if (!deleted) {
            return res.status(404).json({ error: 'Article not found' });
        }

        res.json({ success: true, message: 'Article deleted' });
    } catch (error) {
        console.error('Error deleting article:', error);
        res.status(500).json({ error: 'Failed to delete article' });
    }
});

/**
 * POST /api/knowledge-base/train
 * Train AI on knowledge base content
 */
router.post('/train', (_req: Request, res: Response) => {
    try {
        const result = knowledgeBaseService.trainOnContent();
        res.json(result);
    } catch (error) {
        console.error('Error training AI:', error);
        res.status(500).json({ error: 'Failed to train AI' });
    }
});

export default router;
