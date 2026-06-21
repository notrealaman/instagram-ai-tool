"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Loader2,
  ExternalLink,
  Heart,
  MessageCircle,
  TrendingUp,
  Award,
  Target,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatNumber } from "@/lib/utils";

interface DashboardData {
  profile: {
    username: string;
    followers: number;
    following: number;
    mediaCount: number;
    profilePicture: string;
    biography: string;
  };
  stats: {
    totalLikes: number;
    totalComments: number;
    avgLikes: number;
    avgComments: number;
    engagementRate: number;
    totalPosts: number;
  };
  bestPost: {
    id: string;
    caption: string;
    likes: number;
    comments: number;
    mediaUrl: string;
    permalink: string;
    timestamp: string;
  } | null;
  topPosts: Array<{
    id: string;
    imageUrl: string;
    likes: number;
    comments: number;
    caption: string;
    mediaType: string;
    permalink: string;
  }>;
  recentPosts: Array<{
    id: string;
    caption: string;
    timestamp: string;
    likes: number;
    comments: number;
    mediaUrl: string;
    mediaType: string;
    permalink: string;
  }>;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch("/api/instagram/dashboard");
      if (!res.ok) {
        const errData = await res.json();
        setError(errData.error || "Failed to fetch data");
        return;
      }
      const dashboardData = await res.json();
      setData(dashboardData);
    } catch {
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
          <p className="mt-4 text-sm text-muted-foreground">Loading Instagram data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Data</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{error}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Make sure your Instagram account is connected in{" "}
              <a href="/dashboard/settings" className="text-primary hover:underline">
                Settings
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  const { profile, stats, bestPost, topPosts, recentPosts } = data;

  const statCards = [
    {
      title: "Followers",
      value: formatNumber(profile.followers),
      icon: Users,
    },
    {
      title: "Total Likes",
      value: formatNumber(stats.totalLikes),
      icon: Heart,
    },
    {
      title: "Total Comments",
      value: formatNumber(stats.totalComments),
      icon: MessageCircle,
    },
    {
      title: "Engagement Rate",
      value: `${stats.engagementRate}%`,
      icon: TrendingUp,
    },
  ];

  return (
    <div className="space-y-8">
      <Card className="stat-card">
        <CardContent className="flex items-center gap-4 p-4">
          {profile.profilePicture && (
            <img
              src={profile.profilePicture}
              alt={profile.username}
              className="h-16 w-16 rounded-full"
            />
          )}
          <div className="flex-1">
            <h2 className="text-xl font-bold">@{profile.username}</h2>
            {profile.biography && (
              <p className="text-sm text-muted-foreground line-clamp-2">{profile.biography}</p>
            )}
            <div className="mt-2 flex gap-4 text-sm">
              <span><strong>{formatNumber(profile.mediaCount)}</strong> posts</span>
              <span><strong>{formatNumber(profile.followers)}</strong> followers</span>
              <span><strong>{formatNumber(profile.following)}</strong> following</span>
            </div>
          </div>
          <a
            href={`https://instagram.com/${profile.username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border p-2 hover:bg-muted"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="stat-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Performance Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Avg Likes/Post</span>
                </div>
                <span className="font-bold">{formatNumber(stats.avgLikes)}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Avg Comments/Post</span>
                </div>
                <span className="font-bold">{formatNumber(stats.avgComments)}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Total Posts</span>
                </div>
                <span className="font-bold">{stats.totalPosts}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Engagement Rate</span>
                </div>
                <span className="font-bold">{stats.engagementRate}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Posts</CardTitle>
            <CardDescription>Your latest Instagram content</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentPosts.length > 0 ? (
                recentPosts.map((post) => (
                  <a
                    key={post.id}
                    href={post.permalink || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-4 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded bg-muted">
                      {post.mediaUrl ? (
                        <img
                          src={post.mediaUrl}
                          alt="Post"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <span className="text-xs text-muted-foreground">
                            {post.mediaType === "VIDEO" ? "VIDEO" : "POST"}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{post.caption}</p>
                      <div className="mt-1 flex gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Heart className="h-3 w-3" /> {formatNumber(post.likes)}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="h-3 w-3" /> {post.comments}
                        </span>
                        <span>
                          {new Date(post.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </a>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No posts found. Create some content on Instagram first!
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {bestPost && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-500" />
              Best Performing Post
            </CardTitle>
            <CardDescription>Your most liked post</CardDescription>
          </CardHeader>
          <CardContent>
            <a
              href={bestPost.permalink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50"
            >
              <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded bg-muted">
                {bestPost.mediaUrl ? (
                  <img
                    src={bestPost.mediaUrl}
                    alt="Best post"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Award className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm">{bestPost.caption || "No caption"}</p>
                <div className="mt-2 flex gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Heart className="h-4 w-4 text-red-500" /> {formatNumber(bestPost.likes)} likes
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="h-4 w-4 text-blue-500" /> {bestPost.comments} comments
                  </span>
                  <span>{new Date(bestPost.timestamp).toLocaleDateString()}</span>
                </div>
              </div>
            </a>
          </CardContent>
        </Card>
      )}

      {topPosts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Posts</CardTitle>
            <CardDescription>Best performing content by likes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {topPosts.map((post) => (
                <a
                  key={post.id}
                  href={post.permalink || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative overflow-hidden rounded-lg"
                >
                  <img
                    src={post.imageUrl}
                    alt="Post"
                    className="aspect-square w-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                  <div className="absolute bottom-0 left-0 right-0 p-3 text-white opacity-0 transition-opacity group-hover:opacity-100">
                    <p className="text-xs truncate">{post.caption}</p>
                    <div className="mt-2 flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1">
                        <Heart className="h-4 w-4" /> {formatNumber(post.likes)}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="h-4 w-4" /> {post.comments}
                      </span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
