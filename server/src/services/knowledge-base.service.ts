import { v4 as uuidv4 } from 'uuid';
import db from '../database/db';
import { Article } from '../types';

export class KnowledgeBaseService {
    /**
     * Get all categories with article counts
     */
    getCategories(): Array<{ category: string; articleCount: number; lastUpdated: string }> {
        const rows = db.prepare(`
      SELECT category, COUNT(*) as articleCount, 
             MAX(updated_at) as lastUpdated
      FROM articles 
      GROUP BY category
      ORDER BY category
    `).all() as Array<{ category: string; articleCount: number; lastUpdated: string }>;

        return rows.map(row => ({
            ...row,
            lastUpdated: this.formatTimeAgo(new Date(row.lastUpdated)),
        }));
    }

    /**
     * Get all articles
     */
    getArticles(category?: string): Article[] {
        let query = `
      SELECT id, category, title, content, 
             created_at as createdAt, updated_at as updatedAt
      FROM articles
    `;

        if (category) {
            query += ` WHERE category = ?`;
            return db.prepare(query).all(category) as Article[];
        }

        return db.prepare(query + ' ORDER BY category, title').all() as Article[];
    }

    /**
     * Search articles
     */
    searchArticles(query: string): Article[] {
        const searchPattern = `%${query}%`;
        return db.prepare(`
      SELECT id, category, title, content, 
             created_at as createdAt, updated_at as updatedAt
      FROM articles
      WHERE LOWER(title) LIKE LOWER(?) OR LOWER(content) LIKE LOWER(?)
      ORDER BY 
        CASE WHEN LOWER(title) LIKE LOWER(?) THEN 0 ELSE 1 END,
        title
    `).all(searchPattern, searchPattern, searchPattern) as Article[];
    }

    /**
     * Get a single article by ID
     */
    getArticle(id: string): Article | undefined {
        return db.prepare(`
      SELECT id, category, title, content, 
             created_at as createdAt, updated_at as updatedAt
      FROM articles WHERE id = ?
    `).get(id) as Article | undefined;
    }

    /**
     * Create a new article
     */
    createArticle(category: string, title: string, content: string): Article {
        const id = `art-${uuidv4().slice(0, 8)}`;

        db.prepare(`
      INSERT INTO articles (id, category, title, content)
      VALUES (?, ?, ?, ?)
    `).run(id, category, title, content);

        // Log analytics event
        db.prepare(`
      INSERT INTO analytics_events (id, event_type, data)
      VALUES (?, 'article_created', ?)
    `).run(uuidv4(), JSON.stringify({ articleId: id, category, title }));

        return this.getArticle(id)!;
    }

    /**
     * Update an article
     */
    updateArticle(id: string, updates: { category?: string; title?: string; content?: string }): Article | undefined {
        const article = this.getArticle(id);
        if (!article) return undefined;

        const newCategory = updates.category ?? article.category;
        const newTitle = updates.title ?? article.title;
        const newContent = updates.content ?? article.content;

        db.prepare(`
      UPDATE articles 
      SET category = ?, title = ?, content = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(newCategory, newTitle, newContent, id);

        return this.getArticle(id);
    }

    /**
     * Delete an article
     */
    deleteArticle(id: string): boolean {
        const result = db.prepare(`DELETE FROM articles WHERE id = ?`).run(id);
        return result.changes > 0;
    }

    /**
     * Simulate "training" the AI on new content
     * In production, this would update embeddings or fine-tune the model
     */
    trainOnContent(): { status: string; articlesProcessed: number; timestamp: string } {
        const articles = this.getArticles();

        // Log the training event
        db.prepare(`
      INSERT INTO analytics_events (id, event_type, data)
      VALUES (?, 'ai_training_triggered', ?)
    `).run(uuidv4(), JSON.stringify({ articlesCount: articles.length }));

        return {
            status: 'Training initiated',
            articlesProcessed: articles.length,
            timestamp: new Date().toISOString(),
        };
    }

    /**
     * Format timestamp to "X ago" format
     */
    private formatTimeAgo(date: Date): string {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffHours / 24);

        if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        return 'Just now';
    }
}

export const knowledgeBaseService = new KnowledgeBaseService();
