import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const menuItems = sqliteTable("menu_items", {
  id: text("id").primaryKey(), name: text("name").notNull(), category: text("category").notNull(), description: text("description").notNull().default(""),
  priceCents: integer("price_cents").notNull(), available: integer("available",{mode:"boolean"}).notNull().default(true), statusLabel: text("status_label").notNull().default(""),
  featured: integer("featured",{mode:"boolean"}).notNull().default(false), displayOrder: integer("display_order").notNull().default(0), allowedAddons: text("allowed_addons").notNull().default("[]"),
  options: text("options").notNull().default("[]"), showOnKiosk: integer("show_on_kiosk",{mode:"boolean"}).notNull().default(true), showOnMenuBoard: integer("show_on_menu_board",{mode:"boolean"}).notNull().default(true), updatedAt: text("updated_at").notNull(),
});
export const addons = sqliteTable("addons", {
  id:text("id").primaryKey(), name:text("name").notNull(), shortName:text("short_name").notNull(), category:text("category").notNull(), priceCents:integer("price_cents").notNull(), available:integer("available",{mode:"boolean"}).notNull().default(true), displayOrder:integer("display_order").notNull().default(0), updatedAt:text("updated_at").notNull(),
});
export const orders = sqliteTable("orders", {
  id:text("id").primaryKey(), customerName:text("customer_name").notNull(), status:text("status").notNull(), subtotalCents:integer("subtotal_cents").notNull(), taxCents:integer("tax_cents").notNull().default(0), totalCents:integer("total_cents").notNull(),
  paymentRequired:integer("payment_required",{mode:"boolean"}).notNull().default(false), paymentStatus:text("payment_status").notNull().default("not_required"), paymentProvider:text("payment_provider").notNull().default("none"), paymentIntentId:text("payment_intent_id").notNull().default(""), receiptUrl:text("receipt_url").notNull().default(""), pickupCode:text("pickup_code"), trackingToken:text("tracking_token"), createdAt:text("created_at").notNull(), updatedAt:text("updated_at").notNull(),
});
export const orderItems = sqliteTable("order_items", {
  id:integer("id").primaryKey({autoIncrement:true}), orderId:text("order_id").notNull(), itemId:text("item_id").notNull(), name:text("name").notNull(), optionName:text("option_name").notNull().default(""), addonsJson:text("addons_json").notNull().default("[]"), lineTotalCents:integer("line_total_cents").notNull(),
});
export const settings = sqliteTable("settings", { key:text("key").primaryKey(), value:text("value").notNull(), updatedAt:text("updated_at").notNull() });
