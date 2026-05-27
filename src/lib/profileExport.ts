// Profile export — builds a clean snapshot of the user's profile answers
// and renders it as PDF or CSV. Respects admin field visibility settings.

import { jsPDF } from 'jspdf';
import {
  PROFILE_TYPES,
  FINANCIAL_GOALS,
  FILING_STATUSES,
} from './profileTypes';

const EMPLOYER_MATCH_LABELS: Record<string, string> = {
  yes: 'Yes — gets the full match',
  no: "No — leaving match money behind",
  not_sure: 'Not sure',
  na: "Employer doesn't offer a match",
};

const TAX_ACCOUNT_LABELS: Record<string, string> = {
  '401k': '401(k) / 403(b)',
  ira: 'Traditional IRA',
  roth_ira: 'Roth IRA',
  hsa: 'HSA',
  fsa: 'FSA',
  '529': '529 Plan',
  none: "Doesn't contribute to any",
};

const STRESS_WORRY_LABELS: Record<string, string> = {
  never: 'Never',
  rarely: 'Rarely',
  sometimes: 'Sometimes',
  often: 'Often',
  constantly: 'Constantly',
};

const STRESS_CONFIDENCE_LABELS: Record<string, string> = {
  very_confident: 'Very confident',
  somewhat: 'Somewhat confident',
  not_confident: 'Not confident',
  couldnt: "Couldn't handle it",
};

const STRESS_CONTROL_LABELS: Record<string, string> = {
  fully: 'Fully in control',
  mostly: 'Mostly in control',
  somewhat: 'Somewhat in control',
  not_at_all: 'Not in control',
};

export interface ProfileExportRow {
  section: string;
  label: string;
  value: string;
}

export interface ProfileExportUser {
  email?: string | null;
  fullName?: string | null;
}

type AnyProfile = Record<string, any> | null | undefined;
type IsVisibleFn = (key: string) => boolean;

function fmtCurrency(n: number | null | undefined): string {
  if (n == null || isNaN(n as number)) return '';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Number(n));
}

function labelFor(opts: Record<string, string>, value: string | null | undefined): string {
  if (!value) return '';
  return opts[value] || value;
}

function multiLabels(opts: readonly { value: string; label: string }[], values: string[] | null | undefined): string {
  if (!values || values.length === 0) return '';
  return values
    .map((v) => opts.find((o) => o.value === v)?.label || v)
    .join(', ');
}

function push(rows: ProfileExportRow[], section: string, label: string, value: string | number | null | undefined) {
  if (value == null || value === '' || (typeof value === 'string' && !value.trim())) return;
  rows.push({ section, label, value: String(value) });
}

/**
 * Build the ordered list of export rows from the profile, gated by admin
 * visibility settings. Empty fields are skipped automatically.
 */
