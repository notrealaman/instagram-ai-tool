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

    // Fetch all media with pagination
    let allPosts: Record<string, unknown>[] = [];
    let nextUrl: string | null = `https://graph.facebook.com/v21.0/${instagramId}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count,children{media_type,media_url}&limit=50&access_token=${accessToken}`;

    while (nextUrl) {
      const mediaRes = await fetch(nextUrl);
      const mediaData = await mediaRes.json();

      if (mediaData.error) {
        return NextResponse.json(
          { error: mediaData.error.message },
          { status: 500 }
        );
      }

      allPosts = [...allPosts, ...(mediaData.data || [])];
      nextUrl = mediaData.paging?.next || null;
    }

    const followers = profileData.followers_count || 0;

    const posts = allPosts.map((post) => {
      const likes = (post.like_count as number) || 0;
      const comments = (post.comments_count as number) || 0;
      const engagement = followers > 0
        ? parseFloat((((likes + comments) / followers) * 100).toFixed(2))
        : 0;

      let imageUrl = "";
      if (post.media_type === "VIDEO") {
        imageUrl = (post.thumbnail_url as string) || (post.media_url as string) || "";
      } else if (post.media_type === "CAROUSEL_ALBUM") {
        const children = post.children as { data: Array<{ media_type: string; media_url: string }> } | undefined;
        imageUrl = children?.data?.[0]?.media_url || (post.media_url as string) || "";
      } else {
        imageUrl = (post.media_url as string) || "";
      }

      if (!imageUrl) {
        imageUrl = `https://picsum.photos/seed/${post.id}/400/400`;
      }

      return {
        id: post.id as string,
        caption: (post.caption as string) || "",
        mediaType: post.media_type as string,
        imageUrl,
        permalink: post.permalink as string,
        timestamp: post.timestamp as string,
        likes,
        comments,
        engagement,
        childCount: (post.children as { data: unknown[] })?.data?.length || 0,
      };
    });

    // Compute summary stats
    const totalLikes = posts.reduce((sum, p) => sum + p.likes, 0);
    const totalComments = posts.reduce((sum, p) => sum + p.comments, 0);
    const postCount = posts.length || 1;

    return NextResponse.json({
      profile: {
        username: profileData.username,
        followers,
        following: profileData.follows_count || 0,
        mediaCount: profileData.media_count || 0,
        profilePicture: profileData.profile_picture_url || "",
      },
      summary: {
        totalPosts: posts.length,
        totalLikes,
        totalComments,
        avgLikes: Math.round(totalLikes / postCount),
        avgComments: Math.round(totalComments / postCount),
        avgEngagement: posts.length > 0
          ? parseFloat((posts.reduce((sum, p) => sum + p.engagement, 0) / posts.length).toFixed(2))
          : 0,
        totalReach: followers,
      },
      posts,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
