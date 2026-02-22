import Link from "next/link";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(#0052FF 1px, transparent 1px), linear-gradient(90deg, #0052FF 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Glow */}
      <div className="absolute left-1/2 top-0 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-base-blue/8 blur-[120px]" />

      <div className="relative mx-auto max-w-6xl px-6 pt-40 pb-24">
        {/* Hero */}
        <div className="flex flex-col items-center text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-base-blue/20 bg-base-blue/5 px-4 py-1.5 text-sm text-base-blue">
            <span className="h-1.5 w-1.5 rounded-full bg-base-blue animate-pulse" />
            AI-Powered Security Analysis
          </div>

          <h1 className="mb-6 max-w-4xl text-5xl font-extrabold leading-[1.1] tracking-tight md:text-7xl">
            Smart contract security{" "}
            <span className="text-gradient">in 60 seconds</span>
          </h1>

          <p className="mb-10 max-w-2xl text-lg leading-relaxed text-gray-400">
            Paste your Solidity code or enter a contract address. Sonar Audit
            uses advanced AI to detect vulnerabilities, gas inefficiencies, and
            compliance issues instantly.
          </p>

          <div className="flex items-center gap-4">
            <Link
              href="/audit"
              className="group flex items-center gap-2 rounded-xl bg-base-blue px-8 py-3.5 text-base font-semibold text-white transition-all hover:bg-base-blue-dark hover:shadow-lg hover:shadow-base-blue/20"
            >
              Start Audit
              <svg
                className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </Link>
            <Link
              href="/pricing"
              className="rounded-xl border border-surface-border bg-surface-secondary px-8 py-3.5 text-base font-semibold text-gray-300 transition-colors hover:border-gray-600 hover:text-white"
            >
              View Pricing
            </Link>
          </div>
        </div>

        {/* Features grid */}
        <div className="mt-32 grid grid-cols-1 gap-6 md:grid-cols-3">
          <FeatureCard
            icon={
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                />
              </svg>
            }
            title="Vulnerability Detection"
            description="Detects reentrancy, overflow, access control, front-running, and more. Powered by Claude 3.5 Sonnet."
          />
          <FeatureCard
            icon={
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
                />
              </svg>
            }
            title="Gas Optimization"
            description="Identifies gas-inefficient patterns and suggests concrete optimizations to reduce deployment and execution costs."
          />
          <FeatureCard
            icon={
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z"
                />
              </svg>
            }
            title="Security Score"
            description="Get a 0-100 security score with detailed findings. Share your audit results via a permanent link."
          />
        </div>

        {/* Trusted by */}
        <div className="mt-32 text-center">
          <p className="mb-8 text-sm font-medium uppercase tracking-widest text-gray-600">
            Built for developers who ship secure code
          </p>
          <div className="flex items-center justify-center gap-12 text-gray-600">
            <span className="font-mono text-sm">Solidity ^0.8.x</span>
            <span className="text-gray-700">|</span>
            <span className="font-mono text-sm">ERC-20 / ERC-721</span>
            <span className="text-gray-700">|</span>
            <span className="font-mono text-sm">DeFi Protocols</span>
            <span className="text-gray-700">|</span>
            <span className="font-mono text-sm">NFT Contracts</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="group rounded-2xl border border-surface-border bg-surface-secondary/50 p-6 transition-all hover:border-base-blue/20 hover:bg-surface-secondary">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-base-blue/10 text-base-blue">
        {icon}
      </div>
      <h3 className="mb-2 text-lg font-semibold text-gray-100">{title}</h3>
      <p className="text-sm leading-relaxed text-gray-400">{description}</p>
    </div>
  );
}
