"use client";

import { FormEvent, useEffect, useState } from "react";
import type { AuditResult, Rule, Score } from "../lib/audit";
import type { AuditV2Dto } from "../lib/services/audit-v2-service";
import "./workspace.css";

function percent(value: number | null) {
  return value === null ? "측정 불가" : `${Math.round(value * 100)}%`;
}

function V2Domain({ title, data }: { title: string; data: AuditV2Dto["seoFact"] }) {
  return (
    <div className="v2-domain">
      <div className="v2-domain-score">
        <div><h3>{title}</h3><p>{data.state}</p></div>
        <strong>{data.score ?? "N/A"}<small>{data.score === null ? "" : " / 100"}</small></strong>
      </div>
      <dl>
        <div><dt>Coverage</dt><dd>{percent(data.coverage.coverage)}</dd></div>
        <div><dt>Measured</dt><dd>{data.coverage.measuredWeight} / {data.coverage.applicableWeight} pt</dd></div>
        <div><dt>N_A</dt><dd>{data.coverage.counts.N_A}</dd></div>
        <div><dt>UNKNOWN</dt><dd>{data.coverage.counts.UNKNOWN}</dd></div>
      </dl>
    </div>
  );
}

function V2Section({ data }: { data: AuditV2Dto }) {
  const unavailable = data.exclusions.filter((item) => item.result !== "NOT_EVALUATED");
  const preparingCount = data.geoSemantic.coverage.counts.NOT_EVALUATED;
  function recordEvidenceView() {
    void fetch("/api/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ eventName: "V2_EVIDENCE_VIEWED", auditV2ResultId: data.resultId }),
    }).catch(() => undefined);
  }
  return (
    <section className="v2-section" aria-labelledby="v2-heading">
      <details className="v2-preview">
        <summary>
          <span><span className="section-kicker">EXPERIMENTAL · PREVIEW</span><strong id="v2-heading">Fact 기반 실험 측정 보기</strong></span>
          <small>공식 SEO/GEO 점수를 대체하지 않습니다.</small>
        </summary>
        <div className="v2-preview-body">
          <p className="v2-notice">개발 중인 Fact 측정의 coverage를 검증하는 보조 정보입니다. GEO Fact는 실제 AI 노출이나 인용률이 아니며 공식 점수와 직접 비교하면 안 됩니다.</p>
          <div className="page-type-context">
            <strong>페이지 유형: {data.pageType.type}</strong>
            <span>{data.pageType.type === "UNKNOWN" ? "페이지 유형을 충분히 확정할 근거가 없어 일부 유형별 검사가 제외될 수 있습니다." : `${Math.round(data.pageType.confidence * 100)}% 신뢰도로 분류했으며 유형별 적용 규칙에 사용됩니다.`}</span>
          </div>
          <div className="v2-domains">
            <V2Domain title="실험적 SEO Fact" data={data.seoFact} />
            <V2Domain title="실험적 GEO Fact" data={data.geoFact} />
          </div>
          <div className="preparing-state"><strong>Semantic 분석 준비 중</strong><span>아직 평가하지 않은 {preparingCount}개 항목은 실패나 개선 과제로 계산하지 않습니다.</span></div>
          <details className="v2-reasons">
            <summary>측정 제외·확인 불가 항목 {unavailable.length}건</summary>
            <p>페이지 유형에 적용되지 않거나 현재 근거만으로 판정할 수 없는 항목입니다. 공식 Findings 실패 수에 포함되지 않습니다.</p>
          </details>
          <details className="v2-reasons advanced-diagnostics" onToggle={(event) => {
            if (event.currentTarget.open) recordEvidenceView();
          }}>
            <summary>고급 진단 정보</summary>
            <p>{data.methodologyVersion} · {data.registryVersion} · confidence {Math.round(data.pageType.confidence * 100)}%</p>
            <dl className="v2-meta">
              <div><dt>Result ID</dt><dd>{data.resultId}</dd></div>
              <div><dt>Content hash</dt><dd>{data.contentHash}</dd></div>
              <div><dt>Evidence / Fact</dt><dd>{data.persistence.evidenceCount} / {data.persistence.factCount}</dd></div>
              <div><dt>Snapshot</dt><dd>{data.snapshotId}</dd></div>
            </dl>
            <div className="v2-reason-list">
              {data.exclusions.map((item) => (
                <div key={`${item.domain}-${item.ruleId}`}><strong>{item.result}</strong><code>{item.ruleId}</code><span>{item.rationaleCode}</span></div>
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
function categoryComposition(category: { name: string; maxScore: number }, findings: Rule[]) {
  const inCategory = findings.filter((rule) => rule.category === category.name);
  const failWeight = inCategory.filter((rule) => rule.result === "FAIL").reduce((sum, rule) => sum + rule.weight, 0);
  const warnWeight = inCategory.filter((rule) => rule.result === "WARN").reduce((sum, rule) => sum + rule.weight, 0);
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

function CategoryBreakdown({ data, findings }: { data: Score; findings: Rule[] }) {
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
                <i className="meter-pass" style={{ width: `${composition.pass}%` }} />
                <i className="meter-warn" style={{ width: `${composition.warn}%` }} />
                <i className="meter-fail" style={{ width: `${composition.fail}%` }} />
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

function FindingRow({ rule, defaultOpen }: { rule: Rule; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
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
          <small>
            {rule.category}
          </small>
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
            {rule.evidence.map((evidence) => <div className="evidence" key={evidence.id}>
              <span>{evidence.excerpt}</span>
              <details className="evidence-technical"><summary>근거 식별자</summary><code>{evidence.id}</code></details>
            </div>)}
          </div>
          <div>
            <h4>Recommendation</h4>
            <p>{rule.recommendation}</p>
          </div>
          <details className="rule-technical"><summary>고급 규칙 정보</summary><code>{rule.ruleId || rule.id}</code></details>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [url, setUrl] = useState("https://example.com");
  const [data, setData] = useState<AuditResult | null>(null);
  const [v2Data, setV2Data] = useState<AuditV2Dto | null>(null);
  const [v2Error, setV2Error] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Array<{ id: string; name: string; domainLabel: string }>>([]);
  const [projectId, setProjectId] = useState("");
  const [projectName, setProjectName] = useState("");
  const [projectDomain, setProjectDomain] = useState("example.com");
  const [scans, setScans] = useState<Array<{ id: string; finalUrl: string; createdAt: string }>>([]);
  const [savedProjectId, setSavedProjectId] = useState<string | null>(null);
  const [newProjectOpen, setNewProjectOpen] = useState(false);

  useEffect(() => {
    void fetch("/api/projects").then((response) => response.json() as Promise<{ items: Array<{ id: string; name: string; domainLabel: string }> }>).then((body) => {
      setProjects(body.items);
      if (body.items[0]) setProjectId(body.items[0].id);
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!projectId) return;
    void fetch(`/api/projects/${projectId}/scans`).then((response) => response.json() as Promise<{ items?: Array<{ id: string; finalUrl: string; createdAt: string }> }>).then((body) => setScans(body.items || [])).catch(() => setScans([]));
  }, [projectId, v2Data]);

  async function addProject(event: FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/projects", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: projectName, domain: projectDomain }) });
    const body = await response.json() as { item?: { id: string; name: string; domainLabel: string }; error?: string };
    if (!response.ok || !body.item) { setError(body.error || "프로젝트를 만들 수 없습니다."); return; }
    setProjects((items) => [body.item!, ...items]);
    setProjectId(body.item.id);
    setProjectName("");
    setNewProjectOpen(false);
  }

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
      const result = (await response.json()) as { error?: string; message?: string } & AuditResult;
      if (!response.ok)
        throw new Error(result.message || result.error || "분석에 실패했습니다.");
      setData(result);
      const v2Result = (await v2Response.json()) as { error?: string; message?: string } & AuditV2Dto;
      if (v2Response.ok) { setV2Data(v2Result); setSavedProjectId(analysisProjectId); }
      else setV2Error(v2Result.message || v2Result.error || "v2 분석에 실패했습니다.");
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
    if (!response.ok) { setError("분석 결과를 프로젝트에 저장하지 못했습니다."); return; }
    setSavedProjectId(projectId);
    const scansResponse = await fetch(`/api/projects/${projectId}/scans`);
    const body = await scansResponse.json() as { items?: Array<{ id: string; finalUrl: string; createdAt: string }> };
    setScans(body.items || []);
  }

  const activeProject = projects.find((project) => project.id === projectId) || null;

  return (
    <main className="app-shell">
      <header className="app-header">
        <div className="brand">
          <i aria-hidden="true">CG</i><strong>CiteGraph</strong>
        </div>
        <nav aria-label="현재 위치">
          <span>Workspace</span><strong>{activeProject?.name || "URL Audit"}</strong>
        </nav>
        <div className="mode"><i aria-hidden="true" />Local workspace · 2026.08.1</div>
      </header>
      <div className="workspace-layout">
        <aside className="project-sidebar" aria-labelledby="workspace-heading">
          <nav className="primary-nav" aria-label="제품 메뉴">
            <a href="#audit" aria-current="page">URL Audit</a>
            <a href="/compare">Site Compare</a>
          </nav>
          <div className="sidebar-heading">
            <p className="section-kicker">LOCAL WORKSPACE</p>
            <h2 id="workspace-heading">Projects</h2>
            <p>식별자 기반 로컬 구획이며 로그인 계정은 아닙니다.</p>
          </div>
          <div className="project-list" aria-label="프로젝트 목록">
            {projects.length === 0 && <p className="empty-projects">아직 프로젝트가 없습니다.</p>}
            {projects.map((project) => (
              <button key={project.id} className={project.id === projectId ? "active" : ""} onClick={() => setProjectId(project.id)}>
                <strong>{project.name}</strong><span>{project.domainLabel}</span>
              </button>
            ))}
          </div>
          <details className="new-project" open={newProjectOpen} onToggle={(event) => setNewProjectOpen(event.currentTarget.open)}>
            <summary>+ 새 프로젝트</summary>
            <form onSubmit={addProject} className="project-form">
              <input aria-label="프로젝트 이름" required maxLength={80} placeholder="프로젝트 이름" value={projectName} onChange={(event) => setProjectName(event.target.value)} />
              <input aria-label="도메인 라벨" required placeholder="example.com" value={projectDomain} onChange={(event) => setProjectDomain(event.target.value)} />
              <button>프로젝트 추가</button>
            </form>
          </details>
          {activeProject && <section className="recent-scans" aria-label="최근 저장 결과">
            <div><strong>Recent scans</strong><span>{scans.length}</span></div>
            {scans.slice(0, 5).map((scan) => <p key={scan.id}><span>{scan.finalUrl}</span><time>{new Date(scan.createdAt).toLocaleDateString("ko-KR")}</time></p>)}
          </section>}
        </aside>
        <div className="content audit-content">
        <div className="page-title dashboard-title">
          <div>
            <p className="section-kicker">AUDIT WORKSPACE</p>
            <h1>SEO & AI Search audit</h1>
            <p>공개 페이지의 검색 기반과 생성형 검색 준비도를 근거 중심으로 진단합니다.</p>
          </div>
          <div className="workspace-state"><span>Analysis mode</span><strong>Deterministic</strong><small>REAL HTML · Ruleset 2026.08.1</small></div>
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
          <p>{activeProject ? `${activeProject.name}에 v2 결과를 저장합니다.` : "프로젝트 미선택: 분석은 실행되지만 프로젝트 이력에는 저장되지 않습니다."} 로그인 페이지와 내부 네트워크 주소는 차단됩니다.</p>
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
            <span>Title, meta description, H1, canonical, robots, schema를 추출하고 35개 결정론적 규칙을 실행합니다.</span>
          </div>
        )}

        {data && (
          <div className="report">
            <section className={`save-status ${savedProjectId ? "saved" : "unsaved"}`} aria-live="polite">
              <div><strong>{savedProjectId ? "v2 분석 기록 저장됨" : "v2 분석 기록이 저장되지 않음"}</strong><span>{savedProjectId ? projects.find((project) => project.id === savedProjectId)?.name : "좌측에서 프로젝트를 선택해 이 결과를 보관할 수 있습니다."}</span></div>
              {!savedProjectId && activeProject && v2Data && <button onClick={saveResultToProject}>이 프로젝트에 저장</button>}
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
                <p>가중치가 높은 WARN·FAIL 순서 · 영향 큰 FAIL 항목은 근거와 해결 방법을 기본으로 펼쳐서 보여줍니다.</p>
              </div>
              <div className="finding-table">
                <div className="finding-table-head">
                  <span>Type</span>
                  <span>Rule</span>
                  <span>Weight</span>
                  <span>Result</span>
                  <span />
                </div>
                {(() => {
                  let openFailCount = 0;
                  return data.findings.map((rule) => {
                    const defaultOpen = rule.result === "FAIL" && openFailCount < 3;
                    if (defaultOpen) openFailCount += 1;
                    return <FindingRow key={rule.id} rule={rule} defaultOpen={defaultOpen} />;
                  });
                })()}
              </div>
            </section>

            {v2Data && <V2Section data={v2Data} />}
            {v2Error && <div className="error" role="status"><strong>v2 preview 실패: </strong><span>{v2Error}</span></div>}

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
                    <dd>{Array.isArray(value) ? value.join(", ") || "—" : value || "—"}</dd>
                  </div>
                ))}
              </dl>
            </section>
          </div>
        )}
        </div>
      </div>
    </main>
  );
}
