

# Plan: Sync Admin Products with Shop Frontend + Expand Product Types

## Problem
The Shop page, PricingSection, and ExtrasSection all read from hardcoded `mockData.ts`. The admin `/admin/produtos` manages products in the `products` database table. These two systems are completely disconnected — changes in admin have zero effect on the storefront.

## What Changes

### 1. Database: Add missing columns to `products` table
The `Product` TypeScript type has fields (`originalPrice`, `pricePerUnit`, `highlighted`) that map to existing DB columns, but the `category` column currently only supports "combo" and "extra". We need to expand categories for diverse pet products.

**Migration:**
- Add a `description` text column (for product detail pages and rich display)
- No schema changes needed for categories — it's already a free-text column

### 2. Create a shared hook `useProducts` 
A new `src/hooks/useProducts.ts` hook that fetches active products from the database and maps DB column names to the frontend `Product` interface:
- `original_price` → `originalPrice`
- `price_per_unit` → `pricePerUnit`  
- `image_url` → `image`
- `highlighted` → `highlighted`

This hook replaces all imports of `products` from `mockData.ts`.

### 3. Update PricingSection to use DB products
- Replace `import { products } from "@/services/mockData"` with `useProducts()` hook
- Filter by `category === "combo"` (same logic, but from DB)
- Add a loading skeleton while fetching
- No visual/design changes

### 4. Update ExtrasSection to use DB products
- Same pattern: replace mock import with `useProducts()` hook
- Filter by `category === "extra"` (and any future categories like "acessorio", "higiene", etc.)
- No visual/design changes

### 5. Update Shop.tsx main product to come from DB
- The hardcoded `mainProduct` at the top of Shop.tsx will be fetched from the database (first combo product, or a "featured" flag)
- No visual/design changes

### 6. Enhance Admin Produtos with expanded categories
- Expand the category dropdown from just "combo"/"extra" to include: "combo", "extra", "acessorio", "higiene", "brinquedo", "alimentacao"
- Add fields for `highlighted` toggle and `price_per_unit` text input
- Add a `description` textarea for richer product info
- These map to existing or new DB columns

### 7. Seed existing mock products into DB
- Provide guidance to insert the 6 current mock products into the `products` table so the shop works immediately after the switch

## Technical Details

**Files modified:**
- `src/hooks/useProducts.ts` (new) — shared hook
- `src/components/landing/PricingSection.tsx` — use hook instead of mock
- `src/components/landing/ExtrasSection.tsx` — use hook instead of mock  
- `src/pages/Shop.tsx` — fetch main product from DB
- `src/pages/admin/Produtos.tsx` — expanded categories + new fields
- `supabase/migrations/` — add `description` column

**Files NOT modified:**
- `src/services/mockData.ts` — kept for blog/FAQ/testimonial data (not removed)
- No visual/layout changes to the Shop page

**DB column mapping:**
```text
DB Column         →  TypeScript Field
─────────────────────────────────────
title             →  title
subtitle          →  subtitle
price             →  price
original_price    →  originalPrice
price_per_unit    →  pricePerUnit
quantity          →  quantity
badge             →  badge
highlighted       →  highlighted
category          →  category
image_url         →  image
active            →  (filter only active)
description       →  description (new)
```

