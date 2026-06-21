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
  Calendar,
  Sparkles,
  Loader2,
  Download,
  Copy,
  Check,
  RefreshCw,
} from "lucide-react";

const occasions = [
  { id: "new-year", name: "New Year", emoji: "🎉", category: "holiday" },
  { id: "valentines", name: "Valentine's Day", emoji: "❤️", category: "holiday" },
  { id: "easter", name: "Easter", emoji: "🐰", category: "holiday" },
  { id: "independence", name: "Independence Day", emoji: "🇺🇸", category: "holiday" },
  { id: "halloween", name: "Halloween", emoji: "🎃", category: "holiday" },
  { id: "thanksgiving", name: "Thanksgiving", emoji: "🦃", category: "holiday" },
  { id: "christmas", name: "Christmas", emoji: "🎄", category: "holiday" },
  { id: "graduation", name: "Graduation", emoji: "🎓", category: "milestone" },
  { id: "birthday", name: "Birthday", emoji: "🎂", category: "milestone" },
  { id: "anniversary", name: "Anniversary", emoji: "🥂", category: "milestone" },
  { id: "black-friday", name: "Black Friday", emoji: "🛍️", category: "sales" },
  { id: "cyber-monday", name: "Cyber Monday", emoji: "💻", category: "sales" },
  { id: "summer", name: "Summer", emoji: "☀️", category: "seasonal" },
  { id: "winter", name: "Winter", emoji: "❄️", category: "seasonal" },
  { id: "spring", name: "Spring", emoji: "🌸", category: "seasonal" },
  { id: "fall", name: "Fall", emoji: "🍂", category: "seasonal" },
];

const audienceTypes = [
  "General Audience",
  "Business Professionals",
  "Young Adults",
  "Parents",
  "Fitness Enthusiasts",
  "Foodies",
  "Tech Savvy",
  "Fashion Lovers",
];

const imageSizes = [
  { id: "square", label: "1:1", name: "Square" },
  { id: "portrait", label: "4:5", name: "Portrait" },
  { id: "landscape", label: "16:9", name: "Landscape" },
  { id: "story", label: "9:16", name: "Story" },
];

export default function OccasionalPostPage() {
  const [selectedOccasion, setSelectedOccasion] = useState("");
  const [customOccasion, setCustomOccasion] = useState("");
  const [brandName, setBrandName] = useState("");
  const [selectedAudience, setSelectedAudience] = useState("");
  const [postDate, setPostDate] = useState("");
  const [selectedImageSize, setSelectedImageSize] = useState("square");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [generated, setGenerated] = useState(false);
  const [copied, setCopied] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [result, setResult] = useState<{
    caption: string;
    hashtags: string[];
    imagePrompt: string;
    imageUrl: string;
    occasion: string;
    postDate: string | null;
  } | null>(null);

  const categories = Array.from(new Set(occasions.map((o) => o.category)));

  const handleGenerate = async () => {
    const occasionName = selectedOccasion
      ? occasions.find((o) => o.id === selectedOccasion)?.name
      : customOccasion;

    if (!occasionName) return;

    setGenerating(true);
    setError("");

    try {
      const res = await fetch("/api/ai/generate-occasional-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          occasion: occasionName,
          brandName: brandName || undefined,
          audienceType: selectedAudience || undefined,
          postDate: postDate || undefined,
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
      setError(err instanceof Error ? err.message : "Something went wrong");
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
        setResult((prev) => (prev ? { ...prev, imageUrl: data.url } : null));
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
      a.download = `instaai-${result.occasion.replace(/\s+/g, "-").toLowerCase()}-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      window.open(result.imageUrl, "_blank");
    }
  };

  const selectedOccasionData = occasions.find((o) => o.id === selectedOccasion);

  return (
    <div className="space-y-6">
      {/* Occasion Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Select Occasion
          </CardTitle>
          <CardDescription>
            Choose a holiday, event, or create a custom occasion
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {categories.map((category) => (
            <div key={category} className="space-y-3">
              <h3 className="text-sm font-medium capitalize">{category}</h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {occasions
                  .filter((o) => o.category === category)
                  .map((occasion) => (
                    <Button
                      key={occasion.id}
                      variant={
                        selectedOccasion === occasion.id ? "default" : "outline"
                      }
                      className="h-auto flex-col gap-2 p-4"
                      onClick={() => {
                        setSelectedOccasion(occasion.id);
                        setCustomOccasion("");
                      }}
                    >
                      <span className="text-2xl">{occasion.emoji}</span>
                      <span className="text-xs">{occasion.name}</span>
                    </Button>
                  ))}
              </div>
            </div>
          ))}

          <div className="space-y-2">
            <label className="text-sm font-medium">Custom Occasion</label>
            <Input
              placeholder="e.g., Product Launch, Company Anniversary, Grand Opening..."
              value={customOccasion}
              onChange={(e) => {
                setCustomOccasion(e.target.value);
                setSelectedOccasion("");
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Post Settings</CardTitle>
          <CardDescription>Customize your occasional post</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Brand/Company Name (Optional)</label>
              <Input
                placeholder="Your brand name"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Target Audience (Optional)</label>
              <div className="flex flex-wrap gap-2">
                {audienceTypes.map((audience) => (
                  <Button
                    key={audience}
                    variant={selectedAudience === audience ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedAudience(audience)}
                  >
                    {audience}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Schedule Date (Optional)</label>
              <Input
                type="date"
                value={postDate}
                onChange={(e) => setPostDate(e.target.value)}
              />
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
                    <span className="text-lg font-bold">{size.label}</span>
                    <span className="text-xs">{size.name}</span>
                  </Button>
                ))}
              </div>
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
            disabled={generating || (!selectedOccasion && !customOccasion)}
          >
            {generating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Occasional Post...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Occasional Post
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Preview */}
      {generating && (
        <Card>
          <CardContent className="flex h-[400px] items-center justify-center">
            <div className="text-center">
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-muted-foreground" />
              <p className="mt-4 text-sm text-muted-foreground">
                Creating your occasional post...
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {generated && result && !generating && (
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedOccasionData?.emoji}{" "}
              {selectedOccasionData?.name || customOccasion} Post
            </CardTitle>
            <CardDescription>
              {postDate
                ? `Scheduled for ${new Date(postDate).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}`
                : "Ready to post"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Image */}
            <div className="relative overflow-hidden rounded-lg bg-muted">
              {generatingImage ? (
                <div className="flex aspect-square items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <img
                  src={result.imageUrl}
                  alt={`${result.occasion} post`}
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

            {/* Image Prompt */}
            <details className="rounded-lg border p-3">
              <summary className="cursor-pointer text-sm font-medium text-muted-foreground">
                Image Prompt Used
              </summary>
              <p className="mt-2 text-xs text-muted-foreground">
                {result.imagePrompt}
              </p>
            </details>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
