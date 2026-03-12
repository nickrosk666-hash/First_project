"use client";

import { useState } from "react";
import { CommandPaletteContext } from "@/hooks/use-command-palette";
import { CommandPalette } from "@/components/command-palette";

export function CommandPaletteProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <CommandPaletteContext value={{ open, setOpen }}>
      {children}
      <CommandPalette />
    </CommandPaletteContext>
  );
}
