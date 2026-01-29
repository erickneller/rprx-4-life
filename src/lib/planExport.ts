import { jsPDF } from 'jspdf';
import type { PlanContent, SavedPlan } from '@/hooks/usePlans';

export function exportPlanAsMarkdown(plan: SavedPlan): string {
  const content = plan.content;
  const lines: string[] = [];
  
  lines.push(`# ${plan.title}`);
  lines.push('');
  lines.push(`**Strategy:** ${plan.strategy_name}`);
  if (plan.strategy_id) {
    lines.push(`**Strategy ID:** ${plan.strategy_id}`);
  }
  lines.push(`**Status:** ${formatStatus(plan.status)}`);
  lines.push(`**Created:** ${new Date(plan.created_at).toLocaleDateString()}`);
  lines.push(`**Last Updated:** ${new Date(plan.updated_at).toLocaleDateString()}`);
  lines.push('');
  
  if (content.horseman && content.horseman.length > 0) {
    lines.push(`**Horseman:** ${content.horseman.join(', ')}`);
  }
  if (content.savings) {
    lines.push(`**Potential Savings:** ${content.savings}`);
  }
  if (content.complexity) {
    lines.push(`**Complexity:** ${'★'.repeat(content.complexity)}${'☆'.repeat(5 - content.complexity)}`);
  }
  if (content.taxReference) {
    lines.push(`**Tax Reference:** ${content.taxReference}`);
  }
  lines.push('');
  
  if (content.summary) {
    lines.push('## Summary');
    lines.push('');
    lines.push(content.summary);
    lines.push('');
  }
  
  if (content.requirements) {
    lines.push('## Requirements');
    lines.push('');
    lines.push(content.requirements);
    lines.push('');
  }
  
  if (content.steps && content.steps.length > 0) {
    lines.push('## Implementation Steps');
    lines.push('');
    const completedSteps = content.completedSteps || [];
    content.steps.forEach((step, index) => {
      const isCompleted = completedSteps.includes(index);
      lines.push(`- [${isCompleted ? 'x' : ' '}] ${step}`);
    });
    lines.push('');
  }
  
  if (plan.notes) {
    lines.push('## Personal Notes');
    lines.push('');
    lines.push(plan.notes);
    lines.push('');
  }
  
  if (content.disclaimer) {
    lines.push('---');
    lines.push('');
    lines.push(`*${content.disclaimer}*`);
  }
  
  return lines.join('\n');
}

export function exportPlanAsPDF(plan: SavedPlan): void {
  const doc = new jsPDF();
  const content = plan.content;
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const maxWidth = pageWidth - margin * 2;
  let y = 20;
  
  // Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(plan.title, margin, y);
  y += 12;
  
  // Strategy name
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text(`Strategy: ${plan.strategy_name}`, margin, y);
  y += 8;
  
  // Metadata
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  
  if (plan.strategy_id) {
    doc.text(`Strategy ID: ${plan.strategy_id}`, margin, y);
    y += 5;
  }
  
  doc.text(`Status: ${formatStatus(plan.status)}`, margin, y);
  y += 5;
  
  doc.text(`Created: ${new Date(plan.created_at).toLocaleDateString()}`, margin, y);
  y += 5;
  
  doc.text(`Last Updated: ${new Date(plan.updated_at).toLocaleDateString()}`, margin, y);
  y += 10;
  
  // Additional metadata
  if (content.horseman && content.horseman.length > 0) {
    doc.text(`Horseman: ${content.horseman.join(', ')}`, margin, y);
    y += 5;
  }
  
  if (content.savings) {
    doc.text(`Potential Savings: ${content.savings}`, margin, y);
    y += 5;
  }
  
  if (content.complexity) {
    doc.text(`Complexity: ${'★'.repeat(content.complexity)}${'☆'.repeat(5 - content.complexity)}`, margin, y);
    y += 5;
  }
  
  if (content.taxReference) {
    doc.text(`Tax Reference: ${content.taxReference}`, margin, y);
    y += 5;
  }
  
  y += 5;
  doc.setTextColor(0, 0, 0);
  
  // Summary
  if (content.summary) {
    y = addSection(doc, 'Summary', content.summary, y, margin, maxWidth);
  }
  
  // Requirements
  if (content.requirements) {
    y = addSection(doc, 'Requirements', content.requirements, y, margin, maxWidth);
  }
  
  // Implementation Steps
  if (content.steps && content.steps.length > 0) {
    y = checkPageBreak(doc, y, 20);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Implementation Steps', margin, y);
    y += 8;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const completedSteps = content.completedSteps || [];
    content.steps.forEach((step, index) => {
      y = checkPageBreak(doc, y, 10);
      const isCompleted = completedSteps.includes(index);
      const checkbox = isCompleted ? '☑' : '☐';
      const lines = doc.splitTextToSize(`${checkbox} ${step}`, maxWidth - 5);
      doc.text(lines, margin + 5, y);
      y += lines.length * 5 + 2;
    });
    
    y += 5;
  }
  
  // Personal Notes
  if (plan.notes) {
    y = addSection(doc, 'Personal Notes', plan.notes, y, margin, maxWidth);
  }
  
  // Disclaimer
  if (content.disclaimer) {
    y = checkPageBreak(doc, y, 20);
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'italic');
    const lines = doc.splitTextToSize(content.disclaimer, maxWidth);
    doc.text(lines, margin, y);
  }
  
  // Save the PDF
  const filename = `${plan.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_plan.pdf`;
  doc.save(filename);
}

function addSection(doc: jsPDF, title: string, text: string, y: number, margin: number, maxWidth: number): number {
  y = checkPageBreak(doc, y, 20);
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(title, margin, y);
  y += 8;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const lines = doc.splitTextToSize(text, maxWidth);
  doc.text(lines, margin, y);
  y += lines.length * 5 + 10;
  
  return y;
}

function checkPageBreak(doc: jsPDF, y: number, neededSpace: number): number {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (y + neededSpace > pageHeight - 20) {
    doc.addPage();
    return 20;
  }
  return y;
}

function formatStatus(status: string): string {
  return status.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
}

export function downloadMarkdown(plan: SavedPlan): void {
  const markdown = exportPlanAsMarkdown(plan);
  const blob = new Blob([markdown], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${plan.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_plan.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
