

## Move the mobile lid closer to the jar top

The lid on mobile is currently positioned at `top: -7%` in the CSS class `.hero-lid-mobile`. Based on the screenshot, it needs to move down to sit between the "SEU" and "PET" text lines, closer to the jar opening.

### Change

**File: `src/index.css`** (line 149)

Update the `.hero-lid-mobile` class to change `top-[-7%]` to approximately `top-[12%]` (or similar value around 10-15%) so the lid sits lower, visually between the "SEU PET" text and the top of the jar. This single CSS change repositions the lid without affecting desktop layout.

