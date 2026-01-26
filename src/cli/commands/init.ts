/**
 * Init command implementation - Interactive setup wizard
 */

import inquirer from 'inquirer';
import { setConfigValue, loadConfig, getConfigPath } from '../../core/config-manager.js';
import { getCurrentRepo } from '../../core/github.js';
import { logger } from '../../utils/logger.js';
import { validateApiKey, validateRepoFormat } from '../../utils/validators.js';

/**
 * Init command handler
 */
export async function initCommand(): Promise<void> {
  try {
    console.log();
    logger.header('Claude Ticket Generator - Setup Wizard');
    console.log();
    logger.info('This wizard will help you configure the tool.');
    console.log();

    const config = loadConfig();

    // 1. API Key
    const { apiKey } = await inquirer.prompt([
      {
        type: 'password',
        name: 'apiKey',
        message: 'Anthropic API Key:',
        default: config.anthropicApiKey,
        validate: (input: string) => {
          if (!input) {
            return 'API key is required';
          }
          if (!validateApiKey(input)) {
            return 'Invalid API key format. Should start with "sk-ant-"';
          }
          return true;
        },
      },
    ]);

    setConfigValue('anthropicApiKey', apiKey);
    logger.success('API key saved');

    // 2. Default Repository
    const currentRepo = getCurrentRepo();
    let defaultRepoValue = config.defaultRepo;

    if (!defaultRepoValue && currentRepo) {
      defaultRepoValue = currentRepo;
    }

    const { useDefaultRepo } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'useDefaultRepo',
        message: 'Set a default repository?',
        default: Boolean(defaultRepoValue),
      },
    ]);

    if (useDefaultRepo) {
      const { defaultRepo } = await inquirer.prompt([
        {
          type: 'input',
          name: 'defaultRepo',
          message: 'Default repository (owner/repo):',
          default: defaultRepoValue,
          validate: (input: string) => {
            if (!input) {
              return true; // Allow empty
            }
            if (!validateRepoFormat(input)) {
              return 'Invalid format. Expected: "owner/repo"';
            }
            return true;
          },
        },
      ]);

      if (defaultRepo) {
        setConfigValue('defaultRepo', defaultRepo);
        logger.success(`Default repository set to: ${defaultRepo}`);
      }
    }

    // 3. Default Document Path
    const { useDefaultDoc } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'useDefaultDoc',
        message: 'Set a default document path?',
        default: Boolean(config.defaultDocPath && config.defaultDocPath !== 'ROADMAP.md'),
      },
    ]);

    if (useDefaultDoc) {
      const { defaultDocPath } = await inquirer.prompt([
        {
          type: 'input',
          name: 'defaultDocPath',
          message: 'Default document path:',
          default: config.defaultDocPath || 'ROADMAP.md',
        },
      ]);

      if (defaultDocPath) {
        setConfigValue('defaultDocPath', defaultDocPath);
        logger.success(`Default document path set to: ${defaultDocPath}`);
      }
    }

    // 4. Preferences
    console.log();
    logger.info('Configure preferences (press Enter to keep current values):');
    console.log();

    const { autoCreateLabels, checkDuplicates, duplicateThreshold } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'autoCreateLabels',
        message: 'Automatically create missing labels?',
        default: config.preferences.autoCreateLabels,
      },
      {
        type: 'confirm',
        name: 'checkDuplicates',
        message: 'Check for duplicate issues?',
        default: config.preferences.checkDuplicates,
      },
      {
        type: 'number',
        name: 'duplicateThreshold',
        message: 'Duplicate detection threshold (0.0 - 1.0):',
        default: config.preferences.duplicateThreshold,
        validate: (input: number) => {
          if (input < 0 || input > 1) {
            return 'Threshold must be between 0.0 and 1.0';
          }
          return true;
        },
        when: (answers: any) => answers.checkDuplicates,
      },
    ]);

    setConfigValue('preferences.autoCreateLabels', autoCreateLabels);
    setConfigValue('preferences.checkDuplicates', checkDuplicates);

    if (checkDuplicates && duplicateThreshold !== undefined) {
      setConfigValue('preferences.duplicateThreshold', duplicateThreshold);
    }

    // 5. Summary
    console.log();
    logger.header('Setup Complete');
    console.log();
    logger.success('Configuration saved successfully!');
    logger.dim(`Config file: ${getConfigPath()}`);
    console.log();
    logger.info('Next steps:');
    logger.log('  1. Create or update your roadmap document (e.g., ROADMAP.md)');
    logger.log('  2. Run: claude-ticket-gen generate --dry-run');
    logger.log('  3. Review the preview');
    logger.log('  4. Run: claude-ticket-gen generate (to create issues)');
    console.log();
  } catch (error) {
    if ((error as any).isTtyError) {
      logger.error('Prompt could not be rendered in this environment');
    } else {
      logger.error(`Init failed: ${(error as Error).message}`);
    }
    process.exit(1);
  }
}
