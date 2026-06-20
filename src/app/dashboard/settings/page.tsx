"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Settings, Save, Loader2 } from "lucide-react";

export default function SettingsPage() {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState({
    defaultTone: "professional",
    defaultStyle: "modern",
    autoPostEnabled: false,
    postFrequency: "daily",
    instagramConnected: false,
    geminiApiKey: "",
  });

  const handleSave = async () => {
    setSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
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

          <div className="flex items-center justify-between rounded-lg border p-4">
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
          <CardTitle>API Configuration</CardTitle>
          <CardDescription>Connect your accounts and API keys</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <p className="font-medium">Instagram Account</p>
              <p className="text-sm text-muted-foreground">
                {settings.instagramConnected
                  ? "Connected to @your_username"
                  : "Not connected"}
              </p>
            </div>
            <Button
              variant={settings.instagramConnected ? "outline" : "default"}
            >
              {settings.instagramConnected ? "Disconnect" : "Connect Instagram"}
            </Button>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Google Gemini API Key</label>
            <Input
              type="password"
              placeholder="AIza..."
              value={settings.geminiApiKey}
              onChange={(e) =>
                setSettings({ ...settings, geminiApiKey: e.target.value })
              }
            />
            <p className="text-xs text-muted-foreground">
              Required for AI features. Get your key from Google AI Studio.
            </p>
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
