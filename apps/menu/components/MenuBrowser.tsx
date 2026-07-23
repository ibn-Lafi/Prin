"use client";

import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { CupSoda, IceCreamCone, Popcorn, Sandwich, UtensilsCrossed } from "lucide-react";
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
  if (name.includes("برجر")) return Sandwich;
  if (name.includes("مشروب")) return CupSoda;
  if (name.includes("حلو")) return IceCreamCone;
  if (name.includes("اضاف") || name.includes("إضاف") || name.includes("مقبل")) return Popcorn;
  return UtensilsCrossed;
}

function CategoryTab({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex shrink-0 flex-col items-center gap-2 border-b-2 pb-2 transition-colors ${
        active ? "border-[var(--color-brand-text)]" : "border-transparent"
      }`}
    >
      <Icon
        className={active ? "h-6 w-6 text-[var(--color-brand-text)]" : "h-6 w-6 text-[var(--color-brand-muted)]"}
        strokeWidth={active ? 2.25 : 1.5}
      />
      <span
        className={`text-xs whitespace-nowrap ${
          active ? "font-semibold text-[var(--color-brand-text)]" : "font-medium text-[var(--color-brand-muted)]"
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
}: {
  categories: Category[];
  products: Product[];
  combos: Combo[];
}) {
  const hasVisibleCombos = initialCombos.some(isVisible);
  const [activeTab, setActiveTab] = useState<string>(
    hasVisibleCombos ? COMBOS_TAB_ID : (categories[0]?.id ?? COMBOS_TAB_ID),
  );
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
    <main className="mx-auto max-w-5xl pb-28">
      <div className="sticky top-[61px] z-20 -mx-px bg-[var(--color-brand-background)]/95 px-4 py-3 backdrop-blur">
        <div className="flex gap-7 overflow-x-auto">
          {visibleCombos.length > 0 && (
            <CategoryTab
              icon={UtensilsCrossed}
              label="الوجبات"
              active={activeTab === COMBOS_TAB_ID}
              onClick={() => setActiveTab(COMBOS_TAB_ID)}
            />
          )}
          {categories.map((category) => (
            <CategoryTab
              key={category.id}
              icon={iconForCategory(category.name)}
              label={category.name}
              active={activeTab === category.id}
              onClick={() => setActiveTab(category.id)}
            />
          ))}
        </div>
      </div>

      <div className="px-4 pt-4">
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
      </div>

      {selectedProduct && (
        <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
      )}

      <FloatingCartBar />
    </main>
  );
}
