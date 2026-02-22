"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FindingCard } from "@/components/finding-card";
import { ScoreRing } from "@/components/score-ring";
import type { Finding } from "@/types/audit";
import { SEVERITY_ORDER } from "@/lib/constants";

type InputMode = "paste" | "address";

export default function AuditPage() {
  const router = useRouter();
  const [mode, setMode] = useState<InputMode>("paste");
  const [code, setCode] = useState("");
  const [address, setAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [score, setScore] = useState<number | null>(null);
  const [summary, setSummary] = useState("");
  const [error, setError] = useState("");
  const [auditId, setAuditId] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchFromEtherscan = useCallback(async () => {
    if (!address.trim()) return;
    setIsFetching(true);
    setError("");
    try {
      const res = await fetch(
        `/api/etherscan?address=${encodeURIComponent(address.trim())}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch contract");
      setCode(data.sourceCode);
      setMode("paste");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch contract");
    } finally {
      setIsFetching(false);
    }
  }, [address]);

  const runAudit = useCallback(async () => {
    const sourceCode = code.trim();
    if (!sourceCode) {
      setError("Please paste Solidity code or fetch from a contract address.");
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
        body: JSON.stringify({
          code: sourceCode,
          contractAddress: mode === "address" ? address.trim() : null,
          source: mode === "address" && address.trim() ? "etherscan" : "paste",
        }),
        signal: abortRef.current.signal,
      });

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
  }, [code, address, mode]);

  const hasResults = score !== null && findings.length > 0;

  return (
    <div className="mx-auto max-w-6xl px-6 pt-24 pb-16">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Audit Contract</h1>
        <p className="mt-2 text-gray-400">
          Paste Solidity code or fetch from an Etherscan address
        </p>
      </div>

      {/* Input Mode Toggle */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setMode("paste")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            mode === "paste"
              ? "bg-base-blue text-white"
              : "bg-surface-secondary text-gray-400 hover:text-white"
          }`}
        >
          Paste Code
        </button>
        <button
          onClick={() => setMode("address")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            mode === "address"
              ? "bg-base-blue text-white"
              : "bg-surface-secondary text-gray-400 hover:text-white"
          }`}
        >
          Contract Address
        </button>
      </div>

      {/* Etherscan Input */}
      {mode === "address" && (
        <div className="mb-4 flex gap-3">
          <input
            type="text"
            placeholder="0x... (Ethereum mainnet contract address)"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="flex-1 rounded-xl border border-surface-border bg-surface-secondary px-4 py-3 text-sm font-mono text-gray-200 placeholder-gray-600 outline-none transition-colors focus:border-base-blue/50"
          />
          <button
            onClick={fetchFromEtherscan}
            disabled={isFetching || !address.trim()}
            className="rounded-xl bg-surface-tertiary px-6 py-3 text-sm font-semibold text-gray-300 transition-colors hover:bg-surface-border disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isFetching ? "Fetching..." : "Fetch"}
          </button>
        </div>
      )}

      {/* Code Input */}
      <div className="relative mb-4">
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder={`// SPDX-License-Identifier: MIT\npragma solidity ^0.8.0;\n\ncontract MyContract {\n    // Paste your Solidity code here...\n}`}
          className="code-input h-80 w-full resize-y rounded-xl border border-surface-border bg-surface-secondary p-5 text-gray-200 placeholder-gray-600 outline-none transition-colors focus:border-base-blue/50"
          spellCheck={false}
        />
        <div className="absolute bottom-3 right-3 text-xs text-gray-600">
          {code.length > 0 ? `${code.split("\n").length} lines` : ""}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Audit Button */}
      <button
        onClick={runAudit}
        disabled={isLoading || !code.trim()}
        className="w-full rounded-xl bg-base-blue py-4 text-base font-semibold text-white transition-all hover:bg-base-blue-dark hover:shadow-lg hover:shadow-base-blue/20 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-3">
            <svg
              className="h-5 w-5 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Analyzing contract...
          </span>
        ) : (
          "Audit Now"
        )}
      </button>

      {/* Streaming Results */}
      {(isLoading || hasResults) && (
        <div className="mt-12">
          {/* Score + Summary */}
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
                    <ShareButton score={score} auditId={auditId} />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Findings */}
          {findings.length > 0 && (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold">
                  Findings ({findings.length})
                </h2>
                <div className="flex gap-2 text-xs">
                  {["Critical", "High", "Medium", "Low", "Info"].map((sev) => {
                    const count = findings.filter(
                      (f) => f.severity === sev
                    ).length;
                    if (count === 0) return null;
                    return (
                      <span
                        key={sev}
                        className="rounded-full bg-surface-tertiary px-2.5 py-1 font-medium text-gray-400"
                      >
                        {count} {sev}
                      </span>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-4">
                {findings.map((finding, i) => (
                  <FindingCard key={`${finding.title}-${i}`} finding={finding} index={i} />
                ))}
              </div>
            </div>
          )}

          {/* Loading state for findings */}
          {isLoading && findings.length === 0 && (
            <div className="flex flex-col items-center gap-4 py-16">
              <div className="relative">
                <div className="h-16 w-16 rounded-full border-2 border-base-blue/20" />
                <div className="absolute inset-0 h-16 w-16 rounded-full border-2 border-base-blue border-t-transparent animate-spin" />
              </div>
              <p className="text-sm text-gray-400">
                Scanning contract for vulnerabilities...
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ShareButton({ score, auditId }: { score: number; auditId: string }) {
  const appUrl = typeof window !== "undefined" ? window.location.origin : "";
  const shareUrl = `${appUrl}/results/${auditId}`;
  const tweetText = encodeURIComponent(
    `Just audited my smart contract with @0xsonarbot — security score: ${score}/100. Check yours:`
  );

  return (
    <a
      href={`https://twitter.com/intent/tweet?text=${tweetText}&url=${encodeURIComponent(shareUrl)}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 rounded-lg bg-surface-tertiary px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:text-white"
    >
      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
      Share on X
    </a>
  );
}
