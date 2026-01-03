import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  User,
  Bell,
  Shield,
  Palette,
  Globe,
  Zap,
  ChevronRight,
  RefreshCw,
  Trash2,
  Users,
  Sparkles,
} from "lucide-react";
import { settingsApi, type AIModelType } from "@/lib/api";
import { toast } from "sonner";

const settingsSections = [
  {
    title: "Account",
    items: [
      {
        icon: User,
        label: "Profile Settings",
        description: "Manage your account information",
      },
      {
        icon: Bell,
        label: "Notifications",
        description: "Configure alert preferences",
      },
      {
        icon: Shield,
        label: "Security",
        description: "Password and authentication",
      },
    ],
  },
  {
    title: "Preferences",
    items: [
      {
        icon: Palette,
        label: "Appearance",
        description: "Customize your dashboard look",
      },
      {
        icon: Globe,
        label: "Language & Region",
        description: "Set your locale preferences",
      },
    ],
  },
  {
    title: "AI Configuration",
    items: [
      {
        icon: Zap,
        label: "AI Response Settings",
        description: "Tune AI behavior and responses",
      },
    ],
  },
];

export default function Settings() {
  const [currentModel, setCurrentModel] = useState<AIModelType>('gemini-2.5-pro');
  const [isClearing, setIsClearing] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isTogglingModel, setIsTogglingModel] = useState(false);

  useEffect(() => {
    settingsApi.getModel().then(s => setCurrentModel(s.currentModel)).catch(console.error);
  }, []);

  const handleClearChats = async () => {
    if (!confirm('Are you sure you want to clear all chat history? This will delete all conversations and messages but keep the knowledge base.')) {
      return;
    }
    setIsClearing(true);
    try {
      await settingsApi.clearChats();
      toast.success('Chat history cleared', { description: 'All conversations and messages have been deleted' });
    } catch (error) {
      toast.error('Failed to clear chats');
    } finally {
      setIsClearing(false);
    }
  };

  const handleSeedDemos = async () => {
    setIsSeeding(true);
    try {
      const result = await settingsApi.seedDemos();
      toast.success('Demo personas created', { 
        description: result.personas.map(p => p.name).join(', ')
      });
    } catch (error) {
      toast.error('Failed to create demo personas');
    } finally {
      setIsSeeding(false);
    }
  };

  const handleToggleModel = async () => {
    setIsTogglingModel(true);
    const newModel: AIModelType = currentModel === 'gemini-2.5-pro' ? 'gemini-2.5-flash' : 'gemini-2.5-pro';
    try {
      await settingsApi.setModel(newModel);
      setCurrentModel(newModel);
      toast.success(`Switched to ${newModel}`, {
        description: newModel === 'gemini-2.5-pro' ? 'Higher quality responses' : 'Faster responses',
      });
    } catch (error) {
      toast.error('Failed to switch model');
    } finally {
      setIsTogglingModel(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account and preferences
          </p>
        </div>

        {/* Settings Sections */}
        <div className="space-y-8">
          {settingsSections.map((section) => (
            <div key={section.title}>
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
                {section.title}
              </h2>
              <div className="bg-card rounded-xl shadow-card border border-border/30 overflow-hidden">
                <div className="divide-y divide-border">
                  {section.items.map((item, index) => (
                    <button
                      key={index}
                      className="w-full px-6 py-4 flex items-center justify-between hover:bg-muted/50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                          <item.icon className="w-5 h-5 text-secondary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {item.label}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {item.description}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Version Info */}
        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>ShopAI Support Dashboard v1.0.0</p>
          <p className="mt-1">© 2024 ShopAI. All rights reserved.</p>
        </div>

        {/* Developer Settings */}
        <div className="mt-12 pt-8 border-t border-border/30">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
            Developer Settings
          </h2>
          <p className="text-xs text-muted-foreground mb-6">Advanced options for development and testing</p>
          
          {/* AI Model Toggle */}
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
            AI Model
          </h3>
          <div className="bg-card rounded-xl shadow-card border border-border/30 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  currentModel === 'gemini-2.5-pro' ? 'bg-purple-500/20' : 'bg-yellow-500/20'
                }`}>
                  {currentModel === 'gemini-2.5-pro' ? (
                    <Sparkles className="w-5 h-5 text-purple-400" />
                  ) : (
                    <Zap className="w-5 h-5 text-yellow-400" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    {currentModel === 'gemini-2.5-pro' ? 'Gemini 2.5 Pro' : 'Gemini 2.5 Flash'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {currentModel === 'gemini-2.5-pro' 
                      ? 'Higher quality, more nuanced responses (~10-15s)' 
                      : 'Faster responses, good for simple queries (~2-3s)'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleToggleModel}
                disabled={isTogglingModel}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  currentModel === 'gemini-2.5-pro'
                    ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                    : 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30'
                } disabled:opacity-50`}
              >
                {isTogglingModel ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  `Switch to ${currentModel === 'gemini-2.5-pro' ? 'Flash' : 'Pro'}`
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Data Management */}
        <div className="mt-6">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Data Management
          </h3>
          <div className="bg-card rounded-xl shadow-card border border-border/30 overflow-hidden">
            <div className="divide-y divide-border">
              {/* Clear Chats */}
              <div className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                    <Trash2 className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Clear Chat History</p>
                    <p className="text-sm text-muted-foreground">
                      Delete all conversations and messages (keeps knowledge base)
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClearChats}
                  disabled={isClearing}
                  className="px-4 py-2 rounded-lg bg-red-500/10 text-red-500 font-medium hover:bg-red-500/20 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isClearing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  {isClearing ? 'Clearing...' : 'Clear'}
                </button>
              </div>
              
              {/* Seed Demos */}
              <div className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Create Demo Personas</p>
                    <p className="text-sm text-muted-foreground">
                      Add 5 sample customer personas for testing
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleSeedDemos}
                  disabled={isSeeding}
                  className="px-4 py-2 rounded-lg bg-green-500/10 text-green-500 font-medium hover:bg-green-500/20 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isSeeding ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
                  {isSeeding ? 'Creating...' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
