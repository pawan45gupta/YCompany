import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { SignOutButton } from "@/components/SignOutButton";
import { mockSignOut } from "@/test/mocks/next-auth";
import { renderWithProviders } from "@/test/test-utils";

describe("SignOutButton", () => {
  it("renders sign out label", () => {
    renderWithProviders(<SignOutButton />);
    expect(screen.getByRole("button", { name: /sign out/i })).toBeInTheDocument();
  });

  it("calls signOut on click", async () => {
    const user = userEvent.setup();
    renderWithProviders(<SignOutButton />);
    await user.click(screen.getByRole("button", { name: /sign out/i }));
    expect(mockSignOut).toHaveBeenCalledWith({ callbackUrl: "/products" });
  });

  it("supports fullWidth false", () => {
    renderWithProviders(<SignOutButton fullWidth={false} />);
    const btn = screen.getByRole("button", { name: /sign out/i });
    expect(btn).not.toHaveClass("MuiButton-fullWidth");
  });
});
