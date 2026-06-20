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
import { Image, Sparkles, Loader2 } from "lucide-react";

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

export default function PostGeneratorPage() {
  const [selectedTheme, setSelectedTheme] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("");
  const [selectedMood, setSelectedMood] = useState("");
  const [customInput, setCustomInput] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [generated, setGenerated] = useState(false);
  const [result, setResult] = useState<{
    caption: string;
    hashtags: string[];
    imagePrompt: string;
  } | null>(null);

  const handleGenerate = async () => {
    if (!selectedTheme) return;
    setGenerating(true);
    setError("");

    try {
      const res = await fetch("/api/ai/generate-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          theme: selectedTheme,
          style: selectedStyle,
          mood: selectedMood,
          customInput,
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
              Customize your post generation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Theme</label>
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
              disabled={generating || !selectedTheme}
            >
              {generating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating with AI...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Post
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>
              Your AI-generated post will appear here
            </CardDescription>
          </CardHeader>
          <CardContent>
            {generated && result ? (
              <div className="space-y-4">
                <div className="aspect-square overflow-hidden rounded-lg bg-muted">
                  <img
                    src={`https://picsum.photos/seed/${encodeURIComponent(selectedTheme)}/600/600`}
                    alt="Generated post"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-sm">{result.caption}</p>
                  <p className="text-sm text-primary">
                    {result.hashtags
                      .map((tag) => (tag.startsWith("#") ? tag : `#${tag}`))
                      .join(" ")}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1">Post Now</Button>
                  <Button variant="outline" className="flex-1">
                    Schedule
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `${result.caption}\n\n${result.hashtags.map((t) => (t.startsWith("#") ? t : `#${t}`)).join(" ")}`
                      );
                    }}
                  >
                    Copy
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex h-[400px] items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Image className="mx-auto h-12 w-12 opacity-50" />
                  <p className="mt-2">
                    Select a theme and click Generate to create a post
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
