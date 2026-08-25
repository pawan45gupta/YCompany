import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AuthShell } from "@/components/auth/AuthShell";

describe("AuthShell", () => {
  it("renders title, subtitle, children, and footer", () => {
    render(
      <AuthShell
        title="Welcome back"
        subtitle="Sign in to continue"
        footer={<p>Footer copy</p>}
      >
        <button type="submit">Sign in</button>
      </AuthShell>,
    );

    expect(screen.getByRole("heading", { name: "Welcome back" })).toBeInTheDocument();
    expect(screen.getByText("Sign in to continue")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
    expect(screen.getByText("Footer copy")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "YCompany" })).toBeInTheDocument();
  });

  it("omits subtitle when not provided", () => {
    render(
      <AuthShell title="Create account">
        <span>Form body</span>
      </AuthShell>,
    );

    expect(screen.getByText("Form body")).toBeInTheDocument();
    expect(screen.queryByText("Sign in to continue")).not.toBeInTheDocument();
  });
});
