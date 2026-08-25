import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ProductViewTracker } from "@/components/observability/ProductViewTracker";
import { trackViewItem } from "@/lib/observability/analytics";

vi.mock("@/lib/observability/analytics", () => ({
  trackViewItem: vi.fn(),
}));

const product = {
  id: "p1",
  name: "Heritage Sweater",
  priceCents: 8900,
  currency: "GBP",
  category: "Knitwear",
  brand: "YCompany",
};

describe("ProductViewTracker", () => {
  it("fires view_item analytics once on mount", () => {
    const { rerender } = render(<ProductViewTracker product={product} />);
    expect(trackViewItem).toHaveBeenCalledTimes(1);
    expect(trackViewItem).toHaveBeenCalledWith(product);

    rerender(<ProductViewTracker product={product} />);
    expect(trackViewItem).toHaveBeenCalledTimes(1);
  });

  it("renders nothing", () => {
    const { container } = render(<ProductViewTracker product={product} />);
    expect(container).toBeEmptyDOMElement();
  });
});
