/**
 * GitHub CLI integration wrapper
 */

import { execSync } from 'child_process';
import { ParsedTask, IssueCreationResult } from './types.js';
import { generateIssueBody, generateLabels } from '../templates/issue-template.js';

/**
 * Check if gh CLI is installed
 */
export function checkGhInstalled(): boolean {
  try {
    execSync('gh --version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get current repository from git remote
 */
export function getCurrentRepo(): string | null {
  try {
    const output = execSync('gh repo view --json nameWithOwner --jq .nameWithOwner', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore'],
    });
    return output.trim();
  } catch {
    return null;
  }
}

/**
 * Search for existing issues by keywords
 */
export async function searchIssues(keywords: string, repo: string): Promise<any[]> {
  try {
    const query = keywords.split(' ').slice(0, 5).join(' ');
    const command = `gh issue list --repo ${repo} --search "${query}" --json number,title,state --limit 10`;

    const output = execSync(command, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore'],
    });

    return JSON.parse(output);
  } catch {
    return [];
  }
}

/**
 * Create a new GitHub issue
 */
export async function createIssue(
  task: ParsedTask,
  repo: string,
  dryRun: boolean = false
): Promise<IssueCreationResult> {
  try {
    const body = generateIssueBody(task);
    const labels = generateLabels(task);

    if (dryRun) {
      return {
        success: true,
        issueNumber: 0,
        url: `(dry-run) Would create issue: ${task.title}`,
      };
    }

    // Get existing labels to filter out non-existent ones
    const existingLabels = await listLabels(repo);
    const existingLabelNames = new Set(existingLabels.map(l => l.name.toLowerCase()));

    // Filter to only use labels that exist
    const validLabels = labels.filter(label => existingLabelNames.has(label.toLowerCase()));

    // Escape title for shell (single quotes to avoid escaping issues)
    const escapedTitle = task.title.replace(/'/g, "'\\''");

    // Create issue with valid labels only, using stdin for body to preserve newlines
    let command = `gh issue create --repo ${repo} --title '${escapedTitle}' --body-file -`;

    if (validLabels.length > 0) {
      const labelString = validLabels.join(',');
      command += ` --label "${labelString}"`;
    }

    const output = execSync(command, {
      input: body,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    // Extract issue URL from output
    const url = output.trim();
    const issueNumber = extractIssueNumber(url);

    return {
      success: true,
      issueNumber,
      url,
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Extract issue number from GitHub URL
 */
function extractIssueNumber(url: string): number | undefined {
  const match = url.match(/\/issues\/(\d+)/);
  return match ? parseInt(match[1], 10) : undefined;
}

/**
 * Create a label if it doesn't exist
 */
export async function createLabel(
  name: string,
  color: string,
  repo: string
): Promise<boolean> {
  try {
    // Check if label exists first
    const existingLabels = await listLabels(repo);
    if (existingLabels.some((label) => label.name === name)) {
      return true;
    }

    // Create label
    execSync(`gh label create "${name}" --color ${color} --repo ${repo}`, {
      stdio: 'ignore',
    });

    return true;
  } catch {
    return false;
  }
}

/**
 * List all repository labels
 */
export async function listLabels(repo: string): Promise<{ name: string; color: string }[]> {
  try {
    const output = execSync(`gh label list --repo ${repo} --json name,color --limit 100`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore'],
    });

    return JSON.parse(output);
  } catch {
    return [];
  }
}

/**
 * Ensure required labels exist in the repository
 */
export async function ensureLabelsExist(repo: string, labelColors: { [key: string]: string }): Promise<void> {
  const labels = [
    { name: 'priority-critical', color: labelColors['priority-critical'] || 'B60205' },
    { name: 'priority-high', color: labelColors['priority-high'] || 'D93F0B' },
    { name: 'priority-medium', color: labelColors['priority-medium'] || 'FBCA04' },
    { name: 'priority-low', color: labelColors['priority-low'] || '0E8A16' },
    { name: 'type-feature', color: labelColors['type-feature'] || '0075CA' },
    { name: 'type-bug', color: labelColors['type-bug'] || 'D73A4A' },
    { name: 'type-tech-debt', color: labelColors['type-tech-debt'] || 'F9D0C4' },
    { name: 'type-documentation', color: labelColors['type-documentation'] || '0E8A16' },
    { name: 'optional', color: labelColors['optional'] || 'E4E669' },
  ];

  for (const label of labels) {
    await createLabel(label.name, label.color, repo);
  }
}

/**
 * Create custom labels from tasks
 */
export async function ensureCustomLabels(
  tasks: ParsedTask[],
  repo: string,
  defaultColor: string = '0E8A16'
): Promise<void> {
  // Collect all unique custom labels from tasks
  const customLabels = new Set<string>();

  for (const task of tasks) {
    for (const label of task.labels) {
      customLabels.add(label);
    }
  }

  // Create each custom label
  for (const label of customLabels) {
    await createLabel(label, defaultColor, repo);
  }
}

/**
 * Check if user is authenticated with gh CLI
 */
export function checkGhAuth(): boolean {
  try {
    execSync('gh auth status', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}
