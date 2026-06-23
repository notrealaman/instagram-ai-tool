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
  Download,
  ExternalLink,
  AlertCircle,
  Video,
  Heart,
  MessageCircle,
} from "lucide-react";

interface VideoInfo {
  videoUrl: string;
  thumbnailUrl: string;
  caption: string;
  permalink: string;
  timestamp: string;
  mediaType: string;
  videoCount: number;
}

export default function DownloadPage() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [error, setError] = useState("");

  const handleFetch = async () => {
    if (!input) return;
    setLoading(true);
    setError("");
    setVideoInfo(null);

    try {
      const res = await fetch("/api/instagram/download-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: input.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch video");
      setVideoInfo(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!videoInfo?.videoUrl) return;
    try {
      const res = await fetch(videoInfo.videoUrl);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `instagram-video-${Date.now()}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      window.open(videoInfo.videoUrl, "_blank");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Instagram Video Downloader
          </CardTitle>
          <CardDescription>
            Paste an Instagram reel or post URL to download the video
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Paste Instagram reel/post URL or Post ID..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              onKeyDown={(e) => e.key === "Enter" && handleFetch()}
            />
            <Button onClick={handleFetch} disabled={loading || !input}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Fetch"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Supports Instagram reels, posts, and carousel videos
          </p>
        </CardContent>
      </Card>

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

      {loading && !videoInfo && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-lg font-medium">Fetching video...</p>
          </CardContent>
        </Card>
      )}

      {videoInfo && (
        <Card>
          <CardContent className="p-4">
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
              {/* Video preview */}
              <div className="rounded-lg overflow-hidden bg-muted">
                {videoInfo.thumbnailUrl ? (
                  <img
                    src={videoInfo.thumbnailUrl}
                    alt="Video thumbnail"
                    className="w-full h-auto object-contain max-h-[400px]"
                  />
                ) : (
                  <div className="flex h-64 items-center justify-center text-muted-foreground">
                    <Video className="h-12 w-12 opacity-50" />
                  </div>
                )}
              </div>

              {/* Video info & actions */}
              <div className="space-y-4">
                <div>
                  <p className="text-sm line-clamp-3">
                    {videoInfo.caption || "No caption"}
                  </p>
                  {videoInfo.timestamp && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(videoInfo.timestamp).toLocaleString()}
                    </p>
                  )}
                </div>

                {videoInfo.mediaType === "CAROUSEL_ALBUM" && videoInfo.videoCount > 1 && (
                  <p className="text-sm text-muted-foreground">
                    This carousel has {videoInfo.videoCount} items. Downloading the first video.
                  </p>
                )}

                <div className="flex flex-col gap-2">
                  <Button onClick={handleDownload} className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    Download Video
                  </Button>
                  <a
                    href={videoInfo.permalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors w-full"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View on Instagram
                  </a>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
