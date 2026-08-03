"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Gift, Search, ShoppingBag, UtensilsCrossed, type LucideIcon } from "lucide-react";
import { createSupabaseBrowserClient } from "@brin/database";
import { useCart } from "@/hooks/useCart";
import type { Category, Combo, Product, Reward } from "@/lib/types";
import { ProductCard } from "@/components/ProductCard";
import { ComboCard } from "@/components/ComboCard";
import { RewardCard } from "@/components/RewardCard";
import { ProductModal } from "@/components/ProductModal";

const COMBOS_TAB_ID = "__combos__";
const REWARDS_TAB_ID = "__rewards__";

function isVisible(row: { is_available: boolean; deleted_at: string | null }): boolean {
  return row.is_available && row.deleted_at === null;
}

function matchesQuery(name: string, query: string): boolean {
  return !query || name.toLowerCase().includes(query);
}

function CategoryTab({
  label,
  active,
  icon: Icon,
  onClick,
}: {
  label: string;
  active: boolean;
  icon: LucideIcon;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className="flex shrink-0 flex-col items-center gap-1.5">
      <span
        className={`flex h-14 w-14 items-center justify-center rounded-full transition-all duration-100 active:scale-95 ${
          active
            ? "bg-[var(--color-brand-primary)] ring-2 ring-[var(--color-brand-primary)] ring-offset-2 ring-offset-[var(--color-brand-background)]"
            : "bg-[var(--color-brand-primary-light)]"
        }`}
      >
        <Icon className={`h-6 w-6 ${active ? "text-white" : "text-[var(--color-brand-primary)]"}`} strokeWidth={1.75} />
      </span>
      <span
        className={`whitespace-nowrap text-xs ${
          active ? "font-semibold text-[var(--color-brand-text)]" : "text-[var(--color-brand-muted)]"
        }`}
      >
        {label}
      </span>
    </button>
  );
}

