import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Camera, Loader2, Info, DollarSign, Check, CloudUpload } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { CashFlowSection } from '@/components/profile/CashFlowSection';
import { PROFILE_TYPES, FINANCIAL_GOALS, FILING_STATUSES } from '@/lib/profileTypes';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useUnsavedChangesWarning } from '@/hooks/useUnsavedChangesWarning';
import { UnsavedChangesDialog } from '@/components/profile/UnsavedChangesDialog';
import { BadgeDisplay as BadgeDisplayComponent } from '@/components/gamification/BadgeDisplay';
import { StreakCounter as StreakCounterComponent } from '@/components/gamification/StreakCounter';
import { GamificationScoreCard } from '@/components/gamification/GamificationScoreCard';
import { useGamification } from '@/hooks/useGamification';
import { useRPRxScore } from '@/hooks/useRPRxScore';
import { showAchievementToast } from '@/components/gamification/AchievementToast';

const EMPLOYER_MATCH_OPTIONS = [
  { value: 'yes', label: 'Yes — I get the full match' },
  { value: 'no', label: "No — I'm leaving match money behind" },
  { value: 'not_sure', label: 'Not sure' },
  { value: 'na', label: "My employer doesn't offer a match" },
] as const;

const TAX_ACCOUNT_OPTIONS = [
  { value: '401k', label: '401(k)/403(b)' },
  { value: 'ira', label: 'Traditional IRA' },
  { value: 'roth_ira', label: 'Roth IRA' },
  { value: 'hsa', label: 'HSA' },
  { value: 'fsa', label: 'FSA' },
  { value: '529', label: '529 Plan' },
  { value: 'none', label: "I don't contribute to any of these" },
] as const;

const STRESS_WORRY_OPTIONS = [
  { value: 'never', label: 'Never' },
  { value: 'rarely', label: 'Rarely' },
  { value: 'sometimes', label: 'Sometimes' },
  { value: 'often', label: 'Often' },
  { value: 'constantly', label: 'Constantly' },
] as const;

const STRESS_CONFIDENCE_OPTIONS = [
  { value: 'very_confident', label: 'Very confident' },
  { value: 'somewhat', label: 'Somewhat confident' },
  { value: 'not_confident', label: 'Not confident' },
  { value: 'couldnt', label: "I couldn't handle it" },
] as const;

const STRESS_CONTROL_OPTIONS = [
  { value: 'fully', label: 'Fully in control' },
  { value: 'mostly', label: 'Mostly in control' },
  { value: 'somewhat', label: 'Somewhat in control' },
  { value: 'not_at_all', label: 'Not in control' },
] as const;

