import { SeverityBadge } from "./severity-badge";
import type { Finding } from "@/types/audit";

interface FindingCardProps {
  finding: Finding;
  index: number;
}

export function FindingCard({ finding, index }: FindingCardProps) {
  return (
    <div className="rounded-xl border border-surface-border bg-surface-secondary p-5 transition-colors hover:border-surface-border/80">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-surface-tertiary text-xs font-mono text-gray-500">
            {index + 1}
          </span>
          <h3 className="font-semibold text-gray-100">{finding.title}</h3>
        </div>
        <SeverityBadge severity={finding.severity} />
      </div>

      <p className="mb-4 text-sm leading-relaxed text-gray-400">
        {finding.description}
      </p>

      <div className="rounded-lg bg-surface-primary/60 border border-surface-border p-4">
        <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-base-blue">
          Recommendation
        </div>
        <p className="text-sm leading-relaxed text-gray-300">
          {finding.recommendation}
        </p>
      </div>
    </div>
  );
}
