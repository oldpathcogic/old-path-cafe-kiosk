CREATE TABLE `addons` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`short_name` text NOT NULL,
	`category` text NOT NULL,
	`price_cents` integer NOT NULL,
	`available` integer DEFAULT true NOT NULL,
	`display_order` integer DEFAULT 0 NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `menu_items` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`price_cents` integer NOT NULL,
	`available` integer DEFAULT true NOT NULL,
	`status_label` text DEFAULT '' NOT NULL,
	`featured` integer DEFAULT false NOT NULL,
	`display_order` integer DEFAULT 0 NOT NULL,
	`allowed_addons` text DEFAULT '[]' NOT NULL,
	`options` text DEFAULT '[]' NOT NULL,
	`show_on_kiosk` integer DEFAULT true NOT NULL,
	`show_on_menu_board` integer DEFAULT true NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_id` text NOT NULL,
	`item_id` text NOT NULL,
	`name` text NOT NULL,
	`option_name` text DEFAULT '' NOT NULL,
	`addons_json` text DEFAULT '[]' NOT NULL,
	`line_total_cents` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_name` text NOT NULL,
	`status` text NOT NULL,
	`subtotal_cents` integer NOT NULL,
	`tax_cents` integer DEFAULT 0 NOT NULL,
	`total_cents` integer NOT NULL,
	`payment_required` integer DEFAULT false NOT NULL,
	`payment_status` text DEFAULT 'not_required' NOT NULL,
	`payment_provider` text DEFAULT 'none' NOT NULL,
	`payment_intent_id` text DEFAULT '' NOT NULL,
	`receipt_url` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` text NOT NULL
);
