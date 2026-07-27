import { describe, expect, it } from "vitest";
import { countWords, formatReadingTime, readingTime } from "@/lib/reading-time";

describe("countWords", () => {
  it("counts words separated by any whitespace", () => {
    expect(countWords("one two\tthree\nfour")).toBe(4);
  });

  it("returns 0 for empty and whitespace-only input", () => {
    expect(countWords("")).toBe(0);
    expect(countWords("   \n\t ")).toBe(0);
  });

  it("does not double-count collapsed whitespace", () => {
    expect(countWords("one    two")).toBe(2);
  });
});

describe("readingTime", () => {
  it("rounds up to the next whole minute", () => {
    expect(readingTime(new Array(221).fill("word").join(" "))).toBe(2);
  });

  it("enforces a one-minute floor, including for empty bodies", () => {
    expect(readingTime("")).toBe(1);
    expect(readingTime("short")).toBe(1);
  });

  it("matches the spec for a typical 3000-word essay", () => {
    expect(readingTime(new Array(3000).fill("word").join(" "))).toBe(14);
  });

  it("rejects a non-positive rate rather than dividing by zero", () => {
    expect(() => readingTime("word", 0)).toThrow(RangeError);
  });
});

describe("formatReadingTime", () => {
  it("renders the meta-line format from §6.4", () => {
    expect(formatReadingTime(12)).toBe("12 min");
  });
});
