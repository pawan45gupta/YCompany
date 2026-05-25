import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { AddToCartButton } from "@/components/AddToCartButton";
import { renderWithProviders } from "@/test/test-utils";

describe("AddToCartButton", () => {
  it("adds product to cart on click", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AddToCartButton productId="p1" />);
    await user.click(screen.getByRole("button", { name: /add to cart/i }));
    expect(localStorage.getItem("ycompany-cart")).toContain("p1");
  });

  it("is disabled for unknown product", () => {
    renderWithProviders(<AddToCartButton productId="missing-id" />);
    expect(screen.getByRole("button")).toBeDisabled();
    expect(screen.getByRole("button", { name: /out of stock/i })).toBeInTheDocument();
  });
});
