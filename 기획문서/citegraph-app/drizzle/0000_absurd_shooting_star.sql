CREATE TABLE `audit_evidence` (
	`id` text PRIMARY KEY NOT NULL,
	`finding_id` text NOT NULL,
	`evidence_code` text NOT NULL,
	`field` text NOT NULL,
	`excerpt` text NOT NULL,
	FOREIGN KEY (`finding_id`) REFERENCES `audit_findings`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ux_audit_evidence_item` ON `audit_evidence` (`finding_id`,`evidence_code`,`field`);--> statement-breakpoint
CREATE INDEX `idx_audit_evidence_finding` ON `audit_evidence` (`finding_id`);--> statement-breakpoint
CREATE TABLE `audit_findings` (
	`id` text PRIMARY KEY NOT NULL,
	`audit_result_id` text NOT NULL,
	`rule_id` text NOT NULL,
	`score_type` text NOT NULL,
	`category` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`weight` integer NOT NULL,
	`result` text NOT NULL,
	`recommendation` text NOT NULL,
	FOREIGN KEY (`audit_result_id`) REFERENCES `audit_results`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "ck_audit_findings_score_type" CHECK("audit_findings"."score_type" IN ('SEO', 'GEO')),
	CONSTRAINT "ck_audit_findings_result" CHECK("audit_findings"."result" IN ('PASS', 'WARN', 'FAIL')),
	CONSTRAINT "ck_audit_findings_weight" CHECK("audit_findings"."weight" >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ux_audit_findings_rule` ON `audit_findings` (`audit_result_id`,`rule_id`);--> statement-breakpoint
CREATE INDEX `idx_audit_findings_result` ON `audit_findings` (`audit_result_id`);--> statement-breakpoint
CREATE INDEX `idx_audit_findings_rule` ON `audit_findings` (`rule_id`);--> statement-breakpoint
CREATE TABLE `audit_results` (
	`id` text PRIMARY KEY NOT NULL,
	`normalized_url` text NOT NULL,
	`final_url` text NOT NULL,
	`ruleset_version` text NOT NULL,
	`engine_version` text NOT NULL,
	`html_hash` text NOT NULL,
	`input_hash` text NOT NULL,
	`status` text NOT NULL,
	`http_status` integer NOT NULL,
	`evaluation_duration_ms` integer NOT NULL,
	`seo_score` integer NOT NULL,
	`geo_score` integer NOT NULL,
	`extracted_json` text NOT NULL,
	`extracted_truncated` integer NOT NULL,
	`extracted_bytes` integer NOT NULL,
	`created_at` integer NOT NULL,
	CONSTRAINT "ck_audit_results_status" CHECK("audit_results"."status" IN ('SUCCESS', 'PARTIAL')),
	CONSTRAINT "ck_audit_results_scores" CHECK("audit_results"."seo_score" BETWEEN 0 AND 100 AND "audit_results"."geo_score" BETWEEN 0 AND 100)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ux_audit_results_cache` ON `audit_results` (`normalized_url`,`ruleset_version`,`engine_version`,`input_hash`);--> statement-breakpoint
CREATE INDEX `idx_audit_results_url_created` ON `audit_results` (`normalized_url`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_audit_results_created` ON `audit_results` (`created_at`);--> statement-breakpoint
CREATE TABLE `audit_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`audit_result_id` text,
	`requested_url` text NOT NULL,
	`actor_key` text,
	`status` text NOT NULL,
	`cache_hit` integer NOT NULL,
	`error_code` text,
	`error_message` text,
	`duration_ms` integer NOT NULL,
	`requested_at` integer NOT NULL,
	FOREIGN KEY (`audit_result_id`) REFERENCES `audit_results`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "ck_audit_runs_status" CHECK("audit_runs"."status" IN ('SUCCESS', 'FAILED'))
);
--> statement-breakpoint
CREATE INDEX `idx_audit_runs_result` ON `audit_runs` (`audit_result_id`);--> statement-breakpoint
CREATE INDEX `idx_audit_runs_cursor` ON `audit_runs` (`requested_at`,`id`);--> statement-breakpoint
CREATE INDEX `idx_audit_runs_actor_cursor` ON `audit_runs` (`actor_key`,`requested_at`,`id`);--> statement-breakpoint
CREATE TABLE `audit_scores` (
	`id` text PRIMARY KEY NOT NULL,
	`audit_result_id` text NOT NULL,
	`score_type` text NOT NULL,
	`category_name` text NOT NULL,
	`score` real NOT NULL,
	`max_score` real NOT NULL,
	FOREIGN KEY (`audit_result_id`) REFERENCES `audit_results`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "ck_audit_scores_type" CHECK("audit_scores"."score_type" IN ('SEO', 'GEO')),
	CONSTRAINT "ck_audit_scores_range" CHECK("audit_scores"."max_score" > 0 AND "audit_scores"."score" >= 0 AND "audit_scores"."score" <= "audit_scores"."max_score")
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ux_audit_scores_category` ON `audit_scores` (`audit_result_id`,`score_type`,`category_name`);--> statement-breakpoint
CREATE INDEX `idx_audit_scores_result` ON `audit_scores` (`audit_result_id`);