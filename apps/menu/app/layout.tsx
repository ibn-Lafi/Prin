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
        <header className="sticky top-0 z-30 flex items-center justify-between bg-[var(--color-brand-background)]/95 px-4 py-3 backdrop-blur">
          <span className="text-xl font-extrabold tracking-tight text-[var(--color-brand-primary)]">
            BRIN
          </span>
          <CartBadgeLink />
        </header>
        {children}
      </body>
    </html>
  );
}
