# Feature 64 — Product Categories & Shop Discovery

## Status
Greenlit — build alongside or immediately after v3 Feature 43 (Fan Accounts). Required before the shop becomes publicly discoverable.

## Date
2026-05-25

## Context Links
- `docs/v2/features/39-shop.md` — shop foundation (was "out of scope" there, now promoted here)
- `docs/v3/V3-ARCHITECTURE.md` — ProductCategory model
- `docs/v3/features/55-fan-discovery.md` — fan-side discovery (categories feed into this)

## Why

Without categories, a Business creator's shop is a flat list. Buyers cannot filter by type. The platform cannot aggregate "All shirts from all shops." Categories solve both problems:

1. **Per-shop organisation** — merchant tags each product with a category. Buyers can filter the shop by category (e.g., show only Shirts).
2. **Platform-wide sorting** — Sub-tree can show trending products by category across all shops, enabling cross-shop discovery.
3. **Affiliate clarity** — when a promoter is granted access to products, they can filter by category to find what's relevant to their audience.

---

## Category List (v1 — extensible by admin)

| Key | Label |
|---|---|
| `clothing_tops` | Tops & Shirts |
| `clothing_bottoms` | Bottoms & Trousers |
| `clothing_dresses` | Dresses |
| `clothing_outerwear` | Jackets & Coats |
| `accessories` | Accessories |
| `footwear` | Footwear |
| `music` | Music & Beats |
| `movies_video` | Movies & Videos |
| `digital_art` | Digital Art |
| `ebooks_pdfs` | eBooks & PDFs |
| `software` | Software & Tools |
| `courses` | Courses & Tutorials |
| `photography` | Photography |
| `wallpapers` | Wallpapers & Backgrounds |
| `other_digital` | Other Digital |
| `food_drink` | Food & Drink |
| `beauty` | Beauty & Skincare |
| `home` | Home & Living |
| `other_physical` | Other Physical |

Admin can add new categories via the Platform Settings admin panel. Categories are stored in `ProductCategory` table (not hardcoded).

---

## Data Model

```prisma
model ProductCategory {
  id         Int       @id @default(autoincrement())
  key        String    @unique
  label      String
  type       String    // "digital" | "physical" | "both"
  position   Int       @default(0)   // display order
  active     Boolean   @default(true)
  created_at DateTime  @default(now())

  products   Product[]
}
```

Add to `Product`:
```prisma
category_id  Int?
category     ProductCategory? @relation(fields: [category_id], references: [id])
```

---

## Shop Page Behaviour

### Creator's public shop (`/[username]/shop`)

- Category filter tabs across the top: "All" + any category that has at least one active product in this shop
- Default: "All" tab selected
- Clicking a category tab filters the product grid client-side (no page reload)
- URL updates to `?category=clothing_tops` for shareability

### Dashboard shop management (`/dashboard/shop`)

- Product list has a category column
- "Add Product" form includes a required category dropdown (or "Unclassified" fallback)
- Category filter on the product list so merchant can view all Shirts, all Movies, etc.
- Bulk re-categorise action (select multiple products → change category)

### Platform-wide discovery (connects to Feature 55)

- `GET /api/public/categories/[key]/products` — paginated list of active products across all shops in this category, sorted by: Most purchased | Newest | Price ascending | Price descending
- Powers a "Browse by category" page and fan discovery sections
- Category pages are public, no login required to browse

---

## API Surface

```
# Public
GET    /api/public/categories              — list all active categories
GET    /api/public/categories/[key]/products — paginated products in category (cross-shop)

# Merchant
GET    /api/shop/products?category=[key]   — filter my products by category
PATCH  /api/shop/products/[id]             — existing; category_id now included

# Admin
POST   /api/admin/categories               — create new category
PATCH  /api/admin/categories/[id]          — rename, reorder, deactivate
```

---

## Scope

### In scope
- Category table seeded with v1 list above
- Required category field on product creation (frontend validation; API allows null with "Unclassified" fallback)
- Per-shop category filter tabs on public shop page
- Dashboard category filter on product list
- Cross-shop category browsing endpoint
- Admin can add/edit/deactivate categories via admin panel

### Out of scope
- Multi-category products (one category per product at v3)
- Nested subcategories (flat list at v3)
- AI-suggested categories on product creation
- Category-specific fee rates (all use `fee_shop_business` / `fee_shop_content_house` from Feature 63)

---

## Success Criteria

1. A merchant tags a product as "Dresses" — it appears under the Dresses filter tab on their shop page
2. `GET /api/public/categories/clothing_dresses/products` returns products from all shops in this category, sorted by most purchased
3. Admin creates a new "Sports" category from the admin panel — it immediately appears in the product creation dropdown
4. A shop with only one category shows no filter tabs (all products are in that category, no need to filter)
5. Product creation without a category defaults to "Unclassified" and is still saved successfully
