import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { CouponField } from "@/components/CouponField";
import { renderWithProviders } from "@/test/test-utils";

function CouponFieldHarness({
  initial = "",
  subtotalCents = 10000,
  showApplyButton = true,
}: {
  initial?: string;
  subtotalCents?: number;
  showApplyButton?: boolean;
}) {
  const [value, setValue] = useState(initial);
  return (
    <CouponField
      value={value}
      onChange={setValue}
      subtotalCents={subtotalCents}
      showApplyButton={showApplyButton}
      validateLive={showApplyButton ? undefined : true}
    />
  );
}

describe("CouponField", () => {
  it("renders promo label and suggested chips", () => {
    renderWithProviders(<CouponFieldHarness />);
    expect(screen.getByText(/promo code/i)).toBeInTheDocument();
    expect(screen.getByText("WELCOME10")).toBeInTheDocument();
    expect(screen.getByText("SAVE20")).toBeInTheDocument();
  });

  it("uppercases input on change", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CouponFieldHarness />);
    const input = screen.getByPlaceholderText(/enter code/i);
    await user.type(input, "welcome10");
    expect(input).toHaveValue("WELCOME10");
  });

  it("shows success message after applying valid code", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CouponFieldHarness initial="WELCOME10" />);
    await user.click(screen.getByRole("button", { name: /apply/i }));
    expect(await screen.findByText(/10% off/i)).toBeInTheDocument();
  });

  it("applies suggested code from chip click", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CouponFieldHarness />);
    await user.click(screen.getByText("FREESHIP"));
    expect(await screen.findByText(/free standard shipping over/i)).toBeInTheDocument();
  });

  it("disables apply when subtotal is zero", () => {
    renderWithProviders(<CouponFieldHarness subtotalCents={0} />);
    expect(screen.getByRole("button", { name: /apply/i })).toBeDisabled();
  });

  it("shows warning for invalid code", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CouponFieldHarness initial="NOTREAL" />);
    await user.click(screen.getByRole("button", { name: /apply/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/unknown|invalid/i);
  });

  it("validates live on blur when validateLive is enabled", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <CouponFieldHarness
        initial="WELCOME10"
        subtotalCents={10000}
        showApplyButton={false}
      />,
    );
    const input = screen.getByPlaceholderText(/enter code/i);
    await user.click(input);
    await user.tab();
    expect(await screen.findByText(/10% off/i)).toBeInTheDocument();
  });

  it("clears applied state when code changes", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CouponFieldHarness initial="WELCOME10" />);
    await user.click(screen.getByRole("button", { name: /apply/i }));
    expect(await screen.findByText(/10% off/i)).toBeInTheDocument();

    const input = screen.getByPlaceholderText(/enter code/i);
    await user.clear(input);
    await user.type(input, "X");
    expect(screen.queryByText(/10% off/i)).not.toBeInTheDocument();
  });
});
