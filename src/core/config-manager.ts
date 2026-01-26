/**
 * Configuration management system
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { homedir } from 'os';
import { join, dirname } from 'path';
import { Config, DEFAULT_CONFIG } from './types.js';
import { validateApiKey, validateRepoFormat, validateThreshold } from '../utils/validators.js';

/**
 * Get the config directory path
 */
export function getConfigDir(): string {
  return join(homedir(), '.config', 'claude-ticket-gen');
}

/**
 * Get the config file path
 */
export function getConfigPath(): string {
  return join(getConfigDir(), 'config.json');
}

/**
 * Ensure config directory exists
 */
function ensureConfigDir(): void {
  const configDir = getConfigDir();
  if (!existsSync(configDir)) {
    mkdirSync(configDir, { recursive: true });
  }
}

/**
 * Load configuration from file
 */
export function loadConfig(): Config {
  const configPath = getConfigPath();

  if (!existsSync(configPath)) {
    // Return default config if file doesn't exist
    return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
  }

  try {
    const content = readFileSync(configPath, 'utf-8');
    const userConfig = JSON.parse(content);

    // Merge with defaults to ensure all properties exist
    return {
      ...DEFAULT_CONFIG,
      ...userConfig,
      preferences: {
        ...DEFAULT_CONFIG.preferences,
        ...(userConfig.preferences || {}),
      },
      labelColors: {
        ...DEFAULT_CONFIG.labelColors,
        ...(userConfig.labelColors || {}),
      },
    };
  } catch (error) {
    throw new Error(`Failed to load config: ${(error as Error).message}`);
  }
}

/**
 * Save configuration to file
 */
export function saveConfig(config: Config): void {
  ensureConfigDir();
  const configPath = getConfigPath();

  try {
    const content = JSON.stringify(config, null, 2);
    writeFileSync(configPath, content, 'utf-8');
  } catch (error) {
    throw new Error(`Failed to save config: ${(error as Error).message}`);
  }
}

/**
 * Get a config value by key path (e.g., "preferences.dryRunByDefault")
 */
export function getConfigValue(key: string): any {
  const config = loadConfig();
  const keys = key.split('.');

  let value: any = config;
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      return undefined;
    }
  }

  return value;
}

/**
 * Set a config value by key path
 */
export function setConfigValue(key: string, value: any): void {
  const config = loadConfig();
  const keys = key.split('.');

  // Navigate to the parent object
  let current: any = config;
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i];
    if (!current[k] || typeof current[k] !== 'object') {
      current[k] = {};
    }
    current = current[k];
  }

  // Set the value
  const lastKey = keys[keys.length - 1];

  // Validate certain keys
  if (key === 'anthropicApiKey' && !validateApiKey(value)) {
    throw new Error('Invalid API key format');
  }
  if (key === 'defaultRepo' && value && !validateRepoFormat(value)) {
    throw new Error('Invalid repository format. Expected: "owner/repo"');
  }
  if (key === 'preferences.duplicateThreshold' && !validateThreshold(value)) {
    throw new Error('Threshold must be a number between 0 and 1');
  }

  // Convert string booleans
  if (value === 'true') value = true;
  if (value === 'false') value = false;

  // Convert string numbers for threshold
  if (key === 'preferences.duplicateThreshold' && typeof value === 'string') {
    value = parseFloat(value);
  }

  current[lastKey] = value;
  saveConfig(config);
}

/**
 * Reset configuration to defaults
 */
export function resetConfig(): void {
  saveConfig(JSON.parse(JSON.stringify(DEFAULT_CONFIG)));
}

/**
 * Check if config file exists
 */
export function configExists(): boolean {
  return existsSync(getConfigPath());
}

/**
 * Get all config as an object
 */
export function getAllConfig(): Config {
  return loadConfig();
}

/**
 * Validate that required config is set
 */
export function validateConfig(): { valid: boolean; errors: string[] } {
  const config = loadConfig();
  const errors: string[] = [];

  if (!config.anthropicApiKey) {
    errors.push('Anthropic API key not set. Use: claude-ticket-gen config set anthropicApiKey <key>');
  } else if (!validateApiKey(config.anthropicApiKey)) {
    errors.push('Invalid Anthropic API key format');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
