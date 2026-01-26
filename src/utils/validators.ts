/**
 * Input validation utilities
 */

import { existsSync } from 'fs';
import { Priority } from '../core/types.js';

/**
 * Validate Anthropic API key format
 */
export function validateApiKey(key: string): boolean {
  if (!key || typeof key !== 'string') {
    return false;
  }
  // Anthropic API keys start with sk-ant-
  return key.startsWith('sk-ant-') && key.length > 20;
}

/**
 * Validate GitHub repository format (owner/repo)
 */
export function validateRepoFormat(repo: string): boolean {
  if (!repo || typeof repo !== 'string') {
    return false;
  }
  const parts = repo.split('/');
  return parts.length === 2 && parts[0].length > 0 && parts[1].length > 0;
}

/**
 * Validate file path exists
 */
export function validateFilePath(filePath: string): boolean {
  if (!filePath || typeof filePath !== 'string') {
    return false;
  }
  return existsSync(filePath);
}

/**
 * Validate priority level
 */
export function validatePriority(priority: string): priority is Priority {
  return ['P0', 'P1', 'P2', 'P3'].includes(priority);
}

/**
 * Validate hex color code
 */
export function validateHexColor(color: string): boolean {
  if (!color || typeof color !== 'string') {
    return false;
  }
  // Valid hex color: 6 hex digits (without #)
  return /^[0-9A-Fa-f]{6}$/.test(color);
}

/**
 * Validate duplicate threshold (0-1)
 */
export function validateThreshold(threshold: number): boolean {
  return typeof threshold === 'number' && threshold >= 0 && threshold <= 1;
}

/**
 * Get validation error message for API key
 */
export function getApiKeyError(): string {
  return 'Invalid API key format. Anthropic API keys should start with "sk-ant-"';
}

/**
 * Get validation error message for repo format
 */
export function getRepoFormatError(): string {
  return 'Invalid repository format. Expected: "owner/repo" (e.g., "octocat/Hello-World")';
}

/**
 * Get validation error message for file path
 */
export function getFilePathError(path: string): string {
  return `File not found: ${path}`;
}

/**
 * Get validation error message for priority
 */
export function getPriorityError(): string {
  return 'Invalid priority. Must be one of: P0, P1, P2, P3';
}
