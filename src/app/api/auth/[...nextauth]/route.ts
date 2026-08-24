import { handlers } from "@/auth";
import { ensureAuthSiteUrl } from "@/lib/site-url";
import type { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  ensureAuthSiteUrl(req);
  return handlers.GET(req);
}

export async function POST(req: NextRequest) {
  ensureAuthSiteUrl(req);
  return handlers.POST(req);
}
