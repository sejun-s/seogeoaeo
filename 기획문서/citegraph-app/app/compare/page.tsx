"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import type { CompareResponse, CompareTargetInput } from "../../lib/compare/contracts";
import "./compare.css";

export default function ComparePage() {
  const [meUrl, setMeUrl] = useState("https://example.com");
  const [competitors, setCompetitors] = useState<string[]>([
    "https://iana.org",
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<CompareResponse | null>(null);

  function addCompetitor() {
    if (competitors.length < 4) {
      setCompetitors([...competitors, ""]);
    }
  }

  function removeCompetitor(index: number) {
    if (competitors.length > 1) {
      setCompetitors(competitors.filter((_, i) => i !== index));
    }
  }

  function updateCompetitor(index: number, value: string) {
    const updated = [...competitors];
    updated[index] = value;
    setCompetitors(updated);
  }

  async function runCompare(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setData(null);

    const targets: CompareTargetInput[] = [
      { role: "ME", url: meUrl, label: "자사 사이트 (ME)" },
      ...competitors
        .filter((url) => url.trim().length > 0)
        .map((url, idx) => ({
          role: "COMPETITOR" as const,
          url: url.trim(),
          label: `경쟁사 ${idx + 1}`,
        })),
    ];

    try {
      const response = await fetch("/api/compare", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ targets }),
      });

      const result = (await response.json()) as { message?: string; error?: string } & CompareResponse;
      if (!response.ok) {
        throw new Error(result.message || result.error || "비교 분석에 실패했습니다.");
      }

      setData(result);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "비교 분석 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  const successfulMetrics = data?.targets
    .filter((target) => target.status === "SUCCESS" && target.metrics)
    .map((target) => target.metrics!) ?? [];
  const realObservationCount = successfulMetrics.filter(
    (metrics) => metrics.aiVisibilityStatus === "REAL" && metrics.eligibleObservationCount > 0,
  ).length;
  const aiVisibilityScope = realObservationCount === 0
    ? "UNAVAILABLE"
    : realObservationCount === successfulMetrics.length
      ? "REAL"
      : "PARTIAL";

  return (
    <main className="app-shell">
      <header className="app-header">
        <div className="brand">
          <strong>CiteGraph</strong>
          <span>SEO & AI Search Analysis</span>
        </div>
        <nav aria-label="현재 위치">
          <Link href="/" prefetch={false}>Audits</Link>
          <strong style={{ marginLeft: "8px" }}>Multi-URL Compare</strong>
        </nav>
        <div className="mode">Local mode · Ruleset 2026.08.1</div>
      </header>

      <div className="content">
        <div className="page-title">
          <div>
            <h1>Multi-URL Compare</h1>
            <p>자사 사이트와 경쟁사 웹사이트를 35개 진단 규칙으로 수평 대조 진단합니다.</p>
          </div>
        </div>

        <form className="audit-form" onSubmit={runCompare}>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div>
              <label htmlFor="me-url" style={{ fontWeight: 600, display: "block", marginBottom: "4px" }}>
                자사 사이트 (ME)
              </label>
              <input
                id="me-url"
                type="url"
                required
                value={meUrl}
                onChange={(e) => setMeUrl(e.target.value)}
                placeholder="https://mysite.com"
                style={{ width: "100%", padding: "8px 12px", border: "1px solid #ccc", borderRadius: "4px" }}
              />
            </div>

            {competitors.map((compUrl, idx) => (
              <div key={idx}>
                <label style={{ fontWeight: 600, display: "block", marginBottom: "4px" }}>
                  경쟁사 {idx + 1} (COMPETITOR)
                </label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    type="url"
                    required
                    value={compUrl}
                    onChange={(e) => updateCompetitor(idx, e.target.value)}
                    placeholder={`https://competitor-${idx + 1}.com`}
                    style={{ flex: 1, padding: "8px 12px", border: "1px solid #ccc", borderRadius: "4px" }}
                  />
                  {competitors.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeCompetitor(idx)}
                      style={{ padding: "8px 12px", background: "#f5f5f5", border: "1px solid #ccc", borderRadius: "4px" }}
                    >
                      삭제
                    </button>
                  )}
                </div>
              </div>
            ))}

            <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
              {competitors.length < 4 && (
                <button
                  type="button"
                  onClick={addCompetitor}
                  style={{ padding: "8px 16px", background: "#f0f0f0", border: "1px solid #ccc", borderRadius: "4px" }}
                >
                  + 경쟁사 추가 (최대 4개)
                </button>
              )}
              <button
                type="submit"
                disabled={loading}
                style={{ padding: "8px 24px", background: "#0284c7", color: "#fff", border: "none", borderRadius: "4px", fontWeight: 600 }}
              >
                {loading ? "Comparing…" : "Compare Sites"}
              </button>
            </div>
          </div>
        </form>

        {error && (
          <div className="error" role="alert" style={{ marginTop: "16px", padding: "12px", background: "#fee2e2", border: "1px solid #f87171", borderRadius: "4px" }}>
            <strong>비교 실패: </strong>
            <span>{error}</span>
          </div>
        )}

        {!data && !error && (
          <div className="initial-state" style={{ marginTop: "24px", padding: "32px", textAlign: "center", border: "1px dashed #ccc", borderRadius: "4px" }}>
            <strong>비교할 자사 URL과 경쟁사 URL을 입력하세요.</strong>
            <p>2개부터 5개까지 사이트를 동시에 진단하고 수평으로 대조합니다.</p>
          </div>
        )}

        {data && (
          <div className="report" style={{ marginTop: "24px" }}>
            <section className="compare-availability" aria-label="AI Visibility 상태">
              <strong>AI Visibility · {aiVisibilityScope}</strong>
              <p>
                {aiVisibilityScope === "UNAVAILABLE"
                  ? "실제 AI 엔진 관측과 질문 세트가 연결되지 않아 인용률·브랜드 언급률·인용 위치는 계산하지 않습니다. 아래 값은 결정론적 SEO Score와 GEO Readiness 비교입니다."
                  : aiVisibilityScope === "PARTIAL"
                    ? "일부 대상에만 실제 AI 관측이 있습니다. 관측이 없는 대상은 순위와 격차 계산에서 제외됩니다."
                    : "표시된 AI Visibility는 연결된 엔진·질문 세트의 실제 관측 결과이며 GEO Readiness와 별도로 계산됩니다."}
              </p>
            </section>

            <section className="compare-targets" aria-label="사이트별 기술 진단 점수">
              {data.targets.map((target) => (
                <div
                  key={target.targetId}
                  className={`compare-target ${target.role === "ME" ? "compare-target-me" : ""}`}
                >
                  <div className="compare-target-role">
                    {target.label} {target.role === "ME" && "(ME)"}
                  </div>
                  <h3>
                    {target.displayUrl}
                  </h3>
                  {target.status === "SUCCESS" && target.metrics ? (
                    <div className="compare-target-scores">
                      <span><small>SEO Score</small><strong>{target.metrics.seoScore ?? "—"}</strong></span>
                      <span><small>GEO Readiness</small><strong>{target.metrics.geoReadinessScore ?? "—"}</strong></span>
                      <span>
                        <small>AI Visibility</small>
                        <strong>{target.metrics.aiVisibilityStatus ?? "UNAVAILABLE"}</strong>
                        <small className="compare-visibility-detail">
                          {target.metrics.aiVisibilityStatus === "REAL"
                            ? `Citation ${target.metrics.citationRate ?? "—"}% · Mention ${target.metrics.brandMentionRate ?? "—"}% · Position ${target.metrics.averageCitationPosition ?? "—"}`
                            : target.metrics.aiVisibilityReason || "실제 AI 관측이 없습니다."}
                        </small>
                      </span>
                    </div>
                  ) : (
                    <div style={{ color: "#ef4444", fontSize: "12px", marginTop: "8px" }}>
                      진단 실패 ({target.error?.code || "ERROR"})
                    </div>
                  )}
                </div>
              ))}
            </section>

            {/* Category Comparison Table */}
            <section style={{ marginBottom: "32px" }}>
              <h2>카테고리 수평 비교</h2>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                      <th style={{ padding: "10px" }}>Category</th>
                      <th style={{ padding: "10px" }}>Type</th>
                      <th style={{ padding: "10px" }}>Max</th>
                      {data.targets.map((t) => (
                        <th key={t.targetId} style={{ padding: "10px" }}>
                          {t.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.categories.map((cat, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "10px", fontWeight: 600 }}>{cat.categoryName}</td>
                        <td style={{ padding: "10px" }}>{cat.scoreType}</td>
                        <td style={{ padding: "10px" }}>{cat.maxScore}</td>
                        {data.targets.map((t) => (
                          <td key={t.targetId} style={{ padding: "10px" }}>
                            {cat.scores[t.displayUrl] !== null && cat.scores[t.displayUrl] !== undefined
                              ? `${cat.scores[t.displayUrl]} pt`
                              : "—"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Findings Diff Matrix */}
            <section>
              <h2>Findings 규칙 수평 대조표</h2>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                      <th style={{ padding: "10px" }}>Rule ID</th>
                      <th style={{ padding: "10px" }}>Rule Title</th>
                      <th style={{ padding: "10px" }}>Type</th>
                      <th style={{ padding: "10px" }}>Weight</th>
                      {data.targets.map((t) => (
                        <th key={t.targetId} style={{ padding: "10px" }}>
                          {t.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.findingsDiff.map((finding) => (
                      <tr key={finding.ruleId} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "10px", fontFamily: "monospace", fontSize: "12px" }}>{finding.ruleId}</td>
                        <td style={{ padding: "10px", fontWeight: 600 }}>{finding.title}</td>
                        <td style={{ padding: "10px" }}>{finding.scoreType}</td>
                        <td style={{ padding: "10px" }}>{finding.weight} pt</td>
                        {data.targets.map((t) => {
                          const res = finding.results[t.displayUrl];
                          const bg =
                            res === "PASS" ? "#dcfce7" : res === "WARN" ? "#fef3c7" : res === "FAIL" ? "#fee2e2" : "#f1f5f9";
                          const fg =
                            res === "PASS" ? "#166534" : res === "WARN" ? "#92400e" : res === "FAIL" ? "#991b1b" : "#64748b";
                          return (
                            <td key={t.targetId} style={{ padding: "10px" }}>
                              <span style={{ padding: "2px 8px", borderRadius: "4px", background: bg, color: fg, fontWeight: 700, fontSize: "11px" }}>
                                {res || "—"}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
