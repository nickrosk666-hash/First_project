"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BusinessPlan } from "@/types/idea";

interface BusinessPlanViewProps {
  plan: BusinessPlan;
}

interface SectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function Section({ title, defaultOpen = false, children }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border border-border-default rounded-card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-bg-surface1 hover:bg-bg-surface2 transition-colors text-left"
      >
        <span className="text-sm font-medium text-text-primary">{title}</span>
        <ChevronDown
          className={cn("w-4 h-4 text-text-muted transition-transform duration-200", open && "rotate-180")}
        />
      </button>
      {open && (
        <div className="px-4 py-3 bg-bg-surface1/50 text-sm text-text-secondary space-y-2">
          {children}
        </div>
      )}
    </div>
  );
}

export default function BusinessPlanView({ plan }: BusinessPlanViewProps) {
  return (
    <div className="space-y-2">
      {plan.market_analysis && (
        <Section title="Market Analysis" defaultOpen>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-text-muted text-xs">TAM</span>
              <p className="text-text-primary">{plan.market_analysis.tam}</p>
            </div>
            <div>
              <span className="text-text-muted text-xs">SAM</span>
              <p className="text-text-primary">{plan.market_analysis.sam}</p>
            </div>
            <div>
              <span className="text-text-muted text-xs">SOM</span>
              <p className="text-text-primary">{plan.market_analysis.som}</p>
            </div>
            <div>
              <span className="text-text-muted text-xs">Target Audience</span>
              <p className="text-text-primary">{plan.market_analysis.target_audience}</p>
            </div>
          </div>
        </Section>
      )}

      {plan.competitors && plan.competitors.length > 0 && (
        <Section title="Competition">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-text-muted text-xs border-b border-border-default">
                  <th className="text-left py-2 pr-3">Competitor</th>
                  <th className="text-left py-2 pr-3">Price</th>
                  <th className="text-left py-2 pr-3">Users</th>
                  <th className="text-left py-2">Weakness</th>
                </tr>
              </thead>
              <tbody>
                {plan.competitors.map((c, i) => (
                  <tr key={i} className="border-b border-border-default/50 last:border-0">
                    <td className="py-2 pr-3 text-text-primary font-medium">{c.name}</td>
                    <td className="py-2 pr-3 font-mono text-xs">{c.pricing}</td>
                    <td className="py-2 pr-3 font-mono text-xs">{c.users}</td>
                    <td className="py-2 text-text-secondary">{c.weakness}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {plan.revenue_model && (
        <Section title="Revenue Model">
          <div>
            <span className="text-text-muted text-xs">Pricing Tiers</span>
            <ul className="list-disc list-inside mt-1">
              {plan.revenue_model.pricing_tiers.map((t, i) => (
                <li key={i} className="text-text-primary">{t}</li>
              ))}
            </ul>
          </div>
          <div className="mt-2">
            <span className="text-text-muted text-xs">Projected ARR</span>
            <p className="text-text-primary font-mono">{plan.revenue_model.projected_arr}</p>
          </div>
        </Section>
      )}

      {plan.technical && (
        <Section title="Technical Feasibility">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <span className="text-text-muted text-xs">Build Time</span>
              <p className="text-text-primary">{plan.technical.build_time}</p>
            </div>
            <div>
              <span className="text-text-muted text-xs">Complexity</span>
              <p className="text-text-primary">{plan.technical.complexity}</p>
            </div>
            <div>
              <span className="text-text-muted text-xs">Stack</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {plan.technical.stack.map((s) => (
                  <span key={s} className="text-[11px] px-1.5 py-0.5 rounded-pill bg-bg-surface2 text-accent-blue">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Section>
      )}

      {plan.risks && plan.risks.length > 0 && (
        <Section title="Risks">
          <div className="space-y-2">
            {plan.risks.map((r, i) => (
              <div key={i} className="flex gap-3 items-start">
                <span className={cn(
                  "text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-pill shrink-0 mt-0.5",
                  r.severity === "high" ? "bg-verdict-kill/10 text-verdict-kill" :
                  r.severity === "medium" ? "bg-verdict-bet/10 text-verdict-bet" :
                  "bg-verdict-build/10 text-verdict-build"
                )}>
                  {r.severity}
                </span>
                <div>
                  <p className="text-text-primary">{r.risk}</p>
                  <p className="text-text-muted text-xs mt-0.5">Mitigation: {r.mitigation}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {plan.launch_plan && plan.launch_plan.length > 0 && (
        <Section title="Launch Plan">
          <div className="space-y-1.5">
            {plan.launch_plan.map((step, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className={cn(
                  "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0",
                  step.done ? "bg-verdict-build/20 text-verdict-build" : "bg-bg-surface2 text-text-muted"
                )}>
                  {step.done ? "✓" : i + 1}
                </span>
                <span className={cn(step.done ? "text-text-muted line-through" : "text-text-primary")}>
                  {step.step}
                </span>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}
