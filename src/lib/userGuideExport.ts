import { jsPDF } from 'jspdf';
import type { UserGuideSection } from '@/hooks/useUserGuide';

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/^#+\s+/gm, '')
    .replace(/^[-*]\s+/gm, '• ')
    .replace(/^\d+\.\s+/gm, (m) => m);
}

function checkPageBreak(doc: jsPDF, y: number, needed: number): number {
  if (y + needed > doc.internal.pageSize.getHeight() - 30) {
    doc.addPage();
    return 30;
  }
  return y;
}

export function exportUserGuidePDF(sections: UserGuideSection[]): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const maxWidth = pageWidth - margin * 2;
  const pageHeight = doc.internal.pageSize.getHeight();

  // --- Title Page ---
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('RPRx For Life', pageWidth / 2, pageHeight / 2 - 30, { align: 'center' });

  doc.setFontSize(18);
  doc.setFont('helvetica', 'normal');
  doc.text('User Guide', pageWidth / 2, pageHeight / 2 - 10, { align: 'center' });

  doc.setFontSize(11);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated ${new Date().toLocaleDateString()}`, pageWidth / 2, pageHeight / 2 + 10, { align: 'center' });
  doc.setTextColor(0, 0, 0);

  // --- Table of Contents ---
  doc.addPage();
  let y = 30;
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Table of Contents', margin, y);
  y += 12;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  sections.forEach((section, idx) => {
    y = checkPageBreak(doc, y, 8);
    doc.text(`${idx + 1}. ${section.title}`, margin + 5, y);
    y += 7;
  });

  // --- Content Sections ---
  sections.forEach((section) => {
    doc.addPage();
    y = 30;

    // Section title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    const titleLines = doc.splitTextToSize(section.title, maxWidth);
    doc.text(titleLines, margin, y);
    y += titleLines.length * 8 + 6;

    // Section body
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const plainText = stripMarkdown(section.body);
    const paragraphs = plainText.split('\n');

    for (const paragraph of paragraphs) {
      if (!paragraph.trim()) {
        y += 4;
        continue;
      }
      y = checkPageBreak(doc, y, 12);
      const lines = doc.splitTextToSize(paragraph, maxWidth);
      doc.text(lines, margin, y);
      y += lines.length * 5 + 3;
    }
  });

  // Footer on each page
  const totalPages = doc.getNumberOfPages();
  for (let i = 2; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`RPRx For Life User Guide — Page ${i - 1}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    doc.setTextColor(0, 0, 0);
  }

  doc.save('RPRx_User_Guide.pdf');
}
