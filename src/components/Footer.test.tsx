import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Footer } from "@/components/Footer";
import { renderWithProviders } from "@/test/test-utils";

describe("Footer", () => {
  it("renders copyright with current year", () => {
    renderWithProviders(<Footer />);
    expect(screen.getByText(new RegExp(String(new Date().getFullYear())))).toBeInTheDocument();
    expect(screen.getByText(/YCompany/i)).toBeInTheDocument();
  });

  it("renders catalog and search links", () => {
    renderWithProviders(<Footer />);
    expect(screen.getByRole("link", { name: /catalog/i })).toHaveAttribute(
      "href",
      "/products",
    );
    expect(screen.getByRole("link", { name: /search/i })).toHaveAttribute(
      "href",
      "/search",
    );
  });

  it("uses footer landmark", () => {
    renderWithProviders(<Footer />);
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });
});
