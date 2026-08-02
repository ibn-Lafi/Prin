import type { Reward } from "@/lib/types";

type RawRewardWithLink = {
  id: string;
  name: string | null;
  description: string | null;
  points_cost: number;
  discount_amount: number;
  image_url: string | null;
  products: { name: string; price: number; image_url: string | null } | null;
  combos: { name: string; price: number; image_url: string | null } | null;
};

/** المكافآت المربوطة بصنف/وجبة (product_id/combo_id) تُعرض بالاسم والصورة
 * والسعر الحيّين للصنف نفسه بدل القيم المخزّنة بجدول rewards — نفس منطق create_pos_order. */
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
    };
  });
}
