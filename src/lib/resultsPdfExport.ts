import { jsPDF } from 'jspdf';
import type { HorsemanScores, HorsemanType } from './scoringEngine';
import type { CashFlowStatus } from './cashFlowCalculator';
import { getFeedback, compoundingExplanation } from './feedbackEngine';

const HORSEMAN_LABEL: Record<HorsemanType, string> = {
  interest: 'Interest & Debt',
  taxes: 'Taxes',
  insurance: 'Insurance',
  education: 'Education',
};

const CASH_FLOW_LABEL: Record<CashFlowStatus, string> = {
  surplus: 'Surplus — income exceeds expenses',
  tight: 'Tight — income just covers expenses',
  deficit: 'Deficit — expenses exceed income',
};

interface ExportArgs {
  scores: HorsemanScores;
  primaryHorseman: HorsemanType;
  cashFlowStatus: CashFlowStatus | null;
  assessmentDate?: string;
}

export function exportResultsPdf({ scores, primaryHorseman, cashFlowStatus, assessmentDate }: ExportArgs) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 18;
  const maxW = pageW - margin * 2;
  let y = margin;

  // Header band
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, pageW, 22, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('RPRx Assessment Results', margin, 14);
  y = 30;

  doc.setTextColor(107, 114, 128);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const dateStr = assessmentDate
    ? new Date(assessmentDate).toLocaleDateString()
    : new Date().toLocaleDateString();
  doc.text(`Generated ${dateStr}`, margin, y);
  y += 10;

  // Section: Four Horsemen Scores
  doc.setTextColor(17, 24, 39);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('The Four Horsemen Scores', margin, y);
  y += 7;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(55, 65, 81);
  (['interest', 'taxes', 'insurance', 'education'] as HorsemanType[]).forEach((h) => {
    const isPrimary = h === primaryHorseman;
    const label = `${HORSEMAN_LABEL[h]}: ${scores[h]} / 100${isPrimary ? '   (Primary pressure)' : ''}`;
    if (isPrimary) doc.setFont('helvetica', 'bold');
    doc.text(label, margin, y);
    if (isPrimary) doc.setFont('helvetica', 'normal');
    y += 7;
  });
  y += 4;

  // Section: Cash Flow
  if (cashFlowStatus) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(17, 24, 39);
    doc.text('Cash Flow Status', margin, y);
    y += 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(55, 65, 81);
    doc.text(CASH_FLOW_LABEL[cashFlowStatus], margin, y);
    y += 10;
  }

  // Section: Diagnostic
  const feedback = getFeedback(primaryHorseman);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(17, 24, 39);
  doc.text(feedback.title, margin, y, { maxWidth: maxW });
  y += 7;

  const blocks: { heading?: string; text: string }[] = [
    { text: feedback.intro },
    { heading: 'What This Means', text: feedback.whatItMeans },
    { heading: 'Why It Matters', text: feedback.whyItMatters },
  ];

  doc.setFontSize(11);
  blocks.forEach((b) => {
    if (b.heading) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(17, 24, 39);
      y = ensure(doc, y, 8);
      doc.text(b.heading, margin, y);
      y += 6;
    }
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(55, 65, 81);
    const lines = doc.splitTextToSize(b.text, maxW) as string[];
    lines.forEach((line) => {
      y = ensure(doc, y, 6);
      doc.text(line, margin, y);
      y += 5.5;
    });
    y += 3;
  });

  // Compounding
  y = ensure(doc, y, 20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(17, 24, 39);
  doc.setFontSize(13);
  doc.text(compoundingExplanation.title, margin, y);
  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(55, 65, 81);
  const compLines = doc.splitTextToSize(compoundingExplanation.content, maxW) as string[];
  compLines.forEach((line) => {
    y = ensure(doc, y, 6);
    doc.text(line, margin, y);
    y += 5.5;
  });

  // Footer disclaimer on last page
  const pageH = doc.internal.pageSize.getHeight();
  doc.setFontSize(8);
  doc.setTextColor(156, 163, 175);
  doc.text(
    'RPRx For Life — Educational diagnostic. Not formal financial, tax, or legal advice.',
    margin,
    pageH - 8,
  );

  const filename = `rprx-results-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}

function ensure(doc: jsPDF, y: number, needed: number): number {
  const pageH = doc.internal.pageSize.getHeight();
  if (y + needed > pageH - 18) {
    doc.addPage();
    return 20;
  }
  return y;
}
