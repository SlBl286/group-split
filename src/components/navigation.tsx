"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/brand-logo";
import {
  LayoutDashboard,
  Users,
  Plus,
  Settings,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/groups", label: "Nhóm", icon: Users },
  { href: "/settings", label: "Cài đặt", icon: Settings },
];

// Bottom nav for mobile
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all",
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

// Sidebar for desktop
export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-64 min-h-screen border-r bg-background/95 backdrop-blur">
      <div className="flex items-center px-6 py-5 border-b">
        <BrandLogo size="md" href="/dashboard" />
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

// Floating button to create new group or add expense contextually
export function FloatingCreateGroupButton() {
  const pathname = usePathname();

  // Hide the floating button on the group creation, join, or new expense pages
  if (
    pathname === "/groups/new" || 
    pathname.includes("/expenses/new") || 
    pathname.includes("/groups/join")
  ) {
    return null;
  }

  // Check if we are inside a specific group detail page: /groups/[id]
  const groupMatch = pathname.match(/^\/groups\/([^/]+)$/);
  const isGroupDetail = groupMatch && groupMatch[1] !== "new" && groupMatch[1] !== "join";

  const href = isGroupDetail ? `/groups/${groupMatch[1]}/expenses/new` : "/groups/new";
  const label = isGroupDetail ? "Thêm hoá đơn" : "Tạo nhóm mới";

  return (
    <Link
      href={href}
      className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40 flex items-center justify-center w-16 h-16 md:w-auto md:h-12 md:px-5 rounded-full bg-primary text-primary-foreground shadow-xl hover:bg-primary/90 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 hover:shadow-primary/30 gap-2.5 group/fab"
      aria-label={label}
    >
      <Plus className="h-7 w-7 md:h-5 md:w-5 transition-transform group-hover/fab:rotate-90 duration-300" />
      <span className="hidden md:inline text-base font-bold tracking-wide">{label}</span>
    </Link>
  );
}

