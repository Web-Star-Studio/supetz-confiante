

## Plan: Complete Newsletter System with Lead Management

### Overview

Build a full newsletter subscription system where visitors become leads in the CRM, registered users are auto-enrolled, and admins can manage email marketing campaigns targeting both subscriber types.

### Database Changes (Migration)

**New table: `newsletter_subscribers`**
- `id` (uuid, PK)
- `email` (text, unique, not null)
- `name` (text, nullable)
- `user_id` (uuid, nullable) — links to auth.users if registered
- `source` (text, default 'footer') — where they subscribed (footer, landing, popup)
- `status` (text, default 'active') — active, unsubscribed
- `subscribed_at` (timestamptz, default now())
- `unsubscribed_at` (timestamptz, nullable)

RLS: public can insert (for anonymous signups), admins can read/manage all, service_role can update.

**Auto-link trigger**: When a new user registers (`handle_new_user`), check if their email exists in `newsletter_subscribers` and link the `user_id`.

### Frontend Changes

#### 1. Footer Newsletter Form (`src/components/layout/Footer.tsx`)
- Make the existing form functional: on submit, insert into `newsletter_subscribers`
- Show success/error toast feedback
- No auth required (anonymous insert via anon key)
- Validate email client-side

#### 2. Landing Page Newsletter Section
- Add a small newsletter CTA component to the Index page (before FinalCTA)
- Reuse the same subscribe logic

#### 3. Admin: Newsletter Tab in Marketing Page (`src/pages/admin/Marketing.tsx`)
- Add a tabbed interface: "Campanhas" (existing) | "Newsletter"
- Newsletter tab shows:
  - **Stats**: total subscribers, registered vs anonymous, active vs unsubscribed
  - **Subscriber list** with search, sortable columns, pagination
  - **Badge system**: "Registrado" (has user_id) vs "Lead" (no user_id)
  - **Export CSV** of subscribers
  - **Segment targeting**: when creating campaigns, add "Newsletter subscribers" as a segment option, differentiating registered vs lead-only

#### 4. Campaign Segmentation Enhancement
- Add newsletter subscriber targeting to campaign creation form
- Options: "All newsletter subscribers", "Only leads (no account)", "Only registered users", or combine with existing CRM filters

#### 5. CRM Integration
- In CRM client list, newsletter-only subscribers (no user_id) appear as a separate "Lead (Newsletter)" status
- Differentiated with a distinct badge/tag

### Files to Create/Modify

| File | Action |
|------|--------|
| Migration SQL | Create `newsletter_subscribers` table + trigger |
| `src/components/layout/Footer.tsx` | Wire up newsletter form with Supabase insert |
| `src/components/landing/NewsletterSection.tsx` | New standalone CTA component |
| `src/pages/Index.tsx` | Add NewsletterSection |
| `src/pages/admin/Marketing.tsx` | Add Newsletter tab with subscriber management |
| `src/components/admin/AdminLayout.tsx` | No change needed (Marketing already in sidebar) |

### Technical Details

- Newsletter inserts use `.insert()` with `onConflict: 'email'` to prevent duplicates
- The `handle_new_user` trigger is updated to auto-link `newsletter_subscribers.user_id` when email matches
- RLS allows anonymous inserts (only email + name columns) but blocks reads for non-admins
- Campaign sending logic extended to query `newsletter_subscribers` when "newsletter" segment is selected
- Subscriber badges use color-coded pills: green "Registrado" / blue "Lead"

