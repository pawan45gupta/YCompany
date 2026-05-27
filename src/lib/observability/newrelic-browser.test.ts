import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  nrBrowserAddPageAction,
  nrBrowserNoticeError,
  nrBrowserSetPageViewName,
  nrBrowserSetUserId,
} from "@/lib/observability/newrelic-browser";

type NrMock = {
  addPageAction: ReturnType<typeof vi.fn>;
  setUserId: ReturnType<typeof vi.fn>;
  setCustomAttribute: ReturnType<typeof vi.fn>;
  noticeError: ReturnType<typeof vi.fn>;
  setPageViewName: ReturnType<typeof vi.fn>;
  interaction: ReturnType<typeof vi.fn>;
};

function installMockAgent(): NrMock {
  const mock: NrMock = {
    addPageAction: vi.fn(),
    setUserId: vi.fn(),
    setCustomAttribute: vi.fn(),
    noticeError: vi.fn(),
    setPageViewName: vi.fn(),
    interaction: vi.fn(() => ({ save: vi.fn(), end: vi.fn() })),
  };
  window.newrelic = mock as unknown as Window["newrelic"];
  return mock;
}

describe("newrelic-browser wrapper", () => {
  beforeEach(() => {
    delete window.newrelic;
  });
  afterEach(() => {
    delete window.newrelic;
  });

  describe("when the agent is NOT loaded", () => {
    it("addPageAction is a no-op", () => {
      expect(() =>
        nrBrowserAddPageAction("AddToCart", { item_id: "p1" }),
      ).not.toThrow();
    });

    it("setUserId / noticeError / setPageViewName all no-op", () => {
      expect(() => nrBrowserSetUserId("u1")).not.toThrow();
      expect(() => nrBrowserNoticeError(new Error("boom"))).not.toThrow();
      expect(() => nrBrowserSetPageViewName("/cart")).not.toThrow();
    });
  });

  describe("when the agent IS loaded", () => {
    it("forwards addPageAction with sanitized attributes (strips null/undefined)", () => {
      const nr = installMockAgent();
      nrBrowserAddPageAction("AddToCart", {
        item_id: "p1",
        quantity: 2,
        coupon: undefined,
        notes: null,
        free_shipping: false,
      });
      expect(nr.addPageAction).toHaveBeenCalledTimes(1);
      expect(nr.addPageAction).toHaveBeenCalledWith("AddToCart", {
        item_id: "p1",
        quantity: 2,
        free_shipping: false,
      });
    });

    it("forwards setUserId and noticeError, wrapping non-Error values", () => {
      const nr = installMockAgent();
      nrBrowserSetUserId("user-42");
      nrBrowserNoticeError("plain string");
      nrBrowserNoticeError(new Error("real"), { route: "/cart" });

      expect(nr.setUserId).toHaveBeenCalledWith("user-42");
      expect(nr.noticeError).toHaveBeenCalledTimes(2);
      // First call: string was wrapped in Error
      expect(nr.noticeError.mock.calls[0][0]).toBeInstanceOf(Error);
      expect((nr.noticeError.mock.calls[0][0] as Error).message).toBe(
        "plain string",
      );
      // Second call: original Error + attrs forwarded
      expect(nr.noticeError.mock.calls[1][0]).toBeInstanceOf(Error);
      expect(nr.noticeError.mock.calls[1][1]).toEqual({ route: "/cart" });
    });

    it("swallows agent exceptions so observability cannot break the app", () => {
      const nr = installMockAgent();
      nr.addPageAction.mockImplementation(() => {
        throw new Error("agent boom");
      });
      expect(() => nrBrowserAddPageAction("AddToCart")).not.toThrow();
    });

    it("forwards setPageViewName", () => {
      const nr = installMockAgent();
      nrBrowserSetPageViewName("/products/[slug]");
      expect(nr.setPageViewName).toHaveBeenCalledWith("/products/[slug]");
    });
  });
});
