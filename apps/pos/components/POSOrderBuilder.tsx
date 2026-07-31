"use client";

import { useState } from "react";
import type { Category, Combo, Product } from "@/lib/types";
import { ProductGrid } from "@/components/ProductGrid";
import { OrderTicket } from "@/components/OrderTicket";
import { CheckoutDialog } from "@/components/CheckoutDialog";

export function POSOrderBuilder({
  categories,
  products,
  combos,
  taxRatePercent,
}: {
  categories: Category[];
  products: Product[];
  combos: Combo[];
  taxRatePercent: number;
}) {
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      <div className="flex-1 overflow-hidden">
        <ProductGrid categories={categories} products={products} combos={combos} />
      </div>
      <OrderTicket taxRatePercent={taxRatePercent} onCheckout={() => setIsCheckoutOpen(true)} />

      {isCheckoutOpen && (
        <CheckoutDialog taxRatePercent={taxRatePercent} onClose={() => setIsCheckoutOpen(false)} />
      )}
    </div>
  );
}
