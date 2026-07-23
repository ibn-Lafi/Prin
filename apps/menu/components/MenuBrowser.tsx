"use client";

import { useEffect, useState } from "react";
import { UtensilsCrossed } from "lucide-react";
import { isRestaurantOpen } from "@brin/utils";
import { createSupabaseBrowserClient } from "@brin/database";
import type { Category, Combo, Product } from "@/lib/types";
import { ProductCard } from "@/components/ProductCard";
import { ComboCard } from "@/components/ComboCard";
import { ProductModal } from "@/components/ProductModal";
import { ClosedBanner } from "@/components/ClosedBanner";
import { FloatingCartBar } from "@/components/FloatingCartBar";

const COMBOS_TAB_ID = "__combos__";

function isVisible(row: { is_available: boolean; deleted_at: string | null }): boolean {
  return row.is_available && row.deleted_at === null;
}

export function MenuBrowser({
  categories,
  products: initialProducts,
  combos: initialCombos,
  initialOpeningTime,
  initialClosingTime,
  initialIsAcceptingOrders,
}: {
  categories: Category[];
  products: Product[];
  combos: Combo[];
  initialOpeningTime: string;
  initialClosingTime: string;
  initialIsAcceptingOrders: boolean;
}) {
  const [activeTab, setActiveTab] = useState<string>(categories[0]?.id ?? COMBOS_TAB_ID);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [products, setProducts] = useState(initialProducts);
  const [combos, setCombos] = useState(initialCombos);
  const [openingTime, setOpeningTime] = useState(initialOpeningTime);
  const [closingTime, setClosingTime] = useState(initialClosingTime);
  const [isAcceptingOrders, setIsAcceptingOrders] = useState(initialIsAcceptingOrders);

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
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "restaurant_settings" },
        (payload) => {
          const updated = payload.new as {
            opening_time: string;
            closing_time: string;
            is_accepting_orders: boolean;
          };
          setOpeningTime(updated.opening_time);
          setClosingTime(updated.closing_time);
          setIsAcceptingOrders(updated.is_accepting_orders);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const isOpen = isRestaurantOpen(openingTime, closingTime, isAcceptingOrders);
  const visibleProducts = products.filter((p) => isVisible(p) && p.category_id === activeTab);
  const visibleCombos = combos.filter(isVisible);

  return (
    <main className="mx-auto max-w-3xl pb-28">
      {!isOpen && (
        <div className="px-4 pt-4">
          <ClosedBanner />
        </div>
      )}

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
              <ComboCard key={combo.id} combo={combo} disabled={!isOpen} />
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
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          disabled={!isOpen}
        />
      )}

      <FloatingCartBar />
    </main>
  );
}
