"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Bot,
  Lightbulb,
  Code2,
  BarChart3,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useCommandPalette } from "@/hooks/use-command-palette";

const pages = [
  { title: "Overview", href: "/", icon: LayoutDashboard },
  { title: "Agents", href: "/agents", icon: Bot },
  { title: "Ideas", href: "/ideas", icon: Lightbulb },
  { title: "Code", href: "/code", icon: Code2 },
  { title: "Metrics", href: "/metrics", icon: BarChart3 },
];

export function CommandPalette() {
  const { open, setOpen } = useCommandPalette();
  const router = useRouter();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(!open);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, setOpen]);

  function navigate(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search pages, agents, ideas..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Pages">
          {pages.map((page) => (
            <CommandItem
              key={page.href}
              onSelect={() => navigate(page.href)}
            >
              <page.icon className="mr-2 size-4" />
              {page.title}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
