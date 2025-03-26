CREATE TABLE `days` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`sprint_id` integer NOT NULL,
	`title` text NOT NULL,
	`date` text NOT NULL,
	`total_time` integer DEFAULT 0 NOT NULL,
	`goal_time` integer DEFAULT 0 NOT NULL,
	`report` text,
	`status_id` integer NOT NULL,
	FOREIGN KEY (`sprint_id`) REFERENCES `sprints`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`status_id`) REFERENCES `statuses`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`day_id` integer NOT NULL,
	`title` text NOT NULL,
	`start_time` integer DEFAULT 0 NOT NULL,
	`end_time` integer DEFAULT 0 NOT NULL,
	`weight` integer NOT NULL,
	`description` text,
	`report` text,
	`status_id` integer NOT NULL,
	`truant_id` integer,
	FOREIGN KEY (`day_id`) REFERENCES `days`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`status_id`) REFERENCES `statuses`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`truant_id`) REFERENCES `truants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sprints` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`start_date` text NOT NULL,
	`end_date` text NOT NULL,
	`total_time` integer DEFAULT 0 NOT NULL,
	`goal_time` integer DEFAULT 0 NOT NULL,
	`description` text,
	`status_id` integer NOT NULL,
	FOREIGN KEY (`status_id`) REFERENCES `statuses`(`id`) ON UPDATE no action ON DELETE no action
);
