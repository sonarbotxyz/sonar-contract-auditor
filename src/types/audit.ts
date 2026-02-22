export type Severity = "Critical" | "High" | "Medium" | "Low" | "Info";

export interface Finding {
  severity: Severity;
  title: string;
  description: string;
  recommendation: string;
  line?: string;
}

export interface AuditResult {
  id: string;
  created_at: string;
  contract_code: string;
  contract_address: string | null;
  score: number;
  findings: Finding[];
  summary: string | null;
  source: "paste" | "etherscan";
}

export interface AuditStreamChunk {
  type: "finding" | "score" | "summary" | "error" | "done";
  data: Finding | number | string;
}
