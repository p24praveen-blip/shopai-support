import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  BookOpen,
  Plus,
  Package,
  CreditCard,
  Truck,
  RotateCcw,
  User,
  HelpCircle,
  Brain,
  Search,
  RefreshCw,
  X,
} from "lucide-react";
import { knowledgeBaseApi, type Article } from "@/lib/api";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
  icon: React.ElementType;
  articleCount: number;
  lastUpdated: string;
  color: string;
}

const categoryIcons: Record<string, { icon: React.ElementType; color: string }> = {
  "Orders & Tracking": { icon: Package, color: "bg-secondary" },
  "Payments & Billing": { icon: CreditCard, color: "bg-accent" },
  "Shipping & Delivery": { icon: Truck, color: "bg-success" },
  "Returns & Refunds": { icon: RotateCcw, color: "bg-warning" },
  "Account Management": { icon: User, color: "bg-destructive" },
  "General FAQs": { icon: HelpCircle, color: "bg-muted-foreground" },
};

export default function KnowledgeBase() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [training, setTraining] = useState(false);
  const [newArticle, setNewArticle] = useState({ category: "", title: "", content: "" });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [cats, arts] = await Promise.all([
        knowledgeBaseApi.getCategories(),
        knowledgeBaseApi.getArticles(),
      ]);

      const displayCats: Category[] = cats.map((c, i) => {
        const iconData = categoryIcons[c.category] || { icon: HelpCircle, color: "bg-muted-foreground" };
        return {
          id: String(i),
          name: c.category,
          icon: iconData.icon,
          articleCount: c.articleCount,
          lastUpdated: c.lastUpdated,
          color: iconData.color,
        };
      });

      setCategories(displayCats);
      setArticles(arts);
    } catch (error) {
      console.error("Failed to load knowledge base:", error);
      toast.error("Failed to load knowledge base");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadData();
      return;
    }
    try {
      const results = await knowledgeBaseApi.searchArticles(searchQuery);
      setArticles(results);
    } catch (error) {
      toast.error("Search failed");
    }
  };

  const handleTrainAI = async () => {
    try {
      setTraining(true);
      const result = await knowledgeBaseApi.trainAI();
      toast.success(`AI trained on ${result.articlesProcessed} articles`);
    } catch (error) {
      toast.error("Failed to train AI");
    } finally {
      setTraining(false);
    }
  };

  const handleAddArticle = async () => {
    if (!newArticle.category || !newArticle.title || !newArticle.content) {
      toast.error("Please fill in all fields");
      return;
    }
    try {
      await knowledgeBaseApi.createArticle(newArticle.category, newArticle.title, newArticle.content);
      toast.success("Article created");
      setShowAddModal(false);
      setNewArticle({ category: "", title: "", content: "" });
      loadData();
    } catch (error) {
      toast.error("Failed to create article");
    }
  };

  const filteredArticles = searchQuery
    ? articles
    : articles.slice(0, 4); // Show recent 4 when not searching

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Knowledge Base
            </h1>
            <p className="text-muted-foreground">
              Manage FAQs and train the AI with new content
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleTrainAI}
              disabled={training}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-accent-foreground font-medium hover:bg-accent/90 transition-colors disabled:opacity-50"
            >
              <Brain className={`w-5 h-5 ${training ? 'animate-pulse' : ''}`} />
              {training ? 'Training...' : 'Train AI'}
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-bg text-white font-medium hover:opacity-90 transition-opacity"
            >
              <Plus className="w-5 h-5" />
              Add Article
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-8 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary transition-all shadow-card"
          />
        </div>

        {/* Categories Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="stat-card animate-pulse">
                <div className="h-32 bg-muted rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category, index) => (
              <div
                key={category.id}
                className="stat-card cursor-pointer"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start justify-between mb-6">
                  <div
                    className={`w-14 h-14 rounded-xl ${category.color} flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}
                  >
                    <category.icon className="w-7 h-7 text-white" />
                  </div>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                    {category.lastUpdated}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {category.name}
                </h3>
                <p className="text-muted-foreground">
                  {category.articleCount} articles
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Recent Articles */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-foreground">
              {searchQuery ? 'Search Results' : 'Recently Updated'}
            </h2>
            <button onClick={loadData} className="p-2 rounded-lg hover:bg-muted transition-colors">
              <RefreshCw className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          <div className="bg-card rounded-xl shadow-card border border-border/30 overflow-hidden">
            <div className="divide-y divide-border">
              {filteredArticles.length === 0 ? (
                <div className="px-6 py-12 text-center text-muted-foreground">
                  No articles found
                </div>
              ) : (
                filteredArticles.map((article) => (
                  <div
                    key={article.id}
                    className="px-6 py-4 hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-secondary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{article.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {article.category}
                        </p>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {new Date(article.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Article Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-xl shadow-elevated p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-foreground">Add New Article</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-muted rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Category</label>
                <select
                  value={newArticle.category}
                  onChange={(e) => setNewArticle({ ...newArticle, category: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-secondary/30"
                >
                  <option value="">Select category</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Title</label>
                <input
                  type="text"
                  value={newArticle.title}
                  onChange={(e) => setNewArticle({ ...newArticle, title: e.target.value })}
                  placeholder="Article title"
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-secondary/30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Content</label>
                <textarea
                  value={newArticle.content}
                  onChange={(e) => setNewArticle({ ...newArticle, content: e.target.value })}
                  placeholder="Article content..."
                  rows={4}
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-secondary/30 resize-none"
                />
              </div>
              <button
                onClick={handleAddArticle}
                className="w-full py-3 rounded-xl gradient-bg text-white font-medium hover:opacity-90 transition-opacity"
              >
                Create Article
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
