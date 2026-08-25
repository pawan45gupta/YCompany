import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { LoginView } from "@/app/login/LoginView";
import { mockSignIn } from "@/test/mocks/next-auth";
import { mockPush, mockRefresh, mockUseSearchParams } from "@/test/mocks/next-navigation";
import { renderWithProviders } from "@/test/test-utils";

describe("<LoginView />", () => {
  beforeEach(() => {
    mockSignIn.mockResolvedValue({ error: null, ok: true });
    mockUseSearchParams.mockReturnValue({
      get: (key: string) => (key === "callbackUrl" ? "/account" : null),
      toString: () => "callbackUrl=%2Faccount",
    });
  });

  it("renders email sign-in and links to signup and forgot password", () => {
    renderWithProviders(<LoginView oauthProviders={[]} />);
    expect(screen.getByRole("heading", { name: /welcome back/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /forgot password/i })).toHaveAttribute(
      "href",
      "/forgot-password",
    );
    expect(screen.getByRole("link", { name: /create an account/i })).toHaveAttribute(
      "href",
      "/signup?callbackUrl=%2Faccount",
    );
  });

  it("shows social sign-in buttons when providers are configured", () => {
    renderWithProviders(<LoginView oauthProviders={["google"]} />);
    expect(screen.getByRole("button", { name: /continue with google/i })).toBeInTheDocument();
    expect(screen.getByText(/or continue with email/i)).toBeInTheDocument();
  });

  it("shows invalid credentials message when sign-in fails", async () => {
    mockSignIn.mockResolvedValueOnce({ error: "CredentialsSignin", ok: false });
    const user = userEvent.setup();
    renderWithProviders(<LoginView oauthProviders={[]} />);

    await user.type(screen.getByLabelText(/email/i), "bad@x.com");
    await user.type(screen.getByLabelText(/^password/i), "wrong");
    await user.click(screen.getByRole("button", { name: /sign in with email/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/invalid email or password/i);
  });

  it("redirects after successful credentials sign-in", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginView oauthProviders={[]} />);

    await user.type(screen.getByLabelText(/email/i), "demo@ycompany.com");
    await user.type(screen.getByLabelText(/^password/i), "secret");
    await user.click(screen.getByRole("button", { name: /sign in with email/i }));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith("credentials", {
        email: "demo@ycompany.com",
        password: "secret",
        redirect: false,
      });
    });
    expect(mockPush).toHaveBeenCalledWith("/account");
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("surfaces oauth errors from the query string", () => {
    mockUseSearchParams.mockReturnValue({
      get: (key: string) => (key === "error" ? "AccessDenied" : null),
      toString: () => "error=AccessDenied",
    });

    renderWithProviders(<LoginView oauthProviders={[]} />);
    expect(screen.getByRole("alert")).toHaveTextContent(/access was denied/i);
  });
});
