# She Brews Cafe

Production-ready ordering system for the Old Path church cafe.

## Live Screens

- `/` — customer iPad kiosk
- `/barista` — protected live fulfillment board
- `/menu` — full-screen chalkboard menu display
- `/admin` — protected menu controls and Google Sheet sync

## What Works

- Customers customize drinks, add items, enter a name, and submit an order.
- Orders persist in D1 and appear on separate barista devices within seconds.
- Baristas move orders through New, In Progress, Ready, and Completed.
- Menu availability and sold-out states update across every screen.
- A published Google Sheet CSV can update menu items, add-ons, prices, labels, display order, and availability.
- Staff and admin data are protected by a server-side PIN.
- Payment fields are present, but payment collection remains disabled until Square or Stripe credentials are connected.

## Google Sheet Templates

Download the templates from the Admin screen or use:

- `public/menu-template.csv`
- `public/addons-template.csv`

Publish each completed Google Sheet tab as CSV, paste its published URL into Admin, and select **Sync Menu Now**.

Supported item labels include `New`, `Featured`, `Limited Edition`, `Seasonal`, and `Sold Out`.

## Payment-Ready Design

Orders store subtotal, tax, total, whether payment is required, payment status, provider, payment intent/transaction ID, and receipt URL. Payment is deliberately blocked until a provider is configured so unpaid orders cannot accidentally enter a paid workflow.

## Development

Requires Node.js 22.13 or newer.

```bash
npm ci
npm run dev
```

Useful checks:

```bash
npm run lint
npm test
```

Database schema is in `db/schema.ts`; generated migration SQL is in `drizzle/`.
