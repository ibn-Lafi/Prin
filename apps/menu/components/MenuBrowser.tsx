"use client";

import { useEffect, useState } from "react";
import { UtensilsCrossed } from "lucide-react";
import { createSupabaseBrowserClient } from "@brin/database";
import type { Category, Combo, Product } from "@/lib/types";
import { ProductCard } from "@/components/ProductCard";
import { ComboCard } from "@/components/ComboCard";
import { ProductModal } from "@/components/ProductModal";
import { FloatingCartBar } from "@/components/FloatingCartBar";

const COMBOS_TAB_ID = "__combos__";

function isVisible(row: { is_available: boolean; deleted_at: string | null }): boolean {
  return row.is_available && row.deleted_at === null;
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
  const [activeTab, setActiveTab] = useState<string>(categories[0]?.id ?? COMBOS_TAB_ID);
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

  const visibleProducts = products.filter((p) => isVisible(p) && p.category_id === activeTab);
  const visibleCombos = combos.filter(isVisible);

  return (
    <main className="mx-auto max-w-3xl pb-28">
      <div className="sticky top-[57px] z-20 -mx-px bg-[var(--color-brand-background)]/95 px-4 py-3 backdrop-blur">
        <div className="flex gap-2 overflow-x-auto">
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => setActiveTab(category.id)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === category.id
                  ? "bg-[var(--color-brand-primary)] text-white"
                  : "bg-[var(--color-brand-card)] text-[var(--color-brand-muted)] ring-1 ring-[var(--color-brand-border)]"
              }`}
            >
              {category.name}
            </button>
          ))}
          {visibleCombos.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab(COMBOS_TAB_ID)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === COMBOS_TAB_ID
                  ? "bg-[var(--color-brand-primary)] text-white"
                  : "bg-[var(--color-brand-card)] text-[var(--color-brand-muted)] ring-1 ring-[var(--color-brand-border)]"
              }`}
            >
              <UtensilsCrossed className="h-4 w-4" strokeWidth={1.75} />
              الوجبات
            </button>
          )}
        </div>
      </div>

      <div className="px-4 pt-2">
        {activeTab === COMBOS_TAB_ID ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {visibleCombos.map((combo) => (
              <ComboCard key={combo.id} combo={combo} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {visibleProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onSelect={() => setSelectedProduct(product)}
              />
            ))}
          </div>
        )}
      </div>

      {selectedProduct && (
        <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
      )}

      <FloatingCartBar />
    </main>
  );
}
