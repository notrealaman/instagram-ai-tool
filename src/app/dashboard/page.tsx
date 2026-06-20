"use client";

import {
  Users,
  Eye,
  BarChart3,
  TrendingUp,
  MousePointerClick,
  UserPlus,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { mockInsights } from "@/lib/mock-data";
import { formatNumber } from "@/lib/utils";

export default function DashboardPage() {
  const { overview, followerGrowth, topPosts, recentActivity } = mockInsights;

  const stats = [
    {
      title: "Followers",
      value: formatNumber(overview.followers),
      change: `+${overview.followersGrowth}`,
      icon: Users,
      trend: "up",
    },
    {
      title: "Reach",
      value: formatNumber(overview.reach),
      change: `+${overview.reachChange}%`,
      icon: Eye,
      trend: "up",
    },
    {
      title: "Impressions",
      value: formatNumber(overview.impressions),
      change: `+${overview.impressionsChange}%`,
      icon: BarChart3,
      trend: "up",
    },
    {
      title: "Engagement Rate",
      value: `${overview.engagement}%`,
      change: `+${overview.engagementChange}%`,
      icon: TrendingUp,
      trend: "up",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="stat-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
              <p className="text-xs text-emerald-500">
                {stat.change} from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Follower Growth</CardTitle>
            <CardDescription>Last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <svg
                viewBox="0 0 600 300"
                className="h-full w-full"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="hsl(262, 83%, 58%)" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="hsl(262, 83%, 58%)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {(() => {
                  const minFollowers = Math.min(
                    ...followerGrowth.map((d) => d.followers)
                  );
                  const maxFollowers = Math.max(
                    ...followerGrowth.map((d) => d.followers)
                  );
                  const range = maxFollowers - minFollowers;
                  const padding = 20;

                  const points = followerGrowth.map((d, i) => {
                    const x = padding + (i / (followerGrowth.length - 1)) * (600 - 2 * padding);
                    const y = padding + (1 - (d.followers - minFollowers) / range) * (300 - 2 * padding);
                    return `${x},${y}`;
                  });

                  const linePath = `M${points.join(" L")}`;
                  const areaPath = `${linePath} L${padding + (followerGrowth.length - 1) / (followerGrowth.length - 1) * (600 - 2 * padding)},${300 - padding} L${padding},${300 - padding} Z`;

                  return (
                    <>
                      <path d={areaPath} fill="url(#gradient)" />
                      <path d={linePath} fill="none" stroke="hsl(262, 83%, 58%)" strokeWidth="2" />
                      {followerGrowth.filter((_, i) => i % 5 === 0).map((d, i) => {
                        const x = padding + ((i * 5) / (followerGrowth.length - 1)) * (600 - 2 * padding);
                        const y = padding + (1 - (d.followers - minFollowers) / range) * (300 - 2 * padding);
                        return (
                          <circle key={i} cx={x} cy={y} r="4" fill="hsl(262, 83%, 58%)" />
                        );
                      })}
                    </>
                  );
                })()}
              </svg>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest interactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-4">
                  <div className="rounded-full bg-muted p-2">
                    {activity.type === "like" && (
                      <span className="text-sm">❤️</span>
                    )}
                    {activity.type === "comment" && (
                      <span className="text-sm">💬</span>
                    )}
                    {activity.type === "follow" && (
                      <UserPlus className="h-4 w-4" />
                    )}
                    {activity.type === "mention" && (
                      <span className="text-sm">@</span>
                    )}
                    {activity.type === "share" && (
                      <MousePointerClick className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">
                      <span className="font-medium">{activity.user}</span>{" "}
                      {activity.type === "like" && "liked your post"}
                      {activity.type === "comment" && (
                        <>
                          commented: &quot;{activity.text}&quot;
                        </>
                      )}
                      {activity.type === "follow" && "started following you"}
                      {activity.type === "mention" &&
                        `mentioned you in a post`}
                      {activity.type === "share" && "shared your post"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Performing Posts</CardTitle>
          <CardDescription>Your best content this month</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {topPosts.map((post) => (
              <div key={post.id} className="group relative overflow-hidden rounded-lg">
                <img
                  src={post.imageUrl}
                  alt="Post"
                  className="aspect-square w-full object-cover transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="absolute bottom-0 left-0 right-0 p-3 text-white opacity-0 transition-opacity group-hover:opacity-100">
                  <div className="flex items-center gap-4 text-sm">
                    <span>❤️ {formatNumber(post.likes)}</span>
                    <span>💬 {post.comments}</span>
                    <span>📊 {post.engagement}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
