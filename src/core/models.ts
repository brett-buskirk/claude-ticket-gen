/**
 * Live discovery of available Claude models via the Anthropic Models API.
 *
 * The pinned SDK (0.30.x) ships no dedicated `models` resource, so we use the
 * client's low-level request method. That still routes through the SDK — reusing
 * its base URL, auth header, API-version header, and typed error handling
 * (Anthropic.APIError) — rather than a hand-rolled fetch. Querying the live API
 * (instead of shipping a hardcoded list) is deliberate: a stale in-code list is
 * exactly what let a retired model linger and start returning 404s.
 */

import Anthropic from '@anthropic-ai/sdk';
import { loadConfig } from './config-manager.js';

/** A single model as returned by GET /v1/models. */
export interface ModelInfo {
  id: string;
  display_name: string;
  created_at?: string;
}

/** Shape of one page of the GET /v1/models response. */
interface ModelListPage {
  data: ModelInfo[];
  has_more: boolean;
  last_id: string | null;
}

/**
 * Fetch every available model from the Anthropic Models API.
 *
 * Resolves the API key from config first, then the ANTHROPIC_API_KEY env var
 * (the same fallback order the SDK itself uses), and throws a friendly error if
 * neither is set. Follows pagination so the full catalog is returned even if it
 * ever grows past a single page.
 */
export async function listModels(): Promise<ModelInfo[]> {
  const config = loadConfig();
  const apiKey = config.anthropicApiKey || process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error(
      'Anthropic API key not configured. Set it with: claude-ticket-gen config set anthropicApiKey <key>'
    );
  }

  const client = new Anthropic({ apiKey });

  const models: ModelInfo[] = [];
  let afterId: string | undefined;

  try {
    // 1000 is the max page size, so this is almost always a single request, but
    // we follow `has_more`/`last_id` to stay correct if the catalog ever grows.
    do {
      const query: Record<string, string> = { limit: '1000' };
      if (afterId) {
        query.after_id = afterId;
      }

      const page = await client.get<unknown, ModelListPage>('/v1/models', { query });

      models.push(...page.data);
      afterId = page.has_more ? page.last_id ?? undefined : undefined;
    } while (afterId);
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      throw new Error(`Claude API error: ${error.message}`);
    }
    throw error;
  }

  return models;
}
