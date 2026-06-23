"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Settings,
  Save,
  Loader2,
  Check,
  AlertTriangle,
  Eye,
  EyeOff,
  Camera,
  MessageSquare,
  BarChart3,
  Bell,
  Send,
  Link2,
  Unlink,
} from "lucide-react";

const permissions = [
  {
    id: "instagram_basic",
    name: "Basic Profile Access",
    description: "Access your Instagram profile information",
    icon: Camera,
    required: true,
  },
  {
    id: "instagram_content_publish",
    name: "Content Publishing",
    description: "Create and publish posts, stories, and reels",
    icon: Send,
    required: true,
  },
  {
    id: "instagram_manage_insights",
    name: "Insights & Analytics",
    description: "View account insights, reach, impressions, engagement",
    icon: BarChart3,
    required: true,
  },
  {
    id: "instagram_manage_comments",
    name: "Comment Management",
    description: "Read, reply to, and delete comments",
    icon: MessageSquare,
    required: true,
  },
  {
    id: "pages_show_list",
    name: "Pages Access",
    description: "Access your Facebook Pages linked to Instagram",
    icon: Link2,
    required: false,
  },
  {
    id: "pages_read_engagement",
    name: "Page Engagement",
    description: "Read page engagement data and notifications",
    icon: Bell,
    required: false,
  },
];

