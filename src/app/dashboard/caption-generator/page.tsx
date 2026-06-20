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
import { Sparkles, Loader2, Copy, Check } from "lucide-react";

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
  seoScore: number;
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

  const handleGenerate = async () => {
    if (!topic) return;
    setGenerating(true);
    setError("");

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

  const handleCopy = (index: number) => {
    const caption = captions[index];
    navigator.clipboard.writeText(
      `${caption.text}\n\n${caption.hashtags.map((t) => (t.startsWith("#") ? t : `#${t}`)).join(" ")}`
    );
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
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
                    className="rounded-lg border p-4 transition-colors hover:bg-muted/50"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">
                        Caption Option {index + 1}
                      </span>
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ${
                            caption.seoScore >= 90
                              ? "bg-emerald-100 text-emerald-700"
                              : caption.seoScore >= 85
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-orange-100 text-orange-700"
                          }`}
                        >
                          SEO Score: {caption.seoScore}/100{" "}
                          {caption.seoScore >= 90 ? "⭐" : ""}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopy(index)}
                        >
                          {copiedIndex === index ? (
                            <Check className="h-4 w-4 text-emerald-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm">{caption.text}</p>
                    {includeHashtags && caption.hashtags && (
                      <p className="mt-2 text-sm text-primary">
                        {caption.hashtags
                          .map((tag) => (tag.startsWith("#") ? tag : `#${tag}`))
                          .join(" ")}
                      </p>
                    )}
                  </div>
                ))}

                <div className="rounded-lg border bg-muted/30 p-4">
                  <h4 className="mb-2 text-sm font-medium">SEO Analysis</h4>
                  <div className="grid gap-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Keyword density</span>
                      <span className="text-emerald-500">Good</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Readability</span>
                      <span className="text-emerald-500">Excellent</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Hashtag relevance</span>
                      <span className="text-emerald-500">High</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button className="flex-1">Save as Template</Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleGenerate}
                    disabled={generating}
                  >
                    {generating ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      "Generate More"
                    )}
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
  );
}
