"use client";

import { FormEvent, useState } from "react";
import type { AuditResult, Rule, Score } from "../lib/audit";
import type { AuditV2Dto } from "../lib/services/audit-v2-service";

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
  return (
    <section className="v2-section" aria-labelledby="v2-heading">
      <div className="section-heading">
        <div><p className="section-kicker">SCORING V2 PREVIEW</p><h2 id="v2-heading">Fact score와 측정 범위</h2></div>
        <p>{data.methodologyVersion} · {data.registryVersion}</p>
      </div>
      <p className="v2-notice">v1 결과와 병행하는 개발 preview입니다. GEO Fact는 실제 AI 노출이나 인용률이 아니며, Semantic engine과 GEO Overall은 {data.geoOverall.state}입니다 ({data.geoOverall.reason}).</p>
      <dl className="v2-meta">
        <div><dt>Page type</dt><dd>{data.pageType.type}</dd></div>
        <div><dt>Assignment</dt><dd>{data.pageType.assignment}</dd></div>
        <div><dt>Confidence</dt><dd>{Math.round(data.pageType.confidence * 100)}%</dd></div>
        <div><dt>Snapshot</dt><dd>{data.snapshotId}</dd></div>
      </dl>
      <div className="v2-domains">
        <V2Domain title="SEO Fact score" data={data.seoFact} />
        <V2Domain title="GEO Fact score" data={data.geoFact} />
      </div>
      <details className="v2-reasons">
        <summary>N_A / UNKNOWN 사유 {data.exclusions.length}건</summary>
        {data.exclusions.length === 0 ? <p>제외되거나 측정 불가능한 규칙이 없습니다.</p> : (
          <div className="v2-reason-list">
            {data.exclusions.map((item) => (
              <div key={`${item.domain}-${item.ruleId}`}><strong>{item.result}</strong><code>{item.ruleId}</code><span>{item.rationaleCode}</span></div>
            ))}
          </div>
        )}
      </details>
    </section>
  );
}

function CategoryBreakdown({ data }: { data: Score }) {
  return (
    <div className="category-table">
      <div className="category-header">
        <span>Category</span>
        <span>Score</span>
        <span>Coverage</span>
      </div>
      {data.categories.map((category) => (
        <div className="category-row" key={category.name}>
          <strong>{category.name}</strong>
          <span>
            {category.score} / {category.maxScore}
          </span>
          <div
            className="meter"
            aria-label={`${category.name} ${category.score}/${category.maxScore}`}
          >
            <i style={{ width: `${(category.score / category.maxScore) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function ScoreSection({
  title,
  description,
  data,
  type,
}: {
  title: string;
  description: string;
  data: Score;
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
      <CategoryBreakdown data={data} />
    </section>
  );
}

function FindingRow({ rule }: { rule: Rule }) {
  const [open, setOpen] = useState(false);
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
            {rule.category} · {rule.ruleId || rule.id}
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
            {rule.evidence.map((evidence) => (
              <p className="evidence" key={evidence.id}>
                <code>{evidence.id}</code>
                <span>{evidence.excerpt}</span>
              </p>
            ))}
          </div>
          <div>
            <h4>Recommendation</h4>
            <p>{rule.recommendation}</p>
          </div>
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

  async function run(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setData(null);
    setV2Data(null);
    setV2Error("");
    try {
      const request = {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url }),
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
      if (v2Response.ok) setV2Data(v2Result);
      else setV2Error(v2Result.message || v2Result.error || "v2 분석에 실패했습니다.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "분석에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div className="brand">
          <strong>CiteGraph</strong>
          <span>SEO & AI Search Analysis</span>
        </div>
        <nav aria-label="현재 위치">
          <span>Audits</span>
          <a href="/compare" style={{ marginLeft: "12px", textDecoration: "none", color: "#0284c7" }}>
            Multi-URL Compare
          </a>
        </nav>
        <div className="mode">Local mode · Ruleset 2026.08.1</div>
      </header>
      <div className="content">
        <div className="page-title">
          <div>
            <h1>URL analysis</h1>
            <p>공개 페이지의 검색 최적화(SEO)와 생성형 검색 준비도(GEO)를 결정론적 규칙 기반으로 진단합니다.</p>
          </div>
        </div>
        <form className="audit-form" onSubmit={run}>
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
          <p>서버에서 공개 HTML만 가져옵니다. 로그인 페이지와 내부 네트워크 주소는 차단됩니다.</p>
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
            />

            <ScoreSection
              type="geo"
              title="GEO Readiness Score"
              description="실제 AI 노출값이 아닙니다. 답변 가능성, 기계 판독성, 신뢰 근거와 인용 준비도를 독립적으로 평가합니다."
              data={data.scores.geoReadiness}
            />

            {v2Data && <V2Section data={v2Data} />}
            {v2Error && <div className="error" role="status"><strong>v2 preview 실패: </strong><span>{v2Error}</span></div>}

            <section className="findings-section">
              <div className="section-heading">
                <div>
                  <p className="section-kicker">FINDINGS</p>
                  <h2>개선 항목</h2>
                </div>
                <p>가중치가 높은 WARN·FAIL 순서 · 행을 열어 근거와 권고를 확인하세요.</p>
              </div>
              <div className="finding-table">
                <div className="finding-table-head">
                  <span>Type</span>
                  <span>Rule</span>
                  <span>Weight</span>
                  <span>Result</span>
                  <span />
                </div>
                {data.findings.map((rule) => (
                  <FindingRow key={rule.id} rule={rule} />
                ))}
              </div>
            </section>

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
    </main>
  );
}
