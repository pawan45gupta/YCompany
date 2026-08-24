import { afterEach, describe, expect, it, vi } from "vitest";
import { bootstrapAuthSiteUrl, resolveSiteUrl } from "@/lib/site-url";

function mockRequest(headers: Record<string, string>): Request {
  return new Request("http://internal/api/checkout", { headers });
}

describe("resolveSiteUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("prefers a non-localhost AUTH_URL", () => {
    vi.stubEnv("AUTH_URL", "https://y-company-virid.vercel.app");
    vi.stubEnv("NEXTAUTH_URL", "http://localhost:3000");
    expect(resolveSiteUrl()).toBe("https://y-company-virid.vercel.app");
  });

  it("uses request headers when env still points at localhost", () => {
    vi.stubEnv("AUTH_URL", "http://localhost:3000");
    const req = mockRequest({
      "x-forwarded-proto": "https",
      "x-forwarded-host": "y-company-virid.vercel.app",
    });
    expect(resolveSiteUrl(req)).toBe("https://y-company-virid.vercel.app");
  });

  it("falls back to VERCEL_PROJECT_PRODUCTION_URL without a request", () => {
    vi.stubEnv("AUTH_URL", "http://localhost:3000");
    vi.stubEnv(
      "VERCEL_PROJECT_PRODUCTION_URL",
      "y-company-virid.vercel.app",
    );
    expect(resolveSiteUrl()).toBe("https://y-company-virid.vercel.app");
  });

  it("defaults to localhost in development", () => {
    expect(resolveSiteUrl()).toBe("http://localhost:3000");
  });
});

describe("bootstrapAuthSiteUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("replaces localhost auth env vars in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("AUTH_URL", "http://localhost:3000");
    vi.stubEnv("NEXTAUTH_URL", "http://localhost:3000");
    vi.stubEnv(
      "VERCEL_PROJECT_PRODUCTION_URL",
      "y-company-virid.vercel.app",
    );

    bootstrapAuthSiteUrl();

    expect(process.env.AUTH_URL).toBe("https://y-company-virid.vercel.app");
    expect(process.env.NEXTAUTH_URL).toBe("https://y-company-virid.vercel.app");
  });
});
