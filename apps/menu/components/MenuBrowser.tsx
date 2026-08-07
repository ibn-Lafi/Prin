"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { createSupabaseBrowserClient } from "@brin/database";
import type { Branch, Category, Combo, Product } from "@/lib/types";
import { ProductCard } from "@/components/ProductCard";
import { ComboCard } from "@/components/ComboCard";
import { ProductModal } from "@/components/ProductModal";
import { SectionSwitcher } from "@/components/SectionSwitcher";
import { FlatTab, TabRow } from "@/components/MenuTabs";
import { BranchSelectorCard } from "@/components/BranchSelectorCard";

const COMBOS_TAB_ID = "__combos__";

function isVisible(row: { is_available: boolean; deleted_at: string | null }): boolean {
  return row.is_available && row.deleted_at === null;
}

function matchesQuery(name: string, query: string): boolean {
  return !query || name.toLowerCase().includes(query);
}

export function MenuBrowser({
  categories,
  products: initialProducts,
  combos: initialCombos,
  branches,
}: {
  categories: Category[];
  products: Product[];
  combos: Combo[];
  branches: Branch[];
}) {
  const [activeTab, setActiveTab] = useState<string>(categories[0]?.id ?? COMBOS_TAB_ID);
  const [selectedItem, setSelectedItem] = useState<
    { kind: "product"; item: Product } | { kind: "combo"; item: Combo } | null
  >(null);
  const [products, setProducts] = useState(initialProducts);
  const [combos, setCombos] = useState(initialCombos);
  const [query, setQuery] = useState("");

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
  const isSearching = q.length > 0;
  const allProducts = products.filter(isVisible);
  const allCombos = combos.filter(isVisible);

  // أثناء البحث نتجاهل التبويب النشط ونطابق القائمة كاملة — قبل هذا التعديل
  // كان البحث يقتصر على تبويب الصنف الحالي فقط، فيرجع نتيجة فارغة لصنف موجود
  // فعلاً بتبويب آخر، وهذا مربك جداً للعميل. خارج البحث نرجع لتصفح التبويبات
  // العادي كالمعتاد.
  const visibleCombos = isSearching
    ? allCombos.filter((c) => matchesQuery(c.name, q))
    : activeTab === COMBOS_TAB_ID
      ? allCombos
      : [];
  const visibleProducts = isSearching
    ? allProducts.filter((p) => matchesQuery(p.name, q))
    : activeTab === COMBOS_TAB_ID
      ? []
      : allProducts.filter((p) => p.category_id === activeTab);

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
    <main className="mx-auto max-w-5xl pb-44">
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

      <div className="mt-3 px-4">
        <BranchSelectorCard branches={branches} />
      </div>

      <div className="sticky top-0 z-20 mt-5 bg-[var(--color-brand-background)]/95 pb-1 backdrop-blur">
        <SectionSwitcher />

        <TabRow>
          {categoryTabs.map((tab) => (
            <FlatTab
              key={tab.id}
              label={tab.label}
              active={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
            />
          ))}
        </TabRow>
      </div>

      <div className="px-4 pt-4">
        {isSearching && visibleCombos.length === 0 && visibleProducts.length === 0 ? (
          <p className="py-10 text-center text-sm text-[var(--color-brand-muted)]">
            لا توجد نتائج لـ &quot;{query.trim()}&quot;
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4">
            {(isSearching || activeTab === COMBOS_TAB_ID) &&
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
