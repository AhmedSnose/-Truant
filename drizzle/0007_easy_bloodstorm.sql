ALTER TABLE `days` ADD `is_synced` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `events` ADD `is_synced` integer DEFAULT 0 NOT NULL;