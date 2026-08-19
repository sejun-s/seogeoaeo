import { describe, expect, it } from "vitest";
import { analyzeSnapshotV2 } from "../../lib/v2";
import { listFixtures, loadFixtureSnapshot } from "./fixtures";

const fixtures = listFixtures();

async function pageTypeOf(file: string) {
  const fixture = fixtures.find(entry => entry.file === file);
  if (!fixture) throw new Error(`fixture 없음: ${file}`);
  return analyzeSnapshotV2(await loadFixtureSnapshot(fixture)).pageType;
}

describe("Page Type confidence 계약", () => {
  it("assignment 밴드가 confidence와 항상 일치한다", async () => {
    for (const fixture of fixtures) {
      const result = analyzeSnapshotV2(await loadFixtureSnapshot(fixture)).pageType;
      const expected = result.confidence >= 0.85 ? "AUTO_ASSIGNED" : result.confidence >= 0.6 ? "PROVISIONAL" : "UNKNOWN";
      expect(result.assignment, `${fixture.file} conf=${result.confidence}`).toBe(expected);
    }
  });

  it("UNKNOWN 판정이면 type도 UNKNOWN이다", async () => {
    for (const fixture of fixtures) {
      const result = analyzeSnapshotV2(await loadFixtureSnapshot(fixture)).pageType;
      if (result.assignment === "UNKNOWN") expect(result.type, fixture.file).toBe("UNKNOWN");
    }
  });

  it("결과에 type/confidence/alternatives/evidenceIds가 모두 포함된다", async () => {
    const result = await pageTypeOf("03-article.html");
    expect(result).toHaveProperty("type");
    expect(result).toHaveProperty("confidence");
    expect(Array.isArray(result.alternatives)).toBe(true);
    expect(Array.isArray(result.evidenceIds)).toBe(true);
  });

  it("F01 clean homepage는 HOMEPAGE AUTO_ASSIGNED다", async () => {
    const result = await pageTypeOf("01-clean-homepage.html");
    expect(result.type).toBe("HOMEPAGE");
    expect(result.assignment).toBe("AUTO_ASSIGNED");
  });

  it("F03 article은 ARTICLE_BLOG AUTO_ASSIGNED다", async () => {
    const result = await pageTypeOf("03-article.html");
    expect(result.type).toBe("ARTICLE_BLOG");
    expect(result.assignment).toBe("AUTO_ASSIGNED");
  });

  it("F13 JS-heavy는 raw 기준 UNKNOWN이다", async () => {
    const result = await pageTypeOf("13-js-heavy.html");
    expect(result.assignment).toBe("UNKNOWN");
  });

  it("F12는 schema parse 실패로 신호가 줄어 AUTO_ASSIGNED가 되지 못한다", async () => {
    // 무효 schema를 유효한 type 신호처럼 쓰지 않는다는 계약.
    const result = await pageTypeOf("12-invalid-structured-data.html");
    expect(result.assignment).not.toBe("AUTO_ASSIGNED");
  });

  it("F12는 깨진 JSON-LD에서도 @type을 약한 신호로 회수해 PROVISIONAL PRODUCT에 도달한다", async () => {
    // schema.block FACT 자체는 여전히 INVALID로 남는다(evidence.test.ts에서 검증).
    // page type 추정에만 낮은 confidence로 회수해 UNKNOWN에서 벗어난다.
    const result = await pageTypeOf("12-invalid-structured-data.html");
    expect(result.type).toBe("PRODUCT");
    expect(result.assignment).toBe("PROVISIONAL");
  });

  it("F09 contact는 form+address 구조 신호로 PROVISIONAL CONTACT_ABOUT에 도달한다", async () => {
    const result = await pageTypeOf("09-utility-contact.html");
    expect(result.type).toBe("CONTACT_ABOUT");
    expect(result.assignment).toBe("PROVISIONAL");
  });

  it("F08 documentation은 구조 신호 보강 이후에도 회귀 없이 PROVISIONAL DOCUMENTATION을 유지한다", async () => {
    // article+H2+문단 구조 신호가 이미 확정적인 schema(TechArticle) 신호를
    // 잠식해 confidence를 낮추지 않아야 한다.
    const result = await pageTypeOf("08-documentation.html");
    expect(result.type).toBe("DOCUMENTATION");
    expect(result.assignment).toBe("PROVISIONAL");
  });

  it("F15는 schema(SoftwareApplication) 신호가 있을 때 hero-section 신호가 끼어들어 회귀시키지 않는다", async () => {
    const result = await pageTypeOf("15-strong-seo-weak-geo.html");
    expect(result.assignment).toBe("UNKNOWN");
    expect(result.alternatives[0]?.type).toBe("PRODUCT");
  });

  it("F10 noindex article은 여전히 UNKNOWN이지만 선두 후보가 DOCUMENTATION에서 ARTICLE_BLOG로 바로잡힌다", async () => {
    // expected-outcomes.md: F10 Page type은 ARTICLE_BLOG. 구조 신호 보강 전에는
    // path(/guides/) 신호에 밀려 DOCUMENTATION이 선두였다.
    const result = await pageTypeOf("10-noindex-page.html");
    expect(result.assignment).toBe("UNKNOWN");
    expect(result.alternatives[0]?.type).toBe("ARTICLE_BLOG");
  });
});
