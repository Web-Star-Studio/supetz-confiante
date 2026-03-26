

## Plan: Marketing Module — Advanced Improvements

### Overview

Enhance the Marketing module with smarter features: campaign duplication, scheduling, A/B testing fields, performance analytics, and improved newsletter management with re-subscribe and bulk actions.

### Changes

#### 1. Campaign Enhancements (`src/pages/admin/Marketing.tsx`)

**Campaign duplication**: Add a "Duplicar" button on each campaign row that pre-fills the create form with that campaign's settings (name + " (cópia)", same type, message, segmentation, coupon config).

**Campaign scheduling**: Add an optional `scheduled_for` datetime picker to the create form. If set, campaign is saved as `status: "scheduled"` instead of being sent immediately. Add a new status badge for "Agendada" with a clock icon.

**Campaign deletion**: Add ability to delete draft/scheduled campaigns.

**Improved stats row**: Add a 4th stat card showing conversion rate (campaigns with coupon type that were used vs total coupons generated). Replace the simple 3-card layout with 4 cards.

**Campaign search/filter**: Add a search bar and status filter dropdown above the campaign list to quickly find campaigns by name or filter by status.

#### 2. Database Migration

Add `scheduled_for` column to `campaigns` table:
```sql
ALTER TABLE public.campaigns ADD COLUMN scheduled_for timestamptz;
```

#### 3. Newsletter Tab Improvements (`src/components/admin/NewsletterTab.tsx`)

**Re-subscribe action**: Add a button to re-activate unsubscribed users (set status back to "active", clear unsubscribed_at).

**Bulk actions**: Add select-all checkbox and bulk unsubscribe/delete for selected subscribers.

**Source breakdown chart**: Add a mini visual showing subscriber sources (footer vs landing vs registration) as colored pills with counts.

**Subscriber growth indicator**: Show a simple "+X this week" badge next to the total count.

#### 4. Campaign Analytics Section (`src/pages/admin/Marketing.tsx`)

When a campaign is expanded, show richer details:
- A mini progress bar for open rate
- Coupon redemption rate (count `user_coupons` with `used = true` linked via `campaign_recipients`)
- Timestamp of first and last open

#### 5. Files to Modify

| File | Changes |
|------|---------|
| Migration SQL | Add `scheduled_for` to campaigns |
| `src/pages/admin/Marketing.tsx` | Campaign search, duplication, scheduling, deletion, richer analytics, 4th stat card |
| `src/components/admin/NewsletterTab.tsx` | Re-subscribe, bulk actions, source breakdown, growth indicator |

### Technical Details

- Campaign duplication copies all form fields and opens the create panel pre-filled
- Scheduled campaigns use `status: "scheduled"` — actual sending requires a cron job or manual trigger (for now, admin can manually send when ready)
- Bulk select uses local state array of selected IDs, with a floating action bar
- Source breakdown computed client-side from existing subscriber data
- Growth indicator counts subscribers with `subscribed_at` within last 7 days
- All new UI follows existing design tokens: `rounded-3xl` cards, `rounded-2xl` inputs, primary color accents

