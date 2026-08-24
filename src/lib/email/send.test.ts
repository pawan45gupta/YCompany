import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sendEmail } from "@/lib/email/send";

describe("sendEmail", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.RESEND_API_KEY;
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("logs to console when no transport is configured", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    const result = await sendEmail({
      to: "buyer@example.com",
      subject: "Test",
      text: "Hello",
      html: "<p>Hello</p>",
    });

    expect(result.ok).toBe(true);
    expect(info).toHaveBeenCalledWith(expect.stringContaining("buyer@example.com"));
  });

  it("sends via Resend when RESEND_API_KEY is set", async () => {
    process.env.RESEND_API_KEY = "re_test_key";
    process.env.EMAIL_FROM = "YCompany <orders@example.com>";

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => "",
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await sendEmail({
      to: "buyer@example.com",
      subject: "Order confirmed",
      text: "Thanks",
      html: "<p>Thanks</p>",
    });

    expect(result.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.resend.com/emails",
      expect.objectContaining({ method: "POST" }),
    );
  });
});
