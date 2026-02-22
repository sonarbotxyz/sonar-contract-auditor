"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-surface-border bg-surface-primary/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-base-blue">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </div>
          <span className="text-lg font-bold tracking-tight">
            Sonar<span className="text-base-blue">Audit</span>
          </span>
        </Link>

        <div className="flex items-center gap-6">
          <Link
            href="/audit"
            className={`text-sm font-medium transition-colors ${
              pathname === "/audit"
                ? "text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Audit
          </Link>
          <Link
            href="/pricing"
            className={`text-sm font-medium transition-colors ${
              pathname === "/pricing"
                ? "text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Pricing
          </Link>
          <Link
            href="/audit"
            className="rounded-lg bg-base-blue px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-base-blue-dark"
          >
            Launch App
          </Link>
        </div>
      </div>
    </nav>
  );
}
