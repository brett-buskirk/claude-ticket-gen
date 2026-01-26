/**
 * Generate command implementation
 */

import { existsSync } from 'fs';
import { resolve } from 'path';
import { ParsedTask, GenerateOptions, GenerationSummary, Priority } from '../../core/types.js';
import { loadConfig, validateConfig } from '../../core/config-manager.js';
import { parseWithRetry } from '../../core/parser.js';
import { checkGhInstalled, checkGhAuth, getCurrentRepo, createIssue, ensureLabelsExist, ensureCustomLabels } from '../../core/github.js';
import { checkDuplicate } from '../../core/duplicate-detector.js';
import { logger } from '../../utils/logger.js';
import { validateFilePath, validateRepoFormat, validatePriority } from '../../utils/validators.js';
import { startSpinner, succeedSpinner, failSpinner, displayPreview, displaySummary, updateSpinner } from '../ui.js';
import inquirer from 'inquirer';

/**
 * Generate command handler
 */
export async function generateCommand(file?: string, options: GenerateOptions = {}): Promise<void> {
  try {
    // 1. Validate prerequisites
    await validatePrerequisites();

    // 2. Determine file path
    const filePath = await resolveFilePath(file);

    // 3. Determine target repo
    const repo = await resolveRepo(options.repo);

    // 4. Parse document
    logger.header('Parsing Document');
    const spinner = startSpinner('Parsing document with Claude AI...');

    let tasks: ParsedTask[];
    try {
      tasks = await parseWithRetry(filePath);
      succeedSpinner(spinner, `Parsed ${tasks.length} tasks from document`);
    } catch (error) {
      failSpinner(spinner, 'Failed to parse document');
      throw error;
    }

    if (tasks.length === 0) {
      logger.warning('No tasks found in document');
      return;
    }

    // 5. Filter tasks
    const filteredTasks = filterTasks(tasks, options);
    logger.info(`${filteredTasks.length} tasks after filtering`);

    if (filteredTasks.length === 0) {
      logger.warning('No tasks match the filter criteria');
      return;
    }

    // 6. Preview
    const isDryRun = options.dryRun || false;
    displayPreview(filteredTasks);

    // 7. Confirm (unless dry-run)
    if (!isDryRun) {
      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: `Create ${filteredTasks.length} GitHub issues in ${repo}?`,
          default: false,
        },
      ]);

      if (!confirm) {
        logger.info('Cancelled by user');
        return;
      }
    }

    // 8. Create labels if needed
    const config = loadConfig();
    if (config.preferences.autoCreateLabels && !isDryRun) {
      const labelSpinner = startSpinner('Ensuring labels exist...');
      try {
        await ensureLabelsExist(repo, config.labelColors);
        await ensureCustomLabels(filteredTasks, repo);
        succeedSpinner(labelSpinner, 'Labels ready');
      } catch (error) {
        failSpinner(labelSpinner, 'Failed to create labels (continuing anyway)');
      }
    }

    // 9. Create issues
    logger.header('Creating Issues');
    const summary: GenerationSummary = {
      totalTasks: tasks.length,
      filteredTasks: filteredTasks.length,
      created: 0,
      skipped: 0,
      duplicates: 0,
      errors: 0,
    };

    for (let i = 0; i < filteredTasks.length; i++) {
      const task = filteredTasks[i];
      const progress = `[${i + 1}/${filteredTasks.length}]`;

      // Check for duplicates
      if (config.preferences.checkDuplicates && !isDryRun) {
        const dupCheck = await checkDuplicate(task, repo, config.preferences.duplicateThreshold);

        if (dupCheck.isDuplicate) {
          logger.warning(
            `${progress} Skipping "${task.title}" - duplicate of #${dupCheck.existingIssueNumber}`
          );
          summary.duplicates++;
          continue;
        }
      }

      // Create issue
      const creationSpinner = startSpinner(`${progress} Creating: ${task.title}`);

      try {
        const result = await createIssue(task, repo, isDryRun);

        if (result.success) {
          if (isDryRun) {
            succeedSpinner(creationSpinner, `${progress} [DRY RUN] ${task.title}`);
          } else {
            succeedSpinner(
              creationSpinner,
              `${progress} Created #${result.issueNumber}: ${task.title}`
            );
          }
          summary.created++;
        } else {
          failSpinner(creationSpinner, `${progress} Failed: ${result.error}`);
          summary.errors++;
        }
      } catch (error) {
        failSpinner(creationSpinner, `${progress} Error: ${(error as Error).message}`);
        summary.errors++;
      }
    }

    // 10. Display summary
    displaySummary(summary);

    if (isDryRun) {
      console.log();
      logger.info('This was a dry run. No issues were created.');
      logger.info('Run without --dry-run to create issues.');
    }
  } catch (error) {
    logger.error((error as Error).message);
    process.exit(1);
  }
}