export function buildProfileExportRows(
  profile: AnyProfile,
  isVisible: IsVisibleFn,
  user?: ProfileExportUser,
): ProfileExportRow[] {
  const rows: ProfileExportRow[] = [];
  if (!profile) return rows;

  // Personal Information
  if (isVisible('full_name')) push(rows, 'Personal Information', 'Full Name', user?.fullName || profile.full_name);
  push(rows, 'Personal Information', 'Email', user?.email);
  if (isVisible('phone')) push(rows, 'Personal Information', 'Phone', profile.phone);
  push(rows, 'Personal Information', 'Company', profile.company);

  // About You
  if (isVisible('profile_type')) {
    push(rows, 'About You', 'I am a', multiLabels(PROFILE_TYPES, profile.profile_type));
  }
  if (isVisible('filing_status')) {
    push(rows, 'About You', 'Filing Status', FILING_STATUSES.find((f) => f.value === profile.filing_status)?.label || '');
  }
  if (isVisible('num_children')) push(rows, 'About You', 'Number of Children', profile.num_children);
  if (isVisible('children_ages') && Array.isArray(profile.children_ages) && profile.children_ages.length > 0) {
    push(rows, 'About You', "Children's Ages", profile.children_ages.join(', '));
  }
  if (isVisible('financial_goals')) {
    push(rows, 'About You', 'Financial Goals', multiLabels(FINANCIAL_GOALS, profile.financial_goals));
  }

  // Cash Flow
  if (isVisible('monthly_income')) push(rows, 'Monthly Cash Flow', 'Monthly Income', fmtCurrency(profile.monthly_income));
  if (isVisible('monthly_housing')) push(rows, 'Monthly Cash Flow', 'Housing', fmtCurrency(profile.monthly_housing));
  if (isVisible('monthly_debt_payments')) push(rows, 'Monthly Cash Flow', 'Debt Payments', fmtCurrency(profile.monthly_debt_payments));
  if (isVisible('monthly_insurance')) push(rows, 'Monthly Cash Flow', 'Insurance', fmtCurrency(profile.monthly_insurance));
  if (isVisible('monthly_living_expenses')) push(rows, 'Monthly Cash Flow', 'Living Expenses', fmtCurrency(profile.monthly_living_expenses));

  // Retirement
  if (isVisible('years_until_retirement')) push(rows, 'Retirement', 'Years Until Retirement', profile.years_until_retirement);
  if (isVisible('desired_retirement_income')) push(rows, 'Retirement', 'Desired Annual Retirement Income', fmtCurrency(profile.desired_retirement_income));
  if (isVisible('retirement_balance_total')) push(rows, 'Retirement', 'Total Retirement Balance', fmtCurrency(profile.retirement_balance_total));
  if (isVisible('retirement_contribution_monthly')) push(rows, 'Retirement', 'Monthly Contribution', fmtCurrency(profile.retirement_contribution_monthly));

  // Insurance coverage
  const insuranceItems: string[] = [];
  if (isVisible('health_insurance') && profile.health_insurance) insuranceItems.push('Health');
  if (isVisible('life_insurance') && profile.life_insurance) insuranceItems.push('Life');
  if (isVisible('disability_insurance') && profile.disability_insurance) insuranceItems.push('Disability');
  if (isVisible('long_term_care_insurance') && profile.long_term_care_insurance) insuranceItems.push('Long-Term Care');
  if (isVisible('no_insurance') && profile.no_insurance) insuranceItems.push('No insurance');
  if (insuranceItems.length > 0) {
    push(rows, 'Insurance Coverage', 'Current Coverage', insuranceItems.join(', '));
  }

  // RPRx core fields
  if (isVisible('emergency_fund_balance')) push(rows, 'Financial Health', 'Emergency Fund Balance', fmtCurrency(profile.emergency_fund_balance));
  if (isVisible('employer_match_captured')) push(rows, 'Financial Health', 'Employer 401(k) Match', labelFor(EMPLOYER_MATCH_LABELS, profile.employer_match_captured));
  if (isVisible('tax_advantaged_accounts') && Array.isArray(profile.tax_advantaged_accounts) && profile.tax_advantaged_accounts.length > 0) {
    push(
      rows,
      'Financial Health',
      'Tax-Advantaged Accounts',
      profile.tax_advantaged_accounts.map((v: string) => TAX_ACCOUNT_LABELS[v] || v).join(', '),
    );
  }

  // Stress / wellbeing
  if (isVisible('stress_money_worry')) push(rows, 'Financial Wellbeing', 'How often money is on your mind', labelFor(STRESS_WORRY_LABELS, profile.stress_money_worry));
  if (isVisible('stress_emergency_confidence')) push(rows, 'Financial Wellbeing', 'Confidence in an emergency', labelFor(STRESS_CONFIDENCE_LABELS, profile.stress_emergency_confidence));
  if (isVisible('stress_control_feeling')) push(rows, 'Financial Wellbeing', 'Feeling of control over finances', labelFor(STRESS_CONTROL_LABELS, profile.stress_control_feeling));

  return rows;
}

// ----------------- PDF -----------------

const BRAND = {
  primaryDark: [30, 64, 175] as [number, number, number],
  accent: [16, 185, 129] as [number, number, number],
  ink: [17, 24, 39] as [number, number, number],
  body: [55, 65, 81] as [number, number, number],
  muted: [107, 114, 128] as [number, number, number],
  hairline: [229, 231, 235] as [number, number, number],
  surface: [249, 250, 251] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
};

const PAGE = { margin: 18, headerH: 28, footerH: 14 };

function setFill(doc: jsPDF, c: [number, number, number]) { doc.setFillColor(c[0], c[1], c[2]); }
function setDraw(doc: jsPDF, c: [number, number, number]) { doc.setDrawColor(c[0], c[1], c[2]); }
function setText(doc: jsPDF, c: [number, number, number]) { doc.setTextColor(c[0], c[1], c[2]); }

