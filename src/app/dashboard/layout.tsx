"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  LayoutDashboard,
  Image,
  Calendar,
  MessageSquare,
  Settings,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

const sidebarItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Post Generator",
    href: "/dashboard/post-generator",
    icon: Image,
  },
  {
    title: "Occasional Posts",
    href: "/dashboard/occasional-post",
    icon: Calendar,
  },
  {
    title: "Caption Generator",
    href: "/dashboard/caption-generator",
    icon: Sparkles,
  },
  {
    title: "DM Chatbot",
    href: "/dashboard/dm-chatbot",
    icon: MessageSquare,
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  return (
    <div className="flex min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-card">
        <div className="flex h-16 items-center gap-2 border-b px-6">
          <div className="instagram-gradient rounded-lg p-2">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold">InstaAI</span>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {sidebarItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.title}
              </Link>
            );
          })}
        </nav>

        <div className="border-t p-4">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
            Log out
          </Button>
        </div>
      </aside>

      <main className="flex-1 pl-64">
        <header className="flex h-16 items-center justify-between border-b bg-card px-8">
          <div>
            <h1 className="text-lg font-semibold">
              {sidebarItems.find(
                (item) =>
                  item.href === pathname ||
                  (item.href !== "/dashboard" &&
                    pathname.startsWith(item.href))
              )?.title || "Dashboard"}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="text-sm text-muted-foreground">
              Welcome back!
            </div>
          </div>
        </header>
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
