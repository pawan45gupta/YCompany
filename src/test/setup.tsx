import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import React from "react";
import { afterEach, vi } from "vitest";

import "./mocks/next-auth";
import "./mocks/next-navigation";

vi.mock("next/image", () => ({
  default: function MockImage({
    alt,
    src,
  }: {
    alt: string;
    src: string;
  }) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img alt={alt} src={src} data-testid="next-image" />;
  },
}));

vi.mock("next/script", () => ({
  default: function MockScript({
    children,
    id,
    src,
  }: {
    children?: string;
    id?: string;
    src?: string;
  }) {
    return (
      <div
        id={id}
        data-testid={id ?? "next-script"}
        data-src={src}
      >
        {children}
      </div>
    );
  },
}));

vi.mock("next/link", () => ({
  default: function MockLink({
    children,
    href,
    ...rest
  }: {
    children: React.ReactNode;
    href: string;
  }) {
    return (
      <a href={href} {...rest}>
        {children}
      </a>
    );
  },
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  localStorage.clear();
});