export default function SettingsPage() {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showNvidiaKey, setShowNvidiaKey] = useState(false);
  const [showAccessToken, setShowAccessToken] = useState(false);

  const [debugging, setDebugging] = useState(false);
  const [debugResult, setDebugResult] = useState<Record<string, unknown> | null>(null);

  const [settings, setSettings] = useState({
    defaultTone: "professional",
    defaultStyle: "modern",
    autoPostEnabled: false,
    postFrequency: "daily",
    geminiApiKey: "",
    nvidiaApiKey: "",
    instagramAccountId: "",
    instagramAccessToken: "",
    instagramConnected: false,
    instagramUsername: "",
    instagramFollowers: 0,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setSettings((prev) => ({ ...prev, ...data }));
      }
    } catch {}
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {} finally {
      setSaving(false);
    }
  };

  const handleDirectConnect = async () => {
    if (!settings.instagramAccountId || !settings.instagramAccessToken) {
      alert("Please enter both Instagram Account ID and Access Token.");
      return;
    }

    setConnecting(true);
    try {
      const res = await fetch("/api/instagram/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: settings.instagramAccountId,
          accessToken: settings.instagramAccessToken,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const msg = data.hint ? `${data.error}\n\nHint: ${data.hint}` : data.error || "Failed to connect.";
        alert(msg);
        return;
      }

      setSettings((prev) => ({
        ...prev,
        instagramConnected: true,
        instagramUsername: data.username,
        instagramFollowers: data.followers,
      }));
    } catch {
      alert("Failed to connect. Please try again.");
    } finally {
      setConnecting(false);
    }
  };

  const handleDebugToken = async () => {
    if (!settings.instagramAccessToken) {
      alert("Please enter your Access Token first.");
      return;
    }

    setDebugging(true);
    setDebugResult(null);
    try {
      const res = await fetch("/api/instagram/debug", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken: settings.instagramAccessToken }),
      });

      const data = await res.json();
      setDebugResult(data);
    } catch {
      alert("Debug failed. Please try again.");
    } finally {
      setDebugging(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Disconnect your Instagram account?")) return;

    try {
      await fetch("/api/instagram/disconnect", { method: "POST" });
      setSettings((prev) => ({
        ...prev,
        instagramConnected: false,
        instagramUsername: "",
        instagramFollowers: 0,
        instagramAccountId: "",
        instagramAccessToken: "",
      }));
    } catch {}
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            General Settings
          </CardTitle>
          <CardDescription>Configure your default preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Default Tone</label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                value={settings.defaultTone}
                onChange={(e) =>
                  setSettings({ ...settings, defaultTone: e.target.value })
                }
              >
                <option value="professional">Professional</option>
                <option value="casual">Casual</option>
                <option value="humorous">Humorous</option>
                <option value="inspirational">Inspirational</option>
                <option value="motivational">Motivational</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Default Style</label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                value={settings.defaultStyle}
                onChange={(e) =>
                  setSettings({ ...settings, defaultStyle: e.target.value })
                }
              >
                <option value="modern">Modern</option>
                <option value="minimalist">Minimalist</option>
                <option value="bold">Bold</option>
                <option value="vintage">Vintage</option>
                <option value="neon">Neon</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Post Frequency</label>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              value={settings.postFrequency}
              onChange={(e) =>
                setSettings({ ...settings, postFrequency: e.target.value })
              }
            >
              <option value="twice-daily">Twice Daily</option>
              <option value="daily">Daily</option>
              <option value="every-other-day">Every Other Day</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-lg border p-4 gap-3">
            <div>
              <p className="font-medium">Auto-Post</p>
              <p className="text-sm text-muted-foreground">
                Automatically post generated content at optimal times
              </p>
            </div>
            <Button
              variant={settings.autoPostEnabled ? "default" : "outline"}
              onClick={() =>
                setSettings({
                  ...settings,
                  autoPostEnabled: !settings.autoPostEnabled,
                })
              }
            >
              {settings.autoPostEnabled ? "Enabled" : "Disabled"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Instagram Connection
          </CardTitle>
          <CardDescription>
            Connect your Instagram Business or Creator account using Account ID and Access Token
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {settings.instagramConnected ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white">
                  <Check className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-emerald-700 dark:text-emerald-300">
                    Connected to @{settings.instagramUsername || "your_account"}
                  </p>
                  <p className="text-sm text-emerald-600 dark:text-emerald-400">
                    {settings.instagramFollowers.toLocaleString()} followers
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDisconnect}
                  className="text-red-600 hover:text-red-700"
                >
                  <Unlink className="mr-1 h-4 w-4" />
                  Disconnect
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 rounded-lg border p-4">
              <div className="flex items-center gap-2">
                <Link2 className="h-4 w-4" />
                <p className="text-sm font-medium">Direct Connection</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Enter your Instagram Account ID and Access Token directly. No Facebook App setup required.
              </p>

              <div className="space-y-2">
                <label className="text-sm font-medium">Instagram Account ID</label>
                <Input
                  placeholder="e.g. 17841400123456789"
                  value={settings.instagramAccountId}
                  onChange={(e) =>
                    setSettings({ ...settings, instagramAccountId: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Find this in Instagram Basic Display API or Graph API Explorer
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Access Token</label>
                <div className="relative">
                  <Input
                    type={showAccessToken ? "text" : "password"}
                    placeholder="e.g. EAAGsb0..."
                    value={settings.instagramAccessToken}
                    onChange={(e) =>
                      setSettings({ ...settings, instagramAccessToken: e.target.value })
                    }
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowAccessToken(!showAccessToken)}
                  >
                    {showAccessToken ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Get a long-lived token from{" "}
                  <a
                    href="https://developers.facebook.com/tools/explorer/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Graph API Explorer
                  </a>{" "}
                  with <code className="rounded bg-muted px-1">instagram_basic</code>,{" "}
                  <code className="rounded bg-muted px-1">instagram_content_publish</code>,{" "}
                  <code className="rounded bg-muted px-1">instagram_manage_insights</code>, and{" "}
                  <code className="rounded bg-muted px-1">instagram_manage_comments</code> permissions
                </p>
              </div>

              <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950">
                <AlertTriangle className="mt-0.5 h-4 w-4 text-blue-600" />
                <div className="text-sm">
                  <p className="font-medium text-blue-700 dark:text-blue-300">
                    How to get your credentials:
                  </p>
                  <ol className="mt-1 list-inside list-decimal space-y-1 text-blue-600 dark:text-blue-400">
                    <li>Go to <a href="https://developers.facebook.com/apps/" target="_blank" rel="noopener noreferrer" className="underline">Meta Developers</a> and create an app</li>
                    <li>Add &quot;Instagram Graph API&quot; product to your app</li>
                    <li>Go to Graph API Explorer and generate a token with required permissions</li>
                    <li>Your Account ID is the numeric Instagram Business Account ID</li>
                  </ol>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleDirectConnect}
                  disabled={connecting || !settings.instagramAccountId || !settings.instagramAccessToken}
                  className="flex-1"
                >
                  {connecting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Link2 className="mr-2 h-4 w-4" />
                      Connect
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDebugToken}
                  disabled={debugging || !settings.instagramAccessToken}
                >
                  {debugging ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Debug Token"
                  )}
                </Button>
              </div>

              {debugResult && (
                <div className="rounded-lg border p-3 text-sm">
                  <p className="mb-2 font-medium">Debug Results:</p>
                  <pre className="overflow-auto text-xs text-muted-foreground">
                    {JSON.stringify(debugResult, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          <div className="space-y-3">
            <p className="text-sm font-medium">Available Permissions:</p>
            <div className="grid gap-2">
              {permissions.map((perm) => (
                <div
                  key={perm.id}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
                  <perm.icon className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{perm.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {perm.description}
                    </p>
                  </div>
                  {perm.required && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                      Required
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-800 dark:bg-yellow-950">
            <AlertTriangle className="mt-0.5 h-4 w-4 text-yellow-600" />
            <div className="text-sm">
              <p className="font-medium text-yellow-700 dark:text-yellow-300">
                Business or Creator Account Required
              </p>
              <p className="text-yellow-600 dark:text-yellow-400">
                Your Instagram account must be set to Business or Creator type.
                Personal accounts cannot access insights or publishing APIs.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>API Configuration</CardTitle>
          <CardDescription>Manage your API keys for AI features</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Google Gemini API Key
            </label>
            <div className="relative">
              <Input
                type={showGeminiKey ? "text" : "password"}
                placeholder="AIza..."
                value={settings.geminiApiKey}
                onChange={(e) =>
                  setSettings({ ...settings, geminiApiKey: e.target.value })
                }
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowGeminiKey(!showGeminiKey)}
              >
                {showGeminiKey ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Used for Post Generation and DM Chatbot. Get key from{" "}
              <a
                href="https://makersuite.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Google AI Studio
              </a>
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              NVIDIA Nemotron API Key
            </label>
            <div className="relative">
              <Input
                type={showNvidiaKey ? "text" : "password"}
                placeholder="nvapi-..."
                value={settings.nvidiaApiKey}
                onChange={(e) =>
                  setSettings({ ...settings, nvidiaApiKey: e.target.value })
                }
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowNvidiaKey(!showNvidiaKey)}
              >
                {showNvidiaKey ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Used for SEO Caption Generation. Get free key from{" "}
              <a
                href="https://build.nvidia.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                build.nvidia.com
              </a>
            </p>
          </div>

          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-sm font-medium">API Usage Summary</p>
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Gemini:</span>
                <span
                  className={
                    settings.geminiApiKey ? "text-emerald-500" : "text-yellow-500"
                  }
                >
                  {settings.geminiApiKey ? "Configured" : "Not configured"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nemotron:</span>
                <span
                  className={
                    settings.nvidiaApiKey ? "text-emerald-500" : "text-yellow-500"
                  }
                >
                  {settings.nvidiaApiKey ? "Configured" : "Not configured"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Instagram:</span>
                <span
                  className={
                    settings.instagramConnected
                      ? "text-emerald-500"
                      : "text-yellow-500"
                  }
                >
                  {settings.instagramConnected ? "Connected" : "Not connected"}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : saved ? (
            <>
              <Save className="mr-2 h-4 w-4" />
              Saved!
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
