import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const postId = url.searchParams.get("postId");

    if (!postId) {
      return NextResponse.json(
        { error: "postId is required" },
        { status: 400 }
      );
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

    // Fetch post details
    const postRes = await fetch(
      `https://graph.facebook.com/v21.0/${postId}?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count,children{media_type,media_url,like_count,comments_count}&access_token=${accessToken}`
    );
    const postData = await postRes.json();

    if (postData.error) {
      return NextResponse.json(
        { error: postData.error.message },
        { status: 500 }
      );
    }

    // Fetch post insights (requires instagram_manage_insights permission)
    let insights: Record<string, number> = {};
    try {
      const insightsRes = await fetch(
        `https://graph.facebook.com/v21.0/${postId}/insights?metric=impressions,reach,engagement,saved,shares,video_views&access_token=${accessToken}`
      );
      const insightsData = await insightsRes.json();

      if (insightsData.data) {
        insightsData.data.forEach((metric: { name: string; values: Array<{ value: number }> }) => {
          insights[metric.name] = metric.values?.[0]?.value || 0;
        });
      }
    } catch {
      // Insights may not be available for all post types
    }

    // Fetch comments
    let comments: Array<{
      id: string;
      text: string;
      timestamp: string;
      username: string;
    }> = [];
    try {
      const commentsRes = await fetch(
        `https://graph.facebook.com/v21.0/${postId}/comments?fields=id,text,timestamp,username&limit=50&access_token=${accessToken}`
      );
      const commentsData = await commentsRes.json();
      comments = commentsData.data || [];
    } catch {
      // Comments may not be available
    }

    // Get profile info for engagement calculation
    const profileRes = await fetch(
      `https://graph.facebook.com/v21.0/${instagramId}?fields=followers_count&access_token=${accessToken}`
    );
    const profileData = await profileRes.json();
    const followers = profileData.followers_count || 0;

    const likes = postData.like_count || 0;
    const commentsCount = postData.comments_count || 0;
    const impressions = insights.impressions || 0;
    const reach = insights.reach || 0;
    const saved = insights.saved || 0;
    const shares = insights.shares || 0;
    const videoViews = insights.video_views || 0;

    const engagementRate = followers > 0
      ? parseFloat((((likes + commentsCount + saved + shares) / followers) * 100).toFixed(2))
      : 0;

    const saveRate = impressions > 0
      ? parseFloat(((saved / impressions) * 100).toFixed(2))
      : 0;

    const shareRate = impressions > 0
      ? parseFloat(((shares / impressions) * 100).toFixed(2))
      : 0;

    let imageUrl = "";
    if (postData.media_type === "VIDEO") {
      imageUrl = postData.thumbnail_url || postData.media_url || "";
    } else if (postData.media_type === "CAROUSEL_ALBUM") {
      imageUrl = postData.children?.data?.[0]?.media_url || postData.media_url || "";
    } else {
      imageUrl = postData.media_url || "";
    }

    return NextResponse.json({
      post: {
        id: postData.id,
        caption: postData.caption || "",
        mediaType: postData.media_type,
        imageUrl,
        permalink: postData.permalink,
        timestamp: postData.timestamp,
        likes,
        comments: commentsCount,
        childCount: postData.children?.data?.length || 0,
      },
      insights: {
        impressions,
        reach,
        engagement: likes + commentsCount + saved + shares,
        saved,
        shares,
        videoViews,
        engagementRate,
        saveRate,
        shareRate,
        followers,
      },
      comments: comments.slice(0, 20),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
