import { describe, it, expect } from "vitest";
import { getTemplate, getColorScheme, getFont, TEMPLATES, PALETTES, FONTS } from "@/lib/card-design";

// The validators coerce arbitrary stored/submitted values back into a known
// template/palette (or the default), so a bad value can never break rendering.
describe("getTemplate", () => {
  it("accepts every defined template", () => {
    for (const t of TEMPLATES) expect(getTemplate(t.key)).toBe(t.key);
  });

  it("falls back to classic for unknown / empty / nullish", () => {
    expect(getTemplate("nope")).toBe("classic");
    expect(getTemplate("")).toBe("classic");
    expect(getTemplate(null)).toBe("classic");
    expect(getTemplate(undefined)).toBe("classic");
  });
});

describe("getColorScheme", () => {
  it("accepts every defined palette", () => {
    for (const key of Object.keys(PALETTES)) expect(getColorScheme(key)).toBe(key);
  });

  it("falls back to emerald for unknown / empty / nullish", () => {
    expect(getColorScheme("rainbow")).toBe("emerald");
    expect(getColorScheme("")).toBe("emerald");
    expect(getColorScheme(null)).toBe("emerald");
    expect(getColorScheme(undefined)).toBe("emerald");
  });
});

describe("getFont", () => {
  it("accepts every defined font", () => {
    for (const key of Object.keys(FONTS)) expect(getFont(key)).toBe(key);
  });

  it("falls back to sans for unknown / empty / nullish", () => {
    expect(getFont("comic")).toBe("sans");
    expect(getFont("")).toBe("sans");
    expect(getFont(null)).toBe("sans");
    expect(getFont(undefined)).toBe("sans");
  });
});
