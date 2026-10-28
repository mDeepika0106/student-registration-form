
import { describe, it, expect } from "vitest";

import { getSafeApiUrl } from "./validation";

const AZURE_ORIGIN =
  "https://studentregistrationform-api-deepika-c8cjcthmcgfjhecg.indiasouthcentral-01.azurewebsites.net";

const AZURE_API = `${AZURE_ORIGIN}/api`;

describe("getSafeApiUrl", () => {
  it("accepts the trusted Azure API URL", () => {
    expect(getSafeApiUrl(AZURE_API)).toBe(AZURE_API);
  });

  it("accepts a trusted localhost URL", () => {
    expect(getSafeApiUrl("http://localhost:5187/api"))
      .toBe("http://localhost:5187/api");
  });

  it("accepts a trusted 127.0.0.1 URL", () => {
    expect(getSafeApiUrl("https://127.0.0.1:7240/api"))
      .toBe("https://127.0.0.1:7240/api");
  });

  it("removes trailing slashes from the API path", () => {
    expect(getSafeApiUrl("http://localhost:5187/api///"))
      .toBe("http://localhost:5187/api");
  });

  it("uses the Azure fallback for an untrusted origin", () => {
    expect(getSafeApiUrl("https://example.com/api"))
      .toBe(AZURE_API);
  });

  it("uses the Azure fallback when credentials are present", () => {
    expect(getSafeApiUrl("https://user:pass@localhost:5187/api"))
      .toBe(AZURE_API);
  });

  it("uses the Azure fallback when a query string is present", () => {
    expect(getSafeApiUrl("http://localhost:5187/api?debug=true"))
      .toBe(AZURE_API);
  });

  it("uses the Azure fallback when a hash is present", () => {
    expect(getSafeApiUrl("http://localhost:5187/api#section"))
      .toBe(AZURE_API);
  });

  it("uses the Azure fallback for a path other than /api", () => {
    expect(getSafeApiUrl("http://localhost:5187/other"))
      .toBe(AZURE_API);
  });

  it("uses the Azure fallback for an invalid URL", () => {
    expect(getSafeApiUrl("not-a-valid-url"))
      .toBe(AZURE_API);
  });

  it("uses the Azure fallback for an empty value", () => {
    expect(getSafeApiUrl("")).toBe(AZURE_API);
  });

  it("uses the Azure fallback when the API path is missing", () => {
    expect(getSafeApiUrl("http://localhost:5187"))
      .toBe(AZURE_API);
  });
});
