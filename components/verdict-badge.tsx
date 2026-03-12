import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { Verdict } from "@/lib/types";

const verdictStyles: Record<Verdict, string> = {
  BUILD: "border-verdict-build/30 bg-verdict-build/10 text-verdict-build",
  BET: "border-verdict-bet/30 bg-verdict-bet/10 text-verdict-bet",
  FLIP: "border-verdict-flip/30 bg-verdict-flip/10 text-verdict-flip",
  KILL: "border-verdict-kill/30 bg-verdict-kill/10 text-verdict-kill",
};

export function VerdictBadge({
  verdict,
  className,
}: {
  verdict: Verdict;
  className?: string;
}) {
  return (
    <Badge variant="outline" className={cn(verdictStyles[verdict], className)}>
      {verdict}
    </Badge>
  );
}
