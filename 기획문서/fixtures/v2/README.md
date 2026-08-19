# CiteGraph v2 Fixture Corpus

고정된 로컬 HTML 15개로 scoring v2 설계를 검토한다. 실서비스 URL이나 네트워크 응답을 사용하지 않는다.

| ID | 파일 | Page type |
|---|---|---|
| F01 | `html/01-clean-homepage.html` | HOMEPAGE |
| F02 | `html/02-problematic-homepage.html` | HOMEPAGE |
| F03 | `html/03-article.html` | ARTICLE_BLOG |
| F04 | `html/04-article-without-author.html` | ARTICLE_BLOG |
| F05 | `html/05-article-without-date.html` | ARTICLE_BLOG |
| F06 | `html/06-product.html` | PRODUCT |
| F07 | `html/07-service.html` | SERVICE |
| F08 | `html/08-documentation.html` | DOCUMENTATION |
| F09 | `html/09-utility-contact.html` | CONTACT_ABOUT |
| F10 | `html/10-noindex-page.html` | ARTICLE_BLOG |
| F11 | `html/11-invalid-canonical.html` | PROVISIONAL: CATEGORY_LISTING/LANDING_PAGE |
| F12 | `html/12-invalid-structured-data.html` | PRODUCT |
| F13 | `html/13-js-heavy.html` | raw UNKNOWN, rendered SERVICE 후보 |
| F14 | `html/14-thin-content.html` | PROVISIONAL: LANDING_PAGE |
| F15 | `html/15-strong-seo-weak-geo.html` | PROVISIONAL: SERVICE/LANDING_PAGE |

사람이 검토할 기대 결과는 [fixture-expected-outcomes.md](../../fixture-expected-outcomes.md)에 있다.

주의:

- fixture의 domain은 `.test` 예약 domain을 사용한다.
- Semantic 결과는 현재 실행하지 않는다.
- 정확한 점수는 calibration 전까지 기대값으로 고정하지 않는다.
- HTML 변경 시 contentHash와 expected facts를 새 corpus version으로 갱신해야 한다.
