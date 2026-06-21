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
  Image,
  Sparkles,
  Loader2,
  Download,
  Copy,
  Check,
  RefreshCw,
} from "lucide-react";

const themes = [
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

const styles = [
  "Modern",
  "Minimalist",
  "Bold",
  "Vintage",
  "Neon",
  "Pastel",
  "Dark",
  "Colorful",
];

const moods = [
  "Professional",
  "Casual",
  "Playful",
  "Inspirational",
  "Motivational",
  "Luxurious",
  "Energetic",
  "Calm",
];

const imageSizes = [
  { id: "square", label: "1:1", name: "Square", icon: "□" },
  { id: "portrait", label: "4:5", name: "Portrait", icon: "▮" },
  { id: "landscape", label: "16:9", name: "Landscape", icon: "▬" },
  { id: "story", label: "9:16", name: "Story", icon: "▯" },
];

export default function PostGeneratorPage() {
  const [selectedTheme, setSelectedTheme] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("");
  const [selectedMood, setSelectedMood] = useState("");
  const [selectedImageSize, setSelectedImageSize] = useState("square");
  const [postTitle, setPostTitle] = useState("");
  const [customInput, setCustomInput] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [generated, setGenerated] = useState(false);
  const [result, setResult] = useState<{
    caption: string;
    hashtags: string[];
    imagePrompt: string;
    imageUrl: string;
    imageSize: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);

  const handleGenerate = async () => {
    if (!selectedTheme) return;
    setGenerating(true);
    setError("");

    try {
      const res = await fetch("/api/ai/generate-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: postTitle,
          theme: selectedTheme,
          style: selectedStyle,
          mood: selectedMood,
          customInput,
          imageSize: selectedImageSize,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate");
      }

      setResult(data);
      setGenerated(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setGenerating(false);
    }
  };

  const handleRegenerateImage = async () => {
    if (!result?.imagePrompt) return;
    setGeneratingImage(true);

    try {
      const res = await fetch("/api/ai/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: result.imagePrompt,
          style: "instagram",
          model: "flux",
        }),
      });

      const data = await res.json();
      if (res.ok && data.url) {
        setResult((prev) => prev ? { ...prev, imageUrl: data.url } : null);
      }
    } catch {
      console.error("Failed to regenerate image");
    } finally {
      setGeneratingImage(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    const text = `${result.caption}\n\n${result.hashtags
      .map((t) => (t.startsWith("#") ? t : `#${t}`))
      .join(" ")}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async () => {
    if (!result?.imageUrl) return;

    try {
      const response = await fetch(result.imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `instaai-post-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      window.open(result.imageUrl, "_blank");
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="h-5 w-5" />
              Post Settings
            </CardTitle>
            <CardDescription>
              Customize your Instagram post
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Post Title / Topic *</label>
              <Input
                placeholder="e.g., 5 tips for growing on Instagram..."
                value={postTitle}
                onChange={(e) => setPostTitle(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Enter the main topic or title for your post
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Theme *</label>
              <div className="flex flex-wrap gap-2">
                {themes.map((theme) => (
                  <Button
                    key={theme}
                    variant={selectedTheme === theme ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedTheme(theme)}
                  >
                    {theme}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Style</label>
              <div className="flex flex-wrap gap-2">
                {styles.map((style) => (
                  <Button
                    key={style}
                    variant={selectedStyle === style ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedStyle(style)}
                  >
                    {style}
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
                    variant={selectedMood === mood ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedMood(mood)}
                  >
                    {mood}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Image Size</label>
              <div className="grid grid-cols-4 gap-2">
                {imageSizes.map((size) => (
                  <Button
                    key={size.id}
                    variant={selectedImageSize === size.id ? "default" : "outline"}
                    className="flex flex-col h-auto py-2"
                    onClick={() => setSelectedImageSize(size.id)}
                  >
                    <span className="text-lg">{size.icon}</span>
                    <span className="text-xs">{size.label}</span>
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Additional Details (Optional)
              </label>
              <Input
                placeholder="e.g., product launch, team photo..."
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
              />
            </div>

            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button
              className="w-full"
              onClick={handleGenerate}
              disabled={generating || !selectedTheme || !postTitle}
            >
              {generating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Post & Image...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Complete Post
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Post Preview</CardTitle>
            <CardDescription>
              {generated
                ? "Your AI-generated Instagram post"
                : "Select a theme and click Generate"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {generating ? (
              <div className="flex h-[500px] items-center justify-center">
                <div className="text-center">
                  <Loader2 className="mx-auto h-12 w-12 animate-spin text-muted-foreground" />
                  <p className="mt-4 text-sm text-muted-foreground">
                    Creating your post and image...
                  </p>
                </div>
              </div>
            ) : generated && result ? (
              <div className="space-y-4">
                {/* Image */}
                <div className="relative overflow-hidden rounded-lg bg-muted">
                  {generatingImage ? (
                    <div className="flex aspect-square items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <img
                      src={result.imageUrl}
                      alt="Generated post"
                      className="w-full h-auto object-contain max-h-[500px]"
                    />
                  )}
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={handleRegenerateImage}
                    disabled={generatingImage}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>

                {/* Caption */}
                <div className="space-y-2">
                  <p className="text-sm whitespace-pre-wrap">{result.caption}</p>
                  <p className="text-sm text-primary">
                    {result.hashtags
                      .map((tag) => (tag.startsWith("#") ? tag : `#${tag}`))
                      .join(" ")}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button className="flex-1" onClick={handleCopy}>
                    {copied ? (
                      <Check className="mr-2 h-4 w-4 text-emerald-500" />
                    ) : (
                      <Copy className="mr-2 h-4 w-4" />
                    )}
                    {copied ? "Copied!" : "Copy Caption"}
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={handleDownload}>
                    <Download className="mr-2 h-4 w-4" />
                    Download Image
                  </Button>
                </div>

                {/* Image Prompt (collapsible) */}
                <details className="rounded-lg border p-3">
                  <summary className="cursor-pointer text-sm font-medium text-muted-foreground">
                    Image Prompt Used
                  </summary>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {result.imagePrompt}
                  </p>
                </details>
              </div>
            ) : (
              <div className="flex h-[500px] items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Image className="mx-auto h-12 w-12 opacity-50" />
                  <p className="mt-2">
                    Select a theme and click Generate to create a post
                  </p>
                  <p className="mt-1 text-xs">
                    AI will create both caption and image for you
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