export default function Profile() {
  const { user } = useAuth();
  const { profile, updateProfile, uploadAvatar } = useProfile();
  const { logActivity } = useGamification();
  const { refreshScore } = useRPRxScore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Cash flow fields
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [monthlyDebtPayments, setMonthlyDebtPayments] = useState('');
  const [monthlyHousing, setMonthlyHousing] = useState('');
  const [monthlyInsurance, setMonthlyInsurance] = useState('');
  const [monthlyLivingExpenses, setMonthlyLivingExpenses] = useState('');

  // Optional profile fields
  const [profileTypes, setProfileTypes] = useState<string[]>([]);
  const [numChildren, setNumChildren] = useState<number>(0);
  const [childrenAges, setChildrenAges] = useState<number[]>([]);
  const [financialGoals, setFinancialGoals] = useState<string[]>([]);
  const [filingStatus, setFilingStatus] = useState<string>('');

  // Retirement fields
  const [yearsUntilRetirement, setYearsUntilRetirement] = useState<string>('');
  const [desiredRetirementIncome, setDesiredRetirementIncome] = useState<string>('');
  const [retirementBalanceTotal, setRetirementBalanceTotal] = useState<string>('');
  const [retirementContributionMonthly, setRetirementContributionMonthly] = useState<string>('');

  // Insurance coverage fields
  const [healthInsurance, setHealthInsurance] = useState(false);
  const [lifeInsurance, setLifeInsurance] = useState(false);
  const [disabilityInsurance, setDisabilityInsurance] = useState(false);
  const [longTermCareInsurance, setLongTermCareInsurance] = useState(false);
  const [noInsurance, setNoInsurance] = useState(false);

  // New RPRx fields
  const [emergencyFundBalance, setEmergencyFundBalance] = useState('');
  const [employerMatchCaptured, setEmployerMatchCaptured] = useState('');
  const [taxAdvantagedAccounts, setTaxAdvantagedAccounts] = useState<string[]>([]);
  const [stressMoneyWorry, setStressMoneyWorry] = useState('');
  const [stressEmergencyConfidence, setStressEmergencyConfidence] = useState('');
  const [stressControlFeeling, setStressControlFeeling] = useState('');

  // Track original values for dirty detection
  const [originalValues, setOriginalValues] = useState<Record<string, unknown> | null>(null);

  // Sync form state when profile loads
  useEffect(() => {
    if (profile) {
      const loadedValues = {
        fullName: profile.full_name || '',
        phone: profile.phone || '',
        company: profile.company || '',
        monthlyIncome: profile.monthly_income?.toString() || '',
        monthlyDebtPayments: profile.monthly_debt_payments?.toString() || '',
        monthlyHousing: profile.monthly_housing?.toString() || '',
        monthlyInsurance: profile.monthly_insurance?.toString() || '',
        monthlyLivingExpenses: profile.monthly_living_expenses?.toString() || '',
        profileTypes: profile.profile_type || [],
        numChildren: profile.num_children || 0,
        childrenAges: profile.children_ages || [],
        financialGoals: profile.financial_goals || [],
        filingStatus: profile.filing_status || '',
        yearsUntilRetirement: profile.years_until_retirement?.toString() || '',
        desiredRetirementIncome: profile.desired_retirement_income?.toString() || '',
        retirementBalanceTotal: profile.retirement_balance_total?.toString() || '',
        retirementContributionMonthly: profile.retirement_contribution_monthly?.toString() || '',
        healthInsurance: profile.health_insurance ?? false,
        lifeInsurance: profile.life_insurance ?? false,
        disabilityInsurance: profile.disability_insurance ?? false,
        longTermCareInsurance: profile.long_term_care_insurance ?? false,
        noInsurance: (profile as any).no_insurance ?? false,
        emergencyFundBalance: profile.emergency_fund_balance?.toString() || '',
        employerMatchCaptured: profile.employer_match_captured || '',
        taxAdvantagedAccounts: (profile.tax_advantaged_accounts as string[]) || [],
        stressMoneyWorry: profile.stress_money_worry || '',
        stressEmergencyConfidence: profile.stress_emergency_confidence || '',
        stressControlFeeling: profile.stress_control_feeling || '',
      };

      setFullName(loadedValues.fullName);
      setPhone(loadedValues.phone);
      setCompany(loadedValues.company);
      setMonthlyIncome(loadedValues.monthlyIncome);
      setMonthlyDebtPayments(loadedValues.monthlyDebtPayments);
      setMonthlyHousing(loadedValues.monthlyHousing);
      setMonthlyInsurance(loadedValues.monthlyInsurance);
      setMonthlyLivingExpenses(loadedValues.monthlyLivingExpenses);
      setProfileTypes(loadedValues.profileTypes);
      setNumChildren(loadedValues.numChildren);
      setChildrenAges(loadedValues.childrenAges);
      setFinancialGoals(loadedValues.financialGoals);
      setFilingStatus(loadedValues.filingStatus);
      setYearsUntilRetirement(loadedValues.yearsUntilRetirement);
      setDesiredRetirementIncome(loadedValues.desiredRetirementIncome);
      setRetirementBalanceTotal(loadedValues.retirementBalanceTotal);
      setRetirementContributionMonthly(loadedValues.retirementContributionMonthly);
      setHealthInsurance(loadedValues.healthInsurance);
      setLifeInsurance(loadedValues.lifeInsurance);
      setDisabilityInsurance(loadedValues.disabilityInsurance);
      setLongTermCareInsurance(loadedValues.longTermCareInsurance);
      setNoInsurance(loadedValues.noInsurance);
      setEmergencyFundBalance(loadedValues.emergencyFundBalance);
      setEmployerMatchCaptured(loadedValues.employerMatchCaptured);
      setTaxAdvantagedAccounts(loadedValues.taxAdvantagedAccounts);
      setStressMoneyWorry(loadedValues.stressMoneyWorry);
      setStressEmergencyConfidence(loadedValues.stressEmergencyConfidence);
      setStressControlFeeling(loadedValues.stressControlFeeling);

      setOriginalValues(loadedValues);
    }
  }, [profile]);

  // When numChildren changes, adjust the ages array
  useEffect(() => {
    setChildrenAges((prev) => {
      if (numChildren > prev.length) {
        return [...prev, ...Array(numChildren - prev.length).fill(0)];
      } else {
        return prev.slice(0, numChildren);
      }
    });
  }, [numChildren]);

  // Compute if form is dirty
  const isDirty = useMemo(() => {
    if (!originalValues) return false;

    const currentValues = {
      fullName, phone, company,
      monthlyIncome, monthlyDebtPayments, monthlyHousing, monthlyInsurance, monthlyLivingExpenses,
      profileTypes, numChildren, childrenAges, financialGoals, filingStatus,
      yearsUntilRetirement, desiredRetirementIncome, retirementBalanceTotal, retirementContributionMonthly,
      healthInsurance, lifeInsurance, disabilityInsurance, longTermCareInsurance, noInsurance,
      emergencyFundBalance, employerMatchCaptured, taxAdvantagedAccounts,
      stressMoneyWorry, stressEmergencyConfidence, stressControlFeeling,
    };

    return (
      currentValues.fullName !== originalValues.fullName ||
      currentValues.phone !== originalValues.phone ||
      currentValues.company !== originalValues.company ||
      currentValues.monthlyIncome !== originalValues.monthlyIncome ||
      currentValues.monthlyDebtPayments !== originalValues.monthlyDebtPayments ||
      currentValues.monthlyHousing !== originalValues.monthlyHousing ||
      currentValues.monthlyInsurance !== originalValues.monthlyInsurance ||
      currentValues.monthlyLivingExpenses !== originalValues.monthlyLivingExpenses ||
      JSON.stringify(currentValues.childrenAges) !== JSON.stringify(originalValues.childrenAges) ||
      JSON.stringify(currentValues.financialGoals) !== JSON.stringify(originalValues.financialGoals) ||
      JSON.stringify(currentValues.profileTypes) !== JSON.stringify(originalValues.profileTypes) ||
      currentValues.filingStatus !== originalValues.filingStatus ||
      currentValues.numChildren !== originalValues.numChildren ||
      currentValues.yearsUntilRetirement !== originalValues.yearsUntilRetirement ||
      currentValues.desiredRetirementIncome !== originalValues.desiredRetirementIncome ||
      currentValues.retirementBalanceTotal !== originalValues.retirementBalanceTotal ||
      currentValues.retirementContributionMonthly !== originalValues.retirementContributionMonthly ||
      currentValues.healthInsurance !== originalValues.healthInsurance ||
      currentValues.lifeInsurance !== originalValues.lifeInsurance ||
      currentValues.disabilityInsurance !== originalValues.disabilityInsurance ||
      currentValues.longTermCareInsurance !== originalValues.longTermCareInsurance ||
      currentValues.noInsurance !== originalValues.noInsurance ||
      currentValues.emergencyFundBalance !== originalValues.emergencyFundBalance ||
      currentValues.employerMatchCaptured !== originalValues.employerMatchCaptured ||
      JSON.stringify(currentValues.taxAdvantagedAccounts) !== JSON.stringify(originalValues.taxAdvantagedAccounts) ||
      currentValues.stressMoneyWorry !== originalValues.stressMoneyWorry ||
      currentValues.stressEmergencyConfidence !== originalValues.stressEmergencyConfidence ||
      currentValues.stressControlFeeling !== originalValues.stressControlFeeling
    );

  }, [
    originalValues,
    fullName, phone, company,
    monthlyIncome, monthlyDebtPayments, monthlyHousing, monthlyInsurance, monthlyLivingExpenses,
    profileTypes, numChildren, childrenAges, financialGoals, filingStatus,
    yearsUntilRetirement, desiredRetirementIncome, retirementBalanceTotal, retirementContributionMonthly,
    healthInsurance, lifeInsurance, disabilityInsurance, longTermCareInsurance, noInsurance,
    emergencyFundBalance, employerMatchCaptured, taxAdvantagedAccounts,
    stressMoneyWorry, stressEmergencyConfidence, stressControlFeeling,
  ]);

  const getInitials = () => {
    if (fullName) {
      return fullName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file type', description: 'Please select an image file.', variant: 'destructive' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Please select an image under 5MB.', variant: 'destructive' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => setPreviewUrl(e.target?.result as string);
    reader.readAsDataURL(file);

    setIsUploading(true);
    try {
      await uploadAvatar(file);
      toast({ title: 'Avatar updated', description: 'Your profile picture has been updated.' });
    } catch (error) {
      console.error('Upload error:', error);
      toast({ title: 'Upload failed', description: 'Failed to upload avatar. Please try again.', variant: 'destructive' });
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleGoalToggle = (goalValue: string) => {
    setFinancialGoals((prev) =>
      prev.includes(goalValue) ? prev.filter((g) => g !== goalValue) : [...prev, goalValue]
    );
  };

  const handleChildAgeChange = (index: number, value: string) => {
    const newAges = [...childrenAges];
    newAges[index] = parseInt(value) || 0;
    setChildrenAges(newAges);
  };

  const handleTaxAccountToggle = (accountValue: string) => {
    setTaxAdvantagedAccounts((prev) => {
      if (accountValue === 'none') {
        return prev.includes('none') ? [] : ['none'];
      }
      const withoutNone = prev.filter((a) => a !== 'none');
      return withoutNone.includes(accountValue)
        ? withoutNone.filter((a) => a !== accountValue)
        : [...withoutNone, accountValue];
    });
  };

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      await updateProfile.mutateAsync({
        full_name: fullName || null,
        phone: phone || null,
        company: company || null,
        monthly_income: monthlyIncome ? Number(monthlyIncome) : null,
        monthly_debt_payments: monthlyDebtPayments ? Number(monthlyDebtPayments) : null,
        monthly_housing: monthlyHousing ? Number(monthlyHousing) : null,
        monthly_insurance: monthlyInsurance ? Number(monthlyInsurance) : null,
        monthly_living_expenses: monthlyLivingExpenses ? Number(monthlyLivingExpenses) : null,
        profile_type: profileTypes.length > 0 ? profileTypes : null,
        num_children: numChildren,
        children_ages: numChildren > 0 ? childrenAges.slice(0, numChildren) : null,
        financial_goals: financialGoals.length > 0 ? financialGoals : null,
        filing_status: filingStatus || null,
        years_until_retirement: yearsUntilRetirement ? Number(yearsUntilRetirement) : null,
        desired_retirement_income: desiredRetirementIncome ? Number(desiredRetirementIncome) : null,
        retirement_balance_total: retirementBalanceTotal ? Number(retirementBalanceTotal) : null,
        retirement_contribution_monthly: retirementContributionMonthly ? Number(retirementContributionMonthly) : null,
        health_insurance: healthInsurance,
        life_insurance: lifeInsurance,
        disability_insurance: disabilityInsurance,
        long_term_care_insurance: longTermCareInsurance,
        no_insurance: noInsurance,
        emergency_fund_balance: emergencyFundBalance ? Number(emergencyFundBalance) : 0,
        employer_match_captured: employerMatchCaptured || null,
        tax_advantaged_accounts: taxAdvantagedAccounts.length > 0 ? taxAdvantagedAccounts : [],
        stress_money_worry: stressMoneyWorry || null,
        stress_emergency_confidence: stressEmergencyConfidence || null,
        stress_control_feeling: stressControlFeeling || null,
      } as any);

      setOriginalValues({
        fullName, phone, company,
        monthlyIncome, monthlyDebtPayments, monthlyHousing, monthlyInsurance, monthlyLivingExpenses,
        profileTypes, numChildren, childrenAges, financialGoals, filingStatus,
        yearsUntilRetirement, desiredRetirementIncome, retirementBalanceTotal, retirementContributionMonthly,
        healthInsurance, lifeInsurance, disabilityInsurance, longTermCareInsurance, noInsurance,
        emergencyFundBalance, employerMatchCaptured, taxAdvantagedAccounts,
        stressMoneyWorry, stressEmergencyConfidence, stressControlFeeling,
      });

      toast({ title: 'RPRx Score updated!', description: 'Your profile and score have been saved.' });

      // Refresh RPRx score after save
      refreshScore();

      logActivity('profile_updated').then((awarded) => {
        awarded.forEach((badge) => showAchievementToast(badge));
      });
    } catch (error) {
      console.error('Save error:', error);
      toast({ title: 'Save failed', description: 'Failed to save profile. Please try again.', variant: 'destructive' });
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [
    updateProfile, fullName, phone, company,
    monthlyIncome, monthlyDebtPayments, monthlyHousing, monthlyInsurance, monthlyLivingExpenses,
    profileTypes, numChildren, childrenAges, financialGoals, filingStatus,
    yearsUntilRetirement, desiredRetirementIncome, retirementBalanceTotal, retirementContributionMonthly,
    healthInsurance, lifeInsurance, disabilityInsurance, longTermCareInsurance, noInsurance,
    emergencyFundBalance, employerMatchCaptured, taxAdvantagedAccounts,
    stressMoneyWorry, stressEmergencyConfidence, stressControlFeeling,
  ]);

  // Validation: all fields required
  const validationErrors = useMemo(() => {
    const errors: Record<string, string> = {};
    if (!fullName.trim()) errors.fullName = 'Full name is required';
    if (!phone.trim()) errors.phone = 'Phone number is required';
    if (!monthlyIncome) errors.monthlyIncome = 'Monthly income is required';
    if (!monthlyDebtPayments && monthlyDebtPayments !== '0') errors.monthlyDebtPayments = 'Debt payments is required';
    if (!monthlyHousing) errors.monthlyHousing = 'Housing cost is required';
    if (!monthlyInsurance && monthlyInsurance !== '0') errors.monthlyInsurance = 'Insurance cost is required';
    if (!monthlyLivingExpenses) errors.monthlyLivingExpenses = 'Living expenses is required';
    if (profileTypes.length === 0) errors.profileTypes = 'Select at least one profile type';
    if (financialGoals.length === 0) errors.financialGoals = 'Select at least one financial goal';
    if (!filingStatus) errors.filingStatus = 'Filing status is required';
    if (!yearsUntilRetirement) errors.yearsUntilRetirement = 'Years until retirement is required';
    if (!desiredRetirementIncome) errors.desiredRetirementIncome = 'Desired retirement income is required';
    if (!retirementBalanceTotal && retirementBalanceTotal !== '0') errors.retirementBalanceTotal = 'Retirement balance is required';
    if (!retirementContributionMonthly && retirementContributionMonthly !== '0') errors.retirementContributionMonthly = 'Monthly contribution is required';
    if (!healthInsurance && !lifeInsurance && !disabilityInsurance && !longTermCareInsurance && !noInsurance) {
      errors.insurance = 'Select at least one insurance option or "I don\'t have any insurance"';
    }
    if (!emergencyFundBalance && emergencyFundBalance !== '0') errors.emergencyFundBalance = 'Emergency fund balance is required';
    if (!employerMatchCaptured) errors.employerMatchCaptured = 'Employer match status is required';
    if (taxAdvantagedAccounts.length === 0) errors.taxAdvantagedAccounts = 'Select at least one account or indicate none';
    if (!stressMoneyWorry) errors.stressMoneyWorry = 'This question is required';
    if (!stressEmergencyConfidence) errors.stressEmergencyConfidence = 'This question is required';
    if (!stressControlFeeling) errors.stressControlFeeling = 'This question is required';
    return errors;
  }, [fullName, phone, monthlyIncome, monthlyDebtPayments, monthlyHousing, monthlyInsurance, monthlyLivingExpenses, profileTypes, financialGoals, filingStatus, yearsUntilRetirement, desiredRetirementIncome, retirementBalanceTotal, retirementContributionMonthly, healthInsurance, lifeInsurance, disabilityInsurance, longTermCareInsurance, noInsurance, emergencyFundBalance, employerMatchCaptured, taxAdvantagedAccounts, stressMoneyWorry, stressEmergencyConfidence, stressControlFeeling]);

  const isValid = Object.keys(validationErrors).length === 0;

  // Auto-save status for UI
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Stable ref for handleSave so the effect doesn't restart on every field change
  const handleSaveRef = useRef(handleSave);
  useEffect(() => { handleSaveRef.current = handleSave; }, [handleSave]);

  // Debounced auto-save: triggers 2s after last change if valid
  useEffect(() => {
    if (!isDirty || !isValid) return;

    setAutoSaveStatus('idle');
    const timer = setTimeout(() => {
      setAutoSaveStatus('saving');
      handleSaveRef.current().then(() => {
        setAutoSaveStatus('saved');
        setTimeout(() => setAutoSaveStatus('idle'), 3000);
      }).catch(() => {
        setAutoSaveStatus('idle');
      });
    }, 2000);

    return () => clearTimeout(timer);
  }, [isDirty, isValid]);

  // Unsaved changes warning
  const {
    showDialog,
    isSaving: isDialogSaving,
    attemptNavigation,
    handleSave: handleDialogSave,
    handleDiscard,
    handleCancel
  } = useUnsavedChangesWarning({
    isDirty,
    onSave: handleSave
  });

  const displayUrl = previewUrl || profile?.avatar_url;

  return (
    <AuthenticatedLayout title="Profile">
      <div className="container max-w-2xl py-8 space-y-6">
        {/* Profile Photo Card */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Photo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <Avatar className="h-24 w-24 border-4 border-border">
                  <AvatarImage src={displayUrl || undefined} alt="Profile" />
                  <AvatarFallback className="bg-accent text-accent-foreground text-2xl font-medium">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="absolute bottom-0 right-0 rounded-full bg-accent p-2 text-accent-foreground shadow-md hover:bg-accent/90 transition-colors disabled:opacity-50"
                >
                  {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
              </div>
              <p className="text-sm text-muted-foreground">Click the camera icon to upload a photo</p>
            </div>
          </CardContent>
        </Card>

        {/* Required fields note */}
        <div className="flex items-start gap-2 rounded-lg border-2 border-destructive/40 bg-destructive/5 p-4">
          <Info className="h-5 w-5 mt-0.5 shrink-0 text-destructive" />
          <p className="text-sm font-semibold text-foreground">All fields marked with <span className="text-destructive">*</span> are required. Your profile must be complete before saving. Keep your profile up to date for the best results.</p>
        </div>

        {/* Personal Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name <span className="text-destructive">*</span></Label>
              <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Enter your name" className={validationErrors.fullName ? 'border-destructive' : ''} />
              {validationErrors.fullName && <p className="text-xs text-destructive">{validationErrors.fullName}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={user?.email || ''} disabled className="bg-muted" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone <span className="text-destructive">*</span></Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Enter your phone number" className={validationErrors.phone ? 'border-destructive' : ''} />
              {validationErrors.phone && <p className="text-xs text-destructive">{validationErrors.phone}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Optional Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>About You</CardTitle>
            <CardDescription className="flex items-start gap-2 mt-2">
              <Info className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
              <span>Help us personalize your experience with more detail.</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Profile Type - Multi-select */}
            <div className="space-y-2">
              <Label>I am a: <span className="text-destructive">*</span> <span className="text-muted-foreground text-xs font-normal">(select all that apply)</span></Label>
              <div className="space-y-2">
                {PROFILE_TYPES.map((type) => (
                  <label key={type.value} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={profileTypes.includes(type.value)}
                      onCheckedChange={(checked) => {
                        setProfileTypes((prev) => checked ? [...prev, type.value] : prev.filter((v) => v !== type.value));
                      }}
                    />
                    <span className="text-sm">{type.label}</span>
                  </label>
                ))}
              </div>
              {validationErrors.profileTypes && <p className="text-xs text-destructive">{validationErrors.profileTypes}</p>}
            </div>

            {/* Filing Status */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Label htmlFor="filingStatus">Filing Status <span className="text-destructive">*</span></Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-[220px]">
                      <p className="text-xs">Your filing status affects which tax optimization strategies apply to you</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Select value={filingStatus} onValueChange={setFilingStatus}>
                <SelectTrigger id="filingStatus" className={validationErrors.filingStatus ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select your filing status..." />
                </SelectTrigger>
                <SelectContent>
                  {FILING_STATUSES.map((status) => (
                    <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {validationErrors.filingStatus && <p className="text-xs text-destructive">{validationErrors.filingStatus}</p>}
            </div>

            {/* Number of Children */}
            <div className="space-y-2">
              <Label htmlFor="numChildren">Number of Children <span className="text-destructive">*</span></Label>
              <Input id="numChildren" type="number" min={0} max={10} value={numChildren} onChange={(e) => setNumChildren(parseInt(e.target.value) || 0)} placeholder="0" className="w-24" />
            </div>

            {/* Dynamic Children Ages */}
            {numChildren > 0 && (
              <div className="space-y-3">
                <Label>Children's Ages</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Array.from({ length: numChildren }).map((_, index) => (
                    <div key={index} className="space-y-1">
                      <Label htmlFor={`childAge${index}`} className="text-sm text-muted-foreground">Child {index + 1}</Label>
                      <div className="flex items-center gap-2">
                        <Input id={`childAge${index}`} type="number" min={0} max={25} value={childrenAges[index] || ''} onChange={(e) => handleChildAgeChange(index, e.target.value)} placeholder="Age" className="w-20" />
                        <span className="text-sm text-muted-foreground">years</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Financial Goals */}
            <div className="space-y-3">
              <Label>Financial Goals <span className="text-destructive">*</span> <span className="text-xs font-normal text-muted-foreground">(select all that apply)</span></Label>
              <div className="space-y-3">
                {FINANCIAL_GOALS.map((goal) => (
                  <div key={goal.value} className="flex items-center space-x-3">
                    <Checkbox id={goal.value} checked={financialGoals.includes(goal.value)} onCheckedChange={() => handleGoalToggle(goal.value)} />
                    <Label htmlFor={goal.value} className="text-sm font-normal cursor-pointer">{goal.label}</Label>
                  </div>
                ))}
              </div>
              {validationErrors.financialGoals && <p className="text-xs text-destructive">{validationErrors.financialGoals}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Cash Flow Card */}
        <Card>
          <CardHeader>
            <CardTitle>Your River — Cash Flow <span className="text-destructive">*</span></CardTitle>
            <CardDescription>Required for personalized debt and strategy recommendations</CardDescription>
          </CardHeader>
          <CardContent>
            <CashFlowSection
              monthlyIncome={monthlyIncome}
              setMonthlyIncome={setMonthlyIncome}
              monthlyDebtPayments={monthlyDebtPayments}
              setMonthlyDebtPayments={setMonthlyDebtPayments}
              monthlyHousing={monthlyHousing}
              setMonthlyHousing={setMonthlyHousing}
              monthlyInsurance={monthlyInsurance}
              setMonthlyInsurance={setMonthlyInsurance}
              monthlyLivingExpenses={monthlyLivingExpenses}
              setMonthlyLivingExpenses={setMonthlyLivingExpenses}
            />
          </CardContent>
        </Card>

        {/* 🌊 Emergency Savings */}
        <Card>
          <CardHeader>
            <CardTitle>🌊 Emergency Savings</CardTitle>
            <CardDescription>Your financial safety net for unexpected expenses</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="emergencyFundBalance">Emergency Fund Balance <span className="text-destructive">*</span></Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="emergencyFundBalance"
                  type="text"
                  inputMode="numeric"
                  value={emergencyFundBalance ? Number(emergencyFundBalance).toLocaleString() : ''}
                  onChange={(e) => setEmergencyFundBalance(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="$0"
                  className="pl-9"
                />
              </div>
              <p className="text-xs text-muted-foreground">Total savings you could access within 1 week for emergencies</p>
              {validationErrors.emergencyFundBalance && <p className="text-xs text-destructive">{validationErrors.emergencyFundBalance}</p>}
            </div>
          </CardContent>
        </Card>

        {/* 🏞️ Retirement Planning */}
        <Card>
          <CardHeader>
            <CardTitle>🏞️ Your Lake — Retirement <span className="text-destructive">*</span></CardTitle>
            <CardDescription>Help us understand your retirement outlook</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="yearsUntilRetirement">Years Until Retirement <span className="text-destructive">*</span></Label>
              <Input
                id="yearsUntilRetirement"
                type="number"
                inputMode="numeric"
                min={0}
                max={80}
                value={yearsUntilRetirement}
                onChange={(e) => setYearsUntilRetirement(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="0"
                className={`w-32 ${validationErrors.yearsUntilRetirement ? 'border-destructive' : ''}`}
              />
              {validationErrors.yearsUntilRetirement && <p className="text-xs text-destructive">{validationErrors.yearsUntilRetirement}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="desiredRetirementIncome">Desired Retirement Income (annual) <span className="text-destructive">*</span></Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="desiredRetirementIncome"
                  type="text"
                  inputMode="numeric"
                  value={desiredRetirementIncome ? Number(desiredRetirementIncome).toLocaleString() : ''}
                  onChange={(e) => setDesiredRetirementIncome(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="0"
                  className={`pl-9 ${validationErrors.desiredRetirementIncome ? 'border-destructive' : ''}`}
                />
              </div>
              {validationErrors.desiredRetirementIncome && <p className="text-xs text-destructive">{validationErrors.desiredRetirementIncome}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="retirementBalanceTotal">Retirement Balance Total <span className="text-destructive">*</span></Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="retirementBalanceTotal"
                  type="text"
                  inputMode="numeric"
                  value={retirementBalanceTotal ? Number(retirementBalanceTotal).toLocaleString() : ''}
                  onChange={(e) => setRetirementBalanceTotal(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="0"
                  className={`pl-9 ${validationErrors.retirementBalanceTotal ? 'border-destructive' : ''}`}
                />
              </div>
              {validationErrors.retirementBalanceTotal && <p className="text-xs text-destructive">{validationErrors.retirementBalanceTotal}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="retirementContributionMonthly">Monthly Retirement Contribution <span className="text-destructive">*</span></Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="retirementContributionMonthly"
                  type="text"
                  inputMode="numeric"
                  value={retirementContributionMonthly ? Number(retirementContributionMonthly).toLocaleString() : ''}
                  onChange={(e) => setRetirementContributionMonthly(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="0"
                  className={`pl-9 ${validationErrors.retirementContributionMonthly ? 'border-destructive' : ''}`}
                />
              </div>
              {validationErrors.retirementContributionMonthly && <p className="text-xs text-destructive">{validationErrors.retirementContributionMonthly}</p>}
            </div>

            {/* Employer Match - new field */}
            <div className="space-y-1.5">
              <Label htmlFor="employerMatchCaptured">Employer Match Captured <span className="text-destructive">*</span></Label>
              <Select value={employerMatchCaptured} onValueChange={setEmployerMatchCaptured}>
                <SelectTrigger id="employerMatchCaptured" className={validationErrors.employerMatchCaptured ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {EMPLOYER_MATCH_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Is your employer matching your retirement contributions?</p>
              {validationErrors.employerMatchCaptured && <p className="text-xs text-destructive">{validationErrors.employerMatchCaptured}</p>}
            </div>
          </CardContent>
        </Card>

        {/* 💰 Tax Efficiency */}
        <Card>
          <CardHeader>
            <CardTitle>💰 Tax Efficiency</CardTitle>
            <CardDescription>Understanding your tax-advantaged accounts helps us optimize your strategy</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Label>Tax-Advantaged Accounts <span className="text-destructive">*</span> <span className="text-xs font-normal text-muted-foreground">(select all that apply)</span></Label>
              <div className="space-y-3">
              {TAX_ACCOUNT_OPTIONS.map((account) => (
                  <div
                    key={account.value}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      account.value === 'none'
                        ? 'border-dashed border-muted-foreground/40 hover:bg-muted/30'
                        : 'border-border hover:bg-muted/50'
                    }`}
                    onClick={() => handleTaxAccountToggle(account.value)}
                  >
                    <Checkbox
                      checked={taxAdvantagedAccounts.includes(account.value)}
                      onCheckedChange={() => handleTaxAccountToggle(account.value)}
                      onClick={(e) => e.stopPropagation()}
                      id={`tax-${account.value}`}
                    />
                    <Label
                      htmlFor=""
                      className={`cursor-pointer flex-1 text-sm ${
                        account.value === 'none' ? 'italic text-muted-foreground' : 'font-medium'
                      }`}
                    >
                      {account.label}
                    </Label>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Select all accounts you currently contribute to</p>
              {validationErrors.taxAdvantagedAccounts && <p className="text-xs text-destructive">{validationErrors.taxAdvantagedAccounts}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Your Rainbow — Insurance Coverage */}
        <Card>
          <CardHeader>
            <CardTitle>Your Rainbow — Insurance Coverage / Protection <span className="text-destructive">*</span></CardTitle>
            <CardDescription>Select all coverages you currently have, or indicate you don't have any</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="healthInsurance" className="cursor-pointer">Health Insurance</Label>
              <Switch id="healthInsurance" checked={healthInsurance} onCheckedChange={(v) => { setHealthInsurance(v); if (v) setNoInsurance(false); }} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="lifeInsurance" className="cursor-pointer">Life Insurance</Label>
              <Switch id="lifeInsurance" checked={lifeInsurance} onCheckedChange={(v) => { setLifeInsurance(v); if (v) setNoInsurance(false); }} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="disabilityInsurance" className="cursor-pointer">Disability Insurance</Label>
              <Switch id="disabilityInsurance" checked={disabilityInsurance} onCheckedChange={(v) => { setDisabilityInsurance(v); if (v) setNoInsurance(false); }} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="longTermCareInsurance" className="cursor-pointer">Long‑Term Care Insurance</Label>
              <Switch id="longTermCareInsurance" checked={longTermCareInsurance} onCheckedChange={(v) => { setLongTermCareInsurance(v); if (v) setNoInsurance(false); }} />
            </div>
            <div className="border-t pt-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="noInsurance" className="cursor-pointer text-muted-foreground">I don't have any insurance</Label>
                <Switch id="noInsurance" checked={noInsurance} onCheckedChange={(v) => {
                  setNoInsurance(v);
                  if (v) {
                    setHealthInsurance(false);
                    setLifeInsurance(false);
                    setDisabilityInsurance(false);
                    setLongTermCareInsurance(false);
                  }
                }} />
              </div>
            </div>
            {validationErrors.insurance && <p className="text-xs text-destructive">{validationErrors.insurance}</p>}
          </CardContent>
        </Card>

        {/* 🧠 How You Feel About Money */}
        <Card className="bg-muted/30 border-muted">
          <CardHeader>
            <CardTitle>🧠 How You Feel About Money</CardTitle>
            <CardDescription>
              These questions help personalize your RPRx Score. You can update your answers anytime.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="stressMoneyWorry">How often do you worry about money? <span className="text-destructive">*</span></Label>
              <Select value={stressMoneyWorry} onValueChange={setStressMoneyWorry}>
                <SelectTrigger id="stressMoneyWorry" className={validationErrors.stressMoneyWorry ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {STRESS_WORRY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {validationErrors.stressMoneyWorry && <p className="text-xs text-destructive">{validationErrors.stressMoneyWorry}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="stressEmergencyConfidence">How confident are you that you could handle a $2,000 unexpected expense? <span className="text-destructive">*</span></Label>
              <Select value={stressEmergencyConfidence} onValueChange={setStressEmergencyConfidence}>
                <SelectTrigger id="stressEmergencyConfidence" className={validationErrors.stressEmergencyConfidence ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {STRESS_CONFIDENCE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {validationErrors.stressEmergencyConfidence && <p className="text-xs text-destructive">{validationErrors.stressEmergencyConfidence}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="stressControlFeeling">How in control do you feel of your financial future? <span className="text-destructive">*</span></Label>
              <Select value={stressControlFeeling} onValueChange={setStressControlFeeling}>
                <SelectTrigger id="stressControlFeeling" className={validationErrors.stressControlFeeling ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {STRESS_CONTROL_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {validationErrors.stressControlFeeling && <p className="text-xs text-destructive">{validationErrors.stressControlFeeling}</p>}
            </div>
          </CardContent>
        </Card>

        {/* My Achievements */}
        <Card>
          <CardHeader>
            <CardTitle>My Achievements</CardTitle>
            <CardDescription>
              Track your progress and unlock badges as you take control of your finances.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 flex-wrap">
              <StreakCounterComponent />
              <div className="text-xs text-muted-foreground">
                Longest streak: {profile?.longest_streak ?? 0} days
              </div>
            </div>
            <BadgeDisplayComponent />
          </CardContent>
        </Card>

        {/* Required fields reminder */}
        {!isValid && isDirty && (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
            <Info className="h-4 w-4 mt-0.5 shrink-0 text-destructive" />
            <p className="text-sm text-destructive">
              Please complete all required fields. Changes will auto-save once all required fields are filled.
            </p>
          </div>
        )}

        {/* Live RPRx Score */}
        <GamificationScoreCard compact />

        {/* Auto-save status & Cancel */}
        <div className="flex items-center justify-between pb-8">
          <Button variant="outline" onClick={attemptNavigation}>
            Cancel
          </Button>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {autoSaveStatus === 'saving' && (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Saving...</span>
              </>
            )}
            {autoSaveStatus === 'saved' && (
              <>
                <Check className="h-4 w-4 text-accent" />
                <span className="text-accent">Saved</span>
              </>
            )}
            {autoSaveStatus === 'idle' && isDirty && isValid && (
              <>
                <CloudUpload className="h-4 w-4" />
                <span>Auto-saving soon...</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Unsaved Changes Dialog */}
      <UnsavedChangesDialog
        open={showDialog}
        isSaving={isDialogSaving}
        onSave={handleDialogSave}
        onDiscard={handleDiscard}
        onCancel={handleCancel}
      />
    </AuthenticatedLayout>
  );
}
