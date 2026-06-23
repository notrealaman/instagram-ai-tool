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
import {
  Loader2,
  Copy,
  Check,
  FileText,
  Sparkles,
  AlertCircle,
} from "lucide-react";

interface TranscriptionResult {
  transcription: string;
  summary: string;
  videoSize: string;
}

export default function TranscribePage() {
  const [inputValue, setInputValue] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [transcribing, setTranscribing] = useState(false);
  const [result, setResult] = useState<TranscriptionResult | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<"transcription" | "summary" | null>(null);

  const handleTranscribe = async () => {
    if (!inputValue) return;
    setTranscribing(true);
    setError("");
    setResult(null);

    try {
      const trimmed = inputValue.trim();

      // Auto-detect: numeric ID, Instagram URL, or shortcode
      const isNumericId = /^\d+$/.test(trimmed);
      const isInstagramUrl = /instagram\.com\/(?:p|reel)\//.test(trimmed);

      const body: Record<string, string> = {
        prompt: customPrompt || undefined,
      };

      if (isNumericId || isInstagramUrl) {
        body.postId = trimmed;
      } else {
        body.videoUrl = trimmed;
      }

      const res = await fetch("/api/ai/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to transcribe");
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setTranscribing(false);
    }
  };

  const handleCopy = (text: string, type: "transcription" | "summary") => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Video Transcription
          </CardTitle>
          <CardDescription>
            Transcribe audio from Instagram videos to English text
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Paste Instagram URL, Post ID, or Reel link..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={transcribing}
              onKeyDown={(e) => e.key === "Enter" && handleTranscribe()}
            />
            <Button
              onClick={handleTranscribe}
              disabled={transcribing || !inputValue}
            >
              {transcribing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Transcribe"
              )}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Supports: Instagram post/reel URLs, numeric post IDs, or shortcodes. 
            We automatically fetch the video and transcribe it.
          </p>

          <div className="space-y-2">
            <label className="text-sm font-medium">Custom Instructions (Optional)</label>
            <Input
              placeholder="e.g., Summarize the key points..."
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              disabled={transcribing}
            />
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="p-4">
            <div className="flex items-start gap-2 text-destructive">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transcribing state */}
      {transcribing && !result && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-lg font-medium">Transcribing video...</p>
            <p className="text-sm text-muted-foreground mt-1">
              This may take a few minutes depending on video length
            </p>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4">
          <Card className="border-emerald-200 dark:border-emerald-800">
            <CardContent className="p-4">
              <span className="text-sm text-emerald-600 dark:text-emerald-400">
                Transcription complete — {result.videoSize}
              </span>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Sparkles className="h-5 w-5 text-primary" />
                  AI Summary
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(result.summary, "summary")}
                >
                  {copied === "summary" ? (
                    <Check className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="whitespace-pre-wrap text-sm">{result.summary}</div>
            </CardContent>
          </Card>

          {/* Full Transcription */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-5 w-5 text-primary" />
                  Full Transcription
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(result.transcription, "transcription")}
                >
                  {copied === "transcription" ? (
                    <Check className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="whitespace-pre-wrap text-sm max-h-[500px] overflow-y-auto">
                {result.transcription}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
