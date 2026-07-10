/**
 * `models` command: list the Claude models available to the configured API key.
 *
 * Queries the Anthropic Models API live so the list is never stale, and marks
 * whichever model `generate` would use by default (config, or the built-in
 * fallback) so it's obvious what you get without `--model`.
 */

import Table from 'cli-table3';
import chalk from 'chalk';
import { listModels } from '../../core/models.js';
import { loadConfig } from '../../core/config-manager.js';
import { DEFAULT_MODEL } from '../../core/types.js';
import { logger } from '../../utils/logger.js';
import { startSpinner, succeedSpinner, failSpinner } from '../ui.js';

/**
 * Models command handler
 */
export async function modelsCommand(): Promise<void> {
  const spinner = startSpinner('Fetching available models from the Anthropic API...');

  try {
    const models = await listModels();
    succeedSpinner(
      spinner,
      `Found ${models.length} available model${models.length === 1 ? '' : 's'}`
    );

    // The model `generate` uses when no --model flag is passed.
    const activeModel = loadConfig().model || DEFAULT_MODEL;

    const table = new Table({
      head: [chalk.cyan('Model ID'), chalk.cyan('Name'), chalk.cyan('')],
      colWidths: [30, 30, 12],
      wordWrap: true,
    });

    for (const model of models) {
      // The default is usually an alias (e.g. `claude-haiku-4-5`) while the API
      // lists the dated ID (`claude-haiku-4-5-20251001`), so match the alias as
      // a prefix too — the trailing `-` keeps `claude-opus-4` from matching
      // `claude-opus-4-8`.
      const isDefault = model.id === activeModel || model.id.startsWith(`${activeModel}-`);
      table.push([
        isDefault ? chalk.green(model.id) : model.id,
        model.display_name,
        isDefault ? chalk.green('← default') : '',
      ]);
    }

    console.log();
    console.log(table.toString());
    console.log();
    logger.dim(`Default model: ${activeModel}`);
    logger.dim('Override per run:    claude-ticket-gen generate --model <id>');
    logger.dim('Change the default:  claude-ticket-gen config set model <id>');
    console.log();
  } catch (error) {
    failSpinner(spinner, 'Failed to fetch models');
    logger.error((error as Error).message);
    process.exit(1);
  }
}
