CREATE TABLE `audit_v2_results` (
	`id` text PRIMARY KEY NOT NULL,
	`snapshot_id` text NOT NULL,
	`requested_url` text NOT NULL,
	`final_url` text NOT NULL,
	`content_hash` text NOT NULL,
	`http_status` integer NOT NULL,
	`content_type` text NOT NULL,
	`methodology_version` text NOT NULL,
	`registry_version` text NOT NULL,
	`extractor_version` text NOT NULL,
	`storage_mode` text NOT NULL,
	`result_json` text NOT NULL,
	`created_at` integer NOT NULL,
	CONSTRAINT "ck_audit_v2_results_storage_mode" CHECK("audit_v2_results"."storage_mode" = 'HASH_ONLY'),
	CONSTRAINT "ck_audit_v2_results_http_status" CHECK("audit_v2_results"."http_status" BETWEEN 100 AND 599)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ux_audit_v2_results_snapshot` ON `audit_v2_results` (`snapshot_id`);--> statement-breakpoint
CREATE INDEX `idx_audit_v2_results_created` ON `audit_v2_results` (`created_at`);--> statement-breakpoint
CREATE TABLE `product_events` (
	`id` text PRIMARY KEY NOT NULL,
	`event_name` text NOT NULL,
	`audit_v2_result_id` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`audit_v2_result_id`) REFERENCES `audit_v2_results`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "ck_product_events_name" CHECK("product_events"."event_name" IN ('AUDIT_V2_COMPLETED', 'V2_EVIDENCE_VIEWED'))
);
--> statement-breakpoint
CREATE INDEX `idx_product_events_result` ON `product_events` (`audit_v2_result_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_product_events_name_created` ON `product_events` (`event_name`,`created_at`);