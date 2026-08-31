"use client";

import { FormEvent, useState } from "react";
import type { AuditResult, Rule, Score } from "../lib/audit";
import type { AuditV2Dto } from "../lib/services/audit-v2-service";
import { WorkspaceShell, useWorkspace, type ScanItem } from "./workspace-shell";
import "./workspace.css";

function percent(value: number | null) {
  return value === null ? "측정 불가" : `${Math.round(value * 100)}%`;
}

function CoverageGauge({
  coverage,
  domainType,
}: {
  coverage: number | null;
  domainType: "seo" | "geo";
}) {
  const pct = coverage === null ? 0 : Math.round(coverage * 100);
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (pct / 100) * circumference;
  const strokeColor = domainType === "seo" ? "var(--seo)" : "var(--geo)";

  return (
    <div
      className="coverage-gauge"
      title={`Coverage: ${percent(coverage)}`}
      aria-label={`Coverage ${pct}%`}
    >
      <svg width="44" height="44" viewBox="0 0 44 44" aria-hidden="true">
        <circle
          cx="22"
          cy="22"
          r={radius}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="3.5"
        />
        <circle
          cx="22"
          cy="22"
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth="3.5"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform="rotate(-90 22 22)"
        />
      </svg>
      <span className="coverage-gauge-text">{pct}%</span>
    </div>
  );
}

function V2Domain({
  title,
  data,
  domainType,
}: {
  title: string;
  data: AuditV2Dto["seoFact"];
  domainType: "seo" | "geo";
}) {
  return (
    <div className={`v2-domain v2-domain-${domainType}`}>
      <div className="v2-domain-header">
        <div>
          <h3>{title}</h3>
          <p>{data.state}</p>
        </div>
        <div className="v2-score-bundle">
          <CoverageGauge
            coverage={data.coverage.coverage}
            domainType={domainType}
          />
          <div className="v2-score-numbers">
            <strong>
              {data.score ?? "N/A"}
              <small>{data.score === null ? "" : " / 100"}</small>
            </strong>
            <span className="v2-coverage-badge">
              Coverage {percent(data.coverage.coverage)}
            </span>
          </div>
        </div>
      </div>
      <dl>
        <div>
          <dt>Coverage</dt>
          <dd>{percent(data.coverage.coverage)}</dd>
        </div>
        <div>
          <dt>Measured</dt>
          <dd>
            {data.coverage.measuredWeight} / {data.coverage.applicableWeight} pt
          </dd>
        </div>
        <div>
          <dt>N_A</dt>
          <dd>{data.coverage.counts.N_A}</dd>
        </div>
        <div>
          <dt>UNKNOWN</dt>
          <dd>{data.coverage.counts.UNKNOWN}</dd>
        </div>
      </dl>
    </div>
  );
}

