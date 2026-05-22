import Link from "next/link";
import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "ScamShield",
  description: "AI-powered scam detection MVP for suspicious links and payment requests.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <Link href="/" className="brand">
            ScamShield
          </Link>
          <nav className="site-nav">
            <Link href="/">Analyze</Link>
            <Link href="/history">History</Link>
            <Link href="/agents">Agents</Link>
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/api-docs">API</Link>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
