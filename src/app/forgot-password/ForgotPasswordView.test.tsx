import { screen } from "@testing-library/react";
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
import { ForgotPasswordView } from "@/app/forgot-password/ForgotPasswordView";
import { renderWithProviders } from "@/test/test-utils";

let fetchSpy: MockInstance<typeof fetch>;

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("<ForgotPasswordView />", () => {
  beforeEach(() => {
    fetchSpy = vi.spyOn(global, "fetch");
  });
  afterEach(() => fetchSpy.mockRestore());

  it("posts the email and shows the inbox confirmation on success", async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse(200, { ok: true }));
    const user = userEvent.setup();
    renderWithProviders(<ForgotPasswordView />);

    await user.type(screen.getByLabelText(/email/i), "real@x.com");
    await user.click(screen.getByRole("button", { name: /send reset link/i }));

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/auth/forgot-password",
      expect.objectContaining({ method: "POST" }),
    );
    expect(
      await screen.findByRole("heading", { name: /check your inbox/i }),
    ).toBeInTheDocument();
  });

  it("shows the inbox screen even for an unknown email (anti-enumeration)", async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse(200, { ok: true }));
    const user = userEvent.setup();
    renderWithProviders(<ForgotPasswordView />);
    await user.type(screen.getByLabelText(/email/i), "ghost@x.com");
    await user.click(screen.getByRole("button", { name: /send reset link/i }));
    expect(
      await screen.findByRole("heading", { name: /check your inbox/i }),
    ).toBeInTheDocument();
  });

  it("surfaces a too-many-requests error on 429", async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse(429, {}));
    const user = userEvent.setup();
    renderWithProviders(<ForgotPasswordView />);
    await user.type(screen.getByLabelText(/email/i), "real@x.com");
    await user.click(screen.getByRole("button", { name: /send reset link/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      /too many requests/i,
    );
  });

  it("surfaces a generic error on a non-OK response", async () => {
    fetchSpy.mockResolvedValueOnce(
      jsonResponse(500, { error: "Server boom" }),
    );
    const user = userEvent.setup();
    renderWithProviders(<ForgotPasswordView />);
    await user.type(screen.getByLabelText(/email/i), "real@x.com");
    await user.click(screen.getByRole("button", { name: /send reset link/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/server boom/i);
  });

  it("disables submit while the email is empty", () => {
    renderWithProviders(<ForgotPasswordView />);
    expect(
      screen.getByRole("button", { name: /send reset link/i }),
    ).toBeDisabled();
  });
});
