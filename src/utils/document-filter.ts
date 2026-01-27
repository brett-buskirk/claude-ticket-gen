/**
 * Document filtering utilities
 */

/**
 * Extract a specific section/phase from a markdown document
 */
export function extractPhaseFromDocument(content: string, phase: string): string {
  const lines = content.split('\n');
  const result: string[] = [];
  let inTargetSection = false;
  let currentLevel = 0;
  let targetLevel = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const headingMatch = line.match(/^(#+)\s+(.+)$/);

    if (headingMatch) {
      const level = headingMatch[1].length;
      const title = headingMatch[2].trim();

      // Check if this heading matches our target phase
      if (title.toLowerCase().includes(phase.toLowerCase())) {
        inTargetSection = true;
        targetLevel = level;
        result.push(line);
        continue;
      }

      // If we're in the target section and hit a same-level or higher-level heading, we're done
      if (inTargetSection && level <= targetLevel) {
        break;
      }
    }

    // Include line if we're in the target section
    if (inTargetSection) {
      result.push(line);
    }
  }

  // If no section was found, return the original content
  if (result.length === 0) {
    return content;
  }

  return result.join('\n');
}
