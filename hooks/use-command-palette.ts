"use client";

import { createContext, useContext } from "react";

type CommandPaletteState = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

export const CommandPaletteContext = createContext<CommandPaletteState>({
  open: false,
  setOpen: () => {},
});

export function useCommandPalette() {
  return useContext(CommandPaletteContext);
}
