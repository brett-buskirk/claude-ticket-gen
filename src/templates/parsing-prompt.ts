/**
 * AI prompt template for document parsing
 */

export function getParsingPrompt(documentContent: string): string {
  return `You are a specialized parser that extracts structured task information from planning documents, roadmaps, and project specifications.

Your task is to analyze the following document and extract ALL tasks, features, and actionable items, regardless of their format (checkboxes, bullet points, numbered lists, or plain text).

Document to analyze:
---
${documentContent}
---

Instructions:
1. Identify ALL tasks and actionable items in the document
2. For each task, determine:
   - Title: A clear, concise title (imperative form, e.g., "Add user authentication")
   - Description: Detailed context, acceptance criteria, and notes
   - Priority: P0 (critical), P1 (high), P2 (medium), P3 (low)
     * Look for keywords like "critical", "urgent", "important", "nice-to-have", "optional"
     * Consider placement and context (early sections often higher priority)
     * Default to P2 if unclear
   - Type: feature, bug, tech-debt, or documentation
   - Phase/Section: Which section or phase of the document it belongs to
   - Status: Is it marked as completed? (✓, [x], "done", "completed")
   - Optional: Is it marked as optional or nice-to-have?
   - Labels: Relevant tags (extract from context, e.g., "backend", "frontend", "api")
   - Subtasks: Any nested or related subtasks
   - Metadata: milestone, target date, dependencies (if mentioned)

3. Be intelligent about extraction:
   - Don't require specific markdown formats
   - Understand various checkbox syntaxes: [ ], [x], ☐, ✓, etc.
   - Recognize tasks in plain prose ("We need to...", "Should implement...")
   - Infer context from headings and sections
   - Combine split information (title in heading, details in paragraph)

4. Return ONLY a valid JSON array with this exact structure:

[
  {
    "title": "string",
    "description": "string",
    "phase": "string or null",
    "priority": "P0" | "P1" | "P2" | "P3",
    "labels": ["string"],
    "isCompleted": boolean,
    "isOptional": boolean,
    "type": "feature" | "bug" | "tech-debt" | "documentation",
    "subTasks": ["string"] or null,
    "metadata": {
      "milestone": "string or null",
      "target": "string or null",
      "dependencies": ["string"] or null
    }
  }
]

Important:
- Return ONLY the JSON array, no explanations or markdown formatting
- Ensure all JSON is valid and properly escaped
- If no tasks found, return an empty array: []
- Be thorough - extract every actionable item you can find
- Preserve the original intent and context of each task`;
}
