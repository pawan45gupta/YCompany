import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { UserMenu } from "@/components/UserMenu";
import { mockSignOut, mockUseSession } from "@/test/mocks/next-auth";
import { renderWithProviders } from "@/test/test-utils";

describe("UserMenu", () => {
  beforeEach(() => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: "user-1",
          name: "Jane Doe",
          email: "jane@example.com",
        },
      },
      status: "authenticated",
    });
  });

  it("returns null when not authenticated", () => {
    mockUseSession.mockReturnValue({ data: null, status: "unauthenticated" });
    const { container } = renderWithProviders(<UserMenu />);
    expect(container).toBeEmptyDOMElement();
  });

  it("opens menu and shows account link", async () => {
    const user = userEvent.setup();
    renderWithProviders(<UserMenu />);
    await user.click(screen.getByLabelText(/account menu/i));
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByText("jane@example.com")).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /my account/i })).toHaveAttribute(
      "href",
      "/account",
    );
  });

  it("signs out from menu", async () => {
    const user = userEvent.setup();
    renderWithProviders(<UserMenu />);
    await user.click(screen.getByLabelText(/account menu/i));
    await user.click(screen.getByRole("menuitem", { name: /sign out/i }));
    expect(mockSignOut).toHaveBeenCalledWith({ callbackUrl: "/products" });
  });
});
