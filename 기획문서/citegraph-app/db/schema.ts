import { relations, sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const auditResults = sqliteTable(
  "audit_results",
  {
    id: text("id").primaryKey(),
    normalizedUrl: text("normalized_url").notNull(),
    finalUrl: text("final_url").notNull(),
    rulesetVersion: text("ruleset_version").notNull(),
    engineVersion: text("engine_version").notNull(),
    htmlHash: text("html_hash").notNull(),
    inputHash: text("input_hash").notNull(),
    status: text("status", {
      enum: ["SUCCESS", "PARTIAL"],
    }).notNull(),
    httpStatus: integer("http_status").notNull(),
    evaluationDurationMs: integer("evaluation_duration_ms").notNull(),
    seoScore: integer("seo_score").notNull(),
    geoScore: integer("geo_score").notNull(),

    // v3.0 Additional Metrics
    tier0Blocked: integer("tier0_blocked", { mode: "boolean" }).notNull().default(false),
    tier0Reason: text("tier0_reason"),
    sSeoScore: real("s_seo_score").notNull().default(0),
    rTechScore: real("r_tech_score").notNull().default(0),
    rSemScore: real("r_sem_score").notNull().default(0),
    ociScore: real("oci_score").notNull().default(0),

    extractedJson: text("extracted_json").notNull(),
    extractedTruncated: integer("extracted_truncated", {
      mode: "boolean",
    }).notNull(),
    extractedBytes: integer("extracted_bytes").notNull(),
    createdAt: integer("created_at", {
      mode: "timestamp_ms",
    }).notNull(),
  },
  (t) => [
    uniqueIndex("ux_audit_results_cache").on(
      t.normalizedUrl,
      t.rulesetVersion,
      t.engineVersion,
      t.inputHash,
    ),
    index("idx_audit_results_url_created").on(
      t.normalizedUrl,
      t.createdAt,
    ),
    index("idx_audit_results_created").on(t.createdAt),
    check(
      "ck_audit_results_status",
      sql`${t.status} IN ('SUCCESS', 'PARTIAL')`,
    ),
    check(
      "ck_audit_results_scores",
      sql`${t.seoScore} BETWEEN 0 AND 100 AND ${t.geoScore} BETWEEN 0 AND 100`,
    ),
  ],
);

export const auditScores = sqliteTable(
  "audit_scores",
  {
    id: text("id").primaryKey(),
    auditResultId: text("audit_result_id")
      .notNull()
      .references(() => auditResults.id, { onDelete: "cascade" }),
    scoreType: text("score_type", {
      enum: ["SEO", "GEO"],
    }).notNull(),
    categoryName: text("category_name").notNull(),
    score: real("score").notNull(),
    maxScore: real("max_score").notNull(),
  },
  (t) => [
    uniqueIndex("ux_audit_scores_category").on(
      t.auditResultId,
      t.scoreType,
      t.categoryName,
    ),
    index("idx_audit_scores_result").on(t.auditResultId),
    check(
      "ck_audit_scores_type",
      sql`${t.scoreType} IN ('SEO', 'GEO')`,
    ),
    check(
      "ck_audit_scores_range",
      sql`${t.maxScore} > 0 AND ${t.score} >= 0 AND ${t.score} <= ${t.maxScore}`,
    ),
  ],
);

export const auditFindings = sqliteTable(
  "audit_findings",
  {
    id: text("id").primaryKey(),
    auditResultId: text("audit_result_id")
      .notNull()
      .references(() => auditResults.id, { onDelete: "cascade" }),
    ruleId: text("rule_id").notNull(),
    scoreType: text("score_type", {
      enum: ["SEO", "GEO"],
    }).notNull(),
    category: text("category").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    weight: integer("weight").notNull(),
    result: text("result", {
      enum: ["PASS", "WARN", "FAIL"],
    }).notNull(),
    recommendation: text("recommendation").notNull(),

    // v3.0 Metadata & Priority Columns
    grade: text("grade"),
    weightStatus: text("weight_status"),
    difficulty: text("difficulty"),
    lossScore: real("loss_score"),
    priorityScore: real("priority_score"),
  },
  (t) => [
    uniqueIndex("ux_audit_findings_rule").on(
      t.auditResultId,
      t.ruleId,
    ),
    index("idx_audit_findings_result").on(t.auditResultId),
    index("idx_audit_findings_rule").on(t.ruleId),
    check(
      "ck_audit_findings_score_type",
      sql`${t.scoreType} IN ('SEO', 'GEO')`,
    ),
    check(
      "ck_audit_findings_result",
      sql`${t.result} IN ('PASS', 'WARN', 'FAIL')`,
    ),
    check("ck_audit_findings_weight", sql`${t.weight} >= 0`),
  ],
);

export const auditEvidence = sqliteTable(
  "audit_evidence",
  {
    id: text("id").primaryKey(),
    findingId: text("finding_id")
      .notNull()
      .references(() => auditFindings.id, { onDelete: "cascade" }),
    evidenceCode: text("evidence_code").notNull(),
    field: text("field").notNull(),
    excerpt: text("excerpt").notNull(),
  },
  (t) => [
    uniqueIndex("ux_audit_evidence_item").on(
      t.findingId,
      t.evidenceCode,
      t.field,
    ),
    index("idx_audit_evidence_finding").on(t.findingId),
  ],
);

export const auditRuns = sqliteTable(
  "audit_runs",
  {
    id: text("id").primaryKey(),
    auditResultId: text("audit_result_id").references(
      () => auditResults.id,
      { onDelete: "set null" },
    ),
    requestedUrl: text("requested_url").notNull(),
    actorKey: text("actor_key"),
    status: text("status", {
      enum: ["SUCCESS", "FAILED"],
    }).notNull(),
    cacheHit: integer("cache_hit", { mode: "boolean" }).notNull(),
    errorCode: text("error_code"),
    errorMessage: text("error_message"),
    durationMs: integer("duration_ms").notNull(),
    requestedAt: integer("requested_at", {
      mode: "timestamp_ms",
    }).notNull(),
  },
  (t) => [
    index("idx_audit_runs_result").on(t.auditResultId),
    index("idx_audit_runs_cursor").on(t.requestedAt, t.id),
    index("idx_audit_runs_actor_cursor").on(
      t.actorKey,
      t.requestedAt,
      t.id,
    ),
    check(
      "ck_audit_runs_status",
      sql`${t.status} IN ('SUCCESS', 'FAILED')`,
    ),
  ],
);

export const compareRuns = sqliteTable(
  "compare_runs",
  {
    id: text("id").primaryKey(),
    actorKey: text("actor_key"),
    projectId: text("project_id").notNull(),
    questionSetId: text("question_set_id").notNull(),
    questionSetVersion: text("question_set_version").notNull(),
    platformSetVersion: text("platform_set_version").notNull(),
    rulesetVersion: text("ruleset_version").notNull(),
    engineVersion: text("engine_version").notNull(),
    comparisonAlgorithmVersion: text("comparison_algorithm_version").notNull(),
    status: text("status", {
      enum: ["RUNNING", "COMPLETED", "PARTIAL", "INSUFFICIENT", "FAILED", "ABORTED"],
    }).notNull(),
    targetCount: integer("target_count").notNull(),
    successCount: integer("success_count").notNull(),
    failureCount: integer("failure_count").notNull(),
    startedAt: integer("started_at", { mode: "timestamp_ms" }).notNull(),
    completedAt: integer("completed_at", { mode: "timestamp_ms" }),
  },
  (t) => [
    index("idx_compare_runs_actor").on(t.actorKey, t.startedAt, t.id),
    index("idx_compare_runs_project").on(t.projectId, t.startedAt, t.id),
    check("ck_compare_runs_target_count", sql`${t.targetCount} BETWEEN 2 AND 5`),
    check("ck_compare_runs_success_count", sql`${t.successCount} >= 0`),
    check("ck_compare_runs_failure_count", sql`${t.failureCount} >= 0`),
  ],
);

export const compareTargets = sqliteTable(
  "compare_targets",
  {
    id: text("id").primaryKey(),
    compareRunId: text("compare_run_id")
      .notNull()
      .references(() => compareRuns.id, { onDelete: "cascade" }),
    ordinal: integer("ordinal").notNull(),
    role: text("role", { enum: ["ME", "COMPETITOR"] }).notNull(),
    label: text("label"),
    requestedUrl: text("requested_url").notNull(),
    normalizedUrl: text("normalized_url").notNull(),
    status: text("status", {
      enum: ["QUEUED", "RUNNING", "SUCCESS", "ERROR", "CANCELLED"],
    }).notNull(),
    auditRunId: text("audit_run_id").references(() => auditRuns.id, { onDelete: "set null" }),
    auditResultId: text("audit_result_id").references(() => auditResults.id, { onDelete: "set null" }),
    errorCode: text("error_code"),
  },
  (t) => [
    uniqueIndex("ux_compare_targets_ordinal").on(t.compareRunId, t.ordinal),
    index("idx_compare_targets_run").on(t.compareRunId),
  ],
);

// Drizzle Relational Mappings
export const auditResultsRelations = relations(auditResults, ({ many }) => ({
  scores: many(auditScores),
  findings: many(auditFindings),
  runs: many(auditRuns),
}));

export const auditScoresRelations = relations(auditScores, ({ one }) => ({
  auditResult: one(auditResults, {
    fields: [auditScores.auditResultId],
    references: [auditResults.id],
  }),
}));

export const auditFindingsRelations = relations(auditFindings, ({ one, many }) => ({
  auditResult: one(auditResults, {
    fields: [auditFindings.auditResultId],
    references: [auditResults.id],
  }),
  evidences: many(auditEvidence),
}));

export const auditEvidenceRelations = relations(auditEvidence, ({ one }) => ({
  finding: one(auditFindings, {
    fields: [auditEvidence.findingId],
    references: [auditFindings.id],
  }),
}));

export const auditRunsRelations = relations(auditRuns, ({ one }) => ({
  auditResult: one(auditResults, {
    fields: [auditRuns.auditResultId],
    references: [auditResults.id],
  }),
}));

export const compareRunsRelations = relations(compareRuns, ({ many }) => ({
  targets: many(compareTargets),
}));

export const compareTargetsRelations = relations(compareTargets, ({ one }) => ({
  compareRun: one(compareRuns, {
    fields: [compareTargets.compareRunId],
    references: [compareRuns.id],
  }),
  auditRun: one(auditRuns, {
    fields: [compareTargets.auditRunId],
    references: [auditRuns.id],
  }),
  auditResult: one(auditResults, {
    fields: [compareTargets.auditResultId],
    references: [auditResults.id],
  }),
}));
