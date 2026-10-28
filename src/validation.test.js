
import { describe, it, expect } from "vitest";

import {
  isSafeText,
  isValidRole,
  getSafeId,
  getSafeApiUrl,
} from "./validation";
describe("isSafeText", () => {
  it("accepts valid text", () => {
    expect(isSafeText("Deepika")).toBe(true);
  });

  it("rejects empty text", () => {
    expect(isSafeText("")).toBe(false);
  });

  it("rejects text longer than the limit", () => {
    expect(isSafeText("abcdef", 5)).toBe(false);
  });

  it("rejects non-string values", () => {
    expect(isSafeText(123)).toBe(false);
  });
});

describe("isValidRole", () => {
  it("accepts Admin", () => {
    expect(isValidRole("Admin")).toBe(true);
  });

  it("accepts Viewer", () => {
    expect(isValidRole("Viewer")).toBe(true);
  });

  it("rejects an unknown role", () => {
    expect(isValidRole("SuperAdmin")).toBe(false);
  });
});

describe("getSafeId", () => {
  it("accepts a positive numeric ID", () => {
    expect(getSafeId(10)).toBe(10);
  });

  it("converts a numeric string to a number", () => {
    expect(getSafeId("25")).toBe(25);
  });

  it("rejects zero", () => {
    expect(() => getSafeId(0))
      .toThrow("Invalid record ID");
  });

  it("rejects negative IDs", () => {
    expect(() => getSafeId(-1))
      .toThrow("Invalid record ID");
  });

  it("rejects non-numeric IDs", () => {
    expect(() => getSafeId("abc"))
      .toThrow("Invalid record ID");
  });
  it("rejects an empty string ID", () => {
  expect(() => getSafeId("")).toThrow("Invalid record ID");
});

it("rejects an ID containing non-digit characters", () => {
  expect(() => getSafeId("12a")).toThrow("Invalid record ID");
});

it("rejects an unsafe integer ID", () => {
  expect(() => getSafeId(Number.MAX_SAFE_INTEGER + 1))
    .toThrow("Invalid record ID");
});

it("rejects a non-number, non-string ID", () => {
  expect(() => getSafeId(null)).toThrow("Invalid record ID");
});
});

describe("getSafeApiUrl", () => {
  const azureApi =
    "https://studentregistrationform-api-deepika-c8cjcthmcgfjhecg.indiasouthcentral-01.azurewebsites.net/api";

  it("accepts the trusted Azure API URL", () => {
    expect(getSafeApiUrl(azureApi)).toBe(azureApi);
  });

  it("accepts a trusted localhost API URL", () => {
    expect(getSafeApiUrl("https://localhost:7240/api"))
      .toBe("https://localhost:7240/api");
  });

  it("rejects an untrusted API origin and uses Azure fallback", () => {
    expect(getSafeApiUrl("https://example.com/api")).toBe(azureApi);
  });

  it("rejects URL credentials and uses Azure fallback", () => {
    expect(getSafeApiUrl("https://user:pass@localhost/api")).toBe(azureApi);
  });

  it("rejects a query string and uses Azure fallback", () => {
    expect(getSafeApiUrl("https://localhost/api?test=1")).toBe(azureApi);
  });

  it("rejects a URL hash and uses Azure fallback", () => {
    expect(getSafeApiUrl("https://localhost/api#section")).toBe(azureApi);
  });

  it("rejects an incorrect API path and uses Azure fallback", () => {
    expect(getSafeApiUrl("https://localhost/other")).toBe(azureApi);
  });

  it("uses Azure fallback for an invalid URL", () => {
    expect(getSafeApiUrl("not a valid URL")).toBe(azureApi);
  });
  it("accepts a trusted API URL with a trailing slash", () => {
  expect(
    getSafeApiUrl(
      "https://localhost:7240/api/"
    )
  ).toBe("https://localhost:7240/api");
});
});
