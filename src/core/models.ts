/**
 * Live discovery of available Claude models via the Anthropic Models API.
 *
 * Uses the SDK's native `models` resource (`client.models.list()`), which
 * auto-paginates. Querying the live API (instead of shipping a hardcoded list)
 * is deliberate: a stale in-code list is exactly what let a retired model linger
 * and start returning 404s.
 */

import Anthropic from '@anthropic-ai/sdk';
import { loadConfig } from './config-manager.js';

/** A single model, trimmed to the fields the CLI displays. */
export interface ModelInfo {
  id: string;
  display_name: string;
  created_at?: string;
}

/**
 * Fetch every available model from the Anthropic Models API.
 *
 * Resolves the API key from config first, then the ANTHROPIC_API_KEY env var
 * (the same fallback order the SDK itself uses), and throws a friendly error if
 * neither is set. `models.list()` auto-paginates, so the full catalog is returned
 * even if it ever grows past a single page.
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

  try {
    // The SDK pages under the hood; iterating yields every model across pages.
    for await (const model of client.models.list({ limit: 1000 })) {
      models.push({
        id: model.id,
        display_name: model.display_name,
        created_at: model.created_at,
      });
    }
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      throw new Error(`Claude API error: ${error.message}`);
    }
    throw error;
  }

  return models;
}
