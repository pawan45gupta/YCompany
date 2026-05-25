import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { GoogleAnalyticsPageView } from "@/components/observability/GoogleAnalyticsPageView";
import {
  mockSearchParams,
  mockUsePathname,
  mockUseSearchParams,
} from "@/test/mocks/next-navigation";

describe("GoogleAnalyticsPageView", () => {
  it("calls gtag config on pathname and search change", () => {
    const gtag = vi.fn();
    window.gtag = gtag;
    mockUsePathname.mockReturnValue("/search");
    mockUseSearchParams.mockReturnValue(mockSearchParams({ q: "sweater" }));

    render(<GoogleAnalyticsPageView measurementId="G-TEST" />);

    expect(gtag).toHaveBeenCalledWith("config", "G-TEST", {
      page_path: "/search?q=sweater",
    });

    mockUseSearchParams.mockReturnValue(mockSearchParams({}));
    render(<GoogleAnalyticsPageView measurementId="G-TEST" />);

    expect(gtag).toHaveBeenCalledWith("config", "G-TEST", {
      page_path: "/search",
    });

    delete window.gtag;
  });

  it("does nothing when gtag is undefined", () => {
    delete window.gtag;
    mockUsePathname.mockReturnValue("/");
    mockUseSearchParams.mockReturnValue(mockSearchParams());
    expect(() =>
      render(<GoogleAnalyticsPageView measurementId="G-TEST" />),
    ).not.toThrow();
  });
});
