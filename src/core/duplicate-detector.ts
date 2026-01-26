/**
 * Duplicate issue detection
 */

import { ParsedTask, DuplicateCheckResult } from './types.js';
import { searchIssues } from './github.js';

/**
 * Check if a task is a duplicate of an existing issue
 */
export async function checkDuplicate(
  task: ParsedTask,
  repo: string,
  threshold: number = 0.8
): Promise<DuplicateCheckResult> {
  // Search for existing issues
  const existingIssues = await searchIssues(task.title, repo);

  if (existingIssues.length === 0) {
    return { isDuplicate: false };
  }

  // Calculate similarity scores
  let bestMatch: { score: number; issue: any } | null = null;

  for (const issue of existingIssues) {
    // Only check open issues
    if (issue.state !== 'open') {
      continue;
    }

    const score = calculateSimilarity(task.title, issue.title);

    if (!bestMatch || score > bestMatch.score) {
      bestMatch = { score, issue };
    }
  }

  if (!bestMatch) {
    return { isDuplicate: false };
  }

  // Check if similarity exceeds threshold
  if (bestMatch.score >= threshold) {
    return {
      isDuplicate: true,
      existingIssueNumber: bestMatch.issue.number,
      existingIssueTitle: bestMatch.issue.title,
      similarityScore: bestMatch.score,
    };
  }

  return { isDuplicate: false };
}

/**
 * Calculate similarity between two strings (simple keyword overlap)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const words1 = normalizeAndTokenize(str1);
  const words2 = normalizeAndTokenize(str2);

  if (words1.length === 0 || words2.length === 0) {
    return 0;
  }

  // Calculate Jaccard similarity (intersection / union)
  const set1 = new Set(words1);
  const set2 = new Set(words2);

  const intersection = new Set([...set1].filter((word) => set2.has(word)));
  const union = new Set([...set1, ...set2]);

  return intersection.size / union.size;
}

/**
 * Normalize and tokenize a string into keywords
 */
function normalizeAndTokenize(str: string): string[] {
  return (
    str
      .toLowerCase()
      // Remove special characters
      .replace(/[^\w\s]/g, ' ')
      // Split into words
      .split(/\s+/)
      // Remove common stop words and short words
      .filter((word) => word.length > 2)
      .filter((word) => !STOP_WORDS.has(word))
  );
}

/**
 * Common English stop words to filter out
 */
const STOP_WORDS = new Set([
  'the',
  'and',
  'for',
  'are',
  'but',
  'not',
  'you',
  'all',
  'can',
  'her',
  'was',
  'one',
  'our',
  'out',
  'day',
  'get',
  'has',
  'him',
  'his',
  'how',
  'man',
  'new',
  'now',
  'old',
  'see',
  'two',
  'way',
  'who',
  'boy',
  'did',
  'its',
  'let',
  'put',
  'say',
  'she',
  'too',
  'use',
]);

/**
 * Check multiple tasks for duplicates
 */
export async function checkDuplicates(
  tasks: ParsedTask[],
  repo: string,
  threshold: number = 0.8
): Promise<Map<number, DuplicateCheckResult>> {
  const results = new Map<number, DuplicateCheckResult>();

  for (let i = 0; i < tasks.length; i++) {
    const result = await checkDuplicate(tasks[i], repo, threshold);
    results.set(i, result);
  }

  return results;
}
