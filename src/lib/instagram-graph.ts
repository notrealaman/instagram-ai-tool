const GRAPH_API_VERSION = "v21.0";
const GRAPH_API_BASE = "https://graph.facebook.com";

export interface IGConversation {
  id: string;
  snippet: string;
  unread_count: number;
  participants: { data: Array<{ name: string; id: string }> };
  message_count: number;
  updated_time: string;
}

export interface IGMessage {
  id: string;
  from: { name: string; id: string };
  message: string;
  created_time: string;
}

export async function getConversations(
  igUserId: string,
  accessToken: string
): Promise<IGConversation[]> {
  console.log(`[IG] Fetching conversations for ${igUserId}`);

  const url = `${GRAPH_API_BASE}/${GRAPH_API_VERSION}/${igUserId}/conversations?platform=instagram&fields=id,snippet,unread_count,participants,message_count,updated_time&limit=20&access_token=${accessToken}`;

  const res = await fetch(url);
  const data = await res.json();

  console.log("[IG] Conversations response:", JSON.stringify(data, null, 2));

  if (data.error) {
    console.error("[IG] Conversations error:", data.error);
    throw new Error(`Graph API error: ${data.error.message}`);
  }

  return data.data || [];
}

export async function getConversationMessages(
  conversationId: string,
  accessToken: string,
  limit = 10
): Promise<IGMessage[]> {
  console.log(`[IG] Fetching messages for conversation ${conversationId}`);

  const url = `${GRAPH_API_BASE}/${GRAPH_API_VERSION}/${conversationId}/messages?fields=id,from,message,created_time&limit=${limit}&access_token=${accessToken}`;

  const res = await fetch(url);
  const data = await res.json();

  console.log("[IG] Messages response:", JSON.stringify(data, null, 2));

  if (data.error) {
    console.error("[IG] Messages error:", data.error);
    throw new Error(`Graph API error: ${data.error.message}`);
  }

  return data.data || [];
}

export async function sendIGMessage(
  recipientId: string,
  messageText: string,
  accessToken: string
): Promise<{ message_id: string }> {
  console.log(`[IG] Sending message to ${recipientId}: ${messageText}`);

  const res = await fetch(
    `${GRAPH_API_BASE}/${GRAPH_API_VERSION}/me/messages`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text: messageText },
        access_token: accessToken,
      }),
    }
  );
  const data = await res.json();

  console.log("[IG] Send message response:", JSON.stringify(data, null, 2));

  if (data.error) {
    console.error("[IG] Send message error:", data.error);
    throw new Error(`Graph API send error: ${data.error.message}`);
  }
  return data;
}

export function getIGUserIdFromConversation(
  conversation: IGConversation,
  pageId: string
): string | null {
  const participant = conversation.participants?.data?.find(
    (p) => p.id !== pageId
  );
  return participant?.id || null;
}

export function isUserMessage(message: IGMessage, pageId: string): boolean {
  return message.from?.id !== pageId;
}
