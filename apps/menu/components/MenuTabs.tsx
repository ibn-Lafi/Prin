// شريط تبويبات مسطّح (نص + خط سفلي عند التفعيل فقط، بدون فواصل رأسية) —
// يُستخدم لتبويبات القسم الفرعي (تصنيفات برجر، أو "استبدل" بصفحة المكافآت).
export function FlatTab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative shrink-0 whitespace-nowrap px-2.5 py-3 text-[15px] transition-colors"
    >
      <span className={active ? "font-bold text-[var(--color-brand-text)]" : "text-[var(--color-brand-muted)]"}>
        {label}
      </span>
      {active && (
        <span className="absolute inset-x-2.5 -bottom-px h-0.5 rounded-full bg-[var(--color-brand-primary)]" />
      )}
    </button>
  );
}

export function TabRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto border-b border-[var(--color-brand-border)] px-4">
      {children}
    </div>
  );
}
