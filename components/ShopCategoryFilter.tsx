"use client"

import { useState } from "react"
import Link from "next/link"

interface Product {
  id: number
  name: string
  price: bigint
  cover_image_url: string | null
  product_type: string
  stock: number | null
  category: { key: string; label: string } | null
}

interface Props {
  products: Product[]
  username: string
}

function formatUGX(n: bigint) {
  return new Intl.NumberFormat("en-UG", { style: "currency", currency: "UGX", maximumFractionDigits: 0 }).format(Number(n))
}

export function ShopCategoryFilter({ products, username }: Props) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  // Build unique category list from products that have one
  const categories = Array.from(
    new Map(
      products
        .filter((p) => p.category !== null)
        .map((p) => [p.category!.key, p.category!.label]),
    ).entries(),
  )

  const filtered = activeCategory
    ? products.filter((p) => p.category?.key === activeCategory)
    : products

  // Only show tabs if there are 2+ distinct categories
  const showTabs = categories.length >= 2

  return (
    <div className="space-y-4">
      {showTabs && (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          <button
            onClick={() => setActiveCategory(null)}
            className={[
              "shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border",
              activeCategory === null
                ? "bg-foreground text-background border-foreground"
                : "border-border text-muted-foreground hover:border-foreground/40",
            ].join(" ")}
          >
            All
          </button>
          {categories.map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveCategory(key)}
              className={[
                "shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border",
                activeCategory === key
                  ? "bg-foreground text-background border-foreground"
                  : "border-border text-muted-foreground hover:border-foreground/40",
              ].join(" ")}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">No products in this category.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((p) => (
            <Link
              key={p.id}
              href={`/${username}/shop/${p.id}`}
              className="block bg-background border border-border rounded-xl overflow-hidden hover:border-primary/40 transition-colors"
            >
              {p.cover_image_url && (
                <img src={p.cover_image_url} alt="" className="w-full h-28 object-cover" />
              )}
              <div className="px-4 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{p.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {p.category?.label ?? (p.product_type === "DIGITAL" ? "Digital" : "Physical")}
                    {p.stock !== null && ` · ${p.stock} left`}
                  </p>
                </div>
                <p className="text-sm font-semibold shrink-0">{formatUGX(p.price)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
