CREATE TABLE `compare_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_key` text,
	`project_id` text NOT NULL,
	`question_set_id` text NOT NULL,
	`question_set_version` text NOT NULL,
	`platform_set_version` text NOT NULL,
	`ruleset_version` text NOT NULL,
	`engine_version` text NOT NULL,
	`comparison_algorithm_version` text NOT NULL,
	`status` text NOT NULL,
	`target_count` integer NOT NULL,
	`success_count` integer NOT NULL,
	`failure_count` integer NOT NULL,
	`started_at` integer NOT NULL,
	`completed_at` integer,
	CONSTRAINT "ck_compare_runs_target_count" CHECK("compare_runs"."target_count" BETWEEN 2 AND 5),
	CONSTRAINT "ck_compare_runs_success_count" CHECK("compare_runs"."success_count" >= 0),
	CONSTRAINT "ck_compare_runs_failure_count" CHECK("compare_runs"."failure_count" >= 0)
);
--> statement-breakpoint
CREATE INDEX `idx_compare_runs_actor` ON `compare_runs` (`actor_key`,`started_at`,`id`);--> statement-breakpoint
CREATE INDEX `idx_compare_runs_project` ON `compare_runs` (`project_id`,`started_at`,`id`);--> statement-breakpoint
CREATE TABLE `compare_targets` (
	`id` text PRIMARY KEY NOT NULL,
	`compare_run_id` text NOT NULL,
	`ordinal` integer NOT NULL,
	`role` text NOT NULL,
	`label` text,
	`requested_url` text NOT NULL,
	`normalized_url` text NOT NULL,
	`status` text NOT NULL,
	`audit_run_id` text,
	`audit_result_id` text,
	`error_code` text,
	FOREIGN KEY (`compare_run_id`) REFERENCES `compare_runs`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`audit_run_id`) REFERENCES `audit_runs`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`audit_result_id`) REFERENCES `audit_results`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ux_compare_targets_ordinal` ON `compare_targets` (`compare_run_id`,`ordinal`);--> statement-breakpoint
CREATE INDEX `idx_compare_targets_run` ON `compare_targets` (`compare_run_id`);