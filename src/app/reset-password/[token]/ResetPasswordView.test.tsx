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
import { ResetPasswordView } from "@/app/reset-password/[token]/ResetPasswordView";
import { renderWithProviders } from "@/test/test-utils";

let fetchSpy: MockInstance<typeof fetch>;

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("<ResetPasswordView />", () => {
  beforeEach(() => {
    fetchSpy = vi.spyOn(global, "fetch");
  });
  afterEach(() => fetchSpy.mockRestore());

  it("disables submit while the password is weak or doesn't match", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ResetPasswordView token="abc123abcdefghij" />);
    const submit = screen.getByRole("button", { name: /update password/i });
    expect(submit).toBeDisabled();

    await user.type(screen.getByLabelText(/new password/i), "Strong123");
    expect(submit).toBeDisabled(); // confirm still empty
    await user.type(screen.getByLabelText(/confirm password/i), "Different1");
    expect(submit).toBeDisabled();
    await user.clear(screen.getByLabelText(/confirm password/i));
    await user.type(screen.getByLabelText(/confirm password/i), "Strong123");
    expect(submit).toBeEnabled();
  });

  it("posts token + password and shows the success view on 200", async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse(200, { ok: true }));
    const user = userEvent.setup();
    renderWithProviders(<ResetPasswordView token="freshtoken-1234567890" />);

    await user.type(screen.getByLabelText(/new password/i), "Strong123");
    await user.type(screen.getByLabelText(/confirm password/i), "Strong123");
    await user.click(screen.getByRole("button", { name: /update password/i }));

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
    const [, init] = fetchSpy.mock.calls[0]!;
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({
      token: "freshtoken-1234567890",
      password: "Strong123",
    });

    expect(
      await screen.findByRole("heading", { name: /password updated/i }),
    ).toBeInTheDocument();
  });

  it("renders the invalid-token error message on a 400 response", async () => {
    fetchSpy.mockResolvedValueOnce(
      jsonResponse(400, { error: "Invalid or expired reset link" }),
    );
    const user = userEvent.setup();
    renderWithProviders(<ResetPasswordView token="badtokenbadtoken1234" />);
    await user.type(screen.getByLabelText(/new password/i), "Strong123");
    await user.type(screen.getByLabelText(/confirm password/i), "Strong123");
    await user.click(screen.getByRole("button", { name: /update password/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      /invalid or has expired/i,
    );
  });

  it("surfaces a password-validation error on 400 (with 'password' in body)", async () => {
    fetchSpy.mockResolvedValueOnce(
      jsonResponse(400, { error: "Password must contain a number" }),
    );
    const user = userEvent.setup();
    renderWithProviders(<ResetPasswordView token="freshtoken-1234567890" />);
    await user.type(screen.getByLabelText(/new password/i), "Strong123");
    await user.type(screen.getByLabelText(/confirm password/i), "Strong123");
    await user.click(screen.getByRole("button", { name: /update password/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      /password must contain a number/i,
    );
  });

  it("surfaces a too-many-requests error on 429", async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse(429, {}));
    const user = userEvent.setup();
    renderWithProviders(<ResetPasswordView token="freshtoken-1234567890" />);
    await user.type(screen.getByLabelText(/new password/i), "Strong123");
    await user.type(screen.getByLabelText(/confirm password/i), "Strong123");
    await user.click(screen.getByRole("button", { name: /update password/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      /too many requests/i,
    );
  });
});