function drawHeader(doc: jsPDF, subtitle: string) {
  const w = doc.internal.pageSize.getWidth();
  setFill(doc, BRAND.primaryDark);
  doc.rect(0, 0, w, PAGE.headerH, 'F');
  setFill(doc, BRAND.accent);
  doc.rect(0, PAGE.headerH, w, 1.2, 'F');
  setText(doc, BRAND.white);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('RPRx 4 Life', PAGE.margin, 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  setText(doc, [199, 210, 254]);
  doc.text(subtitle, PAGE.margin, 18);
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
  doc.text('RPRx 4 Life · Educational use only. Not financial advice.', PAGE.margin, h - 6);
  const pg = `Page ${pageNum} of ${totalPages}`;
  doc.text(pg, w - PAGE.margin - doc.getTextWidth(pg), h - 6);
}

function ensureSpace(doc: jsPDF, y: number, needed: number, subtitle: string): number {
  const h = doc.internal.pageSize.getHeight();
  if (y + needed > h - PAGE.footerH - 4) {
    doc.addPage();
    drawHeader(doc, subtitle);
    return PAGE.headerH + 10;
  }
  return y;
}

export function buildProfilePDF(rows: ProfileExportRow[], user?: ProfileExportUser): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const w = doc.internal.pageSize.getWidth();
  const subtitle = 'Profile Summary';

  drawHeader(doc, subtitle);
  let y = PAGE.headerH + 10;

  // Title block
  setText(doc, BRAND.ink);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('Your Profile Snapshot', PAGE.margin, y + 2);
  y += 9;

  setText(doc, BRAND.muted);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const metaParts: string[] = [];
  if (user?.fullName) metaParts.push(user.fullName);
  if (user?.email) metaParts.push(user.email);
  metaParts.push(`Generated ${new Date().toLocaleDateString()}`);
  doc.text(metaParts.join('  ·  '), PAGE.margin, y + 4);
  y += 10;

  if (rows.length === 0) {
    setText(doc, BRAND.muted);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(11);
    doc.text('No profile information has been filled in yet.', PAGE.margin, y + 6);
  } else {
    // Group by section in original order
    const sections: { name: string; items: ProfileExportRow[] }[] = [];
    const map = new Map<string, ProfileExportRow[]>();
    for (const r of rows) {
      if (!map.has(r.section)) {
        const arr: ProfileExportRow[] = [];
        map.set(r.section, arr);
        sections.push({ name: r.section, items: arr });
      }
      map.get(r.section)!.push(r);
    }

    const labelW = 70;
    const colGap = 4;
    const valueX = PAGE.margin + labelW + colGap;
    const valueW = w - valueX - PAGE.margin;

    for (const section of sections) {
      y = ensureSpace(doc, y, 16, subtitle);
      // Section header
      setFill(doc, BRAND.primaryDark);
      doc.rect(PAGE.margin, y, 2.2, 6.5, 'F');
      setText(doc, BRAND.ink);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(section.name, PAGE.margin + 5, y + 5);
      setDraw(doc, BRAND.hairline);
      doc.setLineWidth(0.3);
      doc.line(PAGE.margin, y + 9, w - PAGE.margin, y + 9);
      y += 13;

      for (const item of section.items) {
        const valueLines = doc.splitTextToSize(item.value, valueW);
        const rowH = Math.max(6, valueLines.length * 5) + 2;
        y = ensureSpace(doc, y, rowH + 1, subtitle);

        setText(doc, BRAND.muted);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        const labelLines = doc.splitTextToSize(item.label, labelW);
        doc.text(labelLines, PAGE.margin, y + 4);

        setText(doc, BRAND.body);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(valueLines, valueX, y + 4);

        y += Math.max(rowH, labelLines.length * 5);
      }
      y += 4;
    }
  }

  // Disclaimer
  y = ensureSpace(doc, y + 2, 14, subtitle);
  setDraw(doc, BRAND.hairline);
  doc.setLineWidth(0.3);
  doc.line(PAGE.margin, y, w - PAGE.margin, y);
  y += 4;
  setText(doc, BRAND.muted);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8.5);
  const disc = doc.splitTextToSize(
    'Generated by RPRx 4 Life. Educational information only. Not formal financial, tax, or legal advice.',
    w - PAGE.margin * 2,
  );
  doc.text(disc, PAGE.margin, y);

  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    drawFooter(doc, i, total);
  }
  return doc;
}

export function exportProfileAsPDF(rows: ProfileExportRow[], user?: ProfileExportUser): void {
  const doc = buildProfilePDF(rows, user);
  const slug = (user?.fullName || user?.email || 'profile')
    .replace(/[^a-z0-9]/gi, '_')
    .toLowerCase();
  doc.save(`${slug}_profile.pdf`);
}

// ----------------- CSV -----------------

function csvEscape(s: string): string {
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function exportProfileAsCSV(rows: ProfileExportRow[], user?: ProfileExportUser): void {
  const lines: string[] = [];
  lines.push(['Section', 'Field', 'Value'].map(csvEscape).join(','));
  if (user?.fullName) lines.push(['Account', 'Name', user.fullName].map(csvEscape).join(','));
  if (user?.email) lines.push(['Account', 'Email', user.email].map(csvEscape).join(','));
  lines.push(['Account', 'Generated', new Date().toLocaleString()].map(csvEscape).join(','));
  for (const r of rows) {
    lines.push([r.section, r.label, r.value].map(csvEscape).join(','));
  }
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const slug = (user?.fullName || user?.email || 'profile')
    .replace(/[^a-z0-9]/gi, '_')
    .toLowerCase();
  a.href = url;
  a.download = `${slug}_profile.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
