import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppTopBar } from "@/components/app-topbar";
import { CommandPaletteProvider } from "@/components/command-palette-provider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <CommandPaletteProvider>
        <AppSidebar />
        <SidebarInset className="min-w-0">
          <AppTopBar />
          <main className="flex-1 min-w-0 overflow-x-hidden overflow-y-auto p-6 lg:p-8">{children}</main>
        </SidebarInset>
      </CommandPaletteProvider>
    </SidebarProvider>
  );
}
