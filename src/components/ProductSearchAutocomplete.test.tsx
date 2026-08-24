import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { ProductSearchAutocomplete } from "@/components/ProductSearchAutocomplete";
import { mockProduct } from "@/test/fixtures/product";
import { renderWithProviders } from "@/test/test-utils";

function AutocompleteHarness({
  onProductSelect,
  onClear,
}: {
  onProductSelect: (product: typeof mockProduct) => void;
  onClear?: () => void;
}) {
  const [value, setValue] = useState("");
  return (
    <ProductSearchAutocomplete
      value={value}
      onChange={setValue}
      onProductSelect={onProductSelect}
      onClear={onClear}
      placeholder="Search apparel"
    />
  );
}

describe("ProductSearchAutocomplete", () => {
  it("calls onProductSelect when a suggestion is chosen", async () => {
    const user = userEvent.setup();
    const onProductSelect = vi.fn();

    renderWithProviders(<AutocompleteHarness onProductSelect={onProductSelect} />);

    const input = screen.getByRole("combobox");
    await user.type(input, "Essential");
    await user.click(await screen.findByText(mockProduct.name));

    expect(onProductSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: mockProduct.id, name: mockProduct.name }),
    );
  });

  it("clears the input and calls onClear", async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();

    renderWithProviders(
      <AutocompleteHarness onProductSelect={vi.fn()} onClear={onClear} />,
    );

    const input = screen.getByRole("combobox");
    await user.type(input, "Essential");
    expect(input).toHaveValue("Essential");

    await user.click(screen.getByRole("button", { name: /clear search/i }));
    expect(input).toHaveValue("");
    expect(onClear).toHaveBeenCalledTimes(1);
  });
});
