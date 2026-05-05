import jsPDF from 'jspdf';
import { Persona, BasicProfile, HealthHabits, Screenings, Goals, Contact } from '@/store/healthAssessmentStore';
import { HealthScore } from './scoring';

interface AssessmentData {
  persona: Persona | null;
  basicProfile: Partial<BasicProfile>;
  healthHabits: Partial<HealthHabits>;
  screenings: Partial<Screenings>;
  goals: Partial<Goals>;
  contact: Partial<Contact>;
}

export async function generatePDF(store: AssessmentData, scores: HealthScore) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const addText = (text: string, x: number, yPos: number, options: any = {}) => {
    const lines = doc.splitTextToSize(text, contentWidth);
    doc.text(lines, x, yPos, options);
    return yPos + lines.length * 7;
  };

  doc.setFillColor(1, 129, 138);
  doc.rect(0, 0, pageWidth, 40, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('RPRx Health Assessment', pageWidth / 2, 20, { align: 'center' });
  doc.setFontSize(12);
  doc.text('Your Personalized Health Summary', pageWidth / 2, 30, { align: 'center' });

  y = 50;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  y = addText(`Name: ${store.contact?.firstName || ''} ${store.contact?.lastName || ''}`, margin, y);
  y = addText(`Date: ${new Date().toLocaleDateString()}`, margin, y);
  y = addText(`Email: ${store.contact?.email || ''}`, margin, y);
  if (store.basicProfile?.age) y = addText(`Age: ${store.basicProfile.age}`, margin, y);
  y += 10;

  doc.setFillColor(240, 248, 255);
  doc.rect(margin, y, contentWidth, 50, 'F');
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  y += 10;
  doc.text('Your Health Scores', margin + 5, y);
  doc.setFontSize(11);
  y += 10;
  doc.text(`Current RPRx Health Score: ${scores.current}/100`, margin + 5, y);
  y += 10;
  doc.text(`RPRx Improvement Potential: +${scores.improvement} points`, margin + 5, y);
  y += 15;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  y = addText('Health Status & Readiness', margin, y);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  const readinessMessages = {
    great: 'Great Foundation - You have a solid health foundation. Fine-tuning your approach can optimize your results.',
    high: 'High Potential - You have significant opportunities for rapid health improvement with the right support.',
    critical: 'Critical Gaps - Immediate attention to key health areas is recommended to prevent future complications.',
  };
  y = addText(readinessMessages[scores.readiness], margin, y + 5);
  y += 10;

  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  y = addText('IMPORTANT DISCLAIMER: This assessment is for educational and informational purposes only and does not constitute medical advice. Always consult with your physician before making decisions about your health.', margin, y);

  doc.save(`RPRx-Health-Assessment-${store.contact?.lastName || 'Report'}.pdf`);
}
