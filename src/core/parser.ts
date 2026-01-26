/**
 * AI-powered document parser using Claude API
 */

import Anthropic from '@anthropic-ai/sdk';
import { readFileSync } from 'fs';
import { ParsedTask } from './types.js';
import { getParsingPrompt } from '../templates/parsing-prompt.js';
import { loadConfig } from './config-manager.js';

/**
 * Parse a document file and extract structured tasks
 */
export async function parseDocument(filePath: string): Promise<ParsedTask[]> {
  const content = readFileSync(filePath, 'utf-8');
  return parseDocumentContent(content);
}

/**
 * Parse document content and extract structured tasks
 */
export async function parseDocumentContent(content: string): Promise<ParsedTask[]> {
  const config = loadConfig();

  if (!config.anthropicApiKey) {
    throw new Error(
      'Anthropic API key not configured. Set it with: claude-ticket-gen config set anthropicApiKey <key>'
    );
  }

  const client = new Anthropic({
    apiKey: config.anthropicApiKey,
  });

  const prompt = getParsingPrompt(content);

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Extract text from response
    const textContent = response.content.find((block) => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text content in API response');
    }

    const responseText = textContent.text.trim();

    // Parse JSON response
    const tasks = parseTasksFromResponse(responseText);

    return tasks;
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      throw new Error(`Claude API error: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Parse tasks from API response text
 */
function parseTasksFromResponse(responseText: string): ParsedTask[] {
  // Try to extract JSON from response (in case there's markdown formatting)
  let jsonText = responseText;

  // Remove markdown code blocks if present
  if (responseText.includes('```')) {
    const match = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match) {
      jsonText = match[1];
    }
  }

  try {
    const parsed = JSON.parse(jsonText);

    // Validate it's an array
    if (!Array.isArray(parsed)) {
      throw new Error('Response is not an array');
    }

    // Validate and sanitize each task
    return parsed.map((task, index) => validateAndSanitizeTask(task, index));
  } catch (error) {
    throw new Error(`Failed to parse tasks from response: ${(error as Error).message}`);
  }
}

/**
 * Validate and sanitize a task object
 */
function validateAndSanitizeTask(task: any, index: number): ParsedTask {
  // Required fields
  if (!task.title || typeof task.title !== 'string') {
    throw new Error(`Task ${index}: missing or invalid title`);
  }

  // Ensure all required fields exist with defaults
  return {
    title: task.title.trim(),
    description: (task.description || '').trim(),
    phase: task.phase || null,
    priority: validatePriority(task.priority) ? task.priority : 'P2',
    labels: Array.isArray(task.labels) ? task.labels : [],
    isCompleted: Boolean(task.isCompleted),
    isOptional: Boolean(task.isOptional),
    type: validateType(task.type) ? task.type : 'feature',
    subTasks: Array.isArray(task.subTasks) ? task.subTasks : undefined,
    metadata: {
      milestone: task.metadata?.milestone || undefined,
      target: task.metadata?.target || undefined,
      dependencies: Array.isArray(task.metadata?.dependencies)
        ? task.metadata.dependencies
        : undefined,
    },
  };
}

/**
 * Validate priority value
 */
function validatePriority(priority: any): boolean {
  return ['P0', 'P1', 'P2', 'P3'].includes(priority);
}

/**
 * Validate type value
 */
function validateType(type: any): boolean {
  return ['feature', 'bug', 'tech-debt', 'documentation'].includes(type);
}

/**
 * Retry logic for API calls
 */
export async function parseWithRetry(
  filePath: string,
  maxRetries: number = 3
): Promise<ParsedTask[]> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await parseDocument(filePath);
    } catch (error) {
      lastError = error as Error;

      // Don't retry on client errors (invalid API key, etc.)
      if (error instanceof Anthropic.APIError && error.status && error.status < 500) {
        throw error;
      }

      // Wait before retry (exponential backoff)
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Parse failed after retries');
}
