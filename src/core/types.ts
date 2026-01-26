/**
 * Core type definitions for the Claude Ticket Generator
 */

export type Priority = 'P0' | 'P1' | 'P2' | 'P3';
export type TaskType = 'feature' | 'bug' | 'tech-debt' | 'documentation';
export type TaskStatus = 'todo' | 'in-progress' | 'completed';

/**
 * Parsed task from document analysis
 */
export interface ParsedTask {
  title: string;
  description: string;
  phase?: string;
  priority: Priority;
  labels: string[];
  isCompleted: boolean;
  isOptional: boolean;
  type: TaskType;
  subTasks?: string[];
  metadata: {
    milestone?: string;
    target?: string;
    dependencies?: string[];
  };
}

/**
 * Configuration schema
 */
export interface Config {
  anthropicApiKey?: string;
  defaultRepo?: string;
  defaultDocPath?: string;
  preferences: {
    dryRunByDefault: boolean;
    autoCreateLabels: boolean;
    checkDuplicates: boolean;
    duplicateThreshold: number;
  };
  labelColors: {
    [key: string]: string;
  };
}

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: Config = {
  anthropicApiKey: undefined,
  defaultRepo: undefined,
  defaultDocPath: 'ROADMAP.md',
  preferences: {
    dryRunByDefault: false,
    autoCreateLabels: true,
    checkDuplicates: true,
    duplicateThreshold: 0.8,
  },
  labelColors: {
    'priority-critical': 'B60205',
    'priority-high': 'D93F0B',
    'priority-medium': 'FBCA04',
    'priority-low': '0E8A16',
    'type-feature': '0075CA',
    'type-bug': 'D73A4A',
    'type-tech-debt': 'F9D0C4',
    'type-documentation': '0E8A16',
  },
};

/**
 * GitHub issue creation result
 */
export interface IssueCreationResult {
  success: boolean;
  issueNumber?: number;
  url?: string;
  error?: string;
  isDuplicate?: boolean;
  duplicateIssueNumber?: number;
}

/**
 * Duplicate detection result
 */
export interface DuplicateCheckResult {
  isDuplicate: boolean;
  existingIssueNumber?: number;
  existingIssueTitle?: string;
  similarityScore?: number;
}

/**
 * Generate command options
 */
export interface GenerateOptions {
  repo?: string;
  dryRun?: boolean;
  filterPhase?: string;
  minPriority?: Priority;
  includeOptional?: boolean;
  config?: string;
}

/**
 * Summary statistics for generation run
 */
export interface GenerationSummary {
  totalTasks: number;
  filteredTasks: number;
  created: number;
  skipped: number;
  duplicates: number;
  errors: number;
}
