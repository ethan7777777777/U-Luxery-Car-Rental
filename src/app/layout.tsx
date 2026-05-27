import type { Metadata } from "next";
import Link from "next/link";

import "./globals.css";

export const metadata: Metadata = {
  title: "Blackline Exotics | Luxury Supercar Rentals",
  description:
    "Rent elite supercars with instant availability checks, secure booking, and premium concierge support.",
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
              BLACKLINE EXOTICS
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
