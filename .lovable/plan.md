

# Plan: Product Detail Page (`/produto/:id`)

## Overview
Create an individual product detail page that shows full product info fetched from the database, with an image gallery, complete description, and add-to-cart functionality. Products in the Shop, PricingSection, and ExtrasSection will link to this page.

## Changes

### 1. New page: `src/pages/Produto.tsx`
- Route: `/produto/:id`
- Fetch single product by ID from `products` table using Supabase
- Layout with two columns (like Shop hero):
  - **Left**: Image gallery — main image + thumbnail strip (fetched from `product-images` storage bucket, falling back to `image_url`)
  - **Right**: Title, subtitle, badge, price/original price, description (rendered from DB `description` field), quantity selector, "Adicionar à Sacola" button, category badge
- Related products section at the bottom (same category, exclude current)
- SEO with `buildProductSchema`
- Breadcrumb: Home / Loja / Product Title

### 2. New hook: `src/hooks/useProductImages.ts`
- Lists files in `product-images` bucket under folder matching `product.id`
- Returns array of public URLs for the gallery
- Falls back to `[product.image]` if no bucket images exist

### 3. Add route in `AnimatedRoutes.tsx`
- `/produto/:id` → `<Produto />`

### 4. Link products to detail page
- **PricingSection**: Wrap product title/image in `<Link to={/produto/${id}}`
- **ExtrasSection**: Same — clickable product cards link to detail page
- Keep "Adicionar à Sacola" buttons working inline (no redirect needed)

### 5. Update `Product` type category
- Expand `category` union type to include the new categories: `"combo" | "extra" | "acessorio" | "higiene" | "brinquedo" | "alimentacao"`

## Technical Details

**Files created:**
- `src/pages/Produto.tsx` — full product detail page
- `src/hooks/useProductImages.ts` — gallery image fetcher

**Files modified:**
- `src/components/layout/AnimatedRoutes.tsx` — add route
- `src/components/landing/PricingSection.tsx` — add Link to product cards
- `src/components/landing/ExtrasSection.tsx` — add Link to product cards
- `src/types/index.ts` — expand category union

**No database changes needed** — all columns already exist.

