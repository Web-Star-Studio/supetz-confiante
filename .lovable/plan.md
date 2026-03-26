

## Plan: Redesign Parceiros Page + Remove from Header

### Changes Overview

**Two files to modify:**

1. **`src/components/layout/Header.tsx`** — Remove "Parceiros" from the `navLinks` array. Footer already has the link.

2. **`src/pages/Parceiros.tsx`** — Full visual redesign following the "Playful Trust" aesthetic with these improvements:

### Design Upgrades

- **Hero section**: Large gradient background with decorative orange circle (matching brand), bold typography with generous whitespace, animated entrance
- **Benefits cards**: Upgrade from flat bordered cards to rounded-3xl cards with subtle gradient backgrounds, larger icons, more breathing room — matching the premium feel of Sobre/Ciencia pages
- **"Como funciona" timeline**: Replace simple list with a horizontal stepped timeline on desktop (vertical on mobile), with connecting lines between steps and animated number badges
- **Application form**: Elevate with a soft background section (light orange tint), rounded-3xl card, pill-shaped submit button (rounded-full per brand guidelines), refined input styling with larger padding and softer borders
- **Success state**: Animated confetti-style checkmark with more celebratory feel
- **Add a stats/social proof strip** between hero and benefits: "500+ parceiros ativos", "R$ 2M+ em comissões pagas", "15% de comissão"
- **CTA at bottom**: Reuse or mirror the FinalCTASection pattern for consistency

### Technical Details

- Use `framer-motion` for staggered card animations and scroll-triggered reveals (consistent with Sobre page patterns)
- Cards use `rounded-3xl` per component guidelines
- Buttons use `rounded-full` (pill shape) per brand
- Generous whitespace, no heavy shadows or hard borders
- Mobile: single-column layout, left-aligned text, full-width form

