PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_days` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`sprint_id` integer,
	`title` text NOT NULL,
	`date` text NOT NULL,
	`total_time` integer DEFAULT 0 NOT NULL,
	`goal_time` integer DEFAULT 0 NOT NULL,
	`report` text,
	`status_id` integer,
	FOREIGN KEY (`sprint_id`) REFERENCES `sprints`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`status_id`) REFERENCES `statuses`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_days`("id", "sprint_id", "title", "date", "total_time", "goal_time", "report", "status_id") SELECT "id", "sprint_id", "title", "date", "total_time", "goal_time", "report", "status_id" FROM `days`;--> statement-breakpoint
DROP TABLE `days`;--> statement-breakpoint
ALTER TABLE `__new_days` RENAME TO `days`;--> statement-breakpoint
PRAGMA foreign_keys=ON;