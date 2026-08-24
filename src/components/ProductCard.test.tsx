import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ProductCard } from "@/components/ProductCard";
import { lowStockProduct, mockProduct, outOfStockProduct } from "@/test/fixtures/product";
import { renderWithProviders } from "@/test/test-utils";

describe("ProductCard", () => {
  it("renders product name and price", () => {
    renderWithProviders(<ProductCard product={mockProduct} />);
    expect(screen.getByRole("heading", { name: mockProduct.name })).toBeInTheDocument();
    expect(screen.getByText(/\$34\.99/)).toBeInTheDocument();
  });

  it("links to product detail page", () => {
    renderWithProviders(<ProductCard product={mockProduct} />);
    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      `/products/${mockProduct.slug}`,
    );
  });

  it("adds to cart when plus is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ProductCard product={mockProduct} />);
    await user.click(screen.getByRole("button", { name: /increase quantity/i }));
    expect(localStorage.getItem("ycompany-cart")).toContain(mockProduct.id);
  });

  it("shows out of stock state", () => {
    renderWithProviders(<ProductCard product={outOfStockProduct} />);
    expect(screen.getAllByText(/out of stock/i).length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: /increase quantity/i })).not.toBeInTheDocument();
  });

  it("shows low stock chip", () => {
    renderWithProviders(<ProductCard product={lowStockProduct} />);
    expect(screen.getByText("Low stock")).toBeInTheDocument();
  });
});
