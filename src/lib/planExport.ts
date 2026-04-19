import { jsPDF } from 'jspdf';
import type { PlanContent, SavedPlan, StructuredPlanStep } from '@/hooks/usePlans';

// ---------- Brand palette (RGB) ----------
const BRAND = {
  primary: [37, 99, 235] as [number, number, number],      // blue-600
  primaryDark: [30, 64, 175] as [number, number, number],  // blue-800
  accent: [16, 185, 129] as [number, number, number],      // emerald-500
  warn: [217, 119, 6] as [number, number, number],         // amber-600
  danger: [220, 38, 38] as [number, number, number],       // red-600
  ink: [17, 24, 39] as [number, number, number],           // gray-900
  body: [55, 65, 81] as [number, number, number],          // gray-700
  muted: [107, 114, 128] as [number, number, number],      // gray-500
  hairline: [229, 231, 235] as [number, number, number],   // gray-200
  surface: [249, 250, 251] as [number, number, number],    // gray-50
  surfaceAlt: [239, 246, 255] as [number, number, number], // blue-50
  white: [255, 255, 255] as [number, number, number],
};

const PAGE = {
  margin: 18,
  headerH: 28,
  footerH: 14,
};

// ---------- helpers ----------
function setFill(doc: jsPDF, c: [number, number, number]) { doc.setFillColor(c[0], c[1], c[2]); }
function setDraw(doc: jsPDF, c: [number, number, number]) { doc.setDrawColor(c[0], c[1], c[2]); }
function setText(doc: jsPDF, c: [number, number, number]) { doc.setTextColor(c[0], c[1], c[2]); }

