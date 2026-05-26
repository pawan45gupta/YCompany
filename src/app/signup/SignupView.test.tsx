import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type MockInstance,
} from "vitest";
import { SignupView } from "@/app/signup/SignupView";
import { mockSignIn } from "@/test/mocks/next-auth";
import { mockPush, mockRefresh } from "@/test/mocks/next-navigation";
import { renderWithProviders } from "@/test/test-utils";

let fetchSpy: MockInstance<typeof fetch>;

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("<SignupView />", () => {
  beforeEach(() => {
    fetchSpy = vi.spyOn(global, "fetch");
    mockSignIn.mockResolvedValue({ error: null, ok: true });
  });
  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it("disables submit until the password policy is satisfied", async () => {
    const user = userEvent.setup();
    renderWithProviders(<SignupView oauthProviders={[]} />);
    const submit = screen.getByRole("button", { name: /create account/i });
    expect(submit).toBeDisabled();
    await user.type(screen.getByLabelText(/email/i), "x@x.com");
    expect(submit).toBeDisabled();
    await user.type(screen.getByLabelText(/^password/i), "abc"); // too short
    expect(submit).toBeDisabled();
    await user.clear(screen.getByLabelText(/^password/i));
    await user.type(screen.getByLabelText(/^password/i), "Strong123");
    expect(submit).toBeEnabled();
  });

  it("posts to /api/auth/signup and auto signs the user in on success", async () => {
    fetchSpy.mockResolvedValueOnce(
      jsonResponse(201, { user: { id: "u1", email: "new@x.com" } }),
    );
    const user = userEvent.setup();
    renderWithProviders(<SignupView oauthProviders={[]} />);
    await user.type(screen.getByLabelText(/email/i), "new@x.com");
    await user.type(screen.getByLabelText(/^password/i), "Strong123");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(url).toBe("/api/auth/signup");
    expect((init as RequestInit).method).toBe("POST");

    await waitFor(() =>
      expect(mockSignIn).toHaveBeenCalledWith("credentials", {
        email: "new@x.com",
        password: "Strong123",
        redirect: false,
      }),
    );
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/products"));
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("shows the email-taken error on 409", async () => {
    fetchSpy.mockResolvedValueOnce(
      jsonResponse(409, { error: "An account with this email already exists" }),
    );
    const user = userEvent.setup();
    renderWithProviders(<SignupView oauthProviders={[]} />);
    await user.type(screen.getByLabelText(/email/i), "dup@x.com");
    await user.type(screen.getByLabelText(/^password/i), "Strong123");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/already exists/i);
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it("shows a too-many-requests error on 429", async () => {
    fetchSpy.mockResolvedValueOnce(
      jsonResponse(429, { error: "Too many requests" }),
    );
    const user = userEvent.setup();
    renderWithProviders(<SignupView oauthProviders={[]} />);
    await user.type(screen.getByLabelText(/email/i), "x@x.com");
    await user.type(screen.getByLabelText(/^password/i), "Strong123");
    await user.click(screen.getByRole("button", { name: /create account/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/too many requests/i);
  });

  it("falls back to /login when auto sign-in fails after a successful signup", async () => {
    fetchSpy.mockResolvedValueOnce(
      jsonResponse(201, { user: { id: "u1", email: "new@x.com" } }),
    );
    mockSignIn.mockResolvedValueOnce({ error: "boom", ok: false });
    const user = userEvent.setup();
    renderWithProviders(<SignupView oauthProviders={[]} />);
    await user.type(screen.getByLabelText(/email/i), "new@x.com");
    await user.type(screen.getByLabelText(/^password/i), "Strong123");
    await user.click(screen.getByRole("button", { name: /create account/i }));
    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining("/login?callbackUrl="),
      ),
    );
  });

  it("renders OAuth buttons when providers are configured", () => {
    renderWithProviders(<SignupView oauthProviders={["google"]} />);
    expect(
      screen.getByRole("button", { name: /continue with google/i }),
    ).toBeInTheDocument();
  });

  it("links back to /login preserving callbackUrl", () => {
    renderWithProviders(<SignupView oauthProviders={[]} />);
    const link = screen.getByRole("link", { name: /sign in/i });
    expect(link).toHaveAttribute(
      "href",
      "/login?callbackUrl=%2Fproducts",
    );
  });
});
