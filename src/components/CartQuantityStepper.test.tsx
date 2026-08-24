import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { CartQuantityStepper } from "@/components/CartQuantityStepper";
import { mockProduct, outOfStockProduct } from "@/test/fixtures/product";
import { renderWithProviders } from "@/test/test-utils";

describe("CartQuantityStepper", () => {
  it("increases quantity on plus click", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CartQuantityStepper productId={mockProduct.id} />);

    expect(screen.getByText("0")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /increase quantity/i }));

    expect(screen.getByText("1")).toBeInTheDocument();
    expect(localStorage.getItem("ycompany-cart")).toContain(mockProduct.id);
  });

  it("decreases quantity on minus click", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CartQuantityStepper productId={mockProduct.id} />);

    await user.click(screen.getByRole("button", { name: /increase quantity/i }));
    await user.click(screen.getByRole("button", { name: /increase quantity/i }));
    expect(screen.getByText("2")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /decrease quantity/i }));
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("shows out of stock state for unavailable products", () => {
    renderWithProviders(<CartQuantityStepper productId={outOfStockProduct.id} />);
    expect(screen.getByText(/out of stock/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /increase quantity/i })).not.toBeInTheDocument();
  });
});
