import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AccountDashboard } from "@/components/account/AccountDashboard";
import { ApiError, apiRequest } from "@/lib/api/client";
import { renderWithProviders } from "@/test/test-utils";
import type { Order } from "@/types/order";

vi.mock("@/lib/api/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/client")>();
  return {
    ...actual,
    apiRequest: vi.fn(),
  };
});

const processingOrder: Order = {
  id: "ord_abc123",
  userId: "u1",
  customerEmail: "jane@example.com",
  status: "processing",
  lines: [
    {
      productId: "p1",
      name: "Essential Crew Tee",
      quantity: 2,
      unitPriceCents: 3499,
    },
  ],
  subtotalCents: 6998,
  shippingCents: 500,
  discountCents: 0,
  totalCents: 7498,
  currency: "usd",
  placedAt: "2024-06-15T10:00:00.000Z",
};

const shippedOrder: Order = {
  ...processingOrder,
  id: "ord_shipped",
  status: "shipped",
  placedAt: "2023-03-10T10:00:00.000Z",
};

const cancelledOrder: Order = {
  ...processingOrder,
  id: "ord_cancelled",
  status: "cancelled",
  placedAt: "2024-01-05T10:00:00.000Z",
  cancelledAt: "2024-01-06T10:00:00.000Z",
};

describe("AccountDashboard", () => {
  beforeEach(() => {
    vi.mocked(apiRequest).mockReset();
  });

  it("shows loading then order history", async () => {
    vi.mocked(apiRequest).mockResolvedValue({ orders: [processingOrder] });

    renderWithProviders(
      <AccountDashboard email="jane@example.com" name="Jane Doe" />,
    );

    expect(screen.getByRole("heading", { name: /my account/i })).toBeInTheDocument();
    expect(screen.getByText(/jane@example.com/i)).toBeInTheDocument();

    await waitFor(() =>
      expect(screen.getByText("Essential Crew Tee")).toBeInTheDocument(),
    );
    expect(screen.getByRole("button", { name: /cancel order/i })).toBeInTheDocument();
  });

  it("shows empty state when no orders", async () => {
    vi.mocked(apiRequest).mockResolvedValue({ orders: [] });

    renderWithProviders(<AccountDashboard email="jane@example.com" />);

    await waitFor(() =>
      expect(screen.getByText(/no orders for this period/i)).toBeInTheDocument(),
    );
    expect(screen.getByRole("link", { name: /browse shop/i })).toHaveAttribute(
      "href",
      "/products",
    );
  });

  it("opens cancel dialog and confirms cancellation", async () => {
    const user = userEvent.setup();
    vi.mocked(apiRequest)
      .mockResolvedValueOnce({ orders: [processingOrder] })
      .mockResolvedValueOnce({ order: { ...processingOrder, status: "cancelled" } });

    renderWithProviders(
      <AccountDashboard email="jane@example.com" name="Jane" />,
    );

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /cancel order/i })).toBeInTheDocument(),
    );

    await user.click(screen.getByRole("button", { name: /cancel order/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /yes, cancel/i }));

    await waitFor(() =>
      expect(apiRequest).toHaveBeenCalledWith(
        "/api/orders/ord_abc123/cancel",
        expect.objectContaining({ method: "POST" }),
      ),
    );
  });

  it("shows load error and allows dismiss", async () => {
    const user = userEvent.setup();
    vi.mocked(apiRequest).mockRejectedValue(new ApiError("fail", 500, null));

    renderWithProviders(<AccountDashboard email="jane@example.com" />);

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/fail|load/i);
    await user.click(within(alert).getByRole("button", { name: /close/i }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("filters orders by year and month", async () => {
    const user = userEvent.setup();
    vi.mocked(apiRequest).mockResolvedValue({
      orders: [processingOrder, shippedOrder, cancelledOrder],
    });

    renderWithProviders(<AccountDashboard email="jane@example.com" />);

    await waitFor(() =>
      expect(screen.getAllByText("Essential Crew Tee").length).toBeGreaterThan(0),
    );

    const yearSelect = screen.getByRole("combobox", { name: /year/i });
    await user.click(yearSelect);
    await user.click(await screen.findByRole("option", { name: "2023" }));

    expect(screen.getAllByText("Essential Crew Tee").length).toBe(1);

    await user.click(yearSelect);
    await user.click(await screen.findByRole("option", { name: "2024" }));
    expect(screen.getAllByText("Essential Crew Tee").length).toBeGreaterThanOrEqual(1);
  });

  it("closes cancel dialog with keep order", async () => {
    const user = userEvent.setup();
    vi.mocked(apiRequest).mockResolvedValue({ orders: [processingOrder] });

    renderWithProviders(<AccountDashboard email="jane@example.com" />);

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /cancel order/i })).toBeInTheDocument(),
    );

    await user.click(screen.getByRole("button", { name: /cancel order/i }));
    await user.click(screen.getByRole("button", { name: /keep order/i }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });
});
