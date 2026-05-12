import { downloadCSV } from './csvExport';

export type GhlMappingRow = {
  profile_field: string;
  ghl_target_type: string;
  ghl_field_key: string;
  transform: string;
  is_active: boolean;
  notes: string | null;
};

const NUMBER_FIELDS = /^(monthly_|num_|years_|estimated_|retirement_|desired_|emergency_fund|total_points|current_streak|longest_streak|rprx_score)/;
const ARRAY_FIELDS = new Set([
  'financial_goals', 'tax_advantaged_accounts', 'profile_type',
  'children_ages', 'motivation_images',
]);
const HORSEMEN = ['interest', 'taxes', 'insurance', 'education'];

export function humanizeKey(key: string): string {
  return key
    .replace(/[_-]+/g, ' ')
    .replace(/\brprx\b/gi, 'RPRx')
    .replace(/\bghl\b/gi, 'GHL')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function inferGhlFieldType(row: GhlMappingRow): string {
  const t = (row.transform || 'none').toLowerCase();
  const f = (row.profile_field || '').toLowerCase();
  if (t === 'boolean_yesno') return 'Checkbox (Yes/No)';
  if (t === 'number' || NUMBER_FIELDS.test(f)) return 'Number';
  if (t === 'join_comma' || ARRAY_FIELDS.has(f)) return 'Multi Line Text (comma-separated)';
  if (f.endsWith('_date') || f === 'last_active_date') return 'Date';
  if (f === 'filing_status' || f.endsWith('_horseman') || f === 'recommended_track' || f === 'readiness_label' || f === 'current_tier' || f === 'rprx_grade' || f === 'company_role' || f === 'employer_match_captured' || f.startsWith('stress_')) {
    return 'Single Line Text (consider Dropdown)';
  }
  return 'Single Line Text';
}

function sampleValue(row: GhlMappingRow): string {
  const t = (row.transform || 'none').toLowerCase();
  const f = (row.profile_field || '').toLowerCase();
  if (t === 'boolean_yesno') return 'Yes';
  if (t === 'number' || NUMBER_FIELDS.test(f)) return '1234';
  if (t === 'join_comma' || ARRAY_FIELDS.has(f)) return 'item_a, item_b';
  if (f.endsWith('_date') || f === 'last_active_date') return '2025-01-15';
  if (f.includes('horseman')) return 'taxes';
  return 'sample text';
}

export function buildSpecRows(mappings: GhlMappingRow[]) {
  return mappings
    .filter((m) => m.is_active && (m.ghl_target_type === 'custom_field' || m.ghl_target_type === 'tag'))
    .map((m) => ({
      'Field Name (Label)': humanizeKey(m.ghl_field_key.replace('{value}', 'value')),
      'Field Key (API)': m.ghl_field_key,
      'GHL Object': 'Contact',
      'Target Type': m.ghl_target_type === 'tag' ? 'Tag (template)' : 'Custom Field',
      'Field Type': m.ghl_target_type === 'tag' ? 'Tag' : inferGhlFieldType(m),
      'Suggested Group': 'RPRx Sync',
      'Sample Value': sampleValue(m),
      'Source Profile Field': m.profile_field,
      'Transform': m.transform,
      'Notes': m.notes ?? '',
      'Required': 'Yes',
    }));
}

export function downloadGhlSpecCsv(mappings: GhlMappingRow[]) {
  const rows = buildSpecRows(mappings);
  if (!rows.length) return;
  const stamp = new Date().toISOString().slice(0, 10);
  downloadCSV(rows, `ghl-custom-fields-spec-${stamp}.csv`);
}

export function buildMarkdownSpec(mappings: GhlMappingRow[]): string {
  const customs = mappings.filter((m) => m.is_active && m.ghl_target_type === 'custom_field');
  const tags = mappings.filter((m) => m.is_active && m.ghl_target_type === 'tag');

  const lines: string[] = [];
  lines.push('# GoHighLevel Custom Field Setup');
  lines.push('');
  lines.push('Create the following **Contact** custom fields in GoHighLevel before enabling the RPRx sync.');
  lines.push('');
  lines.push('**Where to add:** GHL → Settings → Custom Fields → Contact → Add Field');
  lines.push('**Suggested group/folder:** `RPRx Sync`');
  lines.push('');
  lines.push(`## Custom Fields (${customs.length} total)`);
  lines.push('');
  customs.forEach((m, i) => {
    lines.push(`### ${i + 1}. ${humanizeKey(m.ghl_field_key)}`);
    lines.push(`- **Field Key (API name):** \`${m.ghl_field_key}\``);
    lines.push(`- **Type:** ${inferGhlFieldType(m)}`);
    lines.push(`- **Group:** RPRx Sync`);
    lines.push(`- **Sample value:** \`${sampleValue(m)}\``);
    lines.push(`- **Source:** \`profiles.${m.profile_field}\` (transform: \`${m.transform}\`)`);
    if (m.notes) lines.push(`- **Notes:** ${m.notes}`);
    lines.push('');
  });

  if (tags.length) {
    lines.push('## Tags Auto-Applied by Sync');
    lines.push('');
    lines.push('These tags are added to the contact at sync time. Pre-create them in GHL → Settings → Tags if you want consistent casing or automations to fire.');
    lines.push('');
    tags.forEach((m) => {
      const examples = m.ghl_field_key.includes('{value}')
        ? HORSEMEN.map((h) => `\`${m.ghl_field_key.replace('{value}', h)}\``).join(', ')
        : `\`${m.ghl_field_key}\``;
      lines.push(`- **Template:** \`${m.ghl_field_key}\` (from \`${m.profile_field}\`)`);
      lines.push(`  - Examples: ${examples}`);
      if (m.notes) lines.push(`  - Notes: ${m.notes}`);
    });
    lines.push('');
  }

  lines.push('---');
  lines.push(`_Generated ${new Date().toISOString()}_`);
  return lines.join('\n');
}

export function downloadGhlSpecMarkdown(mappings: GhlMappingRow[]) {
  const md = buildMarkdownSpec(mappings);
  const stamp = new Date().toISOString().slice(0, 10);
  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ghl-custom-fields-spec-${stamp}.md`;
  a.click();
  URL.revokeObjectURL(url);
}
