"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Bot,
  Lightbulb,
  Code2,
  BarChart3,
  DollarSign,
  Activity,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { mockAgents, mockCosts } from "@/lib/mock-data";

const navItems = [
  { title: "Обзор", href: "/", icon: LayoutDashboard },
  { title: "Агенты", href: "/agents", icon: Bot },
  { title: "Идеи", href: "/ideas", icon: Lightbulb },
  { title: "Код", href: "/code", icon: Code2 },
  { title: "Метрики", href: "/metrics", icon: BarChart3 },
];

export function AppSidebar() {
  const pathname = usePathname();
  const runningCount = mockAgents.filter((a) => a.status === "running").length;
  const latestCost = mockCosts[mockCosts.length - 1];

  return (
    <Sidebar>
      <SidebarHeader className="px-4 py-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-bold">
            A
          </div>
          <span className="text-sm font-semibold tracking-tight">
            Autonomy
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={isActive}
                      render={<Link href={item.href} />}
                    >
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-4 py-4">
        <div className="flex flex-col gap-2 text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Activity className="size-3 text-status-running" />
              {runningCount} работают
            </span>
            <span className="flex items-center gap-1.5">
              <DollarSign className="size-3" />
              ${latestCost?.costUsd.toFixed(2)}/мес
            </span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
