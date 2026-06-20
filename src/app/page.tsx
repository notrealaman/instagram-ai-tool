import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  MessageSquare,
  Image,
  BarChart3,
  ArrowRight,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="instagram-gradient rounded-lg p-2">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold">InstaAI</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Log in</Button>
            </Link>
            <Link href="/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      <main>
        <section className="container mx-auto px-4 py-24 text-center">
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
            Grow Your Instagram
            <span className="instagram-gradient bg-clip-text text-transparent">
              {" "}
              with AI
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Keep your Instagram page active and engaging with our AI-powered
            tools. Generate posts, captions, and manage your DMs in seconds.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="gap-2">
                Start Free <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>

        <section className="container mx-auto px-4 pb-24">
          <h2 className="mb-12 text-center text-3xl font-bold">
            Everything you need to succeed
          </h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <FeatureCard
              icon={<Image className="h-6 w-6" />}
              title="1-Click Post Generator"
              description="Generate stunning posts with AI in seconds. Choose from templates, styles, and themes."
            />
            <FeatureCard
              icon={<Sparkles className="h-6 w-6" />}
              title="Occasional Posts"
              description="Never miss a holiday or event. Auto-generate themed content for any occasion."
            />
            <FeatureCard
              icon={<BarChart3 className="h-6 w-6" />}
              title="SEO Caption Generator"
              description="Create captions that rank. AI-powered SEO optimization for maximum reach."
            />
            <FeatureCard
              icon={<MessageSquare className="h-6 w-6" />}
              title="AI DM Chatbot"
              description="Automate your Instagram DMs. Respond to messages instantly with AI."
            />
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © 2026 InstaAI. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="stat-card rounded-xl border bg-card p-6 text-card-foreground shadow">
      <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3 text-primary">
        {icon}
      </div>
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
