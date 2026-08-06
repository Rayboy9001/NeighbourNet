import { describe, expect, it } from "vitest";
import {
  DESCRIPTION_MAX,
  TITLE_MAX,
  sanitizeText,
  validateReport,
  parseReportOrThrow,
} from "./report";

const base = {
  title: "Broken streetlight",
  description: "It has been off for a week.",
  category: "electricity" as const,
  latitude: -3.36,
  longitude: 36.68,
  address: "Main street",
  image_url: null,
  original_language: "en",
};

describe("sanitizeText", () => {
  it("removes script blocks entirely", () => {
    expect(sanitizeText('hi <script>alert("x")</script> there')).toBe("hi  there");
  });

  it("strips html tags but keeps inner text", () => {
    expect(sanitizeText("<b>bold</b> text")).toBe("bold text");
  });

  it("escapes leftover angle brackets and quotes", () => {
    expect(sanitizeText('5 < 6 & "ok"')).toBe("5 &lt; 6 &amp; &quot;ok&quot;");
  });

  it("neutralises javascript: urls", () => {
    expect(sanitizeText("javascript:alert(1)")).toBe("alert(1)");
  });

  it("removes control characters and trims", () => {
    expect(sanitizeText("  a\u0000b  ")).toBe("ab");
  });
});

describe("validateReport - title", () => {
  it("rejects titles shorter than 5 characters", () => {
    const res = validateReport({ ...base, title: "abcd" });
    expect(res.success).toBe(false);
    if (!res.success) expect(res.errors.title).toMatch(/at least 5/);
  });

  it("accepts a 5 character title", () => {
    expect(validateReport({ ...base, title: "abcde" }).success).toBe(true);
  });

  it("accepts a 120 character title and rejects 121", () => {
    expect(validateReport({ ...base, title: "a".repeat(TITLE_MAX) }).success).toBe(true);
    expect(validateReport({ ...base, title: "a".repeat(TITLE_MAX + 1) }).success).toBe(false);
  });

  it("counts length after sanitization", () => {
    const res = validateReport({ ...base, title: "<b>abc</b>" });
    expect(res.success).toBe(false);
  });
});

describe("validateReport - description", () => {
  it("allows an empty description", () => {
    expect(validateReport({ ...base, description: "" }).success).toBe(true);
  });

  it("accepts 2000 characters and rejects 2001", () => {
    expect(validateReport({ ...base, description: "a".repeat(DESCRIPTION_MAX) }).success).toBe(true);
    const res = validateReport({ ...base, description: "a".repeat(DESCRIPTION_MAX + 1) });
    expect(res.success).toBe(false);
    if (!res.success) expect(res.errors.description).toMatch(/2000/);
  });

  it("sanitizes xss payloads in the description", () => {
    const res = validateReport({
      ...base,
      description: '<img src=x onerror="alert(1)">hello',
    });
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.description).toBe("hello");
      expect(res.data.description).not.toContain("<");
    }
  });
});

describe("validateReport - category", () => {
  it("rejects unknown categories", () => {
    const res = validateReport({ ...base, category: "aliens" });
    expect(res.success).toBe(false);
    if (!res.success) expect(res.errors.category).toBeTruthy();
  });

  it("accepts every allowed category", () => {
    for (const c of [
      "roads",
      "electricity",
      "water",
      "waste",
      "environment",
      "safety",
      "animals",
      "other",
    ]) {
      expect(validateReport({ ...base, category: c }).success).toBe(true);
    }
  });
});

describe("validateReport - coordinates", () => {
  it("accepts the boundary values", () => {
    expect(validateReport({ ...base, latitude: -90, longitude: -180 }).success).toBe(true);
    expect(validateReport({ ...base, latitude: 90, longitude: 180 }).success).toBe(true);
  });

  it("rejects out-of-range latitude", () => {
    expect(validateReport({ ...base, latitude: 90.1 }).success).toBe(false);
    expect(validateReport({ ...base, latitude: -91 }).success).toBe(false);
  });

  it("rejects out-of-range longitude", () => {
    expect(validateReport({ ...base, longitude: 180.5 }).success).toBe(false);
    expect(validateReport({ ...base, longitude: -181 }).success).toBe(false);
  });

  it("allows null coordinates", () => {
    const res = validateReport({ ...base, latitude: null, longitude: null });
    expect(res.success).toBe(true);
    if (res.success) expect(res.data.latitude).toBeNull();
  });
});

describe("parseReportOrThrow", () => {
  it("returns sanitized data on success", () => {
    const data = parseReportOrThrow({ ...base, title: "  Broken light  " });
    expect(data.title).toBe("Broken light");
  });

  it("throws a readable error on failure", () => {
    expect(() => parseReportOrThrow({ ...base, title: "no" })).toThrow(/at least 5/);
  });
});
