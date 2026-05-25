import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { YCompanyLogo } from "@/components/YCompanyLogo";

describe("YCompanyLogo", () => {
  it("renders full wordmark with accessible label", () => {
    render(<YCompanyLogo variant="full" />);
    expect(screen.getByRole("img", { name: "YCompany" })).toBeInTheDocument();
  });

  it("renders mark-only variant without wordmark role", () => {
    const { container } = render(<YCompanyLogo variant="mark" height={32} />);
    expect(screen.queryByRole("img", { name: "YCompany" })).not.toBeInTheDocument();
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("applies light color mode", () => {
    render(<YCompanyLogo color="light" height={40} />);
    expect(screen.getByRole("img", { name: "YCompany" })).toBeInTheDocument();
  });
});
