import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/navbar";

export const metadata: Metadata = {
  title: "Sonar Audit — AI Smart Contract Security",
  description:
    "AI-powered smart contract security auditing in 60 seconds. Detect vulnerabilities, gas issues, and best practice violations.",
  openGraph: {
    title: "Sonar Audit — AI Smart Contract Security",
    description: "AI-powered smart contract security auditing in 60 seconds.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-surface-primary text-gray-100 antialiased">
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}
