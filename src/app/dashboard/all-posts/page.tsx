"use client";

import { useState, useEffect, useMemo } from "react";
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
  Heart,
  MessageCircle,
  TrendingUp,
  ExternalLink,
  Search,
  ArrowUpDown,
  Filter,
  Image,
  Video,
  Copy,
  BarChart3,
  Grid3X3,
  List,
} from "lucide-react";

interface Post {
  id: string;
  caption: string;
  mediaType: string;
  imageUrl: string;
  permalink: string;
  timestamp: string;
  likes: number;
  comments: number;
  engagement: number;
  childCount: number;
}

interface AllPostsData {
  profile: {
    username: string;
    followers: number;
    following: number;
    mediaCount: number;
    profilePicture: string;
  };
  summary: {
    totalPosts: number;
    totalLikes: number;
    totalComments: number;
    avgLikes: number;
    avgComments: number;
    avgEngagement: number;
  };
  posts: Post[];
}

type SortKey = "timestamp" | "likes" | "comments" | "engagement";
type SortDir = "asc" | "desc";
type ViewMode = "grid" | "list";

export default function AllPostsPage() {
  const [data, setData] = useState<AllPostsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("timestamp");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [filterType, setFilterType] = useState<string>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  useEffect(() => {
    fetchAllPosts();
  }, []);

  const fetchAllPosts = async () => {
    try {
      const res = await fetch("/api/instagram/all-posts");
      if (!res.ok) {
        const errData = await res.json();
        setError(errData.error || "Failed to fetch posts");
        return;
      }
      const postsData = await res.json();
      setData(postsData);
    } catch {
      setError("Failed to load posts data");
    } finally {
      setLoading(false);
    }
  };

  const filteredPosts = useMemo(() => {
    if (!data) return [];
    let posts = [...data.posts];

    // Filter by type
    if (filterType !== "all") {
      posts = posts.filter((p) => p.mediaType === filterType);
    }

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      posts = posts.filter(
        (p) =>
          p.caption.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q)
      );
    }

    // Sort
    posts.sort((a, b) => {
      let valA: number | string;
      let valB: number | string;
      if (sortKey === "timestamp") {
        valA = new Date(a.timestamp).getTime();
        valB = new Date(b.timestamp).getTime();
      } else if (sortKey === "likes") {
        valA = a.likes;
        valB = b.likes;
      } else if (sortKey === "comments") {
        valA = a.comments;
        valB = b.comments;
      } else {
        valA = a.engagement;
        valB = b.engagement;
      }
      if (sortDir === "asc") return valA > valB ? 1 : -1;
      return valA < valB ? 1 : -1;
    });

    return posts;
  }, [data, searchQuery, sortKey, sortDir, filterType]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const formatDate = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatFullDate = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getMediaTypeIcon = (type: string) => {
    switch (type) {
      case "VIDEO":
        return <Video className="h-4 w-4" />;
      case "CAROUSEL_ALBUM":
        return <Copy className="h-4 w-4" />;
      default:
        return <Image className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
          <p className="mt-4 text-sm text-muted-foreground">
            Loading all posts...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">
              Error Loading Posts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{error}</p>
            <Button className="mt-4" onClick={fetchAllPosts}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
        <Card className="stat-card">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Total Posts</div>
            <div className="text-2xl font-bold">{data.summary.totalPosts}</div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Total Likes</div>
            <div className="text-2xl font-bold">
              {data.summary.totalLikes.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Total Comments</div>
            <div className="text-2xl font-bold">
              {data.summary.totalComments.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Avg Likes</div>
            <div className="text-2xl font-bold">
              {data.summary.avgLikes.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Avg Comments</div>
            <div className="text-2xl font-bold">
              {data.summary.avgComments.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">
              Avg Engagement
            </div>
            <div className="text-2xl font-bold">
              {data.summary.avgEngagement}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search captions..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Filter by type */}
            <div className="flex gap-2">
              {[
                { value: "all", label: "All" },
                { value: "IMAGE", label: "Images" },
                { value: "VIDEO", label: "Videos" },
                { value: "CAROUSEL_ALBUM", label: "Carousels" },
              ].map((f) => (
                <Button
                  key={f.value}
                  variant={filterType === f.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterType(f.value)}
                >
                  {f.label}
                </Button>
              ))}
            </div>

            {/* View mode */}
            <div className="flex border rounded-lg overflow-hidden">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="icon"
                className="h-9 w-9 rounded-none"
                onClick={() => setViewMode("grid")}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="icon"
                className="h-9 w-9 rounded-none"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Sort buttons */}
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="text-xs text-muted-foreground self-center mr-1">
              Sort:
            </span>
            {[
              { key: "timestamp" as SortKey, label: "Date" },
              { key: "likes" as SortKey, label: "Likes" },
              { key: "comments" as SortKey, label: "Comments" },
              { key: "engagement" as SortKey, label: "Engagement" },
            ].map((s) => (
              <Button
                key={s.key}
                variant={sortKey === s.key ? "default" : "outline"}
                size="sm"
                onClick={() => toggleSort(s.key)}
              >
                {s.label}
                {sortKey === s.key && (
                  <ArrowUpDown className="ml-1 h-3 w-3" />
                )}
              </Button>
            ))}
            <span className="text-xs text-muted-foreground self-center ml-2">
              {filteredPosts.length} posts
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Posts Display */}
      {viewMode === "grid" ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPosts.map((post) => (
            <Card key={post.id} className="overflow-hidden stat-card">
              <div className="relative aspect-square bg-muted">
                <img
                  src={post.imageUrl}
                  alt={post.caption || "Post"}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2 flex gap-1">
                  <span className="flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-xs text-white">
                    {getMediaTypeIcon(post.mediaType)}
                    {post.mediaType === "CAROUSEL_ALBUM"
                      ? `${post.childCount} photos`
                      : post.mediaType}
                  </span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                  <div className="flex items-center gap-4 text-sm text-white">
                    <span className="flex items-center gap-1">
                      <Heart className="h-4 w-4" />{" "}
                      {post.likes.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="h-4 w-4" />{" "}
                      {post.comments.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-4 w-4" />{" "}
                      {post.engagement}%
                    </span>
                  </div>
                </div>
              </div>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1">
                  {formatFullDate(post.timestamp)}
                </p>
                <p className="text-sm line-clamp-2 mb-2">
                  {post.caption || "No caption"}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Heart className="h-3 w-3" /> {post.likes.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="h-3 w-3" />{" "}
                      {post.comments.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <BarChart3 className="h-3 w-3" /> {post.engagement}%
                    </span>
                  </div>
                  <a
                    href={post.permalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-md border p-1.5 hover:bg-muted transition-colors"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {filteredPosts.map((post) => (
                <div
                  key={post.id}
                  className="flex items-start gap-4 p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded bg-muted">
                    <img
                      src={post.imageUrl}
                      alt="Post"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        {getMediaTypeIcon(post.mediaType)}
                        {post.mediaType}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatFullDate(post.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm line-clamp-2 mb-2">
                      {post.caption || "No caption"}
                    </p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Heart className="h-4 w-4 text-red-500" />{" "}
                        {post.likes.toLocaleString()} likes
                      </span>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <MessageCircle className="h-4 w-4 text-blue-500" />{" "}
                        {post.comments.toLocaleString()} comments
                      </span>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <TrendingUp className="h-4 w-4 text-emerald-500" />{" "}
                        {post.engagement}% engagement
                      </span>
                    </div>
                  </div>
                  <a
                    href={post.permalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border p-2 hover:bg-muted transition-colors shrink-0"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {filteredPosts.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Search className="mb-4 h-12 w-12 opacity-50" />
            <p className="text-lg font-medium">No posts found</p>
            <p className="text-sm">Try adjusting your search or filters</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