function V2Section({ data }: { data: AuditV2Dto }) {
  const unavailable = data.exclusions.filter(
    (item) => item.result !== "NOT_EVALUATED",
  );
  const preparingCount = data.geoSemantic.coverage.counts.NOT_EVALUATED;
  function recordEvidenceView() {
    void fetch("/api/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        eventName: "V2_EVIDENCE_VIEWED",
        auditV2ResultId: data.resultId,
      }),
    }).catch(() => undefined);
  }
  return (
    <section className="v2-section" aria-labelledby="v2-heading">
      <details className="v2-preview">
        <summary>
          <span>
            <span className="section-kicker">EXPERIMENTAL · PREVIEW</span>
            <strong id="v2-heading">Fact 기반 실험 측정 보기</strong>
          </span>
          <small>공식 SEO/GEO 점수를 대체하지 않습니다.</small>
        </summary>
        <div className="v2-preview-body">
          <p className="v2-notice">
            개발 중인 Fact 측정의 coverage를 검증하는 보조 정보입니다. GEO Fact는
            실제 AI 노출이나 인용률이 아니며 공식 점수와 직접 비교하면 안 됩니다.
          </p>
          <div className="page-type-context">
            <strong>페이지 유형: {data.pageType.type}</strong>
            <span>
              {data.pageType.type === "UNKNOWN"
                ? "페이지 유형을 충분히 확정할 근거가 없어 일부 유형별 검사가 제외될 수 있습니다."
                : `${Math.round(data.pageType.confidence * 100)}% 신뢰도로 분류했으며 유형별 적용 규칙에 사용됩니다.`}
            </span>
          </div>
          <div className="v2-domains">
            <V2Domain
              title="실험적 SEO Fact"
              data={data.seoFact}
              domainType="seo"
            />
            <V2Domain
              title="실험적 GEO Fact"
              data={data.geoFact}
              domainType="geo"
            />
          </div>
          <div className="preparing-state">
            <strong>Semantic 분석 준비 중</strong>
            <span>
              아직 평가하지 않은 {preparingCount}개 항목은 실패나 개선 과제로
              계산하지 않습니다.
            </span>
          </div>
          <details className="v2-reasons">
            <summary>측정 제외·확인 불가 항목 {unavailable.length}건</summary>
            <p>
              페이지 유형에 적용되지 않거나 현재 근거만으로 판정할 수 없는
              항목입니다. 공식 Findings 실패 수에 포함되지 않습니다.
            </p>
          </details>
          <details
            className="v2-reasons advanced-diagnostics"
            onToggle={(event) => {
              if (event.currentTarget.open) recordEvidenceView();
            }}
          >
            <summary>고급 진단 정보</summary>
            <p>
              {data.methodologyVersion} · {data.registryVersion} · confidence{" "}
              {Math.round(data.pageType.confidence * 100)}%
            </p>
            <dl className="v2-meta">
              <div>
                <dt>Result ID</dt>
                <dd>{data.resultId}</dd>
              </div>
              <div>
                <dt>Content hash</dt>
                <dd>{data.contentHash}</dd>
              </div>
              <div>
                <dt>Evidence / Fact</dt>
                <dd>
                  {data.persistence.evidenceCount} /{" "}
                  {data.persistence.factCount}
                </dd>
              </div>
              <div>
                <dt>Snapshot</dt>
                <dd>{data.snapshotId}</dd>
              </div>
            </dl>
            <div className="v2-reason-list">
              {data.exclusions.map((item) => (
                <div key={`${item.domain}-${item.ruleId}`}>
                  <strong>{item.result}</strong>
                  <code>{item.ruleId}</code>
                  <span>{item.rationaleCode}</span>
                </div>
              ))}
            </div>
          </details>
        </div>
      </details>
    </section>
  );
}

/**
 * 카테고리 안의 PASS/WARN/FAIL 가중치 구성.
 *
 * `category.rules`는 캐시·저장 경로를 거친 API 응답에는 없을 수 있어
 * (audit-service.ts가 DB 왕복용으로 category score만 남기고 개별 rule은
 * 최상위 findings로 분리해 반환) 신뢰할 수 없다. 대신 항상 존재하는
 * `findings`(비-PASS rule 전체)에서 카테고리별 WARN/FAIL 가중치를 합산하고,
 * PASS 가중치는 maxScore에서 그 나머지로 역산한다.
 */
function categoryComposition(
  category: { name: string; maxScore: number },
  findings: Rule[],
) {
  const inCategory = findings.filter((rule) => rule.category === category.name);
  const failWeight = inCategory
    .filter((rule) => rule.result === "FAIL")
    .reduce((sum, rule) => sum + rule.weight, 0);
  const warnWeight = inCategory
    .filter((rule) => rule.result === "WARN")
    .reduce((sum, rule) => sum + rule.weight, 0);
  const passWeight = Math.max(0, category.maxScore - failWeight - warnWeight);
  const total = passWeight + warnWeight + failWeight || 1;
  return {
    pass: (passWeight / total) * 100,
    warn: (warnWeight / total) * 100,
    fail: (failWeight / total) * 100,
    warnCount: inCategory.filter((rule) => rule.result === "WARN").length,
    failCount: inCategory.filter((rule) => rule.result === "FAIL").length,
  };
}

