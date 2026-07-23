import type { Metadata } from "next";
import "./globals.css";
import { CartBadgeLink } from "../components/CartBadgeLink";

export const metadata: Metadata = {
  title: "BRIN — المنيو الإلكتروني",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[var(--color-brand-border)] bg-[var(--color-brand-card)]/95 px-4 py-3 backdrop-blur">
          <span className="text-lg font-extrabold tracking-wide text-[var(--color-brand-primary)]">
            BRIN
          </span>
          <CartBadgeLink />
        </header>
        {children}
      </body>
    </html>
  );
}
