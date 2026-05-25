import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { Order } from "@/types/order";

const DATA_DIR = path.join(process.cwd(), "data");
const ORDERS_PATH = path.join(DATA_DIR, "orders.json");

type OrdersFile = { orders: Order[] };

declare global {
  var __ycompanyOrders: Order[] | undefined;
}

function readFileOrders(): Order[] | null {
  try {
    if (!existsSync(ORDERS_PATH)) return null;
    const raw = readFileSync(ORDERS_PATH, "utf8");
    const parsed = JSON.parse(raw) as OrdersFile;
    return Array.isArray(parsed.orders) ? parsed.orders : [];
  } catch {
    return null;
  }
}

function writeFileOrders(orders: Order[]): boolean {
  try {
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
    writeFileSync(ORDERS_PATH, JSON.stringify({ orders }, null, 2), "utf8");
    return true;
  } catch {
    return false;
  }
}

export function loadOrders(): Order[] {
  if (globalThis.__ycompanyOrders) return globalThis.__ycompanyOrders;
  const fromFile = readFileOrders();
  globalThis.__ycompanyOrders = fromFile ?? [];
  return globalThis.__ycompanyOrders;
}

export function saveOrders(orders: Order[]): void {
  globalThis.__ycompanyOrders = orders;
  writeFileOrders(orders);
}
