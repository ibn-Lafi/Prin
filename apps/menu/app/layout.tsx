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
        <header className="flex items-center justify-between border-b px-4 py-3">
          <span className="font-bold">BRIN</span>
          <CartBadgeLink />
        </header>
        {children}
      </body>
    </html>
  );
}
