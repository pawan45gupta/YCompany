import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PasswordChecklist } from "@/components/auth/PasswordChecklist";
import { renderWithProviders } from "@/test/test-utils";

describe("<PasswordChecklist />", () => {
  it("renders all three policy rules", () => {
    renderWithProviders(<PasswordChecklist password="" />);
    expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
    expect(screen.getByText(/include a letter/i)).toBeInTheDocument();
    expect(screen.getByText(/include a number/i)).toBeInTheDocument();
  });

  it("uses an aria-live status region for screen reader feedback", () => {
    renderWithProviders(<PasswordChecklist password="" />);
    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-live", "polite");
  });
});
