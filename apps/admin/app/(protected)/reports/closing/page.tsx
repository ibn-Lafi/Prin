import { createSupabaseServiceRoleClient } from "@/lib/supabaseClient";
import { CashClosingForm } from "@/components/CashClosingForm";

function todayInRiyadh(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Riyadh" });
}

type OrderPaymentsRow = { payments: { method: string; amount: number }[] };

export default async function CashClosingPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const params = await searchParams;
  const closingDate = params.date || todayInRiyadh();

  const supabase = createSupabaseServiceRoleClient();

  const [{ data: rawOrders }, { data: existing }] = await Promise.all([
    supabase
      .from("orders")
      .select("payments ( method, amount )")
      .in("status", ["received", "accepted", "completed"])
      .eq("order_date", closingDate),
    supabase
      .from("cash_closings")
      .select("expected_cash, actual_cash, difference, notes")
      .eq("closing_date", closingDate)
      .maybeSingle(),
  ]);

  const orders = (rawOrders ?? []) as unknown as OrderPaymentsRow[];
  const expectedCash = orders.reduce((sum, order) => {
    const cashAmount = order.payments.filter((p) => p.method === "cash").reduce((s, p) => s + p.amount, 0);
    return sum + cashAmount;
  }, 0);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">الإقفال اليومي</h1>
      <CashClosingForm closingDate={closingDate} expectedCash={expectedCash} existing={existing ?? null} />
    </div>
  );
}
