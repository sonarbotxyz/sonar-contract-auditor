"use client";

import { useState, useRef, useCallback } from "react";
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

export default function SonarAuditLanding() {
  const [code, setCode] = useState(
    `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Vault {
    mapping(address => uint256) public balances;

    function deposit() public payable {
        balances[msg.sender] += msg.value;
    }

    function withdraw() public {
        uint256 bal = balances[msg.sender];
        require(bal > 0, "No balance");

        (bool sent, ) = msg.sender.call{value: bal}("");
        require(sent, "Failed to send");

        balances[msg.sender] = 0;
    }
}`
  );

  const [showAudit, setShowAudit] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [score, setScore] = useState<number | null>(null);
  const [summary, setSummary] = useState("");
  const [error, setError] = useState("");
  const [auditId, setAuditId] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const resultsRef = useRef<HTMLDivElement | null>(null);

  const runAudit = useCallback(async () => {
    const sourceCode = code.trim();
    if (!sourceCode) return;

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
        setError(
          "Payment required — $0.50 in USDC on Base. Connect your wallet to pay."
        );
        setIsLoading(false);
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Analysis failed");
      }

      // Scroll to results area
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 200);

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
    <div className="min-h-screen bg-[#080810] text-white selection:bg-[#0052FF] selection:text-white font-sans overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#0052FF] opacity-[0.03] blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#0052FF] opacity-[0.02] blur-[120px] rounded-full pointer-events-none" />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-8 max-w-7xl mx-auto border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-[#0052FF] rounded-sm shadow-[0_0_15px_#0052FF]" />
          <span className="font-mono font-bold tracking-wider text-sm uppercase">
            Sonar Audit
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-4 font-mono text-xs text-gray-500">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Base Network Active
          </span>
        </div>
      </nav>

      {/* Hero — two-column grid */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-24">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left column — copy + CTA */}
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#0052FF]/30 bg-[#0052FF]/5 backdrop-blur-sm">
              <svg
                className="w-4 h-4 text-[#0052FF]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              <span className="font-mono text-xs text-[#0052FF] uppercase tracking-wide">
                Powered by Gemini 3.1 Pro
              </span>
            </div>

            <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight leading-[1.1]">
              Machine-grade paranoia for immutable code.
            </h1>

            <p className="text-lg text-gray-400 max-w-xl leading-relaxed">
              Don&apos;t deploy blind. Sonar Audit aggressively parses your
              Solidity execution paths in 30 seconds. Built strictly for Base
              chain builders who refuse to get exploited.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <button
                onClick={runAudit}
                disabled={isLoading || !code.trim()}
                className="group relative px-8 py-4 bg-[#0052FF] hover:bg-blue-600 text-white font-bold rounded-none transition-all duration-200 shadow-[0_0_20px_rgba(0,82,255,0.3)] hover:shadow-[0_0_30px_rgba(0,82,255,0.5)] flex items-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#0052FF] disabled:hover:shadow-[0_0_20px_rgba(0,82,255,0.3)]"
              >
                {isLoading ? (
                  <>
                    <svg
                      className="h-4 w-4 animate-spin"
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
                    <span>Scanning...</span>
                  </>
                ) : (
                  <>
                    <span>Initialize Scan</span>
                    <svg
                      className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 12h14M12 5l7 7-7 7"
                      />
                    </svg>
                  </>
                )}
              </button>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 font-mono text-xs text-gray-500 border border-gray-800 bg-black/50 px-3 py-1.5 rounded">
                  <svg
                    className="w-3 h-3 text-gray-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                  <span>x402 HTTP Protocol</span>
                </div>
                <span className="font-mono text-xs text-gray-400 ml-1">
                  Cost: $0.50 USDC per scan
                </span>
              </div>
            </div>

            {/* Error display */}
            {error && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}
          </div>

          {/* Right column — code editor */}
          <div className="relative group">
            <div className="relative bg-[#0d0d16] border border-gray-800 rounded-lg overflow-hidden shadow-2xl z-20">
              <div className="flex items-center justify-between px-4 py-3 bg-[#11111a] border-b border-gray-800">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                </div>
                <span className="font-mono text-xs text-gray-500">
                  Vault.sol
                </span>
                <button
                  onClick={() => setShowAudit(!showAudit)}
                  className="font-mono text-[10px] text-[#0052FF] hover:text-white transition-colors border border-[#0052FF]/30 px-2 py-1 rounded"
                >
                  {showAudit ? "Hide Audit" : "Run Demo Audit"}
                </button>
              </div>
              <textarea
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setError("");
                }}
                spellCheck="false"
                className="w-full h-[320px] bg-transparent text-gray-300 font-mono text-sm p-4 focus:outline-none resize-none leading-relaxed"
              />
            </div>

            {/* Demo overlay */}
            <div
              className={`absolute left-4 right-4 bg-black/90 backdrop-blur-md border border-red-900/50 rounded-lg p-4 transition-all duration-300 z-30 shadow-[0_10px_40px_rgba(255,0,0,0.1)] ${
                showAudit
                  ? "bottom-4 opacity-100 translate-y-0"
                  : "-bottom-4 opacity-0 pointer-events-none translate-y-4"
              }`}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 bg-red-500 animate-pulse rounded-full" />
                <span className="font-mono text-xs font-bold text-red-500 uppercase tracking-widest">
                  Critical Vulnerability Detected
                </span>
              </div>
              <div className="space-y-2 font-mono text-sm">
                <div className="text-gray-300">
                  <span className="text-red-400">Error:</span> Reentrancy
                  vulnerability in{" "}
                  <span className="text-white bg-white/10 px-1 rounded">
                    withdraw()
                  </span>
                </div>
                <div className="text-gray-500 text-xs leading-relaxed">
                  External call{" "}
                  <span className="text-[#0052FF]">
                    msg.sender.call&#123;value: bal&#125;(&quot;&quot;)
                  </span>{" "}
                  occurs before state variable{" "}
                  <span className="text-[#0052FF]">
                    balances[msg.sender] = 0
                  </span>{" "}
                  is updated. Attacker can recursively call withdraw() to drain
                  the contract.
                </div>
                <div className="pt-2 mt-2 border-t border-red-900/30 flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    Gemini 3.1 Pro &middot; 284ms
                  </span>
                  <span className="text-xs text-green-400">Fix Generated</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Real audit results — below hero */}
      {(isLoading || hasResults) && (
        <section
          ref={resultsRef}
          className="relative z-10 max-w-7xl mx-auto px-6 pb-24"
        >
          <div className="border-t border-white/5 pt-16">
            {/* Loading spinner */}
            {isLoading && findings.length === 0 && (
              <div className="flex flex-col items-center gap-4 py-16">
                <div className="relative">
                  <div className="h-16 w-16 rounded-full border-2 border-[#0052FF]/20" />
                  <div className="absolute inset-0 h-16 w-16 rounded-full border-2 border-[#0052FF] border-t-transparent animate-spin" />
                </div>
                <p className="text-sm text-gray-400">
                  Scanning contract for vulnerabilities...
                </p>
              </div>
            )}

            {/* Score ring + summary */}
            {score !== null && (
              <div className="mb-8 flex flex-col items-center gap-6 rounded-lg border border-gray-800 bg-[#0a0a14] p-8 md:flex-row md:items-start">
                <ScoreRing score={score} />
                <div className="flex-1 text-center md:text-left">
                  <h2 className="mb-2 text-xl font-bold">Security Score</h2>
                  {summary && (
                    <p className="text-sm leading-relaxed text-gray-400">
                      {summary}
                    </p>
                  )}
                  {auditId && (
                    <div className="mt-4">
                      <a
                        href={`/results/${auditId}`}
                        className="rounded-lg bg-[#11111a] border border-gray-800 px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:text-white hover:border-[#0052FF]/50"
                      >
                        View Full Report &rarr;
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Findings list */}
            {findings.length > 0 && (
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
            )}
          </div>
        </section>
      )}

      {/* Feature cards */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-24 border-t border-white/5">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-6 bg-[#0a0a14] border border-gray-800 hover:border-[#0052FF]/50 transition-colors rounded-sm group">
            <div className="w-10 h-10 bg-[#0052FF]/10 border border-[#0052FF]/20 flex items-center justify-center mb-6 group-hover:bg-[#0052FF]/20 transition-colors">
              <svg
                className="w-5 h-5 text-[#0052FF]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-bold mb-3">Deep Execution Paths</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Gemini 3.1 Pro maps complex state changes across multiple external
              calls. We don&apos;t just find syntax errors — we uncover
              protocol-breaking logic flaws.
            </p>
          </div>
          <div className="p-6 bg-[#0a0a14] border border-gray-800 hover:border-[#0052FF]/50 transition-colors rounded-sm group">
            <div className="w-10 h-10 bg-[#0052FF]/10 border border-[#0052FF]/20 flex items-center justify-center mb-6 group-hover:bg-[#0052FF]/20 transition-colors">
              <svg
                className="w-5 h-5 text-[#0052FF]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-bold mb-3">Flash-Attack Simulation</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Automated testing against known oracle manipulation vectors and
              flash loan attacks. If it can be drained on mainnet, we catch it
              in the editor.
            </p>
          </div>
          <div className="p-6 bg-[#0a0a14] border border-gray-800 hover:border-[#0052FF]/50 transition-colors rounded-sm group">
            <div className="w-10 h-10 bg-[#0052FF]/10 border border-[#0052FF]/20 flex items-center justify-center mb-6 group-hover:bg-[#0052FF]/20 transition-colors">
              <svg
                className="w-5 h-5 text-[#0052FF]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-bold mb-3">
              Gas Warfare Optimization
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Security is priority one. Gas efficiency is priority two. Get
              actionable rewrites to minimize opcodes and deploy leaner, cheaper
              contracts to Base.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 bg-[#05050a] py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#0052FF]/10 border border-[#0052FF]/30 flex items-center justify-center">
              <span className="font-mono text-xs text-[#0052FF] font-bold">
                S
              </span>
            </div>
            <span className="font-mono text-xs text-gray-500">v1.0.0-rc.4</span>
          </div>
          <div className="text-sm text-gray-500 font-mono flex items-center gap-2">
            <span>Designed by</span>
            <a
              href="https://twitter.com/0xsonarbot"
              target="_blank"
              rel="noreferrer"
              className="text-white hover:text-[#0052FF] transition-colors border-b border-white/20 hover:border-[#0052FF]"
            >
              @0xsonarbot
            </a>
            <span>on Base</span>
            <div className="w-3 h-3 ml-1 rounded-full bg-[#0052FF] shadow-[0_0_10px_#0052FF]" />
          </div>
        </div>
      </footer>
    </div>
  );
}
