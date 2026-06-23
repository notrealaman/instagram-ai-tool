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
  X,
  Eye,
  Bookmark,
  Share2,
  BarChart3,
  Clock,
  MessageSquare,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

interface PostDetail {
  post: {
    id: string;
    caption: string;
    mediaType: string;
    imageUrl: string;
    permalink: string;
    timestamp: string;
    likes: number;
    comments: number;
    childCount: number;
  };
  insights: {
    impressions: number;
    reach: number;
    engagement: number;
    saved: number;
    shares: number;
    videoViews: number;
    engagementRate: number;
    saveRate: number;
    shareRate: number;
    followers: number;
  };
  comments: Array<{
    id: string;
    text: string;
    timestamp: string;
    username: string;
  }>;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [postDetail, setPostDetail] = useState<PostDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

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

  const fetchPostDetail = async (postId: string) => {
    setSelectedPostId(postId);
    setLoadingDetail(true);
    setPostDetail(null);
    try {
      const res = await fetch(`/api/instagram/post-detail?postId=${postId}`);
      if (res.ok) {
        const detail = await res.json();
        setPostDetail(detail);
      }
    } catch {
      console.error("Failed to fetch post detail");
    } finally {
      setLoadingDetail(false);
    }
  };

  const closeModal = () => {
    setSelectedPostId(null);
    setPostDetail(null);
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
        <CardContent className="flex flex-col sm:flex-row items-center gap-4 p-4">
          {profile.profilePicture && (
            <img
              src={profile.profilePicture}
              alt={profile.username}
              className="h-16 w-16 rounded-full"
            />
          )}
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-xl font-bold">@{profile.username}</h2>
            {profile.biography && (
              <p className="text-sm text-muted-foreground line-clamp-2">{profile.biography}</p>
            )}
            <div className="mt-2 flex justify-center sm:justify-start gap-4 text-sm">
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

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
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

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
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
                  <button
                    key={post.id}
                    onClick={() => fetchPostDetail(post.id)}
                    className="flex items-start gap-4 rounded-lg border p-3 transition-colors hover:bg-muted/50 w-full text-left cursor-pointer"
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
                  </button>
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
            <button
              onClick={() => fetchPostDetail(bestPost.id)}
              className="flex items-start gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50 w-full text-left cursor-pointer"
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
            </button>
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
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {topPosts.map((post) => (
                <button
                  key={post.id}
                  onClick={() => fetchPostDetail(post.id)}
                  className="group relative overflow-hidden rounded-lg cursor-pointer"
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
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Post Detail Modal */}
      {selectedPostId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={closeModal} />
          <div className="relative z-10 w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-card rounded-xl shadow-2xl border m-4">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-card z-10">
              <h2 className="text-lg font-semibold">Post Analytics</h2>
              <Button variant="ghost" size="icon" onClick={closeModal}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            {loadingDetail ? (
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : postDetail ? (
              <div className="p-6">
                <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                  {/* Post Image */}
                  <div className="rounded-lg overflow-hidden bg-muted">
                    {postDetail.post.imageUrl ? (
                      <img
                        src={postDetail.post.imageUrl}
                        alt="Post"
                        className="w-full h-auto object-contain max-h-[400px]"
                      />
                    ) : (
                      <div className="flex h-64 items-center justify-center text-muted-foreground">
                        No image available
                      </div>
                    )}
                  </div>

                  {/* Post Info */}
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        {new Date(postDetail.post.timestamp).toLocaleString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      <p className="whitespace-pre-wrap text-sm">
                        {postDetail.post.caption || "No caption"}
                      </p>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="rounded-lg border p-3 text-center">
                        <Heart className="h-5 w-5 mx-auto text-red-500 mb-1" />
                        <div className="text-xl font-bold">{postDetail.post.likes.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">Likes</div>
                      </div>
                      <div className="rounded-lg border p-3 text-center">
                        <MessageCircle className="h-5 w-5 mx-auto text-blue-500 mb-1" />
                        <div className="text-xl font-bold">{postDetail.post.comments.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">Comments</div>
                      </div>
                      <div className="rounded-lg border p-3 text-center">
                        <TrendingUp className="h-5 w-5 mx-auto text-emerald-500 mb-1" />
                        <div className="text-xl font-bold">{postDetail.insights.engagementRate}%</div>
                        <div className="text-xs text-muted-foreground">Engagement</div>
                      </div>
                    </div>

                    <a
                      href={postDetail.post.permalink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      View on Instagram <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </div>

                {/* Detailed Insights */}
                <div className="mt-6 space-y-4">
                  <h3 className="text-base font-semibold">Detailed Insights</h3>
                  <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
                    <Card className="stat-card">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <Eye className="h-4 w-4 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Impressions</span>
                        </div>
                        <div className="text-2xl font-bold">
                          {postDetail.insights.impressions.toLocaleString()}
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="stat-card">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Reach</span>
                        </div>
                        <div className="text-2xl font-bold">
                          {postDetail.insights.reach.toLocaleString()}
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="stat-card">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <Bookmark className="h-4 w-4 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Saved</span>
                        </div>
                        <div className="text-2xl font-bold">
                          {postDetail.insights.saved.toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {postDetail.insights.saveRate}% save rate
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="stat-card">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <Share2 className="h-4 w-4 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Shares</span>
                        </div>
                        <div className="text-2xl font-bold">
                          {postDetail.insights.shares.toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {postDetail.insights.shareRate}% share rate
                        </div>
                      </CardContent>
                    </Card>
                    {postDetail.post.mediaType === "VIDEO" && (
                      <Card className="stat-card">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-1">
                            <BarChart3 className="h-4 w-4 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">Video Views</span>
                          </div>
                          <div className="text-2xl font-bold">
                            {postDetail.insights.videoViews.toLocaleString()}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  {/* Engagement Breakdown */}
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="text-sm font-medium mb-3">Engagement Breakdown</h4>
                      <div className="space-y-2">
                        {postDetail.insights.impressions > 0 && (
                          <>
                            <div>
                              <div className="flex justify-between text-xs mb-1">
                                <span>Likes</span>
                                <span>
                                  {((postDetail.post.likes / postDetail.insights.impressions) * 100).toFixed(2)}%
                                </span>
                              </div>
                              <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-red-500 rounded-full"
                                  style={{
                                    width: `${Math.min((postDetail.post.likes / postDetail.insights.impressions) * 100, 100)}%`,
                                  }}
                                />
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between text-xs mb-1">
                                <span>Comments</span>
                                <span>
                                  {((postDetail.post.comments / postDetail.insights.impressions) * 100).toFixed(2)}%
                                </span>
                              </div>
                              <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-blue-500 rounded-full"
                                  style={{
                                    width: `${Math.min((postDetail.post.comments / postDetail.insights.impressions) * 100, 100)}%`,
                                  }}
                                />
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between text-xs mb-1">
                                <span>Saves</span>
                                <span>{postDetail.insights.saveRate}%</span>
                              </div>
                              <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-emerald-500 rounded-full"
                                  style={{
                                    width: `${Math.min(postDetail.insights.saveRate, 100)}%`,
                                  }}
                                />
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between text-xs mb-1">
                                <span>Shares</span>
                                <span>{postDetail.insights.shareRate}%</span>
                              </div>
                              <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-purple-500 rounded-full"
                                  style={{
                                    width: `${Math.min(postDetail.insights.shareRate, 100)}%`,
                                  }}
                                />
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Comments Section */}
                {postDetail.comments.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-base font-semibold mb-3">
                      Comments ({postDetail.comments.length})
                    </h3>
                    <Card>
                      <CardContent className="p-0 divide-y max-h-64 overflow-y-auto">
                        {postDetail.comments.map((comment) => (
                          <div key={comment.id} className="p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <MessageSquare className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm font-medium">@{comment.username}</span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(comment.timestamp).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-sm">{comment.text}</p>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex h-64 items-center justify-center text-muted-foreground">
                Failed to load post details
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
