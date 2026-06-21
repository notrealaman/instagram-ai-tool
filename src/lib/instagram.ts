const INSTAGRAM_API_BASE = "https://graph.facebook.com/v25.0";

export interface InstagramInsights {
  reach: number;
  views: number;
  followerCount: number;
  followerGrowth: number;
  profileViews: number;
}

export interface InstagramPost {
  id: string;
  caption?: string;
  media_type: string;
  media_url: string;
  thumbnail_url?: string;
  permalink: string;
  timestamp: string;
  like_count: number;
  comments_count: number;
  insights?: {
    impressions?: { value: number }[];
    reach?: { value: number }[];
    engagement?: { value: number }[];
    shares?: { value: number }[];
    saved?: { value: number }[];
  };
}

export interface InstagramComment {
  id: string;
  text: string;
  timestamp: string;
  like_count: number;
  username: string;
  replies?: {
    data: InstagramComment[];
  };
}

export class InstagramAPI {
  private accessToken: string;
  private userId: string;

  constructor(accessToken: string, userId: string) {
    this.accessToken = accessToken;
    this.userId = userId;
  }

  private async request(path: string, params: Record<string, string> = {}) {
    const url = new URL(`${INSTAGRAM_API_BASE}${path}`);
    url.searchParams.set("access_token", this.accessToken);

    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    return data;
  }

  async getAccountInsights(
    metrics: string[] = ["reach", "views", "follower_count"],
    period: string = "day"
  ) {
    return this.request(`/${this.userId}/insights`, {
      metric: metrics.join(","),
      period,
    });
  }

  async getProfile() {
    return this.request(`/${this.userId}`, {
      fields:
        "id,username,followers_count,follows_count,media_count,profile_picture_url,biography",
    });
  }

  async getPosts(limit: number = 25) {
    return this.request(`/${this.userId}/media`, {
      fields:
        "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count",
      limit: limit.toString(),
    });
  }

  async getPostInsights(mediaId: string) {
    return this.request(`/${mediaId}/insights`, {
      metric: "engagement,impressions,reach,views,likes,comments,shares,saved",
      period: "lifetime",
    });
  }

  async getComments(mediaId: string) {
    return this.request(`/${mediaId}/comments`, {
      fields:
        "id,text,timestamp,like_count,username,replies{id,text,timestamp,username}",
    });
  }

  async postComment(mediaId: string, message: string) {
    const url = `${INSTAGRAM_API_BASE}/${mediaId}/comments`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        access_token: this.accessToken,
      }),
    });
    return response.json();
  }

  async deleteComment(commentId: string) {
    const url = `${INSTAGRAM_API_BASE}/${commentId}?access_token=${this.accessToken}`;
    const response = await fetch(url, { method: "DELETE" });
    return response.json();
  }

  async createMediaContainer(imageUrl: string, caption: string) {
    return fetch(`${INSTAGRAM_API_BASE}/${this.userId}/media`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image_url: imageUrl,
        caption,
        access_token: this.accessToken,
      }),
    }).then((r) => r.json());
  }

  async publishMedia(creationId: string) {
    return fetch(`${INSTAGRAM_API_BASE}/${this.userId}/media_publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        creation_id: creationId,
        access_token: this.accessToken,
      }),
    }).then((r) => r.json());
  }

  async getStoryInsights(storyId: string) {
    return this.request(`/${storyId}/insights`, {
      metric: "impressions,reach,taps_forward,taps_back,exits,replies",
      breakdown: "story_navigation_action_type",
    });
  }
}
