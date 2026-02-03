import type { PlanContent } from '@/hooks/usePlans';

interface ParsedStrategy {
  strategyId?: string;
  strategyName: string;
  content: PlanContent;
}

// Marker phrase that indicates a genuine implementation plan response
const PLAN_MARKER_PHRASE = "Here are the step-by-step implementation plans";

/**
 * Parses assistant messages to detect strategy recommendations with implementation steps.
 * Returns parsed strategy data if found, null otherwise.
 */
export function parseStrategyFromMessage(messageContent: string): ParsedStrategy | null {
  // Only show Save Plan button if marker phrase is present
  if (!messageContent.includes(PLAN_MARKER_PHRASE)) {
    return null;
  }
  
  // Look for strategy IDs like T-1, I-3, IN-2, E-5
  const strategyIdMatch = messageContent.match(/\b([TIE](?:N)?-\d+)\b/i);
  
  // Extract strategy name - look for bold text or headers after strategy ID
  let strategyName = 'Implementation Plan';
  
  // Try to find a title near the strategy ID
  if (strategyIdMatch) {
    const idPosition = messageContent.indexOf(strategyIdMatch[0]);
    const contextAround = messageContent.substring(
      Math.max(0, idPosition - 50),
      Math.min(messageContent.length, idPosition + 150)
    );
    
    // Look for bold text like **Strategy Name** or ### Strategy Name
    const boldMatch = contextAround.match(/\*\*([^*]+)\*\*/);
    const headerMatch = contextAround.match(/#{1,3}\s*([^\n]+)/);
    
    if (boldMatch) {
      strategyName = boldMatch[1].trim();
    } else if (headerMatch) {
      strategyName = headerMatch[1].trim();
    } else {
      // Use text after colon if present
      const colonMatch = contextAround.match(/:\s*([^.\n]{10,60})/);
      if (colonMatch) {
        strategyName = colonMatch[1].trim();
      }
    }
  }
  
  // Extract steps from numbered lists
  const steps: string[] = [];
  const stepMatches = messageContent.matchAll(/(?:^|\n)\s*(\d+)\.\s+([^\n]+)/gm);
  for (const match of stepMatches) {
    const stepText = match[2].trim();
    // Filter out very short or non-actionable items
    if (stepText.length > 10 && !stepText.startsWith('http')) {
      steps.push(stepText);
    }
  }
  
  // If no numbered steps, try bullet points
  if (steps.length < 2) {
    const bulletMatches = messageContent.matchAll(/(?:^|\n)\s*[-•*]\s+([^\n]+)/gm);
    for (const match of bulletMatches) {
      const stepText = match[1].trim();
      if (stepText.length > 10 && !stepText.startsWith('http')) {
        steps.push(stepText);
      }
    }
  }
  
  // Need at least 2 steps to be considered a plan
  if (steps.length < 2) {
    return null;
  }
  
  // Extract summary - first paragraph or text before steps
  let summary: string | undefined;
  const firstParagraph = messageContent.match(/^([^#\n*-1].{50,500}?)(?:\n\n|\n\d\.|\n-|\n\*)/s);
  if (firstParagraph) {
    summary = firstParagraph[1].trim();
  }
  
  // Detect horseman type
  const horseman: string[] = [];
  if (/\btax(?:es|ation)?\b/i.test(messageContent)) horseman.push('Taxes');
  if (/\binterest\b/i.test(messageContent) && !/\binterest(?:ed|ing)\b/i.test(messageContent)) horseman.push('Interest');
  if (/\binsurance\b/i.test(messageContent)) horseman.push('Insurance');
  if (/\beducation|college|529\b/i.test(messageContent)) horseman.push('Education');
  
  // Extract complexity if mentioned
  let complexity: number | undefined;
  const complexityMatch = messageContent.match(/complexity[:\s]*(\d)[\/\s]*(?:out\s*of\s*)?5/i);
  if (complexityMatch) {
    complexity = parseInt(complexityMatch[1]);
  }
  
  // Extract savings potential
  let savings: string | undefined;
  const savingsMatch = messageContent.match(/(?:savings?|save)[:\s]*\$?([0-9,]+(?:\s*[-–]\s*\$?[0-9,]+)?(?:\+)?)/i);
  if (savingsMatch) {
    savings = '$' + savingsMatch[1].replace(/^\$/, '');
  }
  
  // Extract tax reference
  let taxReference: string | undefined;
  const taxRefMatch = messageContent.match(/(?:IRC|Section|§)\s*(?:§\s*)?(\d+[A-Za-z]?(?:\([a-z]\))?)/i);
  if (taxRefMatch) {
    taxReference = 'IRC §' + taxRefMatch[1];
  }
  
  // Standard disclaimer
  const disclaimer = 'This information is for educational purposes only and does not constitute tax, legal, or financial advice. Consult with qualified professionals before implementing any strategy.';
  
  return {
    strategyId: strategyIdMatch ? strategyIdMatch[1].toUpperCase() : undefined,
    strategyName: strategyName.substring(0, 100), // Limit length
    content: {
      steps,
      summary,
      horseman: horseman.length > 0 ? horseman : undefined,
      complexity,
      savings,
      taxReference,
      disclaimer,
      completedSteps: [],
    },
  };
}
