import type { Metadata } from "next";
import Link from "next/link";

import "./globals.css";

export const metadata: Metadata = {
  title: "Aurelius Executive | Ultra Luxury Executive Rental",
  description:
    "Ultra luxury executive Rolls-Royce rental with demand testing across classic, modern, and ultra premium tiers.",
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
          <div className="container site-header__inner">
            <Link href="/" className="brand">
              AURELIUS EXECUTIVE
            </Link>
            <nav className="nav-links" aria-label="Main navigation">
              <Link href="/">Fleet</Link>
              <Link href="/admin">Admin</Link>
            </nav>
          </div>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
