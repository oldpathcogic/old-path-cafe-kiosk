ALTER TABLE `addons` ADD `track_inventory` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `addons` ADD `stock_on_hand` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `addons` ADD `low_stock_threshold` integer DEFAULT 2 NOT NULL;--> statement-breakpoint
ALTER TABLE `menu_items` ADD `track_inventory` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `menu_items` ADD `stock_on_hand` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `menu_items` ADD `low_stock_threshold` integer DEFAULT 2 NOT NULL;