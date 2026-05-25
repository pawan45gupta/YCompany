import { vi } from "vitest";

export const mockPush = vi.fn();
export const mockReplace = vi.fn();
export const mockRefresh = vi.fn();

export function mockSearchParams(params: Record<string, string> = {}) {
  return {
    get: (key: string) => params[key] ?? null,
    toString: () => new URLSearchParams(params).toString(),
  };
}

export const mockUseSearchParams = vi.fn(() => mockSearchParams());
export const mockUsePathname = vi.fn(() => "/");

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    refresh: mockRefresh,
  }),
  useSearchParams: () => mockUseSearchParams(),
  usePathname: () => mockUsePathname(),
}));
