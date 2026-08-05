import { Client } from "@elastic/elasticsearch";
import { elasticsearchTlsOptions } from "@/lib/elasticsearch/tls";

export function isElasticsearchConfigured(): boolean {
  return Boolean(
    process.env.ELASTICSEARCH_CLOUD_ID?.trim() &&
      process.env.ELASTICSEARCH_API_KEY?.trim(),
  );
}

export function getElasticsearchIndex(): string {
  return process.env.ELASTICSEARCH_INDEX?.trim() || "ycompany-products";
}

declare global {
  var __ycompanyElasticClient: Client | undefined;
}

/** Lazy singleton Elastic Cloud client. Throws if env is not configured. */
export function getElasticsearchClient(): Client {
  if (!isElasticsearchConfigured()) {
    throw new Error(
      "Elasticsearch is not configured. Set ELASTICSEARCH_CLOUD_ID and ELASTICSEARCH_API_KEY.",
    );
  }

  if (!globalThis.__ycompanyElasticClient) {
    const tls = elasticsearchTlsOptions();
    globalThis.__ycompanyElasticClient = new Client({
      cloud: { id: process.env.ELASTICSEARCH_CLOUD_ID!.trim() },
      auth: { apiKey: process.env.ELASTICSEARCH_API_KEY!.trim() },
      requestTimeout: 8_000,
      ...(tls ? { tls } : {}),
    });
  }

  return globalThis.__ycompanyElasticClient;
}