export function MenuBrowser({
  categories,
  products: initialProducts,
  combos: initialCombos,
  rewards,
  pointsBalance,
}: {
  categories: Category[];
  products: Product[];
  combos: Combo[];
  rewards: Reward[];
  pointsBalance: number | null;
}) {
  const [activeTab, setActiveTab] = useState<string>(categories[0]?.id ?? COMBOS_TAB_ID);
  const [selectedItem, setSelectedItem] = useState<
    { kind: "product"; item: Product } | { kind: "combo"; item: Combo } | null
  >(null);
  const [products, setProducts] = useState(initialProducts);
  const [combos, setCombos] = useState(initialCombos);
  const [query, setQuery] = useState("");
  const router = useRouter();
  const { selectReward } = useCart();

  // نفس سلوك الضغط على صنف عادي بالضبط: يُختار ثم ينتقل مباشرة للسلة —
  // بدون حالة "مُختارة" معلّقة بالشبكة نفسها، لأن المستخدم يغادر الصفحة فوراً.
  function handleRewardTap(rewardId: string) {
    selectReward(rewardId);
    router.push("/cart");
  }

  // العميل يتصفح ويضيف للسلة عادي بأي وقت — تقييد ساعات العمل يظهر فقط
  // بصفحة الدفع (/checkout)، مو أثناء التصفح.
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    const channel = supabase
      .channel("menu-availability")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, (payload) => {
        setProducts((prev) => {
          if (payload.eventType === "DELETE") {
            return prev.filter((p) => p.id !== payload.old.id);
          }
          const updated = payload.new as Product;
          const exists = prev.some((p) => p.id === updated.id);
          if (!exists) return [...prev, { ...updated, modifier_groups: [] }];
          return prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p));
        });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "combos" }, (payload) => {
        setCombos((prev) => {
          if (payload.eventType === "DELETE") {
            return prev.filter((c) => c.id !== payload.old.id);
          }
          const updated = payload.new as Combo;
          const exists = prev.some((c) => c.id === updated.id);
          if (!exists) return [...prev, { ...updated, modifier_groups: [] }];
          return prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c));
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const q = query.trim().toLowerCase();
  const allProducts = products.filter(isVisible);
  const allCombos = combos.filter(isVisible);
  const visibleCombos = allCombos.filter((c) => matchesQuery(c.name, q));
  const visibleProducts =
    activeTab === COMBOS_TAB_ID || activeTab === REWARDS_TAB_ID
      ? []
      : allProducts.filter((p) => p.category_id === activeTab && matchesQuery(p.name, q));
  const visibleRewards = rewards.filter((r) => matchesQuery(r.name, q));

  // ترتيب التبويبات المطلوب: برجر - اضافات - وجبة - مشروبات - استبدل —
  // تبويب الوجبات يُدرج مباشرة بعد صنف الإضافات، وتبويب الاستبدال بالنقاط دائماً في النهاية.
  const categoryTabs: { id: string; label: string; icon: LucideIcon }[] = [];
  let combosTabInserted = false;
  for (const category of categories) {
    categoryTabs.push({ id: category.id, label: category.name, icon: UtensilsCrossed });
    if (
      !combosTabInserted &&
      (category.name.includes("اضاف") || category.name.includes("إضاف")) &&
      allCombos.length > 0
    ) {
      categoryTabs.push({ id: COMBOS_TAB_ID, label: "وجبة", icon: ShoppingBag });
      combosTabInserted = true;
    }
  }
  if (!combosTabInserted && allCombos.length > 0) {
    categoryTabs.push({ id: COMBOS_TAB_ID, label: "وجبة", icon: ShoppingBag });
  }
  categoryTabs.push({ id: REWARDS_TAB_ID, label: "استبدل", icon: Gift });

  return (
    <main className="mx-auto max-w-5xl pb-32">
      <div className="relative z-10 -mt-7 px-4">
        <label className="flex items-center gap-2.5 rounded-full bg-[var(--color-brand-card)] px-4 py-3.5 shadow-lg shadow-black/10 ring-1 ring-black/5">
          <Search className="h-4.5 w-4.5 shrink-0 text-[var(--color-brand-muted)]" strokeWidth={2} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث في القائمة..."
            className="w-full bg-transparent text-sm text-[var(--color-brand-text)] outline-none placeholder:text-[var(--color-brand-muted)]"
          />
        </label>
      </div>

      <div className="sticky top-0 z-20 bg-[var(--color-brand-background)]/95 px-4 pt-5 pb-2 backdrop-blur">
        <div className="flex gap-4 overflow-x-auto py-1.5">
          {categoryTabs.map((tab) => (
            <CategoryTab
              key={tab.id}
              label={tab.label}
              icon={tab.icon}
              active={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
            />
          ))}
        </div>
      </div>

      <div className="px-4 pt-4">
        {activeTab === REWARDS_TAB_ID ? (
          <div className="flex flex-col gap-4">
            <p className="text-xs text-[var(--color-brand-muted)]">
              اختر مكافأة لاستبدالها — تُطبَّق تلقائياً على طلبك بصفحة السلة.
            </p>

            {visibleRewards.length === 0 ? (
              <p className="py-10 text-center text-sm text-[var(--color-brand-muted)]">
                لا توجد مكافآت متاحة حالياً.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4">
                {visibleRewards.map((reward) => (
                  <RewardCard
                    key={reward.id}
                    reward={reward}
                    pointsBalance={pointsBalance}
                    onSelect={() => handleRewardTap(reward.id)}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4">
            {activeTab === COMBOS_TAB_ID &&
              visibleCombos.map((combo) => (
                <ComboCard
                  key={combo.id}
                  combo={combo}
                  onSelect={() => setSelectedItem({ kind: "combo", item: combo })}
                />
              ))}
            {visibleProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onSelect={() => setSelectedItem({ kind: "product", item: product })}
              />
            ))}
          </div>
        )}
      </div>

      {selectedItem && (
        <ProductModal
          item={selectedItem.item}
          kind={selectedItem.kind}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </main>
  );
}
