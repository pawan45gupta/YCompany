import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { I18nProvider } from "@/i18n/client";
import { Footer } from "./Footer";

describe("Footer", () => {
  it("renders brand name", () => {
    render(
      <I18nProvider>
        <Footer />
      </I18nProvider>,
    );
    expect(screen.getByText(/YCompany/i)).toBeInTheDocument();
  });
});
