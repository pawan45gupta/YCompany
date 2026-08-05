/**
 * Seed / refresh the Elastic Cloud product index from src/data/products.ts.
 *
 * Usage:
 *   npm run search:index
 *
 * Requires ELASTICSEARCH_CLOUD_ID and ELASTICSEARCH_API_KEY in the environment
 * (or .env.local — loaded below).
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { Client } from "@elastic/elasticsearch";
import { products } from "../src/data/products";
import {
  PRODUCT_INDEX_MAPPINGS,
  PRODUCT_INDEX_SETTINGS,
} from "../src/lib/elasticsearch/mapping";
import { elasticsearchTlsOptions } from "../src/lib/elasticsearch/tls";

function loadEnvFile(filePath: string) {
  if (!existsSync(filePath)) return;
  const text = readFileSync(filePath, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] ??= value;
    }
  }
}

loadEnvFile(resolve(process.cwd(), ".env.local"));
loadEnvFile(resolve(process.cwd(), ".env"));

async function main() {
  const cloudId = process.env.ELASTICSEARCH_CLOUD_ID?.trim();
  const apiKey = process.env.ELASTICSEARCH_API_KEY?.trim();
  const index = process.env.ELASTICSEARCH_INDEX?.trim() || "ycompany-products";

  if (!cloudId || !apiKey) {
    console.error(
      "Missing ELASTICSEARCH_CLOUD_ID or ELASTICSEARCH_API_KEY. Set them in .env.local and retry.",
    );
    process.exit(1);
  }

  const tls = elasticsearchTlsOptions();
  const client = new Client({
    cloud: { id: cloudId },
    auth: { apiKey },
    ...(tls ? { tls } : {}),
  });

  const exists = await client.indices.exists({ index });
  if (exists) {
    console.log(`Deleting existing index "${index}"…`);
    await client.indices.delete({ index });
  }

  console.log(`Creating index "${index}"…`);
  await client.indices.create({
    index,
    settings: PRODUCT_INDEX_SETTINGS,
    mappings: PRODUCT_INDEX_MAPPINGS,
  });

  const operations = products.flatMap((product) => [
    { index: { _index: index, _id: product.id } },
    product,
  ]);

  console.log(`Bulk indexing ${products.length} products…`);
  const result = await client.bulk({ refresh: true, operations });

  if (result.errors) {
    const failed = result.items.filter((item) => item.index?.error);
    console.error("Bulk index had errors:", JSON.stringify(failed, null, 2));
    process.exit(1);
  }

  console.log(`Indexed ${products.length} products into "${index}".`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
