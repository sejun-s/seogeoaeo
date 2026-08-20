> 이 파일은 Gemini(Antigravity)에게 그대로 전달할 작업 프롬프트다. 실행
> 전에 먼저 읽어야 할 문서(순서대로):
> 1. `score-reliability-improvement-plan-2026-08-20-v2-final.md` (전체)
> 2. `real-world-validation-report-2026-08-20-human-labeled.md` §2, §4.2
>    (이번 작업이 고치려는 실제 실패 사례 7건)
> 3. `gemini-feedback-p4-p7-review-2026-08-20.md` (지난 라운드에서 잡힌
>    두 가지 실수 패턴 — 이번에도 똑같이 걸리지 않도록 끝까지 읽을 것)
> 4. `lib/v2/page-type.ts` 전체(현재 코드, Signal Family 구조가 이미 있음)

---

# Gemini에게: CATEGORY_LISTING Page Type 신호 추가

## 왜 이 작업인가

실전 검증 19개 URL 중 Human Label 기준 `CATEGORY_LISTING`(글 목록/피드
페이지) 표본이 7개인데 **정답률 0%**다(0건 정답, 1건 부분인정). 이게
지금 v2 Page Type 분류기에서 가장 뚜렷하게 나쁜 숫자다(HOMEPAGE는 그나마
30%). 실패 사례 7건:

```
techblog.woowahan.com   → HOMEPAGE로 오분류 (부분인정)
d2.naver.com/home       → UNKNOWN
tech.kakao.com/blog     → UNKNOWN
helloworld.kurly.com    → UNKNOWN
hankyung.com/economy    → UNKNOWN
spartacodingclub.kr/blog → ARTICLE_BLOG로 오분류 (P1 이후 AUTO_ASSIGNED,
                            즉 더 확신에 차서 틀림 — 이게 특히 위험한 사례다)
vercel.com/blog         → UNKNOWN
```

**절대 하지 말 것**: 이 작업은 Page Type 분류기(`page-type.ts`)만
건드린다. `lib/audit.ts`(v1, `rulesetVersion 2026.08.1` 동결)는 손대지
않는다. `SATURATION_FLOOR` 값도 근거 없이 바꾸지 않는다(기획안 §3-2).

## 구체적으로 뭘 만들어야 하는가

`page-type.ts`를 직접 분석해서 아래 3가지 신호를 설계했다. 그대로 구현해도
되고, 코드를 더 깊이 보고 더 나은 방법을 찾으면 그것도 좋다 — 다만 왜
바꿨는지 근거를 남겨라.

### 신호 A — 복수 `<article>` 요소는 지금 ARTICLE_BLOG로 잘못 흘러간다

지금 코드(`page-type.ts`):

```ts
if ((landmark?.article ?? 0) > 0) {
  if (schemaTypes.length === 0 && h2Count >= 2 && paragraphCount >= h2Count) {
    push("ARTICLE_BLOG", 3, "DOM_STRUCTURE", "structure:article+multi-h2+paragraphs");
  } else {
    push("ARTICLE_BLOG", 2, "DOM_STRUCTURE", "element:article");
  }
}
```

`landmark.article`이 "본문 하나를 감싸는 `<article>` 1개"인지 "글 목록
페이지에 미리보기 카드 10개가 각각 `<article>`로 감싸져 있는 것"인지
구분하지 않는다. **개수가 다른 이야기를 하고 있는데 같은 신호로 취급하고
있다.** 이게 `spartacodingclub.kr/blog`가 ARTICLE_BLOG로 잘못 잡히는
원인일 가능성이 높다(직접 실행해서 `landmark.article` 값을 확인해봐라).

**할 일**: `landmark.article` 개수로 분기한다.
- `=== 1` → 기존 로직 그대로(ARTICLE_BLOG 후보)
- `>= 3` → 새 신호. `CATEGORY_LISTING`으로 push한다(family:
  `DOM_STRUCTURE`, 3점 정도로 시작 — 기존 신호들과 비슷한 크기로 맞춰라).
  reason은 `"structure:repeated-article-elements"`처럼 구체적으로.
- `=== 2` → 애매한 경계. 어느 쪽으로도 강한 신호를 주지 않는 게 안전하다
  (기획안 §1-3의 "여러 독립적인 Signal Family 간 corroboration"만
  신뢰하고, 경계값에서 억지로 확신을 만들지 않는다는 원칙).

기존 fixture(`기획문서/fixtures/v2/html`) 15개 중 F03(article)이 이
분기로 회귀하지 않는지 반드시 확인해라 — F03의 `landmark.article` 값이
1인지 먼저 실행해서 확인하고 시작해라.

### 신호 B — bare listing path vs article slug path

지금 `PATH_MAP`은 `/blog`, `/blog/some-article-title` 둘 다 똑같이
ARTICLE_BLOG로 매핑한다:

```ts
{ pattern: /^\/(blog|articles?|news|posts?|insights?)(\/|$)/i, type: "ARTICLE_BLOG" },
```

하지만 실측 데이터를 보면 `tech.kakao.com/blog`, `vercel.com/blog`처럼
**경로가 그 키워드 하나로 끝나는 경우(추가 세그먼트 없음)는 목록 페이지인
경우가 많고**, `/blog/how-to-optimize-seo`처럼 **뒤에 구체적인 글
제목/슬러그가 붙으면 개별 글**인 경우가 많다. `hankyung.com/economy`도
같은 패턴이다 — 섹션 이름 하나로 끝나는 경로.