function formatStatus(status: string): string {
  return status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function statusColor(status: string): [number, number, number] {
  if (status === 'completed') return BRAND.accent;
  if (status === 'in_progress') return BRAND.primary;
  return BRAND.muted;
}

function isStructuredStep(s: unknown): s is StructuredPlanStep {
  return !!s && typeof s === 'object' && 'title' in (s as object) && 'instruction' in (s as object);
}

// Reset doc font color/size to body defaults
function bodyDefaults(doc: jsPDF) {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  setText(doc, BRAND.body);
}

// ---------- Page chrome ----------
function drawHeader(doc: jsPDF, plan: SavedPlan) {
  const w = doc.internal.pageSize.getWidth();
  setFill(doc, BRAND.primaryDark);
  doc.rect(0, 0, w, PAGE.headerH, 'F');

  // accent stripe
  setFill(doc, BRAND.accent);
  doc.rect(0, PAGE.headerH, w, 1.2, 'F');

  // Brand mark
  setText(doc, BRAND.white);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('RPRx 4 Life', PAGE.margin, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  setText(doc, [199, 210, 254]); // indigo-200 ish
  doc.text('Implementation Plan', PAGE.margin, 18);

  // Right side: status pill
  const status = formatStatus(plan.status);
  const pillColor = statusColor(plan.status);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  const pillText = status.toUpperCase();
  const pillW = doc.getTextWidth(pillText) + 8;
  const pillX = w - PAGE.margin - pillW;
  setFill(doc, pillColor);
  doc.roundedRect(pillX, 8, pillW, 7, 2, 2, 'F');
  setText(doc, BRAND.white);
  doc.text(pillText, pillX + 4, 13);
}

function drawFooter(doc: jsPDF, pageNum: number, totalPages: number) {
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  setDraw(doc, BRAND.hairline);
  doc.setLineWidth(0.3);
  doc.line(PAGE.margin, h - PAGE.footerH, w - PAGE.margin, h - PAGE.footerH);

  setText(doc, BRAND.muted);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('RPRx 4 Life · Educational use only', PAGE.margin, h - 6);
  const pg = `Page ${pageNum} of ${totalPages}`;
  doc.text(pg, w - PAGE.margin - doc.getTextWidth(pg), h - 6);
}

function ensureSpace(doc: jsPDF, y: number, needed: number, plan: SavedPlan): number {
  const h = doc.internal.pageSize.getHeight();
  if (y + needed > h - PAGE.footerH - 4) {
    doc.addPage();
    drawHeader(doc, plan);
    return PAGE.headerH + 10;
  }
  return y;
}

// ---------- Building blocks ----------
function metaPills(doc: jsPDF, items: { label: string; value: string }[], x: number, y: number, maxWidth: number): number {
  if (items.length === 0) return y;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  let cx = x;
  let cy = y;
  const padX = 4;
  const padY = 2;
  const gap = 5;
  const lineH = 9;

  for (const item of items) {
    const text = `${item.label}: ${item.value}`;
    const tw = doc.getTextWidth(text);
    const pw = tw + padX * 2;
    if (cx + pw > x + maxWidth) {
      cx = x;
      cy += lineH;
    }
    setFill(doc, BRAND.surfaceAlt);
    setDraw(doc, BRAND.hairline);
    doc.setLineWidth(0.3);
    doc.roundedRect(cx, cy - 5, pw, 6.5, 1.5, 1.5, 'FD');
    setText(doc, BRAND.primaryDark);
    doc.text(text, cx + padX, cy - 0.5);
    cx += pw + gap;
  }
  return cy + 4;
}

function sectionHeader(doc: jsPDF, title: string, y: number, color: [number, number, number] = BRAND.primary): number {
  const w = doc.internal.pageSize.getWidth();
  // bar
  setFill(doc, color);
  doc.rect(PAGE.margin, y, 2.2, 6.5, 'F');
  setText(doc, BRAND.ink);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(title, PAGE.margin + 5, y + 5);
  // hairline under
  setDraw(doc, BRAND.hairline);
  doc.setLineWidth(0.3);
  doc.line(PAGE.margin, y + 9, w - PAGE.margin, y + 9);
  bodyDefaults(doc);
  return y + 14;
}

function paragraph(doc: jsPDF, text: string, y: number, plan: SavedPlan, opts?: { italic?: boolean; color?: [number, number, number]; size?: number }): number {
  const w = doc.internal.pageSize.getWidth();
  const maxW = w - PAGE.margin * 2;
  doc.setFont('helvetica', opts?.italic ? 'italic' : 'normal');
  doc.setFontSize(opts?.size ?? 10);
  setText(doc, opts?.color ?? BRAND.body);
  const lines = doc.splitTextToSize(text, maxW);
  for (const line of lines) {
    y = ensureSpace(doc, y, 6, plan);
    doc.text(line, PAGE.margin, y);
    y += 5;
  }
  return y + 2;
}

function bulletList(doc: jsPDF, items: string[], y: number, plan: SavedPlan, bulletColor: [number, number, number] = BRAND.primary): number {
  const w = doc.internal.pageSize.getWidth();
  const maxW = w - PAGE.margin * 2 - 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  for (const item of items) {
    const lines = doc.splitTextToSize(item, maxW);
    const blockH = lines.length * 5 + 1;
    y = ensureSpace(doc, y, blockH, plan);
    setFill(doc, bulletColor);
    doc.circle(PAGE.margin + 1.5, y - 1.5, 0.9, 'F');
    setText(doc, BRAND.body);
    doc.text(lines, PAGE.margin + 6, y);
    y += blockH;
  }
  return y + 2;
}

function checkbox(doc: jsPDF, x: number, y: number, checked: boolean) {
  const size = 4;
  setDraw(doc, checked ? BRAND.accent : BRAND.muted);
  setFill(doc, checked ? BRAND.accent : BRAND.white);
  doc.setLineWidth(0.5);
  doc.roundedRect(x, y - size + 0.5, size, size, 0.6, 0.6, 'FD');
  if (checked) {
    setDraw(doc, BRAND.white);
    doc.setLineWidth(0.7);
    doc.line(x + 0.8, y - 1.4, x + 1.7, y - 0.5);
    doc.line(x + 1.7, y - 0.5, x + 3.3, y - 2.8);
  }
}

function expectedResultCard(doc: jsPDF, content: PlanContent, y: number, plan: SavedPlan): number {
  const er = content.expected_result;
  if (!er && !content.savings) return y;

  const w = doc.internal.pageSize.getWidth();
  const cardW = w - PAGE.margin * 2;
  const cardX = PAGE.margin;
  const colW = cardW / 3;
  const cardH = 22;

  y = ensureSpace(doc, y, cardH + 4, plan);

  setFill(doc, BRAND.surfaceAlt);
  setDraw(doc, BRAND.hairline);
  doc.setLineWidth(0.3);
  doc.roundedRect(cardX, y, cardW, cardH, 2, 2, 'FD');

  const cells = [
    { label: 'Impact Range', value: er?.impact_range || content.savings || '—' },
    { label: 'First Win', value: er?.first_win_timeline || '—' },
    { label: 'Confidence', value: er?.confidence_note || '—' },
  ];

  cells.forEach((cell, i) => {
    const cx = cardX + colW * i;
    if (i > 0) {
      setDraw(doc, BRAND.hairline);
      doc.setLineWidth(0.3);
      doc.line(cx, y + 4, cx, y + cardH - 4);
    }
    setText(doc, BRAND.muted);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text(cell.label.toUpperCase(), cx + 4, y + 7);

    setText(doc, BRAND.ink);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(cell.value, colW - 8);
    doc.text(lines.slice(0, 2), cx + 4, y + 13);
  });

  bodyDefaults(doc);
  return y + cardH + 6;
}

function stepsBlock(doc: jsPDF, content: PlanContent, y: number, plan: SavedPlan): number {
  if (!content.steps || content.steps.length === 0) return y;
  const w = doc.internal.pageSize.getWidth();
  const maxW = w - PAGE.margin * 2;
  const completed = content.completedSteps || [];

  content.steps.forEach((step, idx) => {
    const isDone = completed.includes(idx);
    const structured = isStructuredStep(step);
    const title = structured ? step.title : (typeof step === 'string' ? step : String(step));
    const instruction = structured ? step.instruction : '';
    const time = structured ? step.time_estimate : '';
    const done = structured ? step.done_definition : '';

    // measure
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    const titleLines = doc.splitTextToSize(`${idx + 1}. ${title}`, maxW - 14);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    const instrLines = instruction ? doc.splitTextToSize(instruction, maxW - 14) : [];
    const doneLines = done ? doc.splitTextToSize(`Done when: ${done}`, maxW - 14) : [];
    const metaH = (time || done) ? 5 : 0;
    const cardH = 6 + titleLines.length * 5.2 + (instrLines.length ? instrLines.length * 4.8 + 2 : 0) + (doneLines.length ? doneLines.length * 4.5 + 2 : 0) + metaH + 4;

    y = ensureSpace(doc, y, cardH + 3, plan);

    // card
    setFill(doc, BRAND.surface);
    setDraw(doc, BRAND.hairline);
    doc.setLineWidth(0.3);
    doc.roundedRect(PAGE.margin, y, maxW, cardH, 2, 2, 'FD');

    // checkbox
    checkbox(doc, PAGE.margin + 4, y + 7, isDone);

    // title
    setText(doc, isDone ? BRAND.muted : BRAND.ink);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.text(titleLines, PAGE.margin + 12, y + 7);

    let cy = y + 7 + titleLines.length * 5.2;

    // instruction
    if (instrLines.length) {
      setText(doc, BRAND.body);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.text(instrLines, PAGE.margin + 12, cy + 1);
      cy += instrLines.length * 4.8 + 2;
    }

    // time pill
    if (time) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      const t = `⏱  ${time}`.replace('⏱', '~'); // helvetica lacks the icon
      const label = `~ ${time}`;
      const tw = doc.getTextWidth(label) + 6;
      setFill(doc, BRAND.surfaceAlt);
      doc.roundedRect(PAGE.margin + 12, cy, tw, 5, 1.2, 1.2, 'F');
      setText(doc, BRAND.primaryDark);
      doc.text(label, PAGE.margin + 15, cy + 3.6);
      cy += 6;
    }

    // done definition
    if (doneLines.length) {
      setText(doc, BRAND.muted);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8.5);
      doc.text(doneLines, PAGE.margin + 12, cy + 2);
      cy += doneLines.length * 4.5 + 2;
    }

    y += cardH + 3;
    bodyDefaults(doc);
  });

  return y + 2;
}

