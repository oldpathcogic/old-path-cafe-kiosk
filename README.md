# She Brews Cafe Kiosk

She Brews is a lightweight ordering system for the Old Path church cafe. It includes a customer iPad kiosk, a live barista fulfillment screen, a chalkboard-style menu board, and a small admin view for menu sync and availability.

## Run Locally

```bash
npm start
```

Open:

- `http://localhost:4173/#/kiosk`
- `http://localhost:4173/#/barista`
- `http://localhost:4173/#/menu`
- `http://localhost:4173/#/admin`

## Current Build

- Customer kiosk with categories, add-ons, customer name, cart, and order submit
- Barista board with `New`, `In Progress`, `Ready`, and `Completed`
- Full-screen chalkboard menu display
- Admin screen for availability, status labels, sheet URL, and payment flags
- Payment-ready order fields, with payment capture intentionally disabled
- Local real-time sync through `localStorage` and `BroadcastChannel`

## Google Sheet Source

For phase one, the app can sync menu items from a published Google Sheet CSV URL.

Starter templates:

- `data/menu-template.csv`
- `data/addons-template.csv`

Recommended columns:

| Column | Example |
| --- | --- |
| `item_id` | `latte` |
| `name` | `Latte` |
| `category` | `Coffee` |
| `description` | `Hot or iced, creamy and rich` |
| `price` | `6.00` |
| `available` | `TRUE` |
| `status_label` | `Limited Edition` |
| `featured` | `TRUE` |
| `display_order` | `3` |
| `allowed_addons` | `vanilla,oat-milk,extra-shot` |
| `options` | `Hot,Iced` |
| `show_on_kiosk` | `TRUE` |
| `show_on_menu_board` | `TRUE` |

Status labels supported in the UI:

- `New`
- `Featured`
- `Limited Edition`
- `Sold Out`
- `Seasonal`

## Payment-Ready Order Model

Every order already includes:

- `subtotal`
- `tax`
- `total`
- `paymentRequired`
- `paymentStatus`
- `paymentProvider`
- `paymentIntentId`
- `receiptUrl`

When payment is enabled later, the kiosk should only send paid orders to the active barista queue after Square or Stripe confirms success.

## Future Production Plan

The current app is intentionally simple so it can be tested quickly. The production path should add:

- Supabase database for shared device persistence
- Supabase Realtime for order updates across kiosk/barista/menu devices
- Google Sheets sync through a protected server endpoint
- Square or Stripe credentials stored server-side
- Admin PIN or login for menu/payment controls
- Daily order export for finance tracking

See `docs/build-plan.md` for the staged implementation plan.
