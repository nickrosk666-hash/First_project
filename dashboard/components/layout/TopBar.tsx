"use client";

import Link from "next/link";
import { Bell, Search } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface TopBarProps {
  title: string;
  breadcrumb?: BreadcrumbItem[] | string;
  notificationCount?: number;
}

export default function TopBar({ title, breadcrumb, notificationCount = 0 }: TopBarProps) {
  const crumbs = typeof breadcrumb === "string"
    ? [{ label: breadcrumb }]
    : breadcrumb;

  return (
    <header className="h-14 border-b border-border-default flex items-center justify-between px-8 bg-bg-base sticky top-0 z-30">
      <div className="min-w-0">
        {crumbs && crumbs.length > 0 ? (
          <div className="flex items-center gap-2 text-sm min-w-0">
            {crumbs.map((item, i) => (
              <span key={i} className="flex items-center gap-2 min-w-0">
                {i > 0 && <span className="text-text-muted">/</span>}
                {item.href ? (
                  <Link href={item.href} className="text-text-muted hover:text-text-secondary transition-colors">
                    {i === 0 ? `← ${item.label}` : item.label}
                  </Link>
                ) : (
                  <span className="text-text-primary font-semibold truncate">{item.label}</span>
                )}
              </span>
            ))}
          </div>
        ) : (
          <h1 className="text-[28px] font-semibold tracking-[-0.02em] text-text-primary">{title}</h1>
        )}
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-btn border border-border-default text-text-muted hover:text-text-secondary hover:border-border-hover transition-colors text-sm">
          <Search className="w-4 h-4" />
          <span className="hidden sm:inline">Search</span>
          <kbd className="hidden sm:inline text-[11px] bg-bg-surface2 px-1.5 py-0.5 rounded border border-border-default font-mono">⌘K</kbd>
        </button>

        <button className="relative p-2 rounded-btn text-text-muted hover:text-text-secondary hover:bg-bg-surface1 transition-colors">
          <Bell className="w-5 h-5" />
          {notificationCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-verdict-kill text-[10px] font-bold text-white flex items-center justify-center">
              {notificationCount > 9 ? "9+" : notificationCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
