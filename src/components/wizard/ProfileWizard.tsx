import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '@/hooks/useProfile';
import { useWizardContent } from '@/hooks/useWizardContent';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, ArrowRight, Loader2, Rocket } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { PROFILE_TYPES } from '@/lib/profileTypes';

const TAX_ACCOUNT_OPTIONS = [
  { value: '401k', label: '401(k)/403(b)' },
  { value: 'ira', label: 'Traditional IRA' },
  { value: 'roth_ira', label: 'Roth IRA' },
  { value: 'hsa', label: 'HSA' },
  { value: 'fsa', label: 'FSA' },
  { value: '529', label: '529 Plan' },
  { value: 'none', label: "I don't contribute to any of these" },
] as const;
  { value: 'single', label: 'Single' },
  { value: 'married_jointly', label: 'Married Filing Jointly' },
  { value: 'married_separately', label: 'Married Filing Separately' },
  { value: 'head_of_household', label: 'Head of Household' },
];
const EMPLOYER_MATCH_OPTIONS = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'na', label: 'Not Applicable' },
  { value: 'not_sure', label: 'Not Sure' },
];
const FINANCIAL_GOALS = [
  { value: 'reduce_taxes', label: 'Reduce Taxes' },
  { value: 'reduce_debt', label: 'Reduce Debt & Interest' },
  { value: 'reduce_insurance_costs', label: 'Lower Insurance Costs' },
  { value: 'save_for_education', label: 'Education Funding' },
  { value: 'increase_cash_flow', label: 'Increase Cash Flow' },
  { value: 'improve_retirement', label: 'Improve Retirement' },
  { value: 'build_emergency_fund', label: 'Build Emergency Fund' },
];
const STRESS_WORRY_OPTIONS = [
  { value: 'never', label: 'Never' },
  { value: 'sometimes', label: 'Sometimes' },
  { value: 'often', label: 'Often' },
  { value: 'always', label: 'Always' },
];
const STRESS_CONFIDENCE_OPTIONS = [
  { value: 'not_confident', label: 'Not Confident' },
  { value: 'somewhat_confident', label: 'Somewhat Confident' },
  { value: 'very_confident', label: 'Very Confident' },
  { value: 'completely_confident', label: 'Completely Confident' },
];
const STRESS_CONTROL_OPTIONS = [
  { value: 'not_at_all', label: 'Not at All' },
  { value: 'somewhat', label: 'Somewhat' },
  { value: 'mostly', label: 'Mostly' },
  { value: 'completely', label: 'Completely' },
];

// Dollar input helpers
function formatDollar(val: number | null | undefined): string {
  if (val === null || val === undefined) return '';
  return val.toString();
}
function parseDollar(raw: string): number | null {
  const cleaned = raw.replace(/[^0-9.]/g, '');
  if (!cleaned) return null;
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : Math.max(0, num);
}

function DollarInput({ label, value, onChange, allowZero, error }: {
  label: string; value: number | null | undefined; onChange: (v: number | null) => void; allowZero?: boolean; error?: string;
}) {
  const [display, setDisplay] = useState(formatDollar(value));
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
        <Input
          className="pl-7"
          inputMode="decimal"
          value={display}
          onChange={(e) => {
            const raw = e.target.value.replace(/[^0-9.]/g, '');
            setDisplay(raw);
            onChange(parseDollar(raw));
          }}
          onBlur={() => {
            const parsed = parseDollar(display);
            if (parsed !== null) setDisplay(parsed.toString());
          }}
        />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function NumberInput({ label, value, onChange, error }: {
  label: string; value: number | null | undefined; onChange: (v: number | null) => void; error?: string;
}) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Input
        type="number"
        inputMode="numeric"
        min={0}
        value={value !== null && value !== undefined ? value : ''}
        onChange={(e) => {
          const v = e.target.value;
          onChange(v === '' ? null : Math.max(0, parseInt(v) || 0));
        }}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function OptionCard({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full rounded-xl border-2 p-4 text-left text-sm font-medium transition-all',
        selected
          ? 'border-accent bg-accent/10 text-accent-foreground'
          : 'border-border bg-card hover:border-accent/50'
      )}
    >
      {label}
    </button>
  );
}

