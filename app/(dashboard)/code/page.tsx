import { Code2, GitBranch, FolderOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function CodePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Code</h1>

      {/* Placeholder — will connect to GitHub API via backend */}
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Code2 className="size-6 text-muted-foreground" />
          </div>
          <h2 className="mt-4 text-lg font-semibold">GitHub Integration</h2>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Connect your GitHub repositories to browse code, view file trees, and
            let your agents access the codebase.
          </p>
          <div className="mt-6 flex gap-8 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <FolderOpen className="size-3.5" />
              File Browser
            </div>
            <div className="flex items-center gap-1.5">
              <Code2 className="size-3.5" />
              Syntax Highlighting
            </div>
            <div className="flex items-center gap-1.5">
              <GitBranch className="size-3.5" />
              Branch Switching
            </div>
          </div>
          <p className="mt-8 text-xs text-muted-foreground">
            Requires backend API connection (Phase 2)
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
