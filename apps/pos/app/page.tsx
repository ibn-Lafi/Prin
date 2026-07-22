import { BRAND_COLORS } from "@brin/config";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <div
        className="rounded-lg px-6 py-4 text-white"
        style={{ backgroundColor: BRAND_COLORS.primary }}
      >
        BRIN — الكاشير (قيد الإنشاء)
      </div>
    </main>
  );
}
