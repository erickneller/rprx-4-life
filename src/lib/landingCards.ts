// Types and defaults for landing page card content.
// Each section component reads from its content shape, with safe fallbacks
// in the component itself so the site never renders blank.

export type LandingButton = {
  label: string;
  url: string;
  variant?: 'primary' | 'outline' | 'secondary' | 'accent';
};

export type LandingCardRow = {
  id: string;
  component_key: string;
  display_name: string;
  sort_order: number;
  is_visible: boolean;
  content: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export const LANDING_COMPONENT_KEYS = [
  'Hero',
  'ProblemSection',
  'SolutionSnapshot',
  'Features',
  'HowItWorks',
  'Testimonials',
  'Stats',
  'ProductDemo',
  'Pricing',
  'ComparisonTable',
  'Integrations',
  'SecuritySection',
  'FAQ',
  'FinalCTA',
] as const;