// ---------- Main PDF export ----------
export function exportPlanAsPDF(plan: SavedPlan): void {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const content = plan.content;
  const w = doc.internal.pageSize.getWidth();

  drawHeader(doc, plan);
  let y = PAGE.headerH + 10;

  // Title block
  setText(doc, BRAND.ink);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  const titleLines = doc.splitTextToSize(plan.title, w - PAGE.margin * 2);
  doc.text(titleLines, PAGE.margin, y + 2);
  y += titleLines.length * 8;

  setText(doc, BRAND.muted);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(plan.strategy_name, PAGE.margin, y + 4);
  y += 8;

  // Meta pills
  const pills: { label: string; value: string }[] = [];
  if (content.horseman?.length) pills.push({ label: 'Focus', value: content.horseman.join(' · ') });
  if (content.complexity) pills.push({ label: 'Complexity', value: `${content.complexity}/5` });
  if (content.taxReference) pills.push({ label: 'Tax Ref', value: content.taxReference });
  pills.push({ label: 'Updated', value: new Date(plan.updated_at).toLocaleDateString() });
  y = metaPills(doc, pills, PAGE.margin, y + 4, w - PAGE.margin * 2);
  y += 2;

  // Summary
  if (content.summary) {
    y = sectionHeader(doc, 'Summary', y);
    y = paragraph(doc, content.summary, y, plan);
  }

  // Expected Result card
  if (content.expected_result || content.savings) {
    y = sectionHeader(doc, 'Expected Result', y);
    y = expectedResultCard(doc, content, y, plan);
  }

  // Before You Start
  if (content.before_you_start?.length) {
    y = sectionHeader(doc, 'Before You Start', y);
    y = bulletList(doc, content.before_you_start, y, plan, BRAND.primary);
  }

  // Requirements (legacy)
  if (content.requirements && !content.before_you_start?.length) {
    y = sectionHeader(doc, 'Requirements', y);
    y = paragraph(doc, content.requirements, y, plan);
  }

  // Steps
  if (content.steps?.length) {
    y = sectionHeader(doc, 'Step-by-Step Plan', y);
    y = stepsBlock(doc, content, y, plan);
  }

  // Risks
  if (content.risks_and_mistakes_to_avoid?.length) {
    y = sectionHeader(doc, 'Risks & Mistakes to Avoid', y, BRAND.danger);
    y = bulletList(doc, content.risks_and_mistakes_to_avoid, y, plan, BRAND.danger);
  }

  // Advisor packet
  if (content.advisor_packet?.length) {
    y = sectionHeader(doc, 'Advisor Packet', y, BRAND.warn);
    y = bulletList(doc, content.advisor_packet, y, plan, BRAND.warn);
  }

  // Personal notes
  if (plan.notes) {
    y = sectionHeader(doc, 'Personal Notes', y);
    y = paragraph(doc, plan.notes, y, plan);
  }

  // Disclaimer
  const disclaimer = content.disclaimer || 'Educational information only. Consult a qualified professional before implementation.';
  y = ensureSpace(doc, y + 2, 14, plan);
  setDraw(doc, BRAND.hairline);
  doc.setLineWidth(0.3);
  doc.line(PAGE.margin, y, w - PAGE.margin, y);
  y += 4;
  y = paragraph(doc, disclaimer, y, plan, { italic: true, color: BRAND.muted, size: 8.5 });

  // Footers on every page
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    drawFooter(doc, i, total);
  }

  const filename = `${plan.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_plan.pdf`;
  doc.save(filename);
}

