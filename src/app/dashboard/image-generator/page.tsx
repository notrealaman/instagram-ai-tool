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
  Image as ImageIcon,
  Loader2,
  Download,
  RefreshCw,
  Sparkles,
  Copy,
  Check,
} from "lucide-react";

interface ImageSize {
  name: string;
  width: number;
  height: number;
  description: string;
}

interface StylePreset {
  id: string;
  name: string;
  suffix: string;
}

interface ImageModel {
  id: string;
  name: string;
  description: string;
}

const PROMPT_SUGGESTIONS = [
  "A serene mountain lake at sunset with vibrant colors",
  "Modern minimalist workspace with a laptop and coffee",
  "Delicious avocado toast with poached eggs on wooden table",
  "Person jogging in a park during golden hour",
  "Stylish flat lay of fashion accessories on marble",
  "Tropical beach with crystal clear water and palm trees",
  "Cozy coffee shop interior with warm lighting",
  "Fresh smoothie bowls with colorful toppings",
];

export default function ImageGeneratorPage() {
  const [prompt, setPrompt] = useState("");
  const [selectedSize, setSelectedSize] = useState("square");
  const [selectedStyle, setSelectedStyle] = useState("instagram");
  const [selectedModel, setSelectedModel] = useState("flux");
  const [generating, setGenerating] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [sizes, setSizes] = useState<ImageSize[]>([]);
  const [styles, setStyles] = useState<StylePreset[]>([]);
  const [models, setModels] = useState<ImageModel[]>([]);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<Array<{ url: string; prompt: string; timestamp: Date }>>([]);

  useEffect(() => {
    fetchOptions();
  }, []);

  const fetchOptions = async () => {
    try {
      const res = await fetch("/api/ai/generate-image");
      if (res.ok) {
        const data = await res.json();
        setSizes(data.sizes);
        setStyles(data.styles);
        setModels(data.models);
      }
    } catch {
      console.error("Failed to fetch options");
    }
  };

  const handleGenerate = async () => {
    if (!prompt) return;
    setGenerating(true);
    setError("");

    try {
      const size = sizes.find((s) => s.name.toLowerCase().replace(/\s+/g, "") === selectedSize) || sizes[0];

      const res = await fetch("/api/ai/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          width: size?.width || 1080,
          height: size?.height || 1080,
          style: selectedStyle,
          model: selectedModel,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate image");
      }

      setGeneratedUrl(data.url);
      setHistory((prev) => [
        { url: data.url, prompt, timestamp: new Date() },
        ...prev.slice(0, 9),
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!generatedUrl) return;

    try {
      const response = await fetch(generatedUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `instaai-image-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      // Fallback: open in new tab
      window.open(generatedUrl, "_blank");
    }
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRandomPrompt = () => {
    const randomIndex = Math.floor(Math.random() * PROMPT_SUGGESTIONS.length);
    setPrompt(PROMPT_SUGGESTIONS[randomIndex]);
  };

  const sizeOptions = [
    { id: "square", label: "1:1", name: "Square Post" },
    { id: "portrait", label: "4:5", name: "Portrait" },
    { id: "landscape", label: "16:9", name: "Landscape" },
    { id: "story", label: "9:16", name: "Story/Reel" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Settings Panel */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Image Settings
              </CardTitle>
              <CardDescription>
                Create stunning Instagram visuals with AI
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Prompt */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Image Prompt</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Describe the image you want to create..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleRandomPrompt}
                    title="Random prompt"
                  >
                    <Sparkles className="h-4 w-4" />
                  </Button>
                </div>
                {prompt && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={handleCopyPrompt}
                  >
                    {copied ? (
                      <Check className="mr-1 h-3 w-3 text-emerald-500" />
                    ) : (
                      <Copy className="mr-1 h-3 w-3" />
                    )}
                    Copy prompt
                  </Button>
                )}
              </div>

              {/* Aspect Ratio */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Aspect Ratio</label>
                <div className="grid grid-cols-4 gap-2">
                  {sizeOptions.map((size) => (
                    <Button
                      key={size.id}
                      variant={selectedSize === size.id ? "default" : "outline"}
                      className="flex flex-col h-auto py-2"
                      onClick={() => setSelectedSize(size.id)}
                    >
                      <span className="text-lg font-bold">{size.label}</span>
                      <span className="text-xs">{size.name}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Style */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Style</label>
                <div className="flex flex-wrap gap-2">
                  {styles.map((style) => (
                    <Button
                      key={style.id}
                      variant={selectedStyle === style.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedStyle(style.id)}
                    >
                      {style.name}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Model */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Model</label>
                <div className="flex flex-wrap gap-2">
                  {models.map((model) => (
                    <Button
                      key={model.id}
                      variant={selectedModel === model.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedModel(model.id)}
                      title={model.description}
                    >
                      {model.name}
                    </Button>
                  ))}
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
                disabled={generating || !prompt}
              >
                {generating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <ImageIcon className="mr-2 h-4 w-4" />
                    Generate Image
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Preview Panel */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Generated Image</CardTitle>
              <CardDescription>
                {generatedUrl
                  ? "Right-click to save, or use the download button"
                  : "Configure settings and click Generate"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {generating ? (
                <div className="flex h-[500px] items-center justify-center">
                  <div className="text-center">
                    <Loader2 className="mx-auto h-12 w-12 animate-spin text-muted-foreground" />
                    <p className="mt-4 text-sm text-muted-foreground">
                      Creating your image...
                    </p>
                  </div>
                </div>
              ) : generatedUrl ? (
                <div className="space-y-4">
                  <div className="relative overflow-hidden rounded-lg border bg-muted">
                    <img
                      src={generatedUrl}
                      alt="Generated"
                      className="w-full h-auto object-contain max-h-[600px]"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button className="flex-1" onClick={handleDownload}>
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={handleGenerate}
                      disabled={generating}
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Regenerate
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex h-[500px] items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <ImageIcon className="mx-auto h-12 w-12 opacity-50" />
                    <p className="mt-2">
                      Enter a prompt and click Generate to create an image
                    </p>
                    <p className="mt-1 text-xs">
                      Free image generation powered by Pollinations.ai
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* History */}
      {history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Generations</CardTitle>
            <CardDescription>Your recently generated images</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {history.map((item, index) => (
                <button
                  key={index}
                  onClick={() => setGeneratedUrl(item.url)}
                  className="group relative overflow-hidden rounded-lg border bg-muted transition-all hover:ring-2 hover:ring-primary"
                >
                  <img
                    src={item.url}
                    alt={item.prompt}
                    className="aspect-square w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                  <div className="absolute bottom-0 left-0 right-0 p-2 text-white opacity-0 transition-opacity group-hover:opacity-100">
                    <p className="text-xs truncate">{item.prompt}</p>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
