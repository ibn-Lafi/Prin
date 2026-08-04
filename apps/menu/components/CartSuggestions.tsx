"use client";

import { useMemo, useState } from "react";
import { Plus, UtensilsCrossed } from "lucide-react";
import { formatCurrency } from "@brin/utils";
import type { CartSuggestionLink, Product } from "@/lib/types";
import { useCart } from "@/hooks/useCart";
import { ProductModal } from "@/components/ProductModal";

// اقتراحات إضافة سريعة سياقية يربطها الإدمن بصنف "مُحفِّز" مُحدَّد (مثل:
// إضافة برجر تقترح مشروب/صوص) — تظهر فقط لو المُحفِّز فعلاً بالسلة حالياً.
// الصنف بلا تعديلات إجبارية يُضاف مباشرة بضغطة واحدة، وإلا تُفتح نافذة
// اختيار التعديلات كالمعتاد.
export function CartSuggestions({ links }: { links: CartSuggestionLink[] }) {
  const { items, addItem } = useCart();
  const [openProduct, setOpenProduct] = useState<Product | null>(null);

  const triggeredProductIds = useMemo(
    () => new Set(items.filter((item) => item.kind === "product").map((item) => item.refId)),
    [items],
  );

  const suggestions = useMemo(() => {
    const seen = new Set<string>();
    const result: Product[] = [];
    for (const link of links) {
      if (!triggeredProductIds.has(link.triggerProductId)) continue;
      if (seen.has(link.product.id)) continue;
      seen.add(link.product.id);
      result.push(link.product);
    }
    return result;
  }, [links, triggeredProductIds]);

  if (suggestions.length === 0) return null;

  function handleTap(product: Product) {
    const hasRequiredModifiers = product.modifier_groups.some((g) => g.is_required);
    if (hasRequiredModifiers) {
      setOpenProduct(product);
      return;
    }
    addItem({
      kind: "product",
      refId: product.id,
      name: product.name,
      unitPrice: product.price,
      quantity: 1,
      modifiers: [],
    });
  }

  return (
    <div className="mt-6">
      <h2 className="mb-2.5 text-sm font-bold text-[var(--color-brand-text)]">أضف لطلبك</h2>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {suggestions.map((product) => (
          <button
            key={product.id}
            type="button"
            onClick={() => handleTap(product)}
            className="flex w-28 shrink-0 flex-col overflow-hidden rounded-2xl bg-[var(--color-brand-card)] text-right shadow-sm shadow-black/5"
          >
            <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden bg-[var(--color-brand-primary-light)]">
              {product.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
              ) : (
                <UtensilsCrossed className="h-7 w-7 text-[var(--color-brand-primary)]/40" strokeWidth={1.5} />
              )}
              <span className="absolute bottom-1.5 left-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-brand-primary)] shadow-sm">
                <Plus className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
              </span>
            </div>
            <div className="flex flex-col gap-0.5 p-2">
              <span className="line-clamp-1 text-xs font-semibold text-[var(--color-brand-text)]">
                {product.name}
              </span>
              <span className="text-xs font-bold text-[var(--color-brand-primary)]">
                {formatCurrency(product.price)}
              </span>
            </div>
          </button>
        ))}
      </div>

      {openProduct && (
        <ProductModal item={openProduct} kind="product" onClose={() => setOpenProduct(null)} />
      )}
    </div>
  );
}