// ---------- Markdown export (kept, polished) ----------
export function exportPlanAsMarkdown(plan: SavedPlan): string {
  const c = plan.content;
  const out: string[] = [];
  out.push(`# ${plan.title}`, '');
  out.push(`**Strategy:** ${plan.strategy_name}  `);
  out.push(`**Status:** ${formatStatus(plan.status)}  `);
  out.push(`**Updated:** ${new Date(plan.updated_at).toLocaleDateString()}`, '');

  if (c.horseman?.length) out.push(`**Focus:** ${c.horseman.join(', ')}  `);
  if (c.complexity) out.push(`**Complexity:** ${c.complexity}/5  `);
  if (c.taxReference) out.push(`**Tax Reference:** ${c.taxReference}  `);
  out.push('');

  if (c.summary) { out.push('## Summary', '', c.summary, ''); }

  if (c.expected_result || c.savings) {
    out.push('## Expected Result', '');
    if (c.expected_result) {
      out.push(`- **Impact Range:** ${c.expected_result.impact_range}`);
      out.push(`- **First Win:** ${c.expected_result.first_win_timeline}`);
      out.push(`- **Confidence:** ${c.expected_result.confidence_note}`);
    } else if (c.savings) {
      out.push(`- **Potential Savings:** ${c.savings}`);
    }
    out.push('');
  }

  if (c.before_you_start?.length) {
    out.push('## Before You Start', '');
    c.before_you_start.forEach(i => out.push(`- ${i}`));
    out.push('');
  }

  if (c.steps?.length) {
    out.push('## Step-by-Step Plan', '');
    const completed = c.completedSteps || [];
    c.steps.forEach((step, idx) => {
      const done = completed.includes(idx);
      if (isStructuredStep(step)) {
        out.push(`${idx + 1}. [${done ? 'x' : ' '}] **${step.title}**`);
        if (step.instruction) out.push(`   - ${step.instruction}`);
        if (step.time_estimate) out.push(`   - _Estimated time:_ ${step.time_estimate}`);
        if (step.done_definition) out.push(`   - _Done when:_ ${step.done_definition}`);
      } else {
        out.push(`${idx + 1}. [${done ? 'x' : ' '}] ${String(step)}`);
      }
    });
    out.push('');
  }

  if (c.risks_and_mistakes_to_avoid?.length) {
    out.push('## Risks & Mistakes to Avoid', '');
    c.risks_and_mistakes_to_avoid.forEach(i => out.push(`- ${i}`));
    out.push('');
  }

  if (c.advisor_packet?.length) {
    out.push('## Advisor Packet', '');
    c.advisor_packet.forEach(i => out.push(`- ${i}`));
    out.push('');
  }

  if (plan.notes) { out.push('## Personal Notes', '', plan.notes, ''); }

  out.push('---', '');
  out.push(`_${c.disclaimer || 'Educational information only. Consult a qualified professional before implementation.'}_`);
  return out.join('\n');
}

export function downloadMarkdown(plan: SavedPlan): void {
  const md = exportPlanAsMarkdown(plan);
  const blob = new Blob([md], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${plan.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_plan.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
