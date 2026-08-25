import { render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/observability/newrelic-server", () => ({
  nrBrowserTimingHeader: vi.fn(),
}));

import { NewRelicBrowser } from "@/components/observability/NewRelicBrowser";
import { nrBrowserTimingHeader } from "@/lib/observability/newrelic-server";

describe("NewRelicBrowser", () => {
  afterEach(() => {
    vi.mocked(nrBrowserTimingHeader).mockReset();
  });

  it("renders nothing when the agent returns no snippet", async () => {
    vi.mocked(nrBrowserTimingHeader).mockResolvedValue("");
    const element = await NewRelicBrowser();
    expect(element).toBeNull();
  });

  it("renders the browser agent script when a snippet is available", async () => {
    vi.mocked(nrBrowserTimingHeader).mockResolvedValue("window.NREUM={};");
    const element = await NewRelicBrowser();
    const { container } = render(element);
    const script = container.querySelector("#nr-browser-agent");
    expect(script).toBeInTheDocument();
    expect(script?.innerHTML).toContain("window.NREUM");
  });
});
