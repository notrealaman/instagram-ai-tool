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
  Sparkles,
  Loader2,
  Copy,
  Check,
  Clock,
  Trash2,
  RefreshCw,
  Hash,
  Type,
} from "lucide-react";

const tones = [
  "Professional",
  "Casual",
  "Humorous",
  "Inspirational",
  "Motivational",
  "Luxurious",
  "Friendly",
  "Authoritative",
];

const categories = [
  "Business",
  "Lifestyle",
  "Food & Recipe",
  "Travel",
  "Fitness",
  "Fashion",
  "Technology",
  "Education",
  "Health & Wellness",
  "Art & Design",
];

interface Caption {
  text: string;
  hashtags: string[];
  characterCount: number;
  seoScore: number;
  style: string;
}

interface CaptionHistory {
  id: string;
  topic: string;
  tone: string | null;
  category: string | null;
  captions: Caption[];
  createdAt: string;
}

export default function CaptionGeneratorPage() {
  const [topic, setTopic] = useState("");
  const [selectedTone, setSelectedTone] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [keywords, setKeywords] = useState("");
  const [includeEmojis, setIncludeEmojis] = useState(true);
  const [includeCTA, setIncludeCTA] = useState(true);
  const [includeHashtags, setIncludeHashtags] = useState(true);
  const [captionLength, setCaptionLength] = useState("medium");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [generated, setGenerated] = useState(false);
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"generator" | "history">("generator");
  const [history, setHistory] = useState<CaptionHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedCaptionIndex, setSelectedCaptionIndex] = useState<number | null>(null);

  useEffect(() => {
    if (activeTab === "history") {
      fetchHistory();
    }
  }, [activeTab]);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch("/api/captions?limit=20");
      if (res.ok) {
        const data = await res.json();
        setHistory(data.captions);
      }
    } catch {
      console.error("Failed to fetch history");
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleGenerate = async () => {
    if (!topic) return;
    setGenerating(true);
    setError("");
    setSelectedCaptionIndex(null);

    try {
      const res = await fetch("/api/ai/generate-caption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          tone: selectedTone,
          category: selectedCategory,
          keywords,
          includeEmojis,
          includeCTA,
          includeHashtags,
          captionLength,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate");
      }

      setCaptions(data.captions);
      setGenerated(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = (index: number, type: "all" | "text" | "hashtags") => {
    const caption = captions[index];
    let textToCopy = "";

    if (type === "all") {
      textToCopy = caption.text;
      if (includeHashtags && caption.hashtags.length > 0) {
        textToCopy += "\n\n" + caption.hashtags.map((t) => (t.startsWith("#") ? t : `#${t}`)).join(" ");
      }
    } else if (type === "text") {
      textToCopy = caption.text;
    } else {
      textToCopy = caption.hashtags.map((t) => (t.startsWith("#") ? t : `#${t}`)).join(" ");
    }

    navigator.clipboard.writeText(textToCopy);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/captions?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setHistory(history.filter((h) => h.id !== id));
      }
    } catch {
      console.error("Failed to delete");
    }
  };

  const loadFromHistory = (item: CaptionHistory) => {
    setTopic(item.topic);
    setSelectedTone(item.tone || "");
    setSelectedCategory(item.category || "");
    setCaptions(item.captions);
    setGenerated(true);
    setActiveTab("generator");
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Tab Header */}
      <div className="flex gap-2">
        <Button
          variant={activeTab === "generator" ? "default" : "outline"}
          onClick={() => setActiveTab("generator")}
        >
          <Sparkles className="mr-2 h-4 w-4" />
          Generator
        </Button>
        <Button
          variant={activeTab === "history" ? "default" : "outline"}
          onClick={() => setActiveTab("history")}
        >
          <Clock className="mr-2 h-4 w-4" />
          History
        </Button>
      </div>

      {activeTab === "generator" ? (
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
          {/* Settings Panel */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Caption Settings
                </CardTitle>
                <CardDescription>
                  Customize your SEO-friendly caption
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Topic / Theme</label>
                  <Input
                    placeholder="e.g., Social media marketing tips..."
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                  />
                  {topic && (
                    <p className="text-xs text-muted-foreground">
                      <Type className="inline h-3 w-3 mr-1" />
                      {topic.length} characters
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Tone</label>
                  <div className="flex flex-wrap gap-2">
                    {tones.map((tone) => (
                      <Button
                        key={tone}
                        variant={selectedTone === tone ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedTone(tone)}
                      >
                        {tone}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((category) => (
                      <Button
                        key={category}
                        variant={selectedCategory === category ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedCategory(category)}
                      >
                        {category}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Keywords (comma-separated)</label>
                  <Input
                    placeholder="e.g., marketing, growth, tips..."
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Caption Length</label>
                  <div className="flex gap-2">
                    {["short", "medium", "long"].map((length) => (
                      <Button
                        key={length}
                        variant={captionLength === length ? "default" : "outline"}
                        className="flex-1 capitalize"
                        onClick={() => setCaptionLength(length)}
                      >
                        {length}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Include</label>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={includeEmojis ? "default" : "outline"}
                      size="sm"
                      onClick={() => setIncludeEmojis(!includeEmojis)}
                    >
                      Emojis
                    </Button>
                    <Button
                      variant={includeCTA ? "default" : "outline"}
                      size="sm"
                      onClick={() => setIncludeCTA(!includeCTA)}
                    >
                      CTA
                    </Button>
                    <Button
                      variant={includeHashtags ? "default" : "outline"}
                      size="sm"
                      onClick={() => setIncludeHashtags(!includeHashtags)}
                    >
                      Hashtags
                    </Button>
                  </div>
                </div>

                {error && (
                  <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                    {error}
                  </div>
                )}

                <Button
                  className="w-full"
                  onClick={handleGenerate}
                  disabled={generating || !topic}
                >
                  {generating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating with AI...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Caption
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Generated Captions</CardTitle>
                <CardDescription>
                  {generated
                    ? "Select and copy your preferred caption"
                    : "Configure settings and click Generate"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {generated && captions.length > 0 ? (
                  <div className="space-y-4">
                    {captions.map((caption, index) => (
                      <div
                        key={index}
                        className={`rounded-lg border p-4 transition-colors ${
                          selectedCaptionIndex === index
                            ? "border-primary bg-primary/5"
                            : "hover:bg-muted/50"
                        }`}
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-muted-foreground">
                              Caption {index + 1}
                            </span>
                            <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                              {caption.style}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Type className="h-3 w-3" />
                              {caption.characterCount || caption.text.length} chars
                            </span>
                            <span
                              className={`rounded-full px-2 py-1 text-xs font-medium ${
                                caption.seoScore >= 90
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                  : caption.seoScore >= 80
                                  ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                                  : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                              }`}
                            >
                              SEO: {caption.seoScore}
                            </span>
                          </div>
                        </div>

                        <p className="whitespace-pre-line text-sm">{caption.text}</p>

                        {includeHashtags && caption.hashtags && caption.hashtags.length > 0 && (
                          <div className="mt-3 flex items-start gap-1">
                            <Hash className="mt-0.5 h-3 w-3 text-muted-foreground" />
                            <p className="text-sm text-primary">
                              {caption.hashtags
                                .map((tag) => (tag.startsWith("#") ? tag : `#${tag}`))
                                .join(" ")}
                            </p>
                          </div>
                        )}

                        <div className="mt-3 flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopy(index, "all")}
                          >
                            {copiedIndex === index ? (
                              <Check className="mr-1 h-3 w-3 text-emerald-500" />
                            ) : (
                              <Copy className="mr-1 h-3 w-3" />
                            )}
                            Copy All
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopy(index, "text")}
                          >
                            Text Only
                          </Button>
                          {includeHashtags && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCopy(index, "hashtags")}
                            >
                              Hashtags Only
                            </Button>
                          )}
                          <Button
                            variant={selectedCaptionIndex === index ? "default" : "outline"}
                            size="sm"
                            onClick={() =>
                              setSelectedCaptionIndex(
                                selectedCaptionIndex === index ? null : index
                              )
                            }
                          >
                            {selectedCaptionIndex === index ? "Selected" : "Select"}
                          </Button>
                        </div>
                      </div>
                    ))}

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={handleGenerate}
                        disabled={generating}
                      >
                        {generating ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="mr-2 h-4 w-4" />
                        )}
                        Generate More
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex h-[400px] items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <Sparkles className="mx-auto h-12 w-12 opacity-50" />
                      <p className="mt-2">
                        Enter a topic and click Generate to create captions
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        /* History Tab */
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Caption History
            </CardTitle>
            <CardDescription>Your previously generated captions</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingHistory ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : history.length > 0 ? (
              <div className="space-y-4">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-lg border p-4 transition-colors hover:bg-muted/50"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.topic}</span>
                        {item.tone && (
                          <span className="rounded-full bg-secondary px-2 py-1 text-xs">
                            {item.tone}
                          </span>
                        )}
                        {item.category && (
                          <span className="rounded-full bg-secondary px-2 py-1 text-xs">
                            {item.category}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {formatDate(item.createdAt)}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {item.captions.slice(0, 1).map((caption, idx) => (
                        <p key={idx} className="line-clamp-2 text-sm text-muted-foreground">
                          {caption.text}
                        </p>
                      ))}
                    </div>

                    <div className="mt-3 flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => loadFromHistory(item)}
                      >
                        <RefreshCw className="mr-1 h-3 w-3" />
                        Load
                      </Button>
                      <span className="text-xs text-muted-foreground self-center">
                        {item.captions.length} captions generated
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Clock className="mx-auto h-8 w-8 opacity-50" />
                  <p className="mt-2">No caption history yet</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
