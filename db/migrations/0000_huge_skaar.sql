CREATE TABLE `news` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`story_path` text NOT NULL,
	`source_logo_id` text NOT NULL,
	`published` integer NOT NULL,
	`source` text NOT NULL,
	`urgency` integer NOT NULL,
	`provider` text NOT NULL,
	`link` text
);
--> statement-breakpoint
CREATE TABLE `news_related_symbol` (
	`news_id` text,
	`symbol` text NOT NULL,
	`logoid` text,
	FOREIGN KEY (`news_id`) REFERENCES `news`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `news_id_unique` ON `news` (`id`);