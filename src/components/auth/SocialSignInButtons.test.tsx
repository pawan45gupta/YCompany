import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { SocialSignInButtons } from "@/components/auth/SocialSignInButtons";
import { mockSignIn } from "@/test/mocks/next-auth";
import { renderWithProviders } from "@/test/test-utils";

describe("SocialSignInButtons", () => {
  it("returns null when no providers", () => {
    const { container } = renderWithProviders(
      <SocialSignInButtons providers={[]} callbackUrl="/account" />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders provider buttons", () => {
    renderWithProviders(
      <SocialSignInButtons
        providers={["google", "github"]}
        callbackUrl="/account"
      />,
    );
    expect(
      screen.getByRole("button", { name: /continue with google/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /continue with github/i }),
    ).toBeInTheDocument();
  });

  it("calls signIn with provider id", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <SocialSignInButtons providers={["google"]} callbackUrl="/account" />,
    );
    await user.click(screen.getByRole("button", { name: /continue with google/i }));
    expect(mockSignIn).toHaveBeenCalledWith("google", { callbackUrl: "/account" });
  });

  it("renders all oauth providers", () => {
    renderWithProviders(
      <SocialSignInButtons
        providers={["google", "github", "facebook", "apple"]}
        callbackUrl="/"
      />,
    );
    expect(screen.getByRole("button", { name: /continue with facebook/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /continue with apple/i })).toBeInTheDocument();
  });
});
