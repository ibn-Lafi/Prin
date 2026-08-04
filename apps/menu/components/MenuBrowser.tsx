"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Gift, Search, UtensilsCrossed, type LucideIcon } from "lucide-react";
import { createSupabaseBrowserClient } from "@brin/database";
import { useCart } from "@/hooks/useCart";
import type { Category, Combo, Product, Reward } from "@/lib/types";
import { ProductCard } from "@/components/ProductCard";
import { ComboCard } from "@/components/ComboCard";
import { RewardCard } from "@/components/RewardCard";
import { ProductModal } from "@/components/ProductModal";

const COMBOS_TAB_ID = "__combos__";

function isVisible(row: { is_available: boolean; deleted_at: string | null }): boolean {
  return row.is_available && row.deleted_at === null;
}

function matchesQuery(name: string, query: string): boolean {
  return !query || name.toLowerCase().includes(query);
}

// شريط تبويبات مسطّح (نص + خط سفلي عند التفعيل، فواصل رأسية بين العناصر) —
// يُستخدم للمستويين معاً (القسم الرئيسي وتبويبات القسم الفرعي).
function FlatTab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative shrink-0 whitespace-nowrap px-3.5 py-3 text-[15px] transition-colors"
    >
      <span className={active ? "font-bold text-[var(--color-brand-text)]" : "text-[var(--color-brand-muted)]"}>
        {label}
      </span>
      {active && (
        <span className="absolute inset-x-3.5 -bottom-px h-0.5 rounded-full bg-[var(--color-brand-primary)]" />
      )}
    </button>
  );
}

function TabRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex divide-x divide-x-reverse divide-[var(--color-brand-border)] overflow-x-auto border-b border-[var(--color-brand-border)] px-4">
      {children}
    </div>
  );
}

// مفتاح القسم الرئيسي (برجر/مكافآت): كبسولة عائمة، أيقونة فوق نص، والقسم
// النشط يأخذ خلفية دائرية ملوّنة بدل خط سفلي — مستوى مختلف كلياً عن FlatTab.
function IconTab({
  label,
  icon: Icon,
  active,
  onClick,
}: {
  label: string;
  icon: LucideIcon;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 flex-col items-center gap-1 rounded-full px-5 py-2.5 transition-colors ${
        active ? "bg-[var(--color-brand-primary-light)]" : ""
      }`}
    >
      <Icon
        className={active ? "h-5 w-5 text-[var(--color-brand-primary)]" : "h-5 w-5 text-[var(--color-brand-text)]"}
        strokeWidth={active ? 2.25 : 1.75}
      />
      <span
        className={`text-xs ${active ? "font-semibold text-[var(--color-brand-text)]" : "text-[var(--color-brand-muted)]"}`}
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
  const [topSection, setTopSection] = useState<"food" | "rewards">("food");
  const [activeTab, setActiveTab] = useState<string>(categories[0]?.id ?? COMBOS_TAB_ID);
  const [selectedItem, setSelectedItem] = useState<
    { kind: "product"; item: Product } | { kind: "combo"; item: Combo } | null
  >(null);
  const [products, setProducts] = useState(initialProducts);
  const [combos, setCombos] = useState(initialCombos);
  const [query, setQuery] = useState("");
  const router = useRouter();
  const { selectedRewardId, selectReward, addItem } = useCart();

  // مكافأة مربوطة بصنف/وجبة حقيقية (مثل "وجبة كلاسيك مجانية") يُقدر يستبدلها
  // العميل لوحدها بدون شراء أي شيء إضافي — الصنف/الوجبة نفسها تُضاف للسلة
  // تلقائياً هنا (خصمها لاحقاً بالدفع = سعرها بالضبط، فتصير مجانية فعلياً).
  // مكافأة عامة (خصم نقدي بدون ربط) تبقى تحتاج العميل يضيف صنفاً بنفسه.
  function handleRewardTap(reward: Reward) {
    if (reward.linkedItem && selectedRewardId !== reward.id) {
      addItem({
        kind: reward.linkedItem.kind,
        refId: reward.linkedItem.refId,
        name: reward.name,
        unitPrice: reward.discount_amount,
        quantity: 1,
        modifiers: [],
      });
    }
    selectReward(reward.id);
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
    activeTab === COMBOS_TAB_ID
      ? []
      : allProducts.filter((p) => p.category_id === activeTab && matchesQuery(p.name, q));
  const visibleRewards = rewards.filter((r) => matchesQuery(r.name, q));

  // ترتيب تبويبات قسم "برجر" المطلوب: برجر - اضافات - وجبة - مشروبات —
  // تبويب الوجبات يُدرج مباشرة بعد صنف الإضافات.
  const categoryTabs: { id: string; label: string }[] = [];
  let combosTabInserted = false;
  for (const category of categories) {
    categoryTabs.push({ id: category.id, label: category.name });
    if (
      !combosTabInserted &&
      (category.name.includes("اضاف") || category.name.includes("إضاف")) &&
      allCombos.length > 0
    ) {
      categoryTabs.push({ id: COMBOS_TAB_ID, label: "وجبة" });
      combosTabInserted = true;
    }
  }
  if (!combosTabInserted && allCombos.length > 0) {
    categoryTabs.push({ id: COMBOS_TAB_ID, label: "وجبة" });
  }

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

      <div className="sticky top-0 z-20 mt-5 bg-[var(--color-brand-background)]/95 pb-1 backdrop-blur">
        <div className="px-4 pb-3">
          <div className="flex items-center gap-1 rounded-[28px] bg-[var(--color-brand-card)] p-1.5 shadow-lg shadow-black/10 ring-1 ring-black/5">
            <IconTab
              label="برجر"
              icon={UtensilsCrossed}
              active={topSection === "food"}
              onClick={() => setTopSection("food")}
            />
            <IconTab
              label="مكافآت"
              icon={Gift}
              active={topSection === "rewards"}
              onClick={() => setTopSection("rewards")}
            />
          </div>
        </div>

        <TabRow>
          {topSection === "food" ? (
            categoryTabs.map((tab) => (
              <FlatTab
                key={tab.id}
                label={tab.label}
                active={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
              />
            ))
          ) : (
            <FlatTab label="استبدل" active onClick={() => {}} />
          )}
        </TabRow>
      </div>

      <div className="px-4 pt-4">
        {topSection === "rewards" ? (
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
                    onSelect={() => handleRewardTap(reward)}
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
