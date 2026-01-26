/**
 * Console output utilities with formatting
 */

import chalk from 'chalk';

/**
 * Log levels
 */
export const logger = {
  /**
   * Success message (green)
   */
  success(message: string): void {
    console.log(chalk.green('✓'), message);
  },

  /**
   * Error message (red)
   */
  error(message: string): void {
    console.error(chalk.red('✗'), message);
  },

  /**
   * Warning message (yellow)
   */
  warning(message: string): void {
    console.warn(chalk.yellow('⚠'), message);
  },

  /**
   * Info message (blue)
   */
  info(message: string): void {
    console.log(chalk.blue('ℹ'), message);
  },

  /**
   * Plain message
   */
  log(message: string): void {
    console.log(message);
  },

  /**
   * Dim/secondary text
   */
  dim(message: string): void {
    console.log(chalk.dim(message));
  },

  /**
   * Bold text
   */
  bold(message: string): void {
    console.log(chalk.bold(message));
  },

  /**
   * Formatted header
   */
  header(message: string): void {
    console.log();
    console.log(chalk.bold.cyan(message));
    console.log(chalk.cyan('─'.repeat(message.length)));
  },

  /**
   * Section divider
   */
  divider(): void {
    console.log(chalk.dim('─'.repeat(50)));
  },

  /**
   * Empty line
   */
  newline(): void {
    console.log();
  },
};

/**
 * Format priority with color
 */
export function formatPriority(priority: string): string {
  switch (priority) {
    case 'P0':
      return chalk.red.bold(priority);
    case 'P1':
      return chalk.yellow.bold(priority);
    case 'P2':
      return chalk.blue(priority);
    case 'P3':
      return chalk.gray(priority);
    default:
      return priority;
  }
}

/**
 * Format task type with color
 */
export function formatType(type: string): string {
  switch (type) {
    case 'feature':
      return chalk.cyan(type);
    case 'bug':
      return chalk.red(type);
    case 'tech-debt':
      return chalk.magenta(type);
    case 'documentation':
      return chalk.green(type);
    default:
      return type;
  }
}

/**
 * Format status with color
 */
export function formatStatus(status: string): string {
  switch (status) {
    case 'completed':
      return chalk.green('✓ ' + status);
    case 'in-progress':
      return chalk.yellow('⟳ ' + status);
    case 'todo':
      return chalk.gray('○ ' + status);
    default:
      return status;
  }
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Format a URL with highlighting
 */
export function formatUrl(url: string): string {
  return chalk.cyan.underline(url);
}
