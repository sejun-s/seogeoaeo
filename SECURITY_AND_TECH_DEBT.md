# CiteGraph 보안 및 기술부채 감사

> **프로젝트명**: CiteGraph (`seogeoaeo`)  
> **문서명/역할**: SSRF·테넌시·비밀정보·작업 안정성·migration 감사  
> **버전**: `2026.08.19-v1.1`  
> **최종 갱신일**: 2026-08-19  
> **작업 담당 AI**: OpenAI Codex  
> **사용 모델**: GPT-5  
> **문서 상태**: 기획 검토안 — 보안 수정 승인 전

## 1. 요약

URL fetch에는 기본 SSRF 방어가 있지만, SaaS 공개 운영에 필요한 tenant authorization, rate limit, DNS rebinding pinning, artifact privacy, audit log, job idempotency는 없다. 가장 큰 구조적 위험은 모든 API와 D1 데이터가 익명 전역 scope라는 점이다.

## 2. 긍정적 통제

- http/https 이외 scheme 차단
- credential URL 차단
- localhost/private/loopback/link-local/multicast 계열 차단
- DNS resolution 후 private IP 차단
- redirect를 manual 처리하고 hop마다 `guardUrl` 재실행
- redirect loop와 최대 5 hop 제한
- 15초 timeout, HTML content-type, 2MB streaming cap
- 민감 query parameter를 normalized display/cache key에서 redaction
- server-side evidence row ID 생성
- SSRF/결정론 단위 테스트 존재

## 3. Critical/High

| ID | 위험 | 등급 | 근거 | 권고 |
|---|---|---:|---|---|
| SEC-01 | 전역 익명 데이터 접근 | Critical | history 및 `/:id` route에 auth/workspace filter 없음 | identity+membership+repository boundary 선행 |
| SEC-02 | 무제한 익명 fetch/compare | High | rate/ownership/quota 없음 | rate limit, ownership, usage hard cap |
| SEC-03 | DNS rebinding/connection pinning 미완성 | High | lookup 검증 후 fetch가 별도 DNS 사용 | resolved IP pin 또는 안전 fetch proxy |
| SEC-04 | 원본 evidence 보존/접근정책 없음 | High | excerpt만 D1; artifact ACL/redaction 없음 | private artifact store+retention+redaction |
| SEC-05 | 동기 long-running compare | High | request 안에서 최대 5 audit 순차 실행 | idempotent job/lease/cancel/resume |
| SEC-06 | 합성 AI metric | 해결 완료 | 실제 observation 없음 | null + UNAVAILABLE, 순위 제외 적용 |

## 4. Medium/Low 기술부채

- IPv4-mapped IPv6는 일부 사설 대역만 명시적으로 처리하며 전체 사설 mapping 검토가 필요하다.
- redirect chain이 evidence에 저장되지 않는다.
- fetch response charset을 항상 UTF-8로 decode한다.
- robots.txt 준수와 crawl rate policy가 없다.
- `audit_runs` FAILED persistence가 API catch 경로에서 보장되지 않는다.
- Compare는 모든 오류를 retryable=true로 표시한다.
- Compare API는 완료/부분/부족 모두 HTTP 200이며 client가 status contract를 별도로 이해해야 한다.
- production D1 ID가 placeholder다.
- README가 starter 상태다.
- `.next`와 `tsconfig.tsbuildinfo` 같은 생성물 존재 여부를 repository hygiene 관점에서 지속 점검해야 한다.
- DB migration `0002`의 OCI/semantic score legacy 컬럼이 정본과 충돌한다.
- E2E는 API fixture 기반이라 실제 fetch+D1 통합 회귀를 대체하지 못한다.
- 공급망 audit 결과와 SBOM/THIRD_PARTY_NOTICES가 없다.

## 5. 테넌시 수용 기준

1. 모든 저장 row는 직접 또는 부모 FK로 workspace에 귀속된다.
2. repository query는 workspace ID 없이는 호출할 수 없는 타입 계약을 가진다.
3. 다른 workspace의 audit/compare ID 조회가 404/403이다.
4. actor identity header를 신뢰하기 전에 hosting access policy와 membership을 검증한다.
5. export/share link는 만료, revoke, scope를 가진다.

## 6. Job 수용 기준

- client idempotency key로 중복 scan 방지
- at-least-once 재실행에서 result/usage 중복 없음
- timeout 후 lease recovery
- URL별 partial retry
- cancel과 resume
- 실제 비용과 실패 원인 기록

## 7. Migration/rollback

다음 단계에서 legacy score 컬럼을 바로 drop하지 않는다.

1. read/write 사용 여부를 query/code search로 고정
2. 신규 canonical schema를 additive migration으로 도입
3. dual-read가 필요하면 기간 명시
4. backup/export 및 local migration test
5. rollback SQL과 production D1 snapshot
6. 사용 0 확인 후 deprecated column 제거

## 8. 비밀정보 및 외부 API

저장소에서 API key나 `.env` 파일은 발견되지 않았다. OAuth/provider가 도입되면 refresh token 암호화, 최소 scope, revoke/rotation, secret log redaction을 release gate로 둔다.
