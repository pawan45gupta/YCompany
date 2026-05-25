import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ButtonLink } from "@/components/ButtonLink";
import { renderWithProviders } from "@/test/test-utils";

describe("ButtonLink", () => {
  it("renders as a link with href", () => {
    renderWithProviders(
      <ButtonLink href="/products">Shop now</ButtonLink>,
    );
    const link = screen.getByRole("link", { name: "Shop now" });
    expect(link).toHaveAttribute("href", "/products");
  });

  it("forwards button props", () => {
    render(
      <ButtonLink href="/cart" variant="contained" data-testid="cart-link">
        Cart
      </ButtonLink>,
    );
    expect(screen.getByTestId("cart-link")).toBeInTheDocument();
  });
});
