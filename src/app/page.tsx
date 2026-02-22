"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FindingCard } from "@/components/finding-card";
import { ScoreRing } from "@/components/score-ring";
import type { Finding } from "@/types/audit";
import { SEVERITY_ORDER } from "@/lib/constants";

const DEMO_FINDINGS: Finding[] = [
  {
    severity: "Critical",
    title: "Reentrancy vulnerability in withdraw()",
    description:
      "The withdraw function sends ETH before zeroing the balance. An attacker can recursively call withdraw() via a fallback function to drain the contract.",
    recommendation:
      "Move `balances[msg.sender] = 0` before the external call, or use OpenZeppelin's ReentrancyGuard.",
  },
  {
    severity: "Medium",
    title: "No access control on sensitive functions",
    description:
      "The contract lacks owner-only modifiers. Any address can call functions that should be restricted.",
    recommendation:
      "Add an `onlyOwner` modifier using OpenZeppelin's Ownable contract.",
  },
];

export default function Home() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [score, setScore] = useState<number | null>(null);
  const [summary, setSummary] = useState("");
  const [error, setError] = useState("");
  const [auditId, setAuditId] = useState<string | null>(null);
  const [demoOpen, setDemoOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const runAudit = useCallback(async () => {
    const sourceCode = code.trim();
    if (!sourceCode) {
      setError("Paste some Solidity code first.");
      return;
    }

    setIsLoading(true);
    setError("");
    setFindings([]);
    setScore(null);
    setSummary("");
    setAuditId(null);

    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: sourceCode, source: "paste" }),
        signal: abortRef.current.signal,
      });

      if (res.status === 402) {
        setError("Payment required — $0.50 in USDC on Base. Connect your wallet to pay.");
        setIsLoading(false);
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Analysis failed");
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (!payload || payload === "[DONE]") continue;

          try {
            const chunk = JSON.parse(payload);
            if (chunk.type === "finding") {
              setFindings((prev) =>
                [...prev, chunk.data as Finding].sort(
                  (a, b) =>
                    (SEVERITY_ORDER[a.severity] ?? 5) -
                    (SEVERITY_ORDER[b.severity] ?? 5)
                )
              );
            } else if (chunk.type === "score") {
              setScore(chunk.data as number);
            } else if (chunk.type === "summary") {
              setSummary(chunk.data as string);
            } else if (chunk.type === "id") {
              setAuditId(chunk.data as string);
            } else if (chunk.type === "error") {
              setError(chunk.data as string);
            }
          } catch {
            // skip malformed chunks
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        setError(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  }, [code]);

  const hasResults = score !== null && findings.length > 0;

  return (
    <div className="relative min-h-screen">
      {/* Subtle glow */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[600px] -translate-x-1/2 rounded-full bg-base-blue/6 blur-[120px]" />

      <div className="relative mx-auto max-w-3xl px-6 pt-32 pb-24">
        {/* Header */}
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          Audit your contract in 30 seconds
        </h1>
        <p className="mt-4 text-lg text-gray-400 max-w-xl">
          Paste any Solidity contract. Gemini scans for vulnerabilities, gas
          issues, and attack vectors — before you deploy.
        </p>

        {/* Stat bar */}
        <div className="mt-6 flex items-center gap-6 text-sm text-gray-500">
          <span>10,000+ contracts audited</span>
          <span className="text-gray-700">·</span>
          <span>0 false starts</span>
        </div>

        {/* Textarea */}
        <textarea
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            setError("");
          }}
          placeholder={`// SPDX-License-Identifier: MIT\npragma solidity ^0.8.0;\n\ncontract MyContract {\n    // Paste your Solidity code here...\n}`}
          className="mt-8 h-64 w-full resize-y rounded-xl border border-surface-border bg-surface-secondary p-5 font-mono text-sm text-gray-200 placeholder-gray-600 outline-none transition-colors focus:border-base-blue/50"
          spellCheck={false}
        />

        {/* Error */}
        {error && (
          <div className="mt-3 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* CTA */}
        <button
          onClick={runAudit}
          disabled={isLoading || !code.trim()}
          className="mt-4 w-full rounded-xl bg-base-blue py-4 text-base font-semibold text-white transition-all hover:bg-base-blue-dark hover:shadow-lg hover:shadow-base-blue/20 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-3">
              <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Scanning contract...
            </span>
          ) : (
            "Audit Now — $0.50 in USDC"
          )}
        </button>

        {/* Live Results */}
        {(isLoading || hasResults) && (
          <div className="mt-10">
            {score !== null && (
              <div className="mb-8 flex flex-col items-center gap-6 rounded-2xl border border-surface-border bg-surface-secondary p-8 md:flex-row md:items-start">
                <ScoreRing score={score} />
                <div className="flex-1 text-center md:text-left">
                  <h2 className="mb-2 text-xl font-bold">Security Score</h2>
                  {summary && (
                    <p className="text-sm leading-relaxed text-gray-400">
                      {summary}
                    </p>
                  )}
                  {auditId && (
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <button
                        onClick={() => router.push(`/results/${auditId}`)}
                        className="rounded-lg bg-surface-tertiary px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:text-white"
                      >
                        View Full Report &rarr;
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {findings.length > 0 && (
              <div>
                <h2 className="mb-4 text-lg font-bold">
                  Findings ({findings.length})
                </h2>
                <div className="space-y-4">
                  {findings.map((finding, i) => (
                    <FindingCard key={`${finding.title}-${i}`} finding={finding} index={i} />
                  ))}
                </div>
              </div>
            )}

            {isLoading && findings.length === 0 && (
              <div className="flex flex-col items-center gap-4 py-16">
                <div className="relative">
                  <div className="h-16 w-16 rounded-full border-2 border-base-blue/20" />
                  <div className="absolute inset-0 h-16 w-16 rounded-full border-2 border-base-blue border-t-transparent animate-spin" />
                </div>
                <p className="text-sm text-gray-400">Scanning contract for vulnerabilities...</p>
              </div>
            )}
          </div>
        )}

        {/* Demo Result */}
        {!hasResults && !isLoading && (
          <div className="mt-12">
            <button
              onClick={() => setDemoOpen(!demoOpen)}
              className="flex w-full items-center justify-between rounded-xl border border-surface-border bg-surface-secondary/50 px-5 py-4 text-left transition-colors hover:bg-surface-secondary"
            >
              <div>
                <span className="text-sm font-semibold text-gray-200">
                  Example: VulnerableToken.sol
                </span>
                <span className="ml-3 rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-medium text-red-400">
                  2 issues found
                </span>
              </div>
              <svg
                className={`h-5 w-5 text-gray-500 transition-transform ${demoOpen ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {demoOpen && (
              <div className="mt-3 space-y-3">
                {DEMO_FINDINGS.map((f, i) => (
                  <FindingCard key={i} finding={f} index={i} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-20 text-center text-sm text-gray-600">
          by{" "}
          <a
            href="https://twitter.com/0xsonarbot"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-white transition-colors"
          >
            @0xsonarbot
          </a>{" "}
          on Base
        </div>
      </div>
    </div>
  );
}
