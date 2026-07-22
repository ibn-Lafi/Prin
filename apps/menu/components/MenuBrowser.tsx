"use client";

import { useState } from "react";
import type { Category, Combo, Product } from "@/lib/types";
import { ProductCard } from "@/components/ProductCard";
import { ComboCard } from "@/components/ComboCard";
import { ProductModal } from "@/components/ProductModal";

const COMBOS_TAB_ID = "__combos__";

export function MenuBrowser({
  categories,
  products,
  combos,
}: {
  categories: Category[];
  products: Product[];
  combos: Combo[];
}) {
  const [activeTab, setActiveTab] = useState<string>(categories[0]?.id ?? COMBOS_TAB_ID);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const visibleProducts = products.filter((p) => p.category_id === activeTab);

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-6 flex gap-2 overflow-x-auto border-b pb-2">
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => setActiveTab(category.id)}
            className={`shrink-0 rounded-full px-4 py-2 ${
              activeTab === category.id
                ? "bg-[var(--color-brand-primary)] text-white"
                : "bg-gray-100"
            }`}
          >
            {category.name}
          </button>
        ))}
        {combos.length > 0 && (
          <button
            type="button"
            onClick={() => setActiveTab(COMBOS_TAB_ID)}
            className={`shrink-0 rounded-full px-4 py-2 ${
              activeTab === COMBOS_TAB_ID
                ? "bg-[var(--color-brand-primary)] text-white"
                : "bg-gray-100"
            }`}
          >
            الوجبات
          </button>
        )}
      </div>

      {activeTab === COMBOS_TAB_ID ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {combos.map((combo) => (
            <ComboCard key={combo.id} combo={combo} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {visibleProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onSelect={() => setSelectedProduct(product)}
            />
          ))}
        </div>
      )}

      {selectedProduct && (
        <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
      )}
    </main>
  );
}