function CategoryBreakdown({
  data,
  findings,
}: {
  data: Score;
  findings: Rule[];
}) {
  return (
    <div className="category-table">
      <div className="category-header">
        <span>Category</span>
        <span>Score</span>
        <span>구성 · WARN/FAIL</span>
      </div>
      {data.categories.map((category) => {
        const composition = categoryComposition(category, findings);
        return (
          <div className="category-row" key={category.name}>
            <strong>{category.name}</strong>
            <span>
              {category.score} / {category.maxScore}
            </span>
            <div className="meter-group">
              <div
                className="meter meter-stacked"
                role="img"
                aria-label={`${category.name}: WARN ${composition.warnCount}건, FAIL ${composition.failCount}건`}
              >
                <i
                  className="meter-pass"
                  style={{ width: `${composition.pass}%` }}
                />
                <i
                  className="meter-warn"
                  style={{ width: `${composition.warn}%` }}
                />
                <i
                  className="meter-fail"
                  style={{ width: `${composition.fail}%` }}
                />
              </div>
              <span className="meter-legend">
                W{composition.warnCount} · F{composition.failCount}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ScoreSection({
  title,
  description,
  data,
  findings,
  type,
}: {
  title: string;
  description: string;
  data: Score;
  findings: Rule[];
  type: "seo" | "geo";
}) {
  return (
    <section className={`score-section ${type}`}>
      <div className="score-summary">
        <div>
          <p className="section-kicker">{title}</p>
          <p>{description}</p>
        </div>
        <div className="score-value">
          <strong>{data.score}</strong>
          <span>/ 100</span>
        </div>
      </div>
      <CategoryBreakdown data={data} findings={findings} />
    </section>
  );
}

function getActionableSnippet(
  rule: Rule,
  extracted: AuditResult["extracted"],
  finalUrl: string,
  pageType?: string,
): { label: string; code: string } | null {
  if (rule.result !== "FAIL") return null;
  const ruleId = rule.ruleId || rule.id;

  // Canonical 관련 FAIL
  if (ruleId === "SEO-TECH-002" || ruleId === "SEO-INDEX-003") {
    const targetUrl = finalUrl || "https://example.com";
    return {
      label: "Canonical 태그 스니펫",
      code: `<link rel="canonical" href="${targetUrl}">`,
    };
  }

  // Schema 관련 FAIL
  if (ruleId === "SEO-SCHEMA-001" || ruleId === "SEO-SCHEMA-002") {
    const titleVal = extracted.title || "[페이지 제목을 입력하세요]";
    const descVal = extracted.metaDescription || "[페이지 설명을 입력하세요]";

    if (pageType === "ARTICLE_BLOG") {
      return {
        label: "최소 유효 JSON-LD 스니펫 (Article)",
        code: `<script type="application/ld+json">\n{\n  "@context": "https://schema.org",\n  "@type": "Article",\n  "headline": "${titleVal}",\n  "description": "${descVal}",\n  "author": {\n    "@type": "Person",\n    "name": "[저자 이름 - 필수 입력]"\n  },\n  "datePublished": "[발행일: YYYY-MM-DD - 필수 입력]"\n}\n</script>`,
      };
    }

    if (pageType === "HOMEPAGE") {
      return {
        label: "최소 유효 JSON-LD 스니펫 (WebSite)",
        code: `<script type="application/ld+json">\n{\n  "@context": "https://schema.org",\n  "@type": "WebSite",\n  "name": "${titleVal}",\n  "url": "${finalUrl || 'https://example.com'}"\n}\n</script>`,
      };
    }

    return {
      label: "최소 유효 JSON-LD 스니펫 (WebPage)",
      code: `<script type="application/ld+json">\n{\n  "@context": "https://schema.org",\n  "@type": "WebPage",\n  "name": "${titleVal}",\n  "description": "${descVal}",\n  "url": "${finalUrl || 'https://example.com'}"\n}\n</script>`,
    };
  }

  return null;
}

function FindingRow({
  rule,
  defaultOpen,
  extracted,
  finalUrl,
  pageType,
}: {
  rule: Rule;
  defaultOpen: boolean;
  extracted: AuditResult["extracted"];
  finalUrl: string;
  pageType?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const snippet = getActionableSnippet(rule, extracted, finalUrl, pageType);

  async function copyText(text: string, key: string) {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopiedKey(key);
      setTimeout(() => {
        setCopiedKey((curr) => (curr === key ? null : curr));
      }, 2000);
    } catch {
      // Ignore clipboard error
    }
  }

  return (
    <div className={`finding ${rule.result.toLowerCase()}`}>
      <button
        className="finding-row"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className="finding-type">{rule.scoreType}</span>
        <span className="finding-main">
          <strong>{rule.title}</strong>
          <small>{rule.category}</small>
        </span>
        <span className="finding-weight">{rule.weight} pt</span>
        <span className="finding-status">{rule.result}</span>
        <span className="finding-toggle" aria-hidden="true">
          {open ? "−" : "+"}
        </span>
      </button>
      {open && (
        <div className="finding-detail">
          <div>
            <h4>Rule</h4>
            <p>{rule.description}</p>
          </div>
          <div>
            <h4>Evidence</h4>
            {rule.evidence.map((evidence) => (
              <div className="evidence" key={evidence.id}>
                <span>{evidence.excerpt}</span>
                <details className="evidence-technical">
                  <summary>근거 식별자</summary>
                  <code>{evidence.id}</code>
                </details>
              </div>
            ))}
          </div>
          <div>
            <div className="recommendation-header">
              <h4>Recommendation</h4>
              <button
                type="button"
                className={`copy-btn ${copiedKey === "rec" ? "copied" : ""}`}
                onClick={() => copyText(rule.recommendation, "rec")}
                aria-label="Recommendation 복사"
              >
                {copiedKey === "rec" ? "복사됨" : "복사"}
              </button>
            </div>
            <p>{rule.recommendation}</p>
          </div>
          {snippet && (
            <div className="snippet-box">
              <div className="snippet-header">
                <h4>{snippet.label}</h4>
                <button
                  type="button"
                  className={`copy-btn ${copiedKey === "snippet" ? "copied" : ""}`}
                  onClick={() => copyText(snippet.code, "snippet")}
                  aria-label={`${snippet.label} 복사`}
                >
                  {copiedKey === "snippet" ? "복사됨" : "코드 복사"}
                </button>
              </div>
              <pre className="snippet-code"><code>{snippet.code}</code></pre>
            </div>
          )}
          <details className="rule-technical">
            <summary>고급 규칙 정보</summary>
            <code>{rule.ruleId || rule.id}</code>
          </details>
        </div>
      )}
    </div>
  );
}

function AuditWorkspace() {
  const { projects, projectId, activeProject, scans, refreshScans } = useWorkspace();
  const [url, setUrl] = useState("https://example.com");
  const [data, setData] = useState<AuditResult | null>(null);
  const [v2Data, setV2Data] = useState<AuditV2Dto | null>(null);
  const [v2Error, setV2Error] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [savedProjectId, setSavedProjectId] = useState<string | null>(null);

  async function run(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setData(null);
    setV2Data(null);
    setV2Error("");
    setSavedProjectId(null);
    const analysisProjectId = projectId || null;
    try {
      const request = {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url, projectId: analysisProjectId || undefined }),
      };
      const [response, v2Response] = await Promise.all([
        fetch("/api/audits", request),
        fetch("/api/audits?engine=v2", request),
      ]);
      const result = (await response.json()) as {
        error?: string;
        message?: string;
      } & AuditResult;
      if (!response.ok)
        throw new Error(result.message || result.error || "분석에 실패했습니다.");
      setData(result);
      const v2Result = (await v2Response.json()) as {
        error?: string;
        message?: string;
      } & AuditV2Dto;
      if (v2Response.ok) {
        setV2Data(v2Result);
        setSavedProjectId(analysisProjectId);
        if (analysisProjectId) {
          void refreshScans(analysisProjectId);
        }
      } else {
        setV2Error(v2Result.message || v2Result.error || "v2 분석에 실패했습니다.");
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "분석에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function saveResultToProject() {
    if (!v2Data || !projectId) return;
    const response = await fetch(`/api/audits/v2/${v2Data.resultId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ projectId }),
    });
    if (!response.ok) {
      setError("분석 결과를 프로젝트에 저장하지 못했습니다.");
      return;
    }
    setSavedProjectId(projectId);
    await refreshScans(projectId);
  }

  return (
    <div className="content audit-content">
      <div className="page-title dashboard-title">
        <div>
          <p className="section-kicker">AUDIT WORKSPACE</p>
          <h1>SEO & AI Search audit</h1>
          <p>공개 페이지의 검색 기반과 생성형 검색 준비도를 근거 중심으로 진단합니다.</p>
        </div>
        <div className="workspace-state">
          <span>Analysis mode</span>
          <strong>Deterministic</strong>
          <small>REAL HTML · Ruleset 2026.08.1</small>
        </div>
      </div>
      <form className="audit-form command-bar" onSubmit={run} id="audit">
        <label htmlFor="url">URL</label>
        <div>
          <input
            id="url"
            type="url"
            required
            value={url}
            onChange={(event) => setUrl(event.target.value)}
          />
          <button disabled={loading}>{loading ? "Analyzing…" : "Analyze"}</button>
        </div>
        <p>
          {activeProject
            ? `${activeProject.name}에 v2 결과를 저장합니다.`
            : "프로젝트 미선택: 분석은 실행되지만 프로젝트 이력에는 저장되지 않습니다."}{" "}
          로그인 페이지와 내부 네트워크 주소는 차단됩니다.
        </p>
      </form>

      {error && (
        <div className="error" role="alert">
          <strong>분석 실패: </strong>
          <span>{error}</span>
        </div>
      )}

      {!data && !error && (
        <div className="initial-state">
          <strong>분석할 URL을 입력하세요.</strong>
          <span>
            Title, meta description, H1, canonical, robots, schema를 추출하고 35개
            결정론적 규칙을 실행합니다.
          </span>
        </div>
      )}

      {data && (
        <div className="report">
          <section
            className={`save-status ${savedProjectId ? "saved" : "unsaved"}`}
            aria-live="polite"
          >
            <div>
              <strong>
                {savedProjectId
                  ? "v2 분석 기록 저장됨"
                  : "v2 분석 기록이 저장되지 않음"}
              </strong>
              <span>
                {savedProjectId
                  ? projects.find((project) => project.id === savedProjectId)?.name
                  : "좌측에서 프로젝트를 선택해 이 결과를 보관할 수 있습니다."}
              </span>
            </div>
            {!savedProjectId && activeProject && v2Data && (
              <button onClick={saveResultToProject}>이 프로젝트에 저장</button>
            )}
          </section>
          <section className="url-summary">
            <div>
              <p className="section-kicker">ANALYZED URL</p>
              <h2>{data.extracted.title || new URL(data.finalUrl).hostname}</h2>
              <a href={data.finalUrl} target="_blank" rel="noreferrer">
                {data.finalUrl}
              </a>
            </div>
            <dl>
              <div>
                <dt>Ruleset</dt>
                <dd>{data.rulesetVersion}</dd>
              </div>
              <div>
                <dt>Findings</dt>
                <dd>{data.findings.length}</dd>
              </div>
            </dl>
          </section>

          <ScoreSection
            type="seo"
            title="SEO Score"
            description="기술 SEO, 온페이지, 색인성, 구조화 데이터와 콘텐츠 기본기를 평가합니다."
            data={data.scores.seo}
            findings={data.findings}
          />

          <ScoreSection
            type="geo"
            title="GEO Readiness Score"
            description="실제 AI 노출값이 아닙니다. 답변 가능성, 기계 판독성, 신뢰 근거와 인용 준비도를 독립적으로 평가합니다."
            data={data.scores.geoReadiness}
            findings={data.findings}
          />

          <section className="findings-section">
            <div className="section-heading">
              <div>
                <p className="section-kicker">FINDINGS</p>
                <h2>개선 항목</h2>
              </div>
              <p>
                가중치가 높은 WARN·FAIL 순서 · 영향 큰 FAIL 항목은 근거와 해결
                방법을 기본으로 펼쳐서 보여줍니다.
              </p>
            </div>
            {(() => {
              // 심각도(FAIL 우선) → 가중치 내림차순 정렬.
              const severityRank = { FAIL: 0, WARN: 1, PASS: 2 } as const;
              const sortBySeverity = (rules: typeof data.findings) =>
                [...rules].sort((a, b) => {
                  const bySeverity =
                    (severityRank[a.result] ?? 3) -
                    (severityRank[b.result] ?? 3);
                  if (bySeverity !== 0) return bySeverity;
                  return b.weight - a.weight;
                });

              // SEO / GEO 두 축으로 그룹화한다. 이 제품의 정체성(2축 분리)을
              // findings에서도 시각적으로 유지한다. FAIL 자동 펼침은 축과
              // 무관하게 상위 3개까지만.
              let openFailCount = 0;
              const groups = [
                { type: "SEO" as const, label: "SEO", desc: "검색엔진 발견·색인·구조" },
                { type: "GEO" as const, label: "GEO", desc: "AI 답변 준비도" },
              ];

              return groups.map((group) => {
                const rules = sortBySeverity(
                  data.findings.filter((r) => r.scoreType === group.type),
                );
                if (rules.length === 0) return null;
                const failCount = rules.filter((r) => r.result === "FAIL").length;
                const warnCount = rules.filter((r) => r.result === "WARN").length;
                return (
                  <div
                    className={`finding-group ${group.type.toLowerCase()}`}
                    key={group.type}
                  >
                    <div className="finding-group-head">
                      <span className="finding-group-tag">{group.label}</span>
                      <span className="finding-group-desc">{group.desc}</span>
                      <span className="finding-group-count">
                        {failCount > 0 && <em className="fg-fail">FAIL {failCount}</em>}
                        {warnCount > 0 && <em className="fg-warn">WARN {warnCount}</em>}
                      </span>
                    </div>
                    <div className="finding-table">
                      {rules.map((rule) => {
                        const defaultOpen =
                          rule.result === "FAIL" && openFailCount < 3;
                        if (defaultOpen) openFailCount += 1;
                        return (
                          <FindingRow
                            key={rule.id}
                            rule={rule}
                            defaultOpen={defaultOpen}
                            extracted={data.extracted}
                            finalUrl={data.finalUrl}
                            pageType={v2Data?.pageType?.type}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              });
            })()}
          </section>

          {v2Data && <V2Section data={v2Data} />}
          {v2Error && (
            <div className="error" role="status">
              <strong>v2 preview 실패: </strong>
              <span>{v2Error}</span>
            </div>
          )}

          <section className="source-section">
            <div className="section-heading">
              <div>
                <p className="section-kicker">SOURCE SNAPSHOT</p>
                <h2>추출 정보</h2>
              </div>
            </div>
            <dl className="source-list">
              {Object.entries(data.extracted).map(([key, value]) => (
                <div key={key}>
                  <dt>{key}</dt>
                  <dd>
                    {Array.isArray(value)
                      ? value.join(", ") || "—"
                      : value || "—"}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          {activeProject && (
            <ProjectScanTrend
              scans={scans}
              projectName={activeProject.name}
            />
          )}
        </div>
      )}
    </div>
  );
}

function ProjectScanTrend({
  scans,
  projectName,
}: {
  scans: ScanItem[];
  projectName: string;
}) {
  const validScans = scans
    .filter((s) => s.seoScore !== null && s.seoScore !== undefined)
    .slice()
    .reverse();

  return (
    <section className="scan-trend-section" aria-label="프로젝트 점수 이력 추이">
      <div className="section-heading">
        <div>
          <p className="section-kicker">SCORE HISTORY</p>
          <h2>{projectName} 점수 추이</h2>
        </div>
        {validScans.length >= 2 && (
          <p className="trend-count">저장된 기록 {validScans.length}건</p>
        )}
      </div>
      {validScans.length < 2 ? (
        <div className="scan-trend-empty">
          <strong>이력 부족</strong>
          <p>
            저장된 진단 결과가 2개 미만입니다 (현재 {validScans.length}건).
            프로젝트에 진단 결과를 2회 이상 저장하면 시간축 점수 추이가 표시됩니다.
          </p>
        </div>
      ) : (
        <div className="trend-chart-container">
          <div className="trend-legend">
            <span className="legend-seo">
              <i /> SEO Score
            </span>
            <span className="legend-geo">
              <i /> GEO Fact
            </span>
          </div>
          <div className="trend-timeline">
            {validScans.map((scan, idx) => {
              let path = "/";
              try {
                path = new URL(scan.finalUrl).pathname || "/";
              } catch {
                path = scan.finalUrl;
              }
              return (
                <div key={scan.id || idx} className="trend-point-card">
                  <time>
                    {new Date(scan.createdAt).toLocaleDateString("ko-KR", {
                      month: "numeric",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </time>
                  <span className="trend-url" title={scan.finalUrl}>
                    {path}
                  </span>
                  <div className="trend-scores">
                    <span className="trend-score-seo">
                      SEO <strong>{scan.seoScore ?? "—"}</strong>
                    </span>
                    <span className="trend-score-geo">
                      GEO <strong>{scan.geoFactScore ?? "—"}</strong>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

export default function Home() {
  return (
    <WorkspaceShell currentPage="audit">
      <AuditWorkspace />
    </WorkspaceShell>
  );
}
