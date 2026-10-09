import { describe, expect, test } from "bun:test";
import { formatDate, truncate } from "./format";

describe("format utilities", () => {
  test("truncate keeps short strings intact", () => {
    expect(truncate("hello", 10)).toBe("hello");
  });

  test("truncate shortens long strings", () => {
    expect(truncate("hello world", 5)).toBe("hello…");
  });

  test("formatDate returns a placeholder for missing values", () => {
    expect(formatDate(null)).toBe("—");
  });
});
