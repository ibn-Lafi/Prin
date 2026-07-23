"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@brin/database";
import type { Category, Combo, Product } from "@/lib/types";
import { ProductCard } from "@/components/ProductCard";
import { ComboCard } from "@/components/ComboCard";
import { ProductModal } from "@/components/ProductModal";
import { FloatingCartBar } from "@/components/FloatingCartBar";

const ALL_TAB_ID = "__all__";
const COMBOS_TAB_ID = "__combos__";

function isVisible(row: { is_available: boolean; deleted_at: string | null }): boolean {
  return row.is_available && row.deleted_at === null;
}

function CategoryTab({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 whitespace-nowrap rounded-full bg-[var(--color-brand-card)] px-3.5 py-2 text-sm shadow-md shadow-black/5 transition-all duration-100 active:translate-y-0.5 active:shadow-sm ${
        active
          ? "font-semibold text-[var(--color-brand-text)] ring-2 ring-[var(--color-brand-text)]"
          : "font-medium text-[var(--color-brand-muted)] ring-1 ring-[var(--color-brand-border)]"
      }`}
    >
      {label}
    </button>
  );
}

export function MenuBrowser({
  categories,
  products: initialProducts,
  combos: initialCombos,
}: {
  categories: Category[];
  products: Product[];
  combos: Combo[];
}) {
  const [activeTab, setActiveTab] = useState<string>(ALL_TAB_ID);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [products, setProducts] = useState(initialProducts);
  const [combos, setCombos] = useState(initialCombos);

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
          if (!exists) return [...prev, updated];
          return prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c));
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const allProducts = products.filter(isVisible);
  const visibleCombos = combos.filter(isVisible);

  const showCombos = activeTab === ALL_TAB_ID || activeTab === COMBOS_TAB_ID;
  const visibleProducts =
    activeTab === ALL_TAB_ID
      ? allProducts
      : activeTab === COMBOS_TAB_ID
        ? []
        : allProducts.filter((p) => p.category_id === activeTab);

  // ترتيب التبويبات المطلوب: الكل - برجر - وجبات - اضافات - مشروبات —
  // تبويب الوجبات يُدرج مباشرة بعد صنف البرجر بدل أن يكون ثابتاً بالبداية أو النهاية.
  const categoryTabs: { id: string; label: string }[] = [];
  let combosTabInserted = false;
  for (const category of categories) {
    categoryTabs.push({ id: category.id, label: category.name });
    if (!combosTabInserted && category.name.includes("برجر") && visibleCombos.length > 0) {
      categoryTabs.push({ id: COMBOS_TAB_ID, label: "الوجبات" });
      combosTabInserted = true;
    }
  }
  if (!combosTabInserted && visibleCombos.length > 0) {
    categoryTabs.unshift({ id: COMBOS_TAB_ID, label: "الوجبات" });
  }

  return (
    <main className="mx-auto max-w-5xl pb-28">
      <div className="sticky top-[61px] z-20 -mx-px bg-[var(--color-brand-background)]/95 px-4 py-3 backdrop-blur">
        <div className="flex gap-2.5 overflow-x-auto pb-1">
          <CategoryTab
            label="الكل"
            active={activeTab === ALL_TAB_ID}
            onClick={() => setActiveTab(ALL_TAB_ID)}
          />
          {categoryTabs.map((tab) => (
            <CategoryTab
              key={tab.id}
              label={tab.label}
              active={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
            />
          ))}
        </div>
      </div>

      <div className="px-4 pt-4">
        <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4">
          {showCombos && visibleCombos.map((combo) => <ComboCard key={combo.id} combo={combo} />)}
          {visibleProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onSelect={() => setSelectedProduct(product)}
            />
          ))}
        </div>
      </div>

      {selectedProduct && (
        <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
      )}

      <FloatingCartBar />
    </main>
  );
}
