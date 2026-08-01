import { Sparkles } from "lucide-react";

export function MenuHeader({ pointsBalance }: { pointsBalance: number | null }) {
  return (
    <header className="rounded-b-[2rem] bg-[var(--color-brand-primary)] px-4 pt-5 pb-10 shadow-lg shadow-black/10">
      <div className="flex items-center justify-between">
        <div className="flex w-16 justify-start">
          {pointsBalance !== null && (
            <span className="flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1.5 text-xs font-semibold text-white">
              <Sparkles className="h-3.5 w-3.5" strokeWidth={2} />
              {pointsBalance}
            </span>
          )}
        </div>
        <span className="text-2xl font-extrabold tracking-tight text-white">BRIN</span>
        <div className="w-16" />
      </div>
    </header>
  );
}
