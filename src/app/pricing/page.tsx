import Link from "next/link";

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 pt-32 pb-24">
      <div className="mb-16 text-center">
        <h1 className="mb-4 text-4xl font-extrabold tracking-tight">
          Simple pricing
        </h1>
        <p className="text-lg text-gray-400">
          Start with a free audit. Pay per scan after that.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Free Tier */}
        <div className="flex flex-col rounded-2xl border border-surface-border bg-surface-secondary p-8">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-300">Starter</h2>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-white">$0</span>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Try Sonar with your first audit free
            </p>
          </div>

          <ul className="mb-8 flex-1 space-y-3">
            <PricingFeature text="1 free smart contract audit" />
            <PricingFeature text="Full vulnerability report" />
            <PricingFeature text="Security score (0-100)" />
            <PricingFeature text="Shareable report link" />
          </ul>

          <Link
            href="/audit"
            className="rounded-xl border border-surface-border bg-surface-tertiary py-3 text-center text-sm font-semibold text-gray-300 transition-colors hover:border-gray-600 hover:text-white"
          >
            Get Started Free
          </Link>
        </div>

        {/* Pro Tier */}
        <div className="relative flex flex-col rounded-2xl border border-base-blue/30 bg-surface-secondary p-8">
          <div className="absolute -top-3 right-6 rounded-full bg-base-blue px-3 py-1 text-xs font-semibold text-white">
            Popular
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-300">Per Audit</h2>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-white">$19</span>
              <span className="text-sm text-gray-500">/audit</span>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Pay as you go, no subscription
            </p>
          </div>

          <ul className="mb-8 flex-1 space-y-3">
            <PricingFeature text="Unlimited audits" />
            <PricingFeature text="Full vulnerability report" />
            <PricingFeature text="Security score (0-100)" />
            <PricingFeature text="Shareable report links" />
            <PricingFeature text="Priority analysis" />
            <PricingFeature text="Export PDF reports" highlight />
          </ul>

          <button
            className="rounded-xl bg-base-blue py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-base-blue-dark"
            title="Stripe integration coming soon"
          >
            Coming Soon
          </button>
        </div>
      </div>

      <p className="mt-8 text-center text-xs text-gray-600">
        Payments will be processed via Stripe. Enterprise plans available on
        request.
      </p>
    </div>
  );
}

function PricingFeature({
  text,
  highlight,
}: {
  text: string;
  highlight?: boolean;
}) {
  return (
    <li className="flex items-center gap-2.5 text-sm text-gray-400">
      <svg
        className={`h-4 w-4 shrink-0 ${highlight ? "text-base-blue" : "text-gray-600"}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.5 12.75l6 6 9-13.5"
        />
      </svg>
      {text}
      {highlight && (
        <span className="rounded-full bg-base-blue/10 px-2 py-0.5 text-[10px] font-medium text-base-blue">
          Soon
        </span>
      )}
    </li>
  );
}
