import { roundMoney } from "@brin/utils";
import { createSupabaseServiceRoleClient } from "@/lib/supabaseClient";
import type { CashierShift, ShiftTotals } from "@/lib/types";

type PosOrderRow = {
  employee_id: string | null;
  created_at: string;
  payments: { method: string; amount: number }[];
};

type OnlineOrderRow = {
  accepted_by_employee_id: string | null;
  accepted_at: string | null;
  payments: { method: string; amount: number }[];
};

// يحسب ملخص المبالغ (كاش/شبكة/إلكتروني) لعدة جلسات دفعة وحدة باستعلامين فقط
// (بدل استعلام لكل جلسة) — يجيب كل الطلبات اللي تقع بين أقدم فتح وأحدث إغلاق
// بين الجلسات المطلوبة، ثم يوزّعها بالذاكرة حسب موظف/نافذة وقت كل جلسة.
// الأعمدة تُحسب من دفعات payments الفعلية بغض النظر عن القناة (pos/online) —
// نفس منطق closeShiftAndSummarizeAction بتطبيق الكاشير تماماً.
export async function computeShiftTotalsMap(shifts: CashierShift[]): Promise<Map<string, ShiftTotals>> {
  const map = new Map<string, ShiftTotals>();
  if (shifts.length === 0) return map;

  const supabase = createSupabaseServiceRoleClient();
  const employeeIds = Array.from(new Set(shifts.map((s) => s.employee_id)));
  const nowIso = new Date().toISOString();
  let minOpened = shifts[0]!.opened_at;
  let maxClosed = shifts[0]!.closed_at ?? nowIso;
  for (const s of shifts) {
    if (s.opened_at < minOpened) minOpened = s.opened_at;
    const sClosed = s.closed_at ?? nowIso;
    if (sClosed > maxClosed) maxClosed = sClosed;
  }

  const [{ data: rawPosOrders }, { data: rawOnlineOrders }] = await Promise.all([
    supabase
      .from("orders")
      .select("employee_id, created_at, payments ( method, amount )")
      .eq("channel", "pos")
      .neq("status", "cancelled")
      .in("employee_id", employeeIds)
      .gte("created_at", minOpened)
      .lte("created_at", maxClosed),
    supabase
      .from("orders")
      .select("accepted_by_employee_id, accepted_at, payments ( method, amount )")
      .eq("channel", "online")
      .neq("status", "cancelled")
      .in("accepted_by_employee_id", employeeIds)
      .gte("accepted_at", minOpened)
      .lte("accepted_at", maxClosed),
  ]);

  const posOrders = (rawPosOrders ?? []) as unknown as PosOrderRow[];
  const onlineOrders = (rawOnlineOrders ?? []) as unknown as OnlineOrderRow[];

  for (const shift of shifts) {
    const closedAt = shift.closed_at ?? nowIso;
    let cash = 0;
    let cardTerminal = 0;
    let online = 0;

    for (const order of posOrders) {
      if (order.employee_id !== shift.employee_id) continue;
      if (order.created_at < shift.opened_at || order.created_at > closedAt) continue;
      for (const payment of order.payments ?? []) {
        if (payment.method === "cash") cash += payment.amount;
        else if (payment.method === "card_terminal") cardTerminal += payment.amount;
      }
    }

    for (const order of onlineOrders) {
      if (order.accepted_by_employee_id !== shift.employee_id) continue;
      if (!order.accepted_at || order.accepted_at < shift.opened_at || order.accepted_at > closedAt) continue;
      for (const payment of order.payments ?? []) {
        if (payment.method === "cash") cash += payment.amount;
        else if (payment.method === "card_terminal") cardTerminal += payment.amount;
        else if (payment.method === "online_moyasar") online += payment.amount;
      }
    }

    map.set(shift.id, {
      cash: roundMoney(cash),
      cardTerminal: roundMoney(cardTerminal),
      online: roundMoney(online),
      total: roundMoney(cash + cardTerminal + online),
    });
  }

  return map;
}
