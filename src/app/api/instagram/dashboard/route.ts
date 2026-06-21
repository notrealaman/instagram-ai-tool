import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const instagramAccount = await db.instagramAccount.findUnique({
      where: { userId: user.userId },
    });

    if (!instagramAccount) {
      return NextResponse.json(
        { error: "Instagram account not connected" },
        { status: 400 }
      );
    }

    const { instagramId, accessToken } = instagramAccount;

    const profileRes = await fetch(
      `https://graph.facebook.com/v21.0/${instagramId}?fields=id,username,followers_count,follows_count,media_count,profile_picture_url,biography&access_token=${accessToken}`
    );
    const profileData = await profileRes.json();

    if (profileData.error) {
      return NextResponse.json(
        { error: profileData.error.message },
        { status: 500 }
      );
    }

    const mediaRes = await fetch(
      `https://graph.facebook.com/v21.0/${instagramId}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count&limit=50&access_token=${accessToken}`
    );
    const mediaData = await mediaRes.json();

    let totalLikes = 0;
    let totalComments = 0;
    let bestPost = null;
    let bestPostLikes = 0;

    const posts = (mediaData.data || []).map((post: Record<string, unknown>) => {
      const likes = (post.like_count as number) || 0;
      const comments = (post.comments_count as number) || 0;
      totalLikes += likes;
      totalComments += comments;

      if (likes > bestPostLikes) {
        bestPostLikes = likes;
        bestPost = {
          id: post.id as string,
          caption: ((post.caption as string) || "").substring(0, 80),
          likes,
          comments,
          mediaUrl: (post.media_url as string) || (post.thumbnail_url as string) || "",
          permalink: post.permalink as string,
          timestamp: post.timestamp as string,
        };
      }

      let imageUrl = "";
      if (post.media_type === "VIDEO") {
        imageUrl = (post.thumbnail_url as string) || (post.media_url as string) || "";
      } else {
        imageUrl = (post.media_url as string) || "";
      }

      if (!imageUrl) {
        imageUrl = `https://picsum.photos/seed/${post.id}/400/400`;
      }

      return {
        id: post.id,
        imageUrl,
        likes,
        comments,
        caption: (post.caption as string)?.substring(0, 50) || "",
        mediaType: post.media_type,
        permalink: post.permalink,
        timestamp: post.timestamp,
      };
    });

    const postCount = posts.length || 1;
    const avgLikes = Math.round(totalLikes / postCount);
    const avgComments = Math.round(totalComments / postCount);

    const engagementRate = profileData.followers_count > 0
      ? (((totalLikes + totalComments) / (profileData.followers_count * postCount)) * 100).toFixed(2)
      : "0.00";

    const topPosts = [...posts]
      .sort((a, b) => b.likes - a.likes)
      .slice(0, 6);

    const recentPosts = posts.slice(0, 5);

    return NextResponse.json({
      profile: {
        username: profileData.username,
        followers: profileData.followers_count || 0,
        following: profileData.follows_count || 0,
        mediaCount: profileData.media_count || 0,
        profilePicture: profileData.profile_picture_url || "",
        biography: profileData.biography || "",
      },
      stats: {
        totalLikes,
        totalComments,
        avgLikes,
        avgComments,
        engagementRate: parseFloat(engagementRate),
        totalPosts: posts.length,
      },
      bestPost,
      topPosts,
      recentPosts,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
