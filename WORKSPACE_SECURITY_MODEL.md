> **프로젝트명**: CiteGraph (`seogeoaeo`)  
> **문서명/역할**: LOCAL_WORKSPACE 식별자 구획 보안 모델  
> **버전**: `2026.08.19-v1.0`  
> **최종 갱신일**: 2026-08-19  
> **작업 담당 AI**: OpenAI Codex  
> **사용 모델**: GPT-5  
> **문서 상태**: 구현 완수

# LOCAL_WORKSPACE 보안 경계

## 보장하는 범위

- 서버가 `crypto.randomUUID()`로 생성한 UUID v4 식별자를 `HttpOnly`, `SameSite=Lax`, `Path=/` 쿠키로 전달한다.
- Workspace ID를 URL, client state, query parameter에 노출하지 않는다.
- Project, v2 Result, Evidence event 조회는 쿠키 Workspace ID를 함께 조건으로 사용한다.
- 쿠키가 없으면 401, 다른 Workspace가 소유한 ID는 존재 여부를 숨기기 위해 404를 반환한다.

## 보장하지 않는 범위

이 기능은 로그인·세션 서명·사용자 권한·조직 역할을 갖춘 진짜 tenant isolation이 아니다. 브라우저에 저장된 bearer 성격의 식별자를 기반으로 데이터를 구획하는 로컬 단계일 뿐이다. 인증이 구현되기 전에는 고객 데이터 보안 또는 enterprise tenant isolation으로 판매하거나 표현하면 안 된다.

## 도메인 등록 범위

Project의 `domainLabel`은 그룹핑용 normalized hostname이다. DNS, HTML meta tag, Search Console 등으로 도메인 소유권을 검증하지 않는다. 따라서 등록 사실은 사이트 소유권을 의미하지 않는다.

## 기존 데이터 마이그레이션

`0004_fearless_lifeguard.sql`은 기존 `audit_v2_results` 행에 nullable `workspace_id`, `project_id`를 추가한다. 기존 행은 삭제하거나 임의 Workspace에 백필하지 않고 `legacy unowned`로 유지한다. 새 Workspace API에서는 이 행을 조회할 수 없다.

## 인증 전 남은 위험

- 쿠키 탈취·브라우저 공유 시 구획 식별자를 사용할 수 있다.
- 사용자별 철회, 세션 회전, 역할 기반 권한, 감사 로그가 없다.
- 민감 고객 데이터를 저장하거나 외부 고객에게 격리 보장을 제공하기 전에 인증과 서버 검증 세션을 구현해야 한다.
