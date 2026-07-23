"use client";

import { useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Beef, CupSoda, IceCreamCone, Search, Soup, UtensilsCrossed } from "lucide-react";
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

function iconForCategory(name: string): LucideIcon {
  if (name.includes("برجر")) return Beef;
  if (name.includes("مشروب")) return CupSoda;
  if (name.includes("حلو")) return IceCreamCone;
  if (name.includes("اضاف") || name.includes("إضاف") || name.includes("مقبل")) return Soup;
  return UtensilsCrossed;
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
  const [searchQuery, setSearchQuery] = useState("");

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

  const query = searchQuery.trim().toLowerCase();
  const isSearching = query.length > 0;

  const searchedProducts = useMemo(
    () => products.filter((p) => isVisible(p) && p.name.toLowerCase().includes(query)),
    [products, query],
  );
  const searchedCombos = useMemo(
    () => combos.filter((c) => isVisible(c) && c.name.toLowerCase().includes(query)),
    [combos, query],
  );

  const visibleProducts = products.filter((p) => isVisible(p) && p.category_id === activeTab);
  const visibleCombos = combos.filter(isVisible);

  return (
    <main className="mx-auto max-w-5xl pb-28">
      <div className="sticky top-[61px] z-20 -mx-px flex flex-col gap-3 bg-[var(--color-brand-background)]/95 px-4 py-3 backdrop-blur">
        <label className="flex items-center gap-2.5 rounded-full bg-[var(--color-brand-card)] px-4 py-3 shadow-sm ring-1 ring-[var(--color-brand-border)]">
          <Search className="h-4.5 w-4.5 shrink-0 text-[var(--color-brand-muted)]" strokeWidth={2} />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث في المنيو"
            className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--color-brand-muted)]"
          />
        </label>

        {!isSearching && (
          <div className="flex gap-6 overflow-x-auto">
            {categories.map((category) => {
              const Icon = iconForCategory(category.name);
              const active = activeTab === category.id;
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setActiveTab(category.id)}
                  className={`flex shrink-0 flex-col items-center gap-1.5 border-b-2 pb-2 transition-colors ${
                    active ? "border-[var(--color-brand-text)]" : "border-transparent"
                  }`}
                >
                  <Icon
                    className={active ? "h-5 w-5 text-[var(--color-brand-text)]" : "h-5 w-5 text-[var(--color-brand-muted)]"}
                    strokeWidth={1.75}
                  />
                  <span
                    className={`text-xs whitespace-nowrap ${
                      active
                        ? "font-semibold text-[var(--color-brand-text)]"
                        : "font-medium text-[var(--color-brand-muted)]"
                    }`}
                  >
                    {category.name}
                  </span>
                </button>
              );
            })}
            {visibleCombos.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab(COMBOS_TAB_ID)}
                className={`flex shrink-0 flex-col items-center gap-1.5 border-b-2 pb-2 transition-colors ${
                  activeTab === COMBOS_TAB_ID ? "border-[var(--color-brand-text)]" : "border-transparent"
                }`}
              >
                <UtensilsCrossed
                  className={
                    activeTab === COMBOS_TAB_ID
                      ? "h-5 w-5 text-[var(--color-brand-text)]"
                      : "h-5 w-5 text-[var(--color-brand-muted)]"
                  }
                  strokeWidth={1.75}
                />
                <span
                  className={`text-xs whitespace-nowrap ${
                    activeTab === COMBOS_TAB_ID
                      ? "font-semibold text-[var(--color-brand-text)]"
                      : "font-medium text-[var(--color-brand-muted)]"
                  }`}
                >
                  الوجبات
                </span>
              </button>
            )}
          </div>
        )}
      </div>

      <div className="px-4 pt-4">
        {isSearching ? (
          searchedProducts.length === 0 && searchedCombos.length === 0 ? (
            <p className="py-10 text-center text-sm text-[var(--color-brand-muted)]">
              ما فيه نتائج مطابقة لـ &quot;{searchQuery.trim()}&quot;
            </p>
          ) : (
            <div className="flex flex-col gap-6">
              {searchedProducts.length > 0 && (
                <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4">
                  {searchedProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onSelect={() => setSelectedProduct(product)}
                    />
                  ))}
                </div>
              )}
              {searchedCombos.length > 0 && (
                <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4">
                  {searchedCombos.map((combo) => (
                    <ComboCard key={combo.id} combo={combo} />
                  ))}
                </div>
              )}
            </div>
          )
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4">
            {activeTab === COMBOS_TAB_ID
              ? visibleCombos.map((combo) => <ComboCard key={combo.id} combo={combo} />)
              : visibleProducts.map((product) => (
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