export function ProfileWizard() {
  const navigate = useNavigate();
  const { profile, updateProfile } = useProfile();
  const { contentMap, isLoading: contentLoading } = useWizardContent();
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Local form state initialized from profile
  const [form, setForm] = useState(() => ({
    monthly_income: profile?.monthly_income ?? null as number | null,
    monthly_debt_payments: profile?.monthly_debt_payments ?? null as number | null,
    monthly_housing: profile?.monthly_housing ?? null as number | null,
    monthly_insurance: profile?.monthly_insurance ?? null as number | null,
    monthly_living_expenses: profile?.monthly_living_expenses ?? null as number | null,
    emergency_fund_balance: profile?.emergency_fund_balance ?? null as number | null,
    filing_status: profile?.filing_status ?? '' as string,
    employer_match_captured: profile?.employer_match_captured ?? '' as string,
    tax_advantaged_accounts: ((profile?.tax_advantaged_accounts as string[]) ?? []) as string[],
    num_children: profile?.num_children ?? null as number | null,
    health_insurance: profile?.health_insurance ?? false,
    life_insurance: profile?.life_insurance ?? false,
    disability_insurance: profile?.disability_insurance ?? false,
    long_term_care_insurance: profile?.long_term_care_insurance ?? false,
    no_insurance: profile?.no_insurance ?? false,
    financial_goals: profile?.financial_goals ?? [] as string[],
    profile_type: profile?.profile_type ?? [] as string[],
    years_until_retirement: profile?.years_until_retirement ?? null as number | null,
    desired_retirement_income: profile?.desired_retirement_income ?? null as number | null,
    retirement_balance_total: profile?.retirement_balance_total ?? null as number | null,
    retirement_contribution_monthly: profile?.retirement_contribution_monthly ?? null as number | null,
    stress_money_worry: profile?.stress_money_worry ?? '' as string,
    stress_emergency_confidence: profile?.stress_emergency_confidence ?? '' as string,
    stress_control_feeling: profile?.stress_control_feeling ?? '' as string,
  }));

  const set = useCallback(<K extends keyof typeof form>(key: K, val: (typeof form)[K]) => {
    setForm(prev => ({ ...prev, [key]: val }));
    setErrors(prev => { const n = { ...prev }; delete n[key]; return n; });
  }, []);

  const validateStep = (s: number): Record<string, string> => {
    const e: Record<string, string> = {};
    if (s === 1) {
      if (form.monthly_income === null || form.monthly_income <= 0) e.monthly_income = 'Required';
      if (form.monthly_debt_payments === null) e.monthly_debt_payments = 'Required (0 is valid)';
      if (form.monthly_housing === null || form.monthly_housing <= 0) e.monthly_housing = 'Required';
      if (form.monthly_insurance === null) e.monthly_insurance = 'Required (0 is valid)';
      if (form.monthly_living_expenses === null || form.monthly_living_expenses <= 0) e.monthly_living_expenses = 'Required';
      if (form.emergency_fund_balance === null) e.emergency_fund_balance = 'Required (0 is valid)';
      if (!form.filing_status) e.filing_status = 'Required';
      if (!form.employer_match_captured) e.employer_match_captured = 'Required';
      if (!form.tax_advantaged_accounts.length) e.tax_advantaged_accounts = 'Select at least one account or indicate none';
    } else if (s === 2) {
      if (form.num_children === null) e.num_children = 'Required (0 is valid)';
      const anyInsurance = form.health_insurance || form.life_insurance || form.disability_insurance || form.long_term_care_insurance || form.no_insurance;
      if (!anyInsurance) e.insurance = 'Select at least one';
      if (!form.financial_goals.length) e.financial_goals = 'Select at least one';
      if (!form.profile_type.length) e.profile_type = 'Select at least one profile type';
    } else if (s === 3) {
      if (form.years_until_retirement === null) e.years_until_retirement = 'Required';
      if (form.desired_retirement_income === null || form.desired_retirement_income <= 0) e.desired_retirement_income = 'Required';
      if (form.retirement_balance_total === null) e.retirement_balance_total = 'Required (0 is valid)';
      if (form.retirement_contribution_monthly === null) e.retirement_contribution_monthly = 'Required (0 is valid)';
    } else if (s === 4) {
      if (!form.stress_money_worry) e.stress_money_worry = 'Required';
      if (!form.stress_emergency_confidence) e.stress_emergency_confidence = 'Required';
      if (!form.stress_control_feeling) e.stress_control_feeling = 'Required';
    }
    return e;
  };

  const getStepData = (s: number) => {
    if (s === 1) return {
      monthly_income: form.monthly_income, monthly_debt_payments: form.monthly_debt_payments,
      monthly_housing: form.monthly_housing, monthly_insurance: form.monthly_insurance,
      monthly_living_expenses: form.monthly_living_expenses, emergency_fund_balance: form.emergency_fund_balance,
      filing_status: form.filing_status, employer_match_captured: form.employer_match_captured,
      tax_advantaged_accounts: form.tax_advantaged_accounts.length > 0 ? form.tax_advantaged_accounts : [],
    };
    if (s === 2) return {
      num_children: form.num_children, health_insurance: form.health_insurance, life_insurance: form.life_insurance,
      disability_insurance: form.disability_insurance, long_term_care_insurance: form.long_term_care_insurance,
      no_insurance: form.no_insurance, financial_goals: form.financial_goals,
      profile_type: form.profile_type.length > 0 ? form.profile_type : null,
    };
    if (s === 3) return {
      years_until_retirement: form.years_until_retirement, desired_retirement_income: form.desired_retirement_income,
      retirement_balance_total: form.retirement_balance_total, retirement_contribution_monthly: form.retirement_contribution_monthly,
    };
    return {
      stress_money_worry: form.stress_money_worry, stress_emergency_confidence: form.stress_emergency_confidence,
      stress_control_feeling: form.stress_control_feeling,
    };
  };

  const handleNext = async () => {
    const errs = validateStep(step);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setSaving(true);
    try {
      await updateProfile.mutateAsync(getStepData(step) as any);
      setStep(step + 1);
    } catch {
      toast.error('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (contentLoading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  const stepKey = step <= 4 ? `wizard_step_${step}` : 'wizard_complete';
  const content = contentMap[stepKey];
  const totalSteps = 4;

  // Completion screen
  if (step > 4) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-[480px] text-center space-y-6">
          <h1 className="text-2xl font-bold">{content?.title || 'Your profile is complete 🎉'}</h1>
          <p className="text-muted-foreground">{content?.subtitle || ''}</p>
          <Button size="lg" className="gap-2" onClick={() => navigate('/assessment')}>
            <Rocket className="h-5 w-5" /> Start My Assessment →
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center p-4">
      <div className="w-full max-w-[480px] space-y-6 py-8">
        {/* Progress */}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground text-center">Step {step} of {totalSteps}</p>
          <Progress value={(step / totalSteps) * 100} className="h-2" />
        </div>

        {/* Header from DB */}
        <div className="space-y-1">
          <h1 className="text-xl font-bold">{content?.title || ''}</h1>
          <p className="text-sm text-muted-foreground">{content?.subtitle || ''}</p>
        </div>

        {/* Step content */}
        {step === 1 && (
          <div className="space-y-4">
            <DollarInput label="Monthly take-home income" value={form.monthly_income} onChange={v => set('monthly_income', v)} error={errors.monthly_income} />
            <DollarInput label="Monthly debt payments" value={form.monthly_debt_payments} onChange={v => set('monthly_debt_payments', v)} allowZero error={errors.monthly_debt_payments} />
            <DollarInput label="Monthly housing — rent or mortgage" value={form.monthly_housing} onChange={v => set('monthly_housing', v)} error={errors.monthly_housing} />
            <DollarInput label="Monthly insurance premiums total" value={form.monthly_insurance} onChange={v => set('monthly_insurance', v)} allowZero error={errors.monthly_insurance} />
            <DollarInput label="Monthly living expenses — food, transport, utilities" value={form.monthly_living_expenses} onChange={v => set('monthly_living_expenses', v)} error={errors.monthly_living_expenses} />
            <DollarInput label="Current emergency fund balance" value={form.emergency_fund_balance} onChange={v => set('emergency_fund_balance', v)} allowZero error={errors.emergency_fund_balance} />
            <div className="space-y-1">
              <Label>How do you file taxes?</Label>
              <Select value={form.filing_status} onValueChange={v => set('filing_status', v)}>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>{FILING_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
              </Select>
              {errors.filing_status && <p className="text-xs text-destructive">{errors.filing_status}</p>}
            </div>
            <div className="space-y-1">
              <Label>Capturing your full employer 401k match?</Label>
              <Select value={form.employer_match_captured} onValueChange={v => set('employer_match_captured', v)}>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>{EMPLOYER_MATCH_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
              </Select>
              {errors.employer_match_captured && <p className="text-xs text-destructive">{errors.employer_match_captured}</p>}
            </div>

            {/* Tax-Advantaged Accounts */}
            <div className="space-y-2">
              <Label>Tax-Advantaged Accounts <span className="text-destructive">*</span> <span className="text-muted-foreground text-xs font-normal">(select all that apply)</span></Label>
              <div className="space-y-2">
                {TAX_ACCOUNT_OPTIONS.map((opt) => (
                  <label key={opt.value} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer">
                    <Checkbox
                      checked={form.tax_advantaged_accounts.includes(opt.value)}
                      onCheckedChange={(checked) => {
                        if (opt.value === 'none' && checked) {
                          set('tax_advantaged_accounts', ['none']);
                        } else if (opt.value !== 'none' && checked) {
                          set('tax_advantaged_accounts', [...form.tax_advantaged_accounts.filter(v => v !== 'none'), opt.value]);
                        } else {
                          set('tax_advantaged_accounts', form.tax_advantaged_accounts.filter(v => v !== opt.value));
                        }
                      }}
                    />
                    <span className="text-sm">{opt.label}</span>
                  </label>
                ))}
              </div>
              {errors.tax_advantaged_accounts && <p className="text-xs text-destructive">{errors.tax_advantaged_accounts}</p>}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            {/* Profile Type */}
            <div className="space-y-2">
              <Label>I am a: <span className="text-destructive">*</span> <span className="text-muted-foreground text-xs font-normal">(select all that apply)</span></Label>
              <div className="space-y-2">
                {PROFILE_TYPES.map((type) => (
                  <label key={type.value} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer">
                    <Checkbox
                      checked={form.profile_type.includes(type.value)}
                      onCheckedChange={(checked) => {
                        set('profile_type', checked
                          ? [...form.profile_type, type.value]
                          : form.profile_type.filter(t => t !== type.value)
                        );
                      }}
                    />
                    <span className="text-sm">{type.label}</span>
                  </label>
                ))}
              </div>
              {errors.profile_type && <p className="text-xs text-destructive">{errors.profile_type}</p>}
            </div>

            <NumberInput label="Number of dependent children" value={form.num_children} onChange={v => set('num_children', v)} error={errors.num_children} />

            <div className="space-y-2">
              <Label>Insurance coverage currently held</Label>
              {[
                { key: 'health_insurance' as const, label: 'Health Insurance' },
                { key: 'life_insurance' as const, label: 'Life Insurance' },
                { key: 'disability_insurance' as const, label: 'Disability Insurance' },
                { key: 'long_term_care_insurance' as const, label: 'Long-Term Care' },
                { key: 'no_insurance' as const, label: 'None of the above' },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer">
                  <Checkbox
                    checked={form[key]}
                    onCheckedChange={(checked) => {
                      if (key === 'no_insurance' && checked) {
                        set('health_insurance', false);
                        set('life_insurance', false);
                        set('disability_insurance', false);
                        set('long_term_care_insurance', false);
                        set('no_insurance', true);
                      } else if (key !== 'no_insurance' && checked) {
                        set('no_insurance', false);
                        set(key, true as any);
                      } else {
                        set(key, !!checked as any);
                      }
                      setErrors(prev => { const n = { ...prev }; delete n.insurance; return n; });
                    }}
                  />
                  <span className="text-sm">{label}</span>
                </label>
              ))}
              {errors.insurance && <p className="text-xs text-destructive">{errors.insurance}</p>}
            </div>

            <div className="space-y-2">
              <Label>Top financial goals (select at least 1)</Label>
              {FINANCIAL_GOALS.map(goal => (
                <label key={goal.value} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer">
                  <Checkbox
                    checked={form.financial_goals.includes(goal.value)}
                    onCheckedChange={(checked) => {
                      set('financial_goals', checked
                        ? [...form.financial_goals, goal.value]
                        : form.financial_goals.filter(g => g !== goal.value)
                      );
                    }}
                  />
                  <span className="text-sm">{goal.label}</span>
                </label>
              ))}
              {errors.financial_goals && <p className="text-xs text-destructive">{errors.financial_goals}</p>}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground italic">Not sure? Use your best estimate — you can update this anytime in your profile</p>
            <NumberInput label="Years until you plan to retire" value={form.years_until_retirement} onChange={v => set('years_until_retirement', v)} error={errors.years_until_retirement} />
            <DollarInput label="Desired annual retirement income" value={form.desired_retirement_income} onChange={v => set('desired_retirement_income', v)} error={errors.desired_retirement_income} />
            <DollarInput label="Current total retirement savings balance" value={form.retirement_balance_total} onChange={v => set('retirement_balance_total', v)} allowZero error={errors.retirement_balance_total} />
            <DollarInput label="Monthly retirement contribution" value={form.retirement_contribution_monthly} onChange={v => set('retirement_contribution_monthly', v)} allowZero error={errors.retirement_contribution_monthly} />
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>How often do you worry about money?</Label>
              <div className="space-y-2">
                {STRESS_WORRY_OPTIONS.map(opt => (
                  <OptionCard key={opt.value} label={opt.label} selected={form.stress_money_worry === opt.value} onClick={() => set('stress_money_worry', opt.value)} />
                ))}
              </div>
              {errors.stress_money_worry && <p className="text-xs text-destructive">{errors.stress_money_worry}</p>}
            </div>
            <div className="space-y-2">
              <Label>How confident are you handling an unexpected $2,000 expense?</Label>
              <div className="space-y-2">
                {STRESS_CONFIDENCE_OPTIONS.map(opt => (
                  <OptionCard key={opt.value} label={opt.label} selected={form.stress_emergency_confidence === opt.value} onClick={() => set('stress_emergency_confidence', opt.value)} />
                ))}
              </div>
              {errors.stress_emergency_confidence && <p className="text-xs text-destructive">{errors.stress_emergency_confidence}</p>}
            </div>
            <div className="space-y-2">
              <Label>How much control do you feel over your finances?</Label>
              <div className="space-y-2">
                {STRESS_CONTROL_OPTIONS.map(opt => (
                  <OptionCard key={opt.value} label={opt.label} selected={form.stress_control_feeling === opt.value} onClick={() => set('stress_control_feeling', opt.value)} />
                ))}
              </div>
              {errors.stress_control_feeling && <p className="text-xs text-destructive">{errors.stress_control_feeling}</p>}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 pt-2">
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep(step - 1)} className="gap-1">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
          )}
          <Button className="flex-1 gap-1" onClick={handleNext} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            {step === 4 ? 'Finish' : 'Next'}
          </Button>
        </div>
      </div>
    </div>
  );
}
