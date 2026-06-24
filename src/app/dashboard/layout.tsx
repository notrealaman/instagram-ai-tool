"use client";

import { useState, useEffect } from "react";
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
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  BarChart3,
  Subtitles,
  Download,
  CalendarDays,
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
    title: "All Posts",
    href: "/dashboard/all-posts",
    icon: BarChart3,
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
    title: "Transcribe",
    href: "/dashboard/transcribe",
    icon: Subtitles,
  },
  {
    title: "Video Download",
    href: "/dashboard/download",
    icon: Download,
  },
  {
    title: "Content Planner",
    href: "/dashboard/content-planner",
    icon: CalendarDays,
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
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Close mobile sidebar on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  const currentPage = sidebarItems.find(
    (item) =>
      item.href === pathname ||
      (item.href !== "/dashboard" && pathname.startsWith(item.href))
  );

  return (
    <div className="flex min-h-screen">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r bg-card transition-all duration-300",
          // Desktop
          collapsed ? "lg:w-16" : "lg:w-64",
          // Mobile
          mobileOpen ? "w-64 translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div
          className={cn(
            "flex h-16 shrink-0 items-center border-b",
            collapsed ? "justify-center px-2" : "gap-2 px-6"
          )}
        >
          <div className="instagram-gradient rounded-lg p-2 shrink-0">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          {!collapsed && <span className="text-xl font-bold">InstaAI</span>}
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-2 lg:p-4 overflow-y-auto">
          {sidebarItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.title : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  collapsed ? "justify-center" : "",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!collapsed && item.title}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="border-t p-2 lg:p-4">
          <Button
            variant="ghost"
            className={cn(
              "w-full gap-3 text-muted-foreground",
              collapsed ? "justify-center px-2" : "justify-start"
            )}
            onClick={handleLogout}
            title={collapsed ? "Log out" : undefined}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!collapsed && "Log out"}
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main
        className={cn(
          "flex-1 transition-all duration-300",
          collapsed ? "lg:pl-16" : "lg:pl-64"
        )}
      >
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-card px-4 sm:px-8">
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Mobile hamburger */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden shrink-0"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            {/* Desktop collapse toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="hidden lg:flex shrink-0"
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? (
                <PanelLeftOpen className="h-5 w-5" />
              ) : (
                <PanelLeftClose className="h-5 w-5" />
              )}
            </Button>
            <h1 className="text-base sm:text-lg font-semibold truncate">
              {currentPage?.title || "Dashboard"}
            </h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <ThemeToggle />
            <div className="hidden sm:block text-sm text-muted-foreground">
              Welcome back!
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="p-4 sm:p-8">{children}</div>
      </main>
    </div>
  );
}
