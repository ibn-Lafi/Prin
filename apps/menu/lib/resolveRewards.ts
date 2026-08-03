import type { Reward } from "@/lib/types";

type RawRewardWithLink = {
  id: string;
  name: string | null;
  description: string | null;
  points_cost: number;
  discount_amount: number;
  image_url: string | null;
  product_id: string | null;
  combo_id: string | null;
  products: { name: string; price: number; image_url: string | null } | null;
  combos: { name: string; price: number; image_url: string | null } | null;
};

/** المكافآت المربوطة بصنف/وجبة (product_id/combo_id) تُعرض بالاسم والصورة
 * والسعر الحيّين للصنف نفسه بدل القيم المخزّنة بجدول rewards — نفس منطق create_pos_order.
 * تحمل أيضاً هوية الصنف/الوجبة المرتبطة (linkedItem) عشان يمكن إضافتها تلقائياً
 * للسلة وقت الاستبدال — راجع MenuBrowser.tsx. */
export function resolveRewards(rawRewards: unknown): Reward[] {
  return ((rawRewards ?? []) as RawRewardWithLink[]).map((reward) => {
    const linked = reward.products ?? reward.combos;
    return {
      id: reward.id,
      name: linked?.name ?? reward.name ?? "",
      description: linked ? null : reward.description,
      points_cost: reward.points_cost,
      discount_amount: linked?.price ?? reward.discount_amount,
      image_url: linked?.image_url ?? reward.image_url,
      linkedItem: reward.product_id
        ? { kind: "product" as const, refId: reward.product_id }
        : reward.combo_id
          ? { kind: "combo" as const, refId: reward.combo_id }
          : null,
    };
  });
}
