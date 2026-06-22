export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
        <p className="text-muted-foreground mb-4">Last updated: June 2026</p>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">1. Data We Collect</h2>
          <p className="text-muted-foreground">
            InstaAI collects only the data necessary to provide our AI-powered Instagram management services:
          </p>
          <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
            <li>Instagram account information (username, profile picture, follower count) for analytics</li>
            <li>Instagram access tokens to connect and manage your account</li>
            <li>DM conversations to enable AI-powered auto-replies</li>
            <li>Account credentials (email and hashed password) for authentication</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">2. How We Use Your Data</h2>
          <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
            <li>To provide AI-generated captions, posts, and image content</li>
            <li>To auto-reply to Instagram DMs on your behalf using AI</li>
            <li>To display Instagram analytics and insights</li>
            <li>To authenticate and secure your account</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">3. Data Sharing</h2>
          <p className="text-muted-foreground">
            We do not sell, trade, or share your personal data with third parties, except:
          </p>
          <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
            <li>Google Gemini API — for AI text and image generation</li>
            <li>NVIDIA API — for AI caption generation</li>
            <li>Instagram Graph API — to manage your Instagram account</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">4. Data Security</h2>
          <p className="text-muted-foreground">
            We implement appropriate security measures to protect your personal information. Your access tokens are encrypted and stored securely. We do not store raw passwords.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">5. Data Deletion</h2>
          <p className="text-muted-foreground">
            You can delete your account and all associated data at any time from the Settings page. Upon deletion, all your data including Instagram connections, generated content, and chat history will be permanently removed from our servers.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">6. Contact</h2>
          <p className="text-muted-foreground">
            For privacy-related inquiries, contact us at support@instaai.app
          </p>
        </section>
      </div>
    </div>
  );
}