**할 일**: `PATH_MAP` 매칭 로직에 경로 깊이 분기를 추가한다.
- 경로가 `/blog`, `/blog/`, `/news`, `/articles` 처럼 **키워드
  세그먼트 하나로 끝나면**(뒤에 추가 세그먼트가 없으면) → 지금처럼 3점을
  주되 `ARTICLE_BLOG`가 아니라 `CATEGORY_LISTING`으로 준다.
- 경로에 **추가 세그먼트가 있으면**(`/blog/xxx`, `/news/yyy-zzz`) →
  기존대로 `ARTICLE_BLOG` 3점.
- 이미 있는 `CATEGORY_LISTING` 전용 패턴(`category|categories|tag|...`)은
  건드리지 않는다 — 이건 새로 추가하는 "bare listing keyword" 규칙에만
  적용한다.

정규식으로 이걸 구현할 때 `hankyung.com/economy`처럼 애초에 PATH_MAP에
없는 키워드(economy)는 이 규칙으로 못 잡는다는 것도 인지해라 — 이런
사이트별 커스텀 섹션명까지 일반화하려고 하지 마라(과적합 위험, 기획안
§3-2가 경계하는 것과 같은 종류의 실수다). 이번 라운드는 `blog/news/
articles` 계열의 "bare vs slug" 구분만 정확히 고친다.

### 신호 C(선택, 신중하게) — 링크 밀도

`d2.naver.com/home`, `helloworld.kurly.com`처럼 루트/홈 경로 자체가
목록 피드인 경우는 신호 A/B로 못 잡는다. 이건 "본문 대비 내부 링크가
비정상적으로 많다"는 신호가 필요한데, `link.internal`(count)과
`content.main_text`(length)를 조합해서:

```
internal link count가 많고(예: >= 15)
본문 대비 링크 개수 비율이 높으면
→ CATEGORY_LISTING 약한 신호
```

**이건 신호 A/B보다 위험하다** — 문서 페이지(사이드 nav가 큰 경우),
sitemap 유사 페이지 등도 링크가 많을 수 있어서 false positive 가능성이
크다. 시간이 되면 시도해보되, A/B만 확실히 끝내고 회귀 없는 걸 확인한
뒤에 손대라. 확신이 안 서면 이 신호는 이번 라운드에 빼고 다음 라운드로
넘겨도 된다 — 억지로 다 채우려고 하지 마라.

## 반드시 지켜야 할 것 (지난 라운드에서 실제로 걸린 실수들)

`gemini-feedback-p4-p7-review-2026-08-20.md`를 이미 읽었다는 전제로
짧게만 다시 강조한다:

1. **새 테스트를 짤 때, 실제로 값을 찍어서 신호가 격리되는지 먼저
   확인해라.** 통과하는 assert를 쓰기 전에 delta/신호 발생 여부를 콘솔에
   출력해서 눈으로 봐라. `tests/v2/page-type-signal-family.test.ts`가
   이번 세션에 Claude가 쓴 참고 패턴이다 — `createSnapshot`으로 합성
   HTML을 만들고, 각 신호가 진짜 격리되는지 확인한 뒤에야 assert를
   확정했다.
2. **fixture corpus(`기획문서/fixtures/v2/html`, 15개)에 새 파일을
   추가하지 마라** — `tests/v2/evidence.test.ts:20`이 개수를 15로
   고정해뒀다. 새 케이스는 테스트 파일 안에서 `createSnapshot`으로 동적
   HTML을 만들어라.
3. **"7개 URL 재실행해서 정답률이 몇 %로 올랐다"고 쓰려면 진짜
   재실행해라.** 이전 리포트(`real-world-validation-report-2026-08-20-
   human-labeled.md`)의 숫자를 복사하지 마라. `/api/audits?engine=v2`를
   직접 호출한 시각과 방식을 리포트에 명시해라.
4. 표본이 작으면(예: 7개 중 몇 개 고쳤다) "정답률 X%"라고 크게 쓰기 전에
   표본 수를 항상 같이 적어라.

## 완료 기준

1. 기존 fixture 15개 + Vitest 전체 회귀 없음(특히 F03, F08, F15).
2. TypeScript/ESLint/vinext build 통과.
3. 신호 A/B(그리고 시도했다면 C)에 대해 `page-type-signal-family.test.ts`
   같은 패턴으로 합성 HTML 단위 테스트 작성 — 신호가 실제로 격리되어
   작동하는지 증명.
4. **실전 7개 CATEGORY_LISTING URL을 직접 재실행**해서 결과를
   `real-world-validation-report-2026-08-20-human-labeled.md`에 새
   섹션(§5 이후)으로 추가하거나 별도 문서로 만든다 — Before(0%) / After
   비교, URL별 개별 결과, 재실행 시각 명시.
5. `spartacodingclub.kr/blog`가 신호 A 적용 후 더 이상 ARTICLE_BLOG로
   AUTO_ASSIGNED 되지 않는지 특히 확인해라 — 이게 P1 이후 "틀린 판정이
   더 확신에 참" 사례였다.
6. DOCUMENT_MATRIX.md에 변경 사유 기록.

## push 금지

작업 완료 후 **로컬 커밋까지만 하고 push하지 마라.** AGENTS.md §6과
이번 세션의 반복된 패턴대로 Claude가 검수(코드 diff + 실제 재실행 대조 +
테스트) 후 push한다.
