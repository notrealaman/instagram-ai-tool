"use client";

import { useState, useRef, useEffect, useCallback } from "react";
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
  MessageSquare,
  Send,
  Bot,
  User,
  Loader2,
  Settings,
  Power,
  Save,
  Activity,
  RefreshCw,
  Clock,
  Bug,
  ChevronDown,
  ChevronUp,
  Webhook,
  CheckCircle,
  XCircle,
  Copy,
  ExternalLink,
} from "lucide-react";

interface ChatbotSettings {
  isEnabled: boolean;
  botName: string;
  personality: string;
  mood: string;
  humorLevel: number;
  intelligence: number;
  responseLength: string;
  customInstructions: string;
  welcomeMessage: string;
  lastRepliedAt?: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface AutoReplyLog {
  conversationId: string;
  senderName: string;
  message: string;
  reply: string;
  timestamp: string;
}

const personalities = [
  { id: "friendly", name: "Friendly", emoji: "😊", description: "Warm and approachable" },
  { id: "professional", name: "Professional", emoji: "💼", description: "Formal and business-like" },
  { id: "casual", name: "Casual", emoji: "😎", description: "Relaxed and laid-back" },
  { id: "humorous", name: "Humorous", emoji: "😄", description: "Witty and fun" },
  { id: "empathetic", name: "Empathetic", emoji: "💗", description: "Understanding and caring" },
  { id: "enthusiastic", name: "Enthusiastic", emoji: "🚀", description: "Excited and energetic" },
  { id: "mysterious", name: "Mysterious", emoji: "神秘", description: "Intriguing and thoughtful" },
  { id: "expert", name: "Expert", emoji: "🎓", description: "Knowledgeable and authoritative" },
];

const moods = [
  "Professional",
  "Casual",
  "Playful",
  "Serious",
  "Upbeat",
  "Calm",
  "Energetic",
  "Thoughtful",
];

const responseLengths = [
  { id: "short", name: "Short", description: "1-2 sentences" },
  { id: "medium", name: "Medium", description: "2-3 sentences" },
  { id: "long", name: "Long", description: "3-4 sentences" },
];

export default function DMChatbotPage() {
  const [settings, setSettings] = useState<ChatbotSettings>({
    isEnabled: false,
    botName: "AI Assistant",
    personality: "friendly",
    mood: "professional",
    humorLevel: 5,
    intelligence: 7,
    responseLength: "medium",
    customInstructions: "",
    welcomeMessage: "Hi! How can I help you today?",
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "settings" | "activity" | "webhook">("chat");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-reply state
  const [autoReplyLogs, setAutoReplyLogs] = useState<AutoReplyLog[]>([]);
  const [isPolling, setIsPolling] = useState(false);
  const [lastPollTime, setLastPollTime] = useState<string>("");
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Debug state
  const [debugInfo, setDebugInfo] = useState<Record<string, unknown> | null>(null);
  const [isDebugging, setIsDebugging] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [lastPollResult, setLastPollResult] = useState<string>("");

  // Webhook state
  const [webhookStatus, setWebhookStatus] = useState<"unknown" | "subscribed" | "not_subscribed">("unknown");
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [webhookError, setWebhookError] = useState<string>("");
  const [showWebhookInstructions, setShowWebhookInstructions] = useState(true);

  const loadSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/chatbot-settings");
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch {
      console.error("Failed to load settings");
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    if (messages.length === 0 && settings.welcomeMessage) {
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: settings.welcomeMessage,
          timestamp: new Date(),
        },
      ]);
    }
  }, [settings.welcomeMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-reply polling
  const pollAutoReply = useCallback(async () => {
    try {
      const res = await fetch("/api/instagram/auto-reply", {
        method: "POST",
      });
      const data = await res.json();

      if (data.success && data.results && data.results.length > 0) {
        setAutoReplyLogs((prev) => [
          ...data.results.map((r: AutoReplyLog) => ({
            ...r,
            timestamp: new Date().toISOString(),
          })),
          ...prev,
        ].slice(0, 50));
        setLastPollResult(`Replied to ${data.repliedCount} DM(s) out of ${data.totalConversations} conversations`);
      } else if (data.error) {
        setLastPollResult(`Error: ${data.error}`);
      } else {
        setLastPollResult(`No new DMs (${data.totalConversations || 0} conversations checked)`);
      }
      setLastPollTime(new Date().toLocaleTimeString());
    } catch (err) {
      console.error("Auto-reply poll failed:", err);
      setLastPollResult(`Poll failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }, []);

  // Start/stop polling when auto-reply toggled
  useEffect(() => {
    if (settings.isEnabled) {
      setIsPolling(true);
      // Poll immediately
      pollAutoReply();
      // Then poll every 15 seconds
      pollingIntervalRef.current = setInterval(pollAutoReply, 15000);
    } else {
      setIsPolling(false);
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [settings.isEnabled, pollAutoReply]);

  const saveSettings = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/chatbot-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (!res.ok) {
        throw new Error("Failed to save settings");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const toggleChatbot = async () => {
    const newEnabled = !settings.isEnabled;
    setSettings((prev) => ({ ...prev, isEnabled: newEnabled }));
    try {
      await fetch("/api/chatbot-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isEnabled: newEnabled }),
      });
    } catch {
      setSettings((prev) => ({ ...prev, isEnabled: !newEnabled }));
    }
  };

  const testDMConnection = async () => {
    setIsDebugging(true);
    setDebugInfo(null);
    try {
      const res = await fetch("/api/instagram/dm-debug");
      const data = await res.json();
      setDebugInfo(data);
      setShowDebug(true);
    } catch (err) {
      setDebugInfo({ error: err instanceof Error ? err.message : "Failed to test" });
      setShowDebug(true);
    } finally {
      setIsDebugging(false);
    }
  };

  const checkWebhookStatus = async () => {
    try {
      const res = await fetch("/api/instagram/webhook-subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "check" }),
      });
      const data = await res.json();
      if (data.data?.subscribed_apps?.data?.length > 0) {
        setWebhookStatus("subscribed");
      } else {
        setWebhookStatus("not_subscribed");
      }
    } catch {
      setWebhookStatus("unknown");
    }
  };

  const subscribeWebhook = async () => {
    setIsSubscribing(true);
    setWebhookError("");
    try {
      const res = await fetch("/api/instagram/webhook-subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "subscribe" }),
      });
      const data = await res.json();
      if (data.success) {
        setWebhookStatus("subscribed");
      } else {
        setWebhookError(data.error || "Failed to subscribe");
        if (data.hint) {
          setWebhookError(`${data.error}\n\nHint: ${data.hint}`);
        }
      }
    } catch (err) {
      setWebhookError(err instanceof Error ? err.message : "Failed to subscribe");
    } finally {
      setIsSubscribing(false);
    }
  };

  const unsubscribeWebhook = async () => {
    setIsSubscribing(true);
    setWebhookError("");
    try {
      const res = await fetch("/api/instagram/webhook-subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "unsubscribe" }),
      });
      const data = await res.json();
      if (data.success) {
        setWebhookStatus("not_subscribed");
      } else {
        setWebhookError(data.error || "Failed to unsubscribe");
      }
    } catch (err) {
      setWebhookError(err instanceof Error ? err.message : "Failed to unsubscribe");
    } finally {
      setIsSubscribing(false);
    }
  };

  useEffect(() => {
    checkWebhookStatus();
  }, []);

  const handleSend = async (content: string) => {
    if (!content.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);
    setError("");

    try {
      const conversationHistory = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: content.trim(),
          conversationHistory,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to get response");
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          err instanceof Error
            ? `Error: ${err.message}`
            : "Sorry, something went wrong. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(inputValue);
    }
  };

  const selectedPersonality = personalities.find((p) => p.id === settings.personality);

  return (
    <div className="space-y-6">
      {/* Status Bar */}
      <Card>
        <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4">
          <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Power className={`h-5 w-5 ${settings.isEnabled ? "text-emerald-500" : "text-muted-foreground"}`} />
              <span className="font-medium">Auto-Reply</span>
            </div>
            <span className={`text-sm ${settings.isEnabled ? "text-emerald-500" : "text-muted-foreground"}`}>
              {settings.isEnabled
                ? `Active - Polling every 15s ${lastPollTime ? `(Last: ${lastPollTime})` : ""}`
                : "Inactive"}
            </span>
            {isPolling && (
              <span className="flex items-center gap-1 text-xs text-emerald-500">
                <RefreshCw className="h-3 w-3 animate-spin" />
                Polling
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {selectedPersonality?.emoji} {selectedPersonality?.name}
            </span>
            <Button
              variant={settings.isEnabled ? "destructive" : "default"}
              size="sm"
              onClick={toggleChatbot}
            >
              {settings.isEnabled ? "Disable" : "Enable"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tab Navigation */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={activeTab === "chat" ? "default" : "outline"}
          onClick={() => setActiveTab("chat")}
        >
          <MessageSquare className="mr-2 h-4 w-4" />
          Test Chat
        </Button>
        <Button
          variant={activeTab === "activity" ? "default" : "outline"}
          onClick={() => setActiveTab("activity")}
        >
          <Activity className="mr-2 h-4 w-4" />
          Activity Log
          {autoReplyLogs.length > 0 && (
            <span className="ml-2 rounded-full bg-emerald-500 px-2 py-0.5 text-xs text-white">
              {autoReplyLogs.length}
            </span>
          )}
        </Button>
        <Button
          variant={activeTab === "webhook" ? "default" : "outline"}
          onClick={() => setActiveTab("webhook")}
        >
          <Webhook className="mr-2 h-4 w-4" />
          Webhook Setup
          {webhookStatus === "subscribed" && (
            <CheckCircle className="ml-2 h-4 w-4 text-emerald-500" />
          )}
          {webhookStatus === "not_subscribed" && (
            <XCircle className="ml-2 h-4 w-4 text-red-500" />
          )}
        </Button>
        <Button
          variant={activeTab === "settings" ? "default" : "outline"}
          onClick={() => setActiveTab("settings")}
        >
          <Settings className="mr-2 h-4 w-4" />
          Personality Settings
        </Button>
      </div>

      {activeTab === "chat" ? (
        /* Chat Interface */
        <Card className="flex h-[calc(100vh-20rem)] sm:h-[calc(100vh-16rem)] flex-col">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Test Your Chatbot
            </CardTitle>
            <CardDescription>
              Send messages to see how your chatbot responds
            </CardDescription>
          </CardHeader>

          <CardContent className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.role === "assistant" && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}
                  <div
                    className={`max-w-[70%] rounded-lg px-4 py-2 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p
                      className={`mt-1 text-xs ${
                        message.role === "user"
                          ? "text-primary-foreground/70"
                          : "text-muted-foreground"
                      }`}
                    >
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  {message.role === "user" && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              ))}
              {isTyping && (
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="rounded-lg bg-muted px-4 py-2">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">
                        {settings.botName} is typing...
                      </span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </CardContent>

          <div className="border-t p-4">
            <div className="flex gap-2">
              <Input
                placeholder="Type a message to test your chatbot..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isTyping}
              />
              <Button
                onClick={() => handleSend(inputValue)}
                disabled={!inputValue.trim() || isTyping}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      ) : activeTab === "activity" ? (
        /* Activity Log */
        <div className="space-y-4">
          {/* Debug Panel */}
          <Card>
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Bug className="h-5 w-5" />
                    DM Connection Test
                  </CardTitle>
                  <CardDescription>
                    Test your Instagram DM API connection
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={testDMConnection}
                    disabled={isDebugging}
                  >
                    {isDebugging ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Bug className="mr-2 h-4 w-4" />
                    )}
                    Test Connection
                  </Button>
                  {debugInfo && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowDebug(!showDebug)}
                    >
                      {showDebug ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            {showDebug && debugInfo && (
              <CardContent>
                <pre className="overflow-auto rounded-md bg-muted p-4 text-xs">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </CardContent>
            )}
          </Card>

          {/* Activity Log */}
          <Card>
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Auto-Reply Activity Log
                  </CardTitle>
                  <CardDescription>
                    {lastPollResult || "Recent DMs auto-replied by your chatbot"}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {lastPollTime && (
                    <span className="text-xs text-muted-foreground">
                      Last poll: {lastPollTime}
                    </span>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={pollAutoReply}
                    disabled={isPolling}
                  >
                    <RefreshCw className={`h-4 w-4 ${isPolling ? "animate-spin" : ""}`} />
                  </Button>
                </div>
              </div>
            </CardHeader>
          <CardContent className="max-h-[calc(100vh-20rem)] overflow-y-auto">
            {autoReplyLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Clock className="mb-4 h-12 w-12 opacity-50" />
                <p className="text-lg font-medium">No auto-replies yet</p>
                <p className="text-sm">
                  {settings.isEnabled
                    ? "Waiting for incoming DMs... (polls every 15 seconds)"
                    : "Enable auto-reply to start responding to DMs automatically"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {autoReplyLogs.map((log, i) => (
                  <div
                    key={`${log.conversationId}-${i}`}
                    className="rounded-lg border p-4"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <span className="font-medium">{log.senderName}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="rounded-md bg-muted p-2">
                        <p className="text-xs text-muted-foreground">Received:</p>
                        <p className="text-sm">{log.message}</p>
                      </div>
                      <div className="rounded-md bg-primary/10 p-2">
                        <p className="text-xs text-primary">Bot replied:</p>
                        <p className="text-sm">{log.reply}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        </div>
      ) : activeTab === "webhook" ? (
        /* Webhook Setup */
        <div className="space-y-4">
          {/* Webhook Status */}
          <Card>
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Webhook className="h-5 w-5" />
                    Webhook Status
                  </CardTitle>
                  <CardDescription>
                    Real-time DM notifications via Facebook Webhooks
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {webhookStatus === "subscribed" && (
                    <span className="flex items-center gap-1 text-sm text-emerald-500">
                      <CheckCircle className="h-4 w-4" /> Subscribed
                    </span>
                  )}
                  {webhookStatus === "not_subscribed" && (
                    <span className="flex items-center gap-1 text-sm text-red-500">
                      <XCircle className="h-4 w-4" /> Not Subscribed
                    </span>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={checkWebhookStatus}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                {webhookStatus !== "subscribed" ? (
                  <Button
                    onClick={subscribeWebhook}
                    disabled={isSubscribing}
                  >
                    {isSubscribing ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Webhook className="mr-2 h-4 w-4" />
                    )}
                    Subscribe to Webhooks
                  </Button>
                ) : (
                  <Button
                    variant="destructive"
                    onClick={unsubscribeWebhook}
                    disabled={isSubscribing}
                  >
                    {isSubscribing ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <XCircle className="mr-2 h-4 w-4" />
                    )}
                    Unsubscribe
                  </Button>
                )}
              </div>
              {webhookError && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive whitespace-pre-wrap">
                  {webhookError}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Setup Instructions */}
          <Card>
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <CardTitle>Setup Instructions</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowWebhookInstructions(!showWebhookInstructions)}
                >
                  {showWebhookInstructions ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>
            </CardHeader>
            {showWebhookInstructions && (
              <CardContent className="space-y-4">
                {/* Step 1 */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Step 1: Get Your Webhook URL</h3>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 rounded-md bg-muted p-2 text-xs">
                      {typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"}/api/webhook
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const url = `${window.location.origin}/api/webhook`;
                        navigator.clipboard.writeText(url);
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Step 2: Go to Facebook Developer Dashboard</h3>
                  <a
                    href="https://developers.facebook.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-blue-500 hover:underline"
                  >
                    Open Facebook Developers <ExternalLink className="h-3 w-3" />
                  </a>
                </div>

                {/* Step 3 */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Step 3: Add Webhook</h3>
                  <ol className="list-inside list-decimal space-y-1 text-sm text-muted-foreground">
                    <li>Select your app</li>
                    <li>Go to <strong>Webhooks</strong> in the left sidebar</li>
                    <li>Click <strong>"Subscribe to Events"</strong></li>
                    <li>Paste your Webhook URL</li>
                    <li>Enter Verify Token: <code className="rounded bg-muted px-1">instaai-webhook-verify-2024-secret</code></li>
                    <li>Click <strong>"Verify and Save"</strong></li>
                  </ol>
                </div>

                {/* Step 4 */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Step 4: Subscribe to Messages</h3>
                  <ol className="list-inside list-decimal space-y-1 text-sm text-muted-foreground">
                    <li>After verifying, you&apos;ll see event types</li>
                    <li>Find <strong>"messages"</strong> and check the checkbox</li>
                    <li>Also check <strong>"messaging_postbacks"</strong></li>
                    <li>Click <strong>"Save"</strong></li>
                  </ol>
                </div>

                {/* Step 5 */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Step 5: Make App Live</h3>
                  <ol className="list-inside list-decimal space-y-1 text-sm text-muted-foreground">
                    <li>Go to <strong>App Review</strong> → <strong>Permissions and Features</strong></li>
                    <li>Request <code className="rounded bg-muted px-1">pages_messaging</code> permission</li>
                    <li>Go to <strong>Settings</strong> → <strong>Basic</strong></li>
                    <li>Switch <strong>App Mode</strong> from Development to <strong>Live</strong></li>
                  </ol>
                </div>

                {/* Step 6 */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Step 6: Click "Subscribe to Webhooks" Above</h3>
                  <p className="text-sm text-muted-foreground">
                    After your app is Live, click the subscribe button above to start receiving DM notifications.
                  </p>
                </div>

                {/* Webhook URL for Facebook */}
                <div className="rounded-md bg-blue-500/10 p-4 text-sm">
                  <p className="font-medium text-blue-500 mb-2">Quick Setup for Facebook Dashboard:</p>
                  <div className="space-y-1">
                    <p><strong>Callback URL:</strong> <code className="text-xs">{typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"}/api/webhook</code></p>
                    <p><strong>Verify Token:</strong> <code className="text-xs">instaai-webhook-verify-2024-secret</code></p>
                    <p><strong>Events to Subscribe:</strong> messages, messaging_postbacks</p>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      ) : (
        /* Settings Panel */
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
          {/* Basic Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Settings</CardTitle>
              <CardDescription>Configure your chatbot&apos;s identity</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Bot Name</label>
                <Input
                  placeholder="AI Assistant"
                  value={settings.botName}
                  onChange={(e) => setSettings((prev) => ({ ...prev, botName: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Welcome Message</label>
                <Input
                  placeholder="Hi! How can I help you today?"
                  value={settings.welcomeMessage}
                  onChange={(e) => setSettings((prev) => ({ ...prev, welcomeMessage: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Response Length</label>
                <div className="flex gap-2">
                  {responseLengths.map((length) => (
                    <Button
                      key={length.id}
                      variant={settings.responseLength === length.id ? "default" : "outline"}
                      className="flex-1"
                      onClick={() => setSettings((prev) => ({ ...prev, responseLength: length.id }))}
                    >
                      {length.name}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Personality */}
          <Card>
            <CardHeader>
              <CardTitle>Personality</CardTitle>
              <CardDescription>Choose how your chatbot behaves</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Personality Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {personalities.map((p) => (
                    <Button
                      key={p.id}
                      variant={settings.personality === p.id ? "default" : "outline"}
                      className="h-auto flex-col items-start p-3"
                      onClick={() => setSettings((prev) => ({ ...prev, personality: p.id }))}
                    >
                      <div className="flex items-center gap-2">
                        <span>{p.emoji}</span>
                        <span className="font-medium">{p.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{p.description}</span>
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Mood</label>
                <div className="flex flex-wrap gap-2">
                  {moods.map((mood) => (
                    <Button
                      key={mood}
                      variant={settings.mood === mood.toLowerCase() ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSettings((prev) => ({ ...prev, mood: mood.toLowerCase() }))}
                    >
                      {mood}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Advanced Settings */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Advanced Settings</CardTitle>
              <CardDescription>Fine-tune your chatbot&apos;s behavior</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Humor Level</label>
                    <span className="text-sm text-muted-foreground">{settings.humorLevel}/10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={settings.humorLevel}
                    onChange={(e) => setSettings((prev) => ({ ...prev, humorLevel: parseInt(e.target.value) }))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Serious</span>
                    <span>Comedy</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Intelligence</label>
                    <span className="text-sm text-muted-foreground">{settings.intelligence}/10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={settings.intelligence}
                    onChange={(e) => setSettings((prev) => ({ ...prev, intelligence: parseInt(e.target.value) }))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Simple</span>
                    <span>Expert</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Custom Instructions (Optional)</label>
                <textarea
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  rows={3}
                  placeholder="e.g., Always mention our website, never discuss pricing directly, use emojis frequently..."
                  value={settings.customInstructions}
                  onChange={(e) => setSettings((prev) => ({ ...prev, customInstructions: e.target.value }))}
                />
              </div>

              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <Button onClick={saveSettings} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Settings
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
