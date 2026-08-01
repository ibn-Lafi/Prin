import { ShoppingBag, Wallet, Utensils, Monitor } from "lucide-react";
import { formatCurrency } from "@brin/utils";
import { createSupabaseServiceRoleClient } from "@/lib/supabaseClient";

function todayInRiyadh(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Riyadh" });
}

export default async function DashboardPage() {
  const supabase = createSupabaseServiceRoleClient();
  const today = todayInRiyadh();

  const { data: orders } = await supabase
    .from("orders")
    .select("total, channel")
    .eq("order_date", today)
    .in("status", ["received", "accepted", "completed"]);

  const orderCount = orders?.length ?? 0;
  const totalSales = (orders ?? []).reduce((sum, o) => sum + o.total, 0);
  const averageOrder = orderCount > 0 ? totalSales / orderCount : 0;
  const posCount = (orders ?? []).filter((o) => o.channel === "pos").length;
  const onlineCount = (orders ?? []).filter((o) => o.channel === "online").length;

  const stats = [
    { label: "طلبات اليوم", value: orderCount.toString(), icon: ShoppingBag },
    { label: "مبيعات اليوم", value: formatCurrency(totalSales), icon: Wallet },
    { label: "متوسط الطلب", value: formatCurrency(averageOrder), icon: Wallet },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">الرئيسية</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex items-center gap-3 rounded-2xl bg-[var(--color-brand-card)] p-5 ring-1 ring-[var(--color-brand-border)]"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-brand-primary-light)]">
              <stat.icon className="h-5 w-5 text-[var(--color-brand-primary)]" strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-sm text-[var(--color-brand-muted)]">{stat.label}</p>
              <p className="text-xl font-bold">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex items-center gap-3 rounded-2xl bg-[var(--color-brand-card)] p-5 ring-1 ring-[var(--color-brand-border)]">
          <Monitor className="h-5 w-5 text-[var(--color-brand-muted)]" strokeWidth={1.75} />
          <div>
            <p className="text-sm text-[var(--color-brand-muted)]">طلبات الكاشير</p>
            <p className="text-lg font-bold">{posCount}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl bg-[var(--color-brand-card)] p-5 ring-1 ring-[var(--color-brand-border)]">
          <Utensils className="h-5 w-5 text-[var(--color-brand-muted)]" strokeWidth={1.75} />
          <div>
            <p className="text-sm text-[var(--color-brand-muted)]">طلبات المنيو الإلكتروني</p>
            <p className="text-lg font-bold">{onlineCount}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
