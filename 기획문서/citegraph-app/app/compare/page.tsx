"use client";

import { FormEvent, useState } from "react";
import type {
  CompareResponse,
  CompareTargetInput,
} from "../../lib/compare/contracts";
import { WorkspaceShell } from "../workspace-shell";
import "./compare.css";

function CompareWorkspace() {
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

      const result = (await response.json()) as {
        message?: string;
        error?: string;
      } & CompareResponse;
      if (!response.ok) {
        throw new Error(
          result.message || result.error || "비교 분석에 실패했습니다.",
        );
      }

      setData(result);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "비교 분석 중 오류가 발생했습니다.",
      );
    } finally {
      setLoading(false);
    }
  }

  const successfulMetrics =
    data?.targets
      .filter((target) => target.status === "SUCCESS" && target.metrics)
      .map((target) => target.metrics!) ?? [];
  const realObservationCount = successfulMetrics.filter(
    (metrics) =>
      metrics.aiVisibilityStatus === "REAL" &&
      metrics.eligibleObservationCount > 0,
  ).length;
  const aiVisibilityScope =
    realObservationCount === 0
      ? "UNAVAILABLE"
      : realObservationCount === successfulMetrics.length
        ? "REAL"
        : "PARTIAL";

  return (
    <div className="content compare-content">
      <div className="page-title dashboard-title">
        <div>
          <p className="section-kicker">COMPARE WORKSPACE</p>
          <h1>Multi-URL Compare</h1>
          <p>
            자사 사이트와 경쟁사 웹사이트를 35개 진단 규칙으로 수평 대조 진단합니다.
          </p>
        </div>
        <div className="workspace-state">
          <span>Analysis mode</span>
          <strong>Deterministic</strong>
          <small>REAL HTML · Ruleset 2026.08.1</small>
        </div>
      </div>

      <form className="compare-form" onSubmit={runCompare}>
        <div className="compare-form-fields">
          <div className="compare-field-group">
            <label htmlFor="me-url">자사 사이트 (ME)</label>
            <input
              id="me-url"
              type="url"
              required
              value={meUrl}
              onChange={(e) => setMeUrl(e.target.value)}
              placeholder="https://mysite.com"
            />
          </div>

          {competitors.map((compUrl, idx) => (
            <div key={idx} className="compare-field-group">
              <label htmlFor={`comp-url-${idx}`}>경쟁사 {idx + 1} (COMPETITOR)</label>
              <div className="compare-input-row">
                <input
                  id={`comp-url-${idx}`}
                  type="url"
                  required
                  value={compUrl}
                  onChange={(e) => updateCompetitor(idx, e.target.value)}
                  placeholder={`https://competitor-${idx + 1}.com`}
                />
                {competitors.length > 1 && (
                  <button
                    type="button"
                    className="compare-remove-btn"
                    onClick={() => removeCompetitor(idx)}
                  >
                    삭제
                  </button>
                )}
              </div>
            </div>
          ))}

          <div className="compare-actions">
            {competitors.length < 4 && (
              <button
                type="button"
                className="compare-add-btn"
                onClick={addCompetitor}
              >
                + 경쟁사 추가 (최대 4개)
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="compare-submit-btn"
            >
              {loading ? "Comparing…" : "Compare Sites"}
            </button>
          </div>
        </div>
      </form>

      {error && (
        <div className="error" role="alert">
          <strong>비교 실패: </strong>
          <span>{error}</span>
        </div>
      )}

      {!data && !error && (
        <div className="initial-state">
          <strong>비교할 자사 URL과 경쟁사 URL을 입력하세요.</strong>
          <span>2개부터 5개까지 사이트를 동시에 진단하고 수평으로 대조합니다.</span>
        </div>
      )}

      {data && (
        <div className="report">
          <section
            className="compare-availability"
            aria-label="AI Visibility 상태"
          >
            <strong>AI Visibility · {aiVisibilityScope}</strong>
            <p>
              {aiVisibilityScope === "UNAVAILABLE"
                ? "실제 AI 엔진 관측과 질문 세트가 연결되지 않아 인용률·브랜드 언급률·인용 위치는 계산하지 않습니다. 아래 값은 결정론적 SEO Score와 GEO Readiness 비교입니다."
                : aiVisibilityScope === "PARTIAL"
                  ? "일부 대상에만 실제 AI 관측이 있습니다. 관측이 없는 대상은 순위와 격차 계산에서 제외됩니다."
                  : "표시된 AI Visibility는 연결된 엔진·질문 세트의 실제 관측 결과이며 GEO Readiness와 별도로 계산됩니다."}
            </p>
          </section>

          <section
            className="compare-targets"
            aria-label="사이트별 기술 진단 점수"
          >
            {data.targets.map((target) => (
              <div
                key={target.targetId}
                className={`compare-target ${target.role === "ME" ? "compare-target-me" : ""}`}
              >
                <div className="compare-target-role">
                  {target.label} {target.role === "ME" && "(ME)"}
                </div>
                <h3>{target.displayUrl}</h3>
                {target.status === "SUCCESS" && target.metrics ? (
                  <div className="compare-target-scores">
                    <span>
                      <small>SEO Score</small>
                      <strong>{target.metrics.seoScore ?? "—"}</strong>
                    </span>
                    <span>
                      <small>GEO Readiness</small>
                      <strong>
                        {target.metrics.geoReadinessScore ?? "—"}
                      </strong>
                    </span>
                    <span>
                      <small>AI Visibility</small>
                      <strong>
                        {target.metrics.aiVisibilityStatus ?? "UNAVAILABLE"}
                      </strong>
                      <small className="compare-visibility-detail">
                        {target.metrics.aiVisibilityStatus === "REAL"
                          ? `Citation ${target.metrics.citationRate ?? "—"}% · Mention ${target.metrics.brandMentionRate ?? "—"}% · Position ${target.metrics.averageCitationPosition ?? "—"}`
                          : target.metrics.aiVisibilityReason ||
                            "실제 AI 관측이 없습니다."}
                      </small>
                    </span>
                  </div>
                ) : (
                  <div className="compare-target-error">
                    진단 실패 ({target.error?.code || "ERROR"})
                  </div>
                )}
              </div>
            ))}
          </section>

          {/* Category Comparison Table */}
          <section className="compare-section">
            <h2>카테고리 수평 비교</h2>
            <div className="compare-table-wrapper">
              <table className="compare-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Type</th>
                    <th>Max</th>
                    {data.targets.map((t) => (
                      <th key={t.targetId}>{t.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.categories.map((cat, idx) => (
                    <tr key={idx}>
                      <td className="compare-cell-title">{cat.categoryName}</td>
                      <td>{cat.scoreType}</td>
                      <td>{cat.maxScore}</td>
                      {data.targets.map((t) => (
                        <td key={t.targetId}>
                          {cat.scores[t.displayUrl] !== null &&
                          cat.scores[t.displayUrl] !== undefined
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
          <section className="compare-section">
            <h2>Findings 규칙 수평 대조표</h2>
            <div className="compare-table-wrapper">
              <table className="compare-table">
                <thead>
                  <tr>
                    <th>Rule ID</th>
                    <th>Rule Title</th>
                    <th>Type</th>
                    <th>Weight</th>
                    {data.targets.map((t) => (
                      <th key={t.targetId}>{t.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.findingsDiff.map((finding) => (
                    <tr key={finding.ruleId}>
                      <td className="compare-cell-rule-id">
                        {finding.ruleId}
                      </td>
                      <td className="compare-cell-title">{finding.title}</td>
                      <td>{finding.scoreType}</td>
                      <td>{finding.weight} pt</td>
                      {data.targets.map((t) => {
                        const res = finding.results[t.displayUrl];
                        const badgeClass =
                          res === "PASS"
                            ? "compare-badge-pass"
                            : res === "WARN"
                              ? "compare-badge-warn"
                              : res === "FAIL"
                                ? "compare-badge-fail"
                                : "compare-badge-default";
                        return (
                          <td key={t.targetId}>
                            <span className={`compare-badge ${badgeClass}`}>
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
  );
}

export default function ComparePage() {
  return (
    <WorkspaceShell currentPage="compare">
      <CompareWorkspace />
    </WorkspaceShell>
  );
}
