#!/usr/bin/env node

/**
 * Main CLI entry point
 */

import { Command } from 'commander';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Get package.json for version
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(
  readFileSync(join(__dirname, '../../package.json'), 'utf-8')
);

const program = new Command();

program
  .name('claude-ticket-gen')
  .description('AI-powered CLI tool to parse roadmap documents and generate GitHub issues')
  .version(packageJson.version)
  // Root convenience flag: `claude-ticket-gen --models` mirrors the `models`
  // subcommand for users who reach for a flag first. Handled by the default
  // action below (it runs only when no subcommand is given).
  .option('--models', 'List available Claude models');

// Config command
program
  .command('config')
  .description('Manage configuration settings')
  .argument('[action]', 'Action: set, get, list, reset')
  .argument('[key]', 'Config key (for set/get)')
  .argument('[value]', 'Config value (for set)')
  .action(async (action, key, value) => {
    const { configCommand } = await import('./commands/config.js');
    await configCommand(action, key, value);
  });

// Generate command
program
  .command('generate')
  .description('Parse document and generate GitHub issues')
  .argument('[file]', 'Path to roadmap/planning document')
  .option('--repo <owner/repo>', 'Target GitHub repository')
  .option('--dry-run', 'Preview without creating issues')
  .option('--filter-phase <name>', 'Filter by phase/section')
  .option('--min-priority <level>', 'Minimum priority level (P0-P3)')
  .option('--include-optional', 'Include optional items')
  .option('--config <path>', 'Use specific config file')
  .option('--model <id>', 'Claude model to use (overrides the configured default)')
  .action(async (file, options) => {
    const { generateCommand } = await import('./commands/generate.js');
    await generateCommand(file, options);
  });

// Init command
program
  .command('init')
  .description('Initialize configuration with interactive wizard')
  .action(async () => {
    const { initCommand } = await import('./commands/init.js');
    await initCommand();
  });

// Models command
program
  .command('models')
  .description('List available Claude models (queries the Anthropic API)')
  .action(async () => {
    const { modelsCommand } = await import('./commands/models.js');
    await modelsCommand();
  });

// Default action: runs only when no subcommand is given. Handles the root
// `--models` flag; otherwise shows help so a bare invocation is never silent.
program.action(async () => {
  if (program.opts().models) {
    const { modelsCommand } = await import('./commands/models.js');
    await modelsCommand();
  } else {
    program.help();
  }
});

// Parse arguments
program.parse();
