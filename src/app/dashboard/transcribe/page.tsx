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
  Loader2,
  Video,
  Copy,
  Check,
  FileText,
  Sparkles,
  Clock,
  AlertCircle,
  Play,
  ExternalLink,
} from "lucide-react";

interface InstagramPost {
  id: string;
  caption: string;
  mediaType: string;
  mediaUrl: string;
  thumbnailUrl?: string;
  permalink: string;
  timestamp: string;
}

interface TranscriptionResult {
  transcription: string;
  summary: string;
  videoSize: string;
}

export default function TranscribePage() {
  const [videoUrl, setVideoUrl] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [posts, setPosts] = useState<InstagramPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<InstagramPost | null>(null);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [transcribing, setTranscribing] = useState(false);
  const [result, setResult] = useState<TranscriptionResult | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<"transcription" | "summary" | null>(null);
  const [activeTab, setActiveTab] = useState<"select" | "url">("select");

  useEffect(() => {
    fetchVideoPosts();
  }, []);

  const fetchVideoPosts = async () => {
    try {
      const res = await fetch("/api/instagram/all-posts");
      if (res.ok) {
        const data = await res.json();
        const videoPosts = data.posts.filter(
          (p: InstagramPost) => p.mediaType === "VIDEO" || p.mediaType === "CAROUSEL_ALBUM"
        );
        setPosts(videoPosts);
      }
    } catch {
      console.error("Failed to fetch posts");
    } finally {
      setLoadingPosts(false);
    }
  };

  const handleTranscribe = async (url: string) => {
    if (!url) return;
    setTranscribing(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/ai/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoUrl: url,
          prompt: customPrompt || undefined,
        }),
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

  const handlePostSelect = (post: InstagramPost) => {
    setSelectedPost(post);
    setVideoUrl(post.mediaUrl);
    handleTranscribe(post.mediaUrl);
  };

  const handleUrlSubmit = () => {
    if (!videoUrl) return;
    setSelectedPost(null);
    handleTranscribe(videoUrl);
  };

  const handleCopy = (text: string, type: "transcription" | "summary") => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2">
        <Button
          variant={activeTab === "select" ? "default" : "outline"}
          onClick={() => setActiveTab("select")}
        >
          <Video className="mr-2 h-4 w-4" />
          From My Posts
        </Button>
        <Button
          variant={activeTab === "url" ? "default" : "outline"}
          onClick={() => setActiveTab("url")}
        >
          <FileText className="mr-2 h-4 w-4" />
          Paste Video URL
        </Button>
      </div>

      {activeTab === "select" ? (
        /* Select from posts */
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5" />
              Your Video Posts
            </CardTitle>
            <CardDescription>
              Select a video post to transcribe its audio content
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingPosts ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : posts.length > 0 ? (
              <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {posts.map((post) => (
                  <button
                    key={post.id}
                    onClick={() => handlePostSelect(post)}
                    disabled={transcribing}
                    className={`flex items-start gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted/50 disabled:opacity-50 ${
                      selectedPost?.id === post.id ? "border-primary bg-primary/5" : ""
                    }`}
                  >
                    <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded bg-muted">
                      {(post.thumbnailUrl || post.mediaUrl) ? (
                        <img
                          src={post.thumbnailUrl || post.mediaUrl}
                          alt="Post"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Play className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm line-clamp-2">{post.caption || "No caption"}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(post.timestamp).toLocaleDateString()}
                      </p>
                      {selectedPost?.id === post.id && transcribing && (
                        <p className="text-xs text-primary mt-1 flex items-center gap-1">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Transcribing...
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Video className="mx-auto h-12 w-12 opacity-50 mb-2" />
                <p>No video posts found</p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        /* Paste URL */
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Transcribe Video URL
            </CardTitle>
            <CardDescription>
              Paste a direct video URL to transcribe its audio
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="https://... (direct video URL)"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                disabled={transcribing}
              />
              <Button
                onClick={handleUrlSubmit}
                disabled={transcribing || !videoUrl}
              >
                {transcribing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Transcribe"
                )}
              </Button>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Custom Prompt (Optional)</label>
              <Input
                placeholder="e.g., Focus on key points, translate to Spanish..."
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                disabled={transcribing}
              />
              <p className="text-xs text-muted-foreground">
                Customize how the AI transcribes the video
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <p className="text-sm">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Video Info */}
          {selectedPost && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded bg-muted">
                    <img
                      src={selectedPost.thumbnailUrl || selectedPost.mediaUrl}
                      alt="Video"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {selectedPost.caption || "No caption"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Video size: {result.videoSize}
                    </p>
                  </div>
                  <a
                    href={selectedPost.permalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border p-2 hover:bg-muted"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </CardContent>
            </Card>
          )}

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
              <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                {result.summary}
              </div>
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
              <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap max-h-[500px] overflow-y-auto">
                {result.transcription}
              </div>
            </CardContent>
          </Card>
        </div>
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
    </div>
  );
}
