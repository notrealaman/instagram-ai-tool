import { NextResponse } from "next/server";

// Simple test endpoint - logs webhook status
export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Webhook endpoint is live",
    callbackUrl: "https://instagram-ai-tool-tau.vercel.app/api/webhook",
    verifyToken: "instaai-webhook-verify-2024-secret",
    timestamp: new Date().toISOString(),
    instructions: {
      step1: "Go to Facebook Developer Dashboard → Your App → Webhooks",
      step2: "Click 'Subscribe to Events' or 'Edit' your existing subscription",
      step3: "Make sure callback URL is: https://instagram-ai-tool-tau.vercel.app/api/webhook",
      step4: "Make sure verify token is: instaai-webhook-verify-2024-secret",
      step5: "Make sure 'messages' checkbox is CHECKED",
      step6: "Make sure 'messaging_postbacks' checkbox is CHECKED",
      step7: "Click Save",
      step8: "Send a DM to your Instagram page from another account",
      step9: "Check Vercel Functions logs to see if notification arrives",
    },
  });
}
