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
import { Calendar, Sparkles, Loader2 } from "lucide-react";
import { mockOccasions } from "@/lib/mock-data";

export default function OccasionalPostPage() {
  const [selectedOccasion, setSelectedOccasion] = useState("");
  const [customOccasion, setCustomOccasion] = useState("");
  const [postDate, setPostDate] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  const categories = Array.from(new Set(mockOccasions.map((o) => o.category)));

  const handleGenerate = async () => {
    setGenerating(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setGenerating(false);
    setGenerated(true);
  };

  const selectedOccasionData = mockOccasions.find(
    (o) => o.id === selectedOccasion
  );

  return (
    <div className="space-y-6">
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
                {mockOccasions
                  .filter((o) => o.category === category)
                  .map((occasion) => (
                    <Button
                      key={occasion.id}
                      variant={
                        selectedOccasion === occasion.id ? "default" : "outline"
                      }
                      className="h-auto flex-col gap-2 p-4"
                      onClick={() => setSelectedOccasion(occasion.id)}
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
              placeholder="e.g., Product Launch, Company Anniversary..."
              value={customOccasion}
              onChange={(e) => {
                setCustomOccasion(e.target.value);
                setSelectedOccasion("");
              }}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Schedule Date</label>
              <Input
                type="date"
                value={postDate}
                onChange={(e) => setPostDate(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button
                className="w-full"
                onClick={handleGenerate}
                disabled={generating || (!selectedOccasion && !customOccasion)}
              >
                {generating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Occasional Post
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {generated && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Content</CardTitle>
            <CardDescription>
              {selectedOccasionData
                ? `${selectedOccasionData.emoji} ${selectedOccasionData.name}`
                : customOccasion}
              {postDate && ` - ${new Date(postDate).toLocaleDateString()}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="aspect-video overflow-hidden rounded-lg bg-muted">
              <img
                src={`https://picsum.photos/seed/${selectedOccasion || "custom"}/800/450`}
                alt="Generated occasion post"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="space-y-2">
              <p className="text-sm">
                🎉✨{" "}
                {selectedOccasionData
                  ? `Happy ${selectedOccasionData.name}! `
                  : `${customOccasion}! `}
                Celebrate this special moment with us! Whether you're
                {selectedOccasionData?.category === "holiday"
                  ? " gathering with loved ones"
                  : " making memories"}{" "}
                or reflecting on how far we've come, today is all about
                {selectedOccasionData?.category === "holiday"
                  ? " joy and gratitude"
                  : " celebrating milestones"}. Share your moments with
                us! 📸
              </p>
              <p className="text-sm text-primary">
                #{selectedOccasionData?.name?.replace(/\s+/g, "") || customOccasion.replace(/\s+/g, "")}{" "}
                #Celebration #SpecialDay #InstaAI #ContentCreator
              </p>
            </div>
            <div className="flex gap-2">
              <Button className="flex-1">Post Now</Button>
              <Button variant="outline" className="flex-1">
                Schedule for {postDate ? new Date(postDate).toLocaleDateString() : "Later"}
              </Button>
              <Button variant="outline">Copy</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
