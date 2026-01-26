/**
 * UI helpers for CLI (spinners, tables, etc.)
 */

import ora, { Ora } from 'ora';
import Table from 'cli-table3';
import chalk from 'chalk';
import { ParsedTask, GenerationSummary } from '../core/types.js';
import { formatPriority, formatType, truncate } from '../utils/logger.js';

/**
 * Create and start a spinner
 */
export function startSpinner(text: string): Ora {
  return ora(text).start();
}

/**
 * Stop spinner with success
 */
export function succeedSpinner(spinner: Ora, text?: string): void {
  spinner.succeed(text);
}

/**
 * Stop spinner with failure
 */
export function failSpinner(spinner: Ora, text?: string): void {
  spinner.fail(text);
}

/**
 * Update spinner text
 */
export function updateSpinner(spinner: Ora, text: string): void {
  spinner.text = text;
}

/**
 * Display tasks in a table
 */
export function displayTasksTable(tasks: ParsedTask[]): void {
  const table = new Table({
    head: [
      chalk.cyan('Priority'),
      chalk.cyan('Type'),
      chalk.cyan('Title'),
      chalk.cyan('Phase'),
      chalk.cyan('Labels'),
    ],
    colWidths: [10, 15, 45, 20, 20],
    wordWrap: true,
  });

  tasks.forEach((task) => {
    table.push([
      formatPriority(task.priority),
      formatType(task.type),
      task.isCompleted ? chalk.dim(chalk.strikethrough(task.title)) : task.title,
      task.phase || chalk.dim('N/A'),
      task.labels.join(', ') || chalk.dim('none'),
    ]);
  });

  console.log(table.toString());
}

/**
 * Display generation summary
 */
export function displaySummary(summary: GenerationSummary): void {
  const table = new Table({
    head: [chalk.cyan('Metric'), chalk.cyan('Count')],
    colWidths: [25, 10],
  });

  table.push(
    ['Total Tasks Parsed', summary.totalTasks.toString()],
    ['Tasks After Filtering', summary.filteredTasks.toString()],
    [chalk.green('Issues Created'), chalk.green(summary.created.toString())],
    [chalk.yellow('Skipped (Completed)'), summary.skipped.toString()],
    [chalk.blue('Duplicates Detected'), summary.duplicates.toString()],
    [chalk.red('Errors'), summary.errors.toString()]
  );

  console.log();
  console.log(chalk.bold('Generation Summary'));
  console.log(table.toString());
}

/**
 * Display configuration in a table
 */
export function displayConfig(config: any): void {
  const table = new Table({
    head: [chalk.cyan('Key'), chalk.cyan('Value')],
    colWidths: [35, 45],
    wordWrap: true,
  });

  function addConfigRows(obj: any, prefix: string = ''): void {
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;

      if (value && typeof value === 'object' && !Array.isArray(value)) {
        addConfigRows(value, fullKey);
      } else {
        let displayValue: string;

        if (value === undefined || value === null) {
          displayValue = chalk.dim('(not set)');
        } else if (fullKey.includes('apiKey')) {
          // Mask API key
          displayValue = maskApiKey(String(value));
        } else if (typeof value === 'boolean') {
          displayValue = value ? chalk.green('true') : chalk.red('false');
        } else if (Array.isArray(value)) {
          displayValue = value.join(', ');
        } else {
          displayValue = String(value);
        }

        table.push([fullKey, displayValue]);
      }
    }
  }

  addConfigRows(config);
  console.log(table.toString());
}

/**
 * Mask API key for display
 */
function maskApiKey(key: string): string {
  if (key.length <= 20) {
    return '****';
  }
  return key.substring(0, 12) + '...' + key.substring(key.length - 4);
}

/**
 * Display a preview of what would be created
 */
export function displayPreview(tasks: ParsedTask[]): void {
  console.log();
  console.log(chalk.bold.cyan('Preview of Issues to be Created:'));
  console.log(chalk.dim('─'.repeat(80)));

  tasks.forEach((task, index) => {
    console.log();
    console.log(
      chalk.bold(`${index + 1}. ${task.title}`) +
        ' ' +
        formatPriority(task.priority) +
        ' ' +
        formatType(task.type)
    );

    if (task.description) {
      console.log(chalk.dim(truncate(task.description, 100)));
    }

    if (task.labels.length > 0) {
      console.log(chalk.blue('Labels: ') + task.labels.join(', '));
    }

    if (task.phase) {
      console.log(chalk.yellow('Phase: ') + task.phase);
    }
  });

  console.log();
  console.log(chalk.dim('─'.repeat(80)));
  console.log(chalk.bold(`Total: ${tasks.length} issues`));
}
