import { SEVERITY_COLORS } from "@/lib/constants";
import type { Severity } from "@/types/audit";

interface SeverityBadgeProps {
  severity: Severity;
}

export function SeverityBadge({ severity }: SeverityBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
        SEVERITY_COLORS[severity] || SEVERITY_COLORS.Info
      }`}
    >
      {severity}
    </span>
  );
}
