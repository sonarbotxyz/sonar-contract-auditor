import { getSupabase } from "@/lib/supabase";
import { FindingCard } from "@/components/finding-card";
import { ScoreRing } from "@/components/score-ring";
import { SEVERITY_ORDER } from "@/lib/constants";
import type { Finding } from "@/types/audit";
import type { Metadata } from "next";
import Link from "next/link";

interface PageProps {
  params: { id: string };
}

async function getAudit(id: string) {
  const { data, error } = await getSupabase()
    .from("audits")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const audit = await getAudit(params.id);
  if (!audit) return { title: "Audit Not Found — Sonar Audit" };

  return {
    title: `Security Score: ${audit.score}/100 — Sonar Audit`,
    description: audit.summary || "Smart contract security audit results",
    openGraph: {
      title: `Security Score: ${audit.score}/100 — Sonar Audit`,
      description: audit.summary || "Smart contract security audit results",
    },
  };
}

export default async function ResultsPage({ params }: PageProps) {
  const audit = await getAudit(params.id);

  if (!audit) {
    return (
      <div className="mx-auto max-w-6xl px-6 pt-32 text-center">
        <h1 className="mb-4 text-3xl font-bold">Audit Not Found</h1>
        <p className="mb-8 text-gray-400">
          This audit doesn&apos;t exist or has been removed.
        </p>
        <Link
          href="/audit"
          className="rounded-xl bg-base-blue px-6 py-3 text-sm font-semibold text-white"
        >
          Start New Audit
        </Link>
      </div>
    );
  }

  const findings: Finding[] = (
    (audit.findings as Finding[]) || []
  ).sort(
    (a, b) =>
      (SEVERITY_ORDER[a.severity] ?? 5) - (SEVERITY_ORDER[b.severity] ?? 5)
  );

  const severityCounts = findings.reduce(
    (acc, f) => {
      acc[f.severity] = (acc[f.severity] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const shareUrl = `${appUrl}/results/${params.id}`;
  const tweetText = encodeURIComponent(
    `Just audited my smart contract with @0xsonarbot — security score: ${audit.score}/100. Check yours:`
  );

  return (
    <div className="mx-auto max-w-6xl px-6 pt-24 pb-16">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Report</h1>
          <p className="mt-1 text-sm text-gray-500">
            {new Date(audit.created_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
            {audit.contract_address && (
              <span className="ml-2 font-mono">
                &middot; {audit.contract_address.slice(0, 6)}...
                {audit.contract_address.slice(-4)}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-3">
          <a
            href={`https://twitter.com/intent/tweet?text=${tweetText}&url=${encodeURIComponent(shareUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg bg-surface-secondary px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:text-white"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            Share on X
          </a>
          <Link
            href="/audit"
            className="rounded-lg bg-base-blue px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-base-blue-dark"
          >
            New Audit
          </Link>
        </div>
      </div>

      {/* Score Card */}
      <div className="mb-8 flex flex-col items-center gap-6 rounded-2xl border border-surface-border bg-surface-secondary p-8 md:flex-row md:items-start">
        <ScoreRing score={audit.score} />
        <div className="flex-1 text-center md:text-left">
          <h2 className="mb-3 text-xl font-bold">Security Score</h2>
          {audit.summary && (
            <p className="mb-4 text-sm leading-relaxed text-gray-400">
              {audit.summary}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {["Critical", "High", "Medium", "Low", "Info"].map((sev) => {
              const count = severityCounts[sev] || 0;
              if (count === 0) return null;
              return (
                <span
                  key={sev}
                  className="rounded-full bg-surface-tertiary px-3 py-1 text-xs font-medium text-gray-400"
                >
                  {count} {sev}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* Findings */}
      {findings.length > 0 ? (
        <div>
          <h2 className="mb-4 text-lg font-bold">
            Findings ({findings.length})
          </h2>
          <div className="space-y-4">
            {findings.map((finding, i) => (
              <FindingCard
                key={`${finding.title}-${i}`}
                finding={finding}
                index={i}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-8 text-center">
          <p className="text-lg font-semibold text-green-400">
            No issues found
          </p>
          <p className="mt-1 text-sm text-gray-400">
            This contract passed all checks.
          </p>
        </div>
      )}
    </div>
  );
}
