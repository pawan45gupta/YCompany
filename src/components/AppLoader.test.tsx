import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  AppLoader,
  ProductGridSkeleton,
  SearchPageSkeleton,
} from "@/components/AppLoader";

describe("AppLoader", () => {
  it("renders a busy status region with optional label", () => {
    render(<AppLoader label="Loading products" minHeight="20vh" />);
    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-busy", "true");
    expect(status).toHaveAttribute("aria-label", "Loading products");
    expect(screen.getByText("Loading products")).toBeInTheDocument();
  });

  it("omits label text when not provided", () => {
    render(<AppLoader />);
    expect(screen.getByRole("status")).not.toHaveAttribute("aria-label");
    expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
  });
});

describe("ProductGridSkeleton", () => {
  it("renders the requested number of placeholders", () => {
    const { container } = render(<ProductGridSkeleton count={3} />);
    expect(container.querySelectorAll(".MuiSkeleton-root")).toHaveLength(3);
  });
});

describe("SearchPageSkeleton", () => {
  it("renders filter and result placeholders with optional label", () => {
    render(<SearchPageSkeleton label="Searching catalog" />);
    expect(screen.getByText("Searching catalog")).toBeInTheDocument();
    expect(document.querySelectorAll(".MuiSkeleton-root").length).toBeGreaterThan(0);
  });
});
