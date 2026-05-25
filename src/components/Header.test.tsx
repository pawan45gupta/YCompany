import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { Header } from "@/components/Header";
import { mockSignOut, mockUseSession } from "@/test/mocks/next-auth";
import { mockPush } from "@/test/mocks/next-navigation";
import { renderWithProviders } from "@/test/test-utils";

describe("Header", () => {
  beforeEach(() => {
    mockUseSession.mockReturnValue({ data: null, status: "unauthenticated" });
  });

  it("renders brand and shop links", () => {
    renderWithProviders(<Header />);
    expect(screen.getByRole("img", { name: "YCompany" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /shop/i })).toHaveAttribute(
      "href",
      "/products",
    );
    expect(screen.getByRole("link", { name: /sign in/i })).toHaveAttribute(
      "href",
      "/login",
    );
  });

  it("navigates to search on submit", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Header />);

    const input = screen.getByRole("textbox");
    await user.type(input, "sweater");
    await user.keyboard("{Enter}");

    expect(mockPush).toHaveBeenCalledWith("/search?q=sweater");
  });

  it("navigates to bare search when query is empty", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Header />);

    await user.click(screen.getByLabelText(/search/i));
    expect(mockPush).toHaveBeenCalledWith("/search");
  });

  it("shows user menu when authenticated", () => {
    mockUseSession.mockReturnValue({
      data: {
        user: { name: "Jane", email: "jane@example.com" },
      },
      status: "authenticated",
    });

    renderWithProviders(<Header />);
    expect(screen.getByLabelText(/account menu/i)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /sign in/i })).not.toBeInTheDocument();
  });

  it("opens mobile drawer and navigates links", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Header />);

    await user.click(screen.getByLabelText(/open menu/i));
    const drawer = screen.getByRole("dialog");
    expect(within(drawer).getByRole("heading", { name: /menu/i })).toBeInTheDocument();
    await user.click(within(drawer).getByRole("link", { name: /^shop$/i }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("signs out from mobile drawer when authenticated", async () => {
    const user = userEvent.setup();
    mockUseSession.mockReturnValue({
      data: { user: { name: "Jane", email: "jane@example.com" } },
      status: "authenticated",
    });

    renderWithProviders(<Header />);
    await user.click(screen.getByLabelText(/open menu/i));
    const drawer = screen.getByRole("dialog");
    await user.click(within(drawer).getByRole("button", { name: /sign out/i }));

    expect(mockSignOut).toHaveBeenCalledWith({ callbackUrl: "/products" });
  });
});
