/**
 * Config command implementation
 */

import {
  getConfigValue,
  setConfigValue,
  getAllConfig,
  resetConfig,
  getConfigPath,
} from '../../core/config-manager.js';
import { logger } from '../../utils/logger.js';
import { displayConfig } from '../ui.js';

/**
 * Config command handler
 */
export async function configCommand(
  action?: string,
  key?: string,
  value?: string
): Promise<void> {
  try {
    if (!action || action === 'list') {
      // List all config
      const config = getAllConfig();
      console.log();
      logger.header('Configuration');
      displayConfig(config);
      console.log();
      logger.dim(`Config file: ${getConfigPath()}`);
      console.log();
      return;
    }

    if (action === 'get') {
      // Get specific value
      if (!key) {
        logger.error('Key is required for get action');
        console.log('Usage: claude-ticket-gen config get <key>');
        process.exit(1);
      }

      const val = getConfigValue(key);

      if (val === undefined) {
        logger.warning(`Key "${key}" not found`);
        process.exit(1);
      }

      // Mask API key
      if (key.includes('apiKey') && typeof val === 'string') {
        const masked = val.substring(0, 12) + '...' + val.substring(val.length - 4);
        console.log(masked);
      } else {
        console.log(JSON.stringify(val, null, 2));
      }

      return;
    }

    if (action === 'set') {
      // Set value
      if (!key) {
        logger.error('Key is required for set action');
        console.log('Usage: claude-ticket-gen config set <key> <value>');
        process.exit(1);
      }

      if (value === undefined) {
        logger.error('Value is required for set action');
        console.log('Usage: claude-ticket-gen config set <key> <value>');
        process.exit(1);
      }

      try {
        setConfigValue(key, value);
        logger.success(`Set ${key} = ${key.includes('apiKey') ? '****' : value}`);
      } catch (error) {
        logger.error((error as Error).message);
        process.exit(1);
      }

      return;
    }

    if (action === 'reset') {
      // Reset to defaults
      resetConfig();
      logger.success('Configuration reset to defaults');
      logger.warning('You will need to set your API key again');
      return;
    }

    // Unknown action
    logger.error(`Unknown action: ${action}`);
    console.log('Available actions: get, set, list, reset');
    process.exit(1);
  } catch (error) {
    logger.error(`Config command failed: ${(error as Error).message}`);
    process.exit(1);
  }
}
