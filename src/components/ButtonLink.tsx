"use client";

import { Button, type ButtonProps } from "@mui/material";
import Link from "next/link";

type Props = ButtonProps<typeof Link> & {
  href: string;
};

const linkButtonSx = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  textDecoration: "none",
  boxSizing: "border-box",
  verticalAlign: "unset",
  lineHeight: 1.5,
  overflow: "visible",
} as const;

export function ButtonLink({ href, sx, ...props }: Props) {
  return (
    <Button
      component={Link}
      href={href}
      sx={[linkButtonSx, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]}
      {...props}
    />
  );
}
