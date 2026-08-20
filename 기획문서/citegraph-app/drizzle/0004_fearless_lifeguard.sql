CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`name` text NOT NULL,
	`domain_label` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_projects_workspace_created` ON `projects` (`workspace_id`,`created_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `ux_projects_workspace_domain` ON `projects` (`workspace_id`,`domain_label`);--> statement-breakpoint
CREATE TABLE `workspaces` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`created_at` integer NOT NULL,
	CONSTRAINT "ck_workspaces_kind" CHECK("workspaces"."kind" = 'LOCAL_WORKSPACE')
);
--> statement-breakpoint
DROP INDEX `ux_audit_v2_results_snapshot`;--> statement-breakpoint
ALTER TABLE `audit_v2_results` ADD `workspace_id` text REFERENCES workspaces(id);--> statement-breakpoint
ALTER TABLE `audit_v2_results` ADD `project_id` text REFERENCES projects(id);--> statement-breakpoint
CREATE UNIQUE INDEX `ux_audit_v2_results_workspace_snapshot` ON `audit_v2_results` (`workspace_id`,`snapshot_id`);--> statement-breakpoint
CREATE INDEX `idx_audit_v2_results_project_created` ON `audit_v2_results` (`project_id`,`created_at`);