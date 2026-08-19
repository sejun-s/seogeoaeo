ALTER TABLE `audit_findings` ADD `grade` text;--> statement-breakpoint
ALTER TABLE `audit_findings` ADD `weight_status` text;--> statement-breakpoint
ALTER TABLE `audit_findings` ADD `difficulty` text;--> statement-breakpoint
ALTER TABLE `audit_findings` ADD `loss_score` real;--> statement-breakpoint
ALTER TABLE `audit_findings` ADD `priority_score` real;--> statement-breakpoint
ALTER TABLE `audit_results` ADD `tier0_blocked` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `audit_results` ADD `tier0_reason` text;--> statement-breakpoint
ALTER TABLE `audit_results` ADD `s_seo_score` real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `audit_results` ADD `r_tech_score` real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `audit_results` ADD `r_sem_score` real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `audit_results` ADD `oci_score` real DEFAULT 0 NOT NULL;