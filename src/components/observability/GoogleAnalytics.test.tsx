import { render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GoogleAnalyticsProvider } from "@/components/observability/GoogleAnalytics";

vi.mock("@/lib/observability/env", () => ({
  getGaMeasurementId: vi.fn(),
}));

import { getGaMeasurementId } from "@/lib/observability/env";

describe("GoogleAnalyticsProvider", () => {
  afterEach(() => {
    vi.mocked(getGaMeasurementId).mockReset();
  });

  it("renders nothing when measurement id is missing", () => {
    vi.mocked(getGaMeasurementId).mockReturnValue(undefined);
    const { container } = render(<GoogleAnalyticsProvider />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders scripts when measurement id is set", () => {
    vi.mocked(getGaMeasurementId).mockReturnValue("G-TEST123");
    const { container } = render(<GoogleAnalyticsProvider />);
    expect(container.querySelector("#google-analytics")).toBeInTheDocument();
    expect(container.innerHTML).toContain("G-TEST123");
  });
});