/**
 * Validate prerequisites
 */
async function validatePrerequisites(): Promise<void> {
  // Check config
  const validation = validateConfig();
  if (!validation.valid) {
    logger.error('Configuration errors:');
    validation.errors.forEach((err) => logger.error(`  ${err}`));
    process.exit(1);
  }

  // Check gh CLI
  if (!checkGhInstalled()) {
    logger.error('GitHub CLI (gh) is not installed');
    logger.info('Install it from: https://cli.github.com/');
    process.exit(1);
  }

  // Check gh auth
  if (!checkGhAuth()) {
    logger.error('Not authenticated with GitHub CLI');
    logger.info('Run: gh auth login');
    process.exit(1);
  }
}

/**
 * Resolve file path
 */
async function resolveFilePath(file?: string): Promise<string> {
  if (file) {
    const absolutePath = resolve(file);
    if (!validateFilePath(absolutePath)) {
      throw new Error(`File not found: ${file}`);
    }
    return absolutePath;
  }

  // Try default from config
  const config = loadConfig();
  if (config.defaultDocPath) {
    const defaultPath = resolve(config.defaultDocPath);
    if (validateFilePath(defaultPath)) {
      logger.info(`Using default file: ${config.defaultDocPath}`);
      return defaultPath;
    }
  }

  // Fallback to ROADMAP.md
  const fallback = resolve('ROADMAP.md');
  if (validateFilePath(fallback)) {
    logger.info('Using ROADMAP.md');
    return fallback;
  }

  throw new Error('No file specified and no default found');
}

/**
 * Resolve target repository
 */
async function resolveRepo(repoOption?: string): Promise<string> {
  if (repoOption) {
    if (!validateRepoFormat(repoOption)) {
      throw new Error('Invalid repository format. Expected: "owner/repo"');
    }
    return repoOption;
  }

  // Try current repo
  const currentRepo = getCurrentRepo();
  if (currentRepo) {
    logger.info(`Using current repository: ${currentRepo}`);
    return currentRepo;
  }

  // Try config default
  const config = loadConfig();
  if (config.defaultRepo) {
    logger.info(`Using default repository: ${config.defaultRepo}`);
    return config.defaultRepo;
  }

  throw new Error('No repository specified and could not detect current repo');
}

/**
 * Filter tasks based on options
 */
function filterTasks(tasks: ParsedTask[], options: GenerateOptions): ParsedTask[] {
  let filtered = [...tasks];

  // Skip completed tasks
  filtered = filtered.filter((task) => !task.isCompleted);

  // Filter by phase
  if (options.filterPhase) {
    filtered = filtered.filter(
      (task) => task.phase?.toLowerCase() === options.filterPhase?.toLowerCase()
    );
  }

  // Filter by priority
  if (options.minPriority) {
    if (!validatePriority(options.minPriority)) {
      logger.warning(`Invalid priority: ${options.minPriority}. Ignoring filter.`);
    } else {
      const priorityLevels: Priority[] = ['P0', 'P1', 'P2', 'P3'];
      const minIndex = priorityLevels.indexOf(options.minPriority);

      filtered = filtered.filter((task) => {
        const taskIndex = priorityLevels.indexOf(task.priority);
        return taskIndex <= minIndex;
      });
    }
  }

  // Filter optional
  if (!options.includeOptional) {
    filtered = filtered.filter((task) => !task.isOptional);
  }

  return filtered;
}
