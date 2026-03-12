"use client";

import { Search } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useCommandPalette } from "@/hooks/use-command-palette";

export function AppTopBar() {
  const { setOpen } = useCommandPalette();

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <div className="flex flex-1 items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-64 justify-start gap-2 text-muted-foreground"
          onClick={() => setOpen(true)}
        >
          <Search className="size-3.5" />
          <span className="text-xs">Поиск...</span>
          <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            <span className="text-xs">&#x2318;</span>K
          </kbd>
        </Button>
      </div>
    </header>
  );
}
