# She Brews Build Plan

## Phase 1: Local Working App

Goal: replace counter order taking with a simple iPad kiosk and barista screen.

Built now:

- Customer kiosk route: `#/kiosk`
- Barista route: `#/barista`
- Chalkboard menu board route: `#/menu`
- Admin route: `#/admin`
- Seeded menu from the She Brews flyer
- Add-ons and drink options
- Order statuses
- Payment-ready fields

## Phase 2: Google Sheet Source

Goal: make menu changes easy for cafe leaders without editing code.

Recommended approach:

1. Create a Google Sheet from `data/menu-template.csv`.
2. Publish that sheet tab as CSV.
3. Paste the published CSV URL into the admin screen.
4. Click **Sync Menu**.

The app currently syncs menu items from CSV. Add-ons are seeded in code for the first build; the production version should support a second add-ons CSV tab or a protected Google Sheets API endpoint.

## Phase 3: Shared Live Database

Goal: make orders sync across separate devices reliably.

Recommended production layer:

- Supabase `menu_items`
- Supabase `addons`
- Supabase `orders`
- Supabase `order_items`
- Supabase Realtime subscriptions for the barista display

The local build uses `localStorage` and `BroadcastChannel` so it can be tested immediately in one browser/device. Supabase should replace that for production.

## Phase 4: Payment Provider

Goal: add payment without changing the order model.

Payment providers to evaluate:

- Square for cafe-style hardware and familiar in-person POS workflows
- Stripe for custom app-first payment and future online expansion

Order fields already present:

- `paymentRequired`
- `paymentStatus`
- `paymentProvider`
- `paymentIntentId`
- `receiptUrl`

Production rule:

When payments are enabled, an order should not enter the active barista queue until the provider confirms payment success.

## Phase 5: GitHub Push and Hosted Test

Needed from Dom:

- GitHub repository name or URL
- Whether the repo should be public or private
- Hosting preference: GitHub Pages, Vercel, or another host

Recommended first hosted test:

- Use Vercel or Netlify for the static version
- Test iPad kiosk with Guided Access
- Test barista screen on a separate tablet/laptop
- Test menu board on a TV browser
