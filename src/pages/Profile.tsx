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
import { useGamification } from '@/hooks/useGamification';
import { showAchievementToast } from '@/components/gamification/AchievementToast';

export default function Profile() {
  const { user } = useAuth();
  const { profile, updateProfile, uploadAvatar } = useProfile();
  const { logActivity } = useGamification();
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
  const [profileType, setProfileType] = useState<string>('');
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
        profileType: profile.profile_type || '',
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
      };

      setFullName(loadedValues.fullName);
      setPhone(loadedValues.phone);
      setCompany(loadedValues.company);
      setMonthlyIncome(loadedValues.monthlyIncome);
      setMonthlyDebtPayments(loadedValues.monthlyDebtPayments);
      setMonthlyHousing(loadedValues.monthlyHousing);
      setMonthlyInsurance(loadedValues.monthlyInsurance);
      setMonthlyLivingExpenses(loadedValues.monthlyLivingExpenses);
      setProfileType(loadedValues.profileType);
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

      setOriginalValues(loadedValues);
    }
  }, [profile]);

  // When numChildren changes, adjust the ages array
  useEffect(() => {
    setChildrenAges((prev) => {
      if (numChildren > prev.length) {
        // Add empty slots for new children
        return [...prev, ...Array(numChildren - prev.length).fill(0)];
      } else {
        // Trim excess children
        return prev.slice(0, numChildren);
      }
    });
  }, [numChildren]);

  // Compute if form is dirty
  const isDirty = useMemo(() => {
    if (!originalValues) return false;

    const currentValues = {
      fullName,
      phone,
      company,
      monthlyIncome,
      monthlyDebtPayments,
      monthlyHousing,
      monthlyInsurance,
      monthlyLivingExpenses,
      profileType,
      numChildren,
      childrenAges,
      financialGoals,
      filingStatus,
      yearsUntilRetirement,
      desiredRetirementIncome,
      retirementBalanceTotal,
      retirementContributionMonthly,
      healthInsurance,
      lifeInsurance,
      disabilityInsurance,
      longTermCareInsurance,
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
      currentValues.profileType !== originalValues.profileType ||
      currentValues.numChildren !== originalValues.numChildren ||
      currentValues.filingStatus !== originalValues.filingStatus ||
      currentValues.yearsUntilRetirement !== originalValues.yearsUntilRetirement ||
      currentValues.desiredRetirementIncome !== originalValues.desiredRetirementIncome ||
      currentValues.retirementBalanceTotal !== originalValues.retirementBalanceTotal ||
      currentValues.retirementContributionMonthly !== originalValues.retirementContributionMonthly ||
      currentValues.healthInsurance !== originalValues.healthInsurance ||
      currentValues.lifeInsurance !== originalValues.lifeInsurance ||
      currentValues.disabilityInsurance !== originalValues.disabilityInsurance ||
      currentValues.longTermCareInsurance !== originalValues.longTermCareInsurance ||
      JSON.stringify(currentValues.childrenAges) !== JSON.stringify(originalValues.childrenAges) ||
      JSON.stringify(currentValues.financialGoals) !== JSON.stringify(originalValues.financialGoals));

  }, [
  originalValues,
  fullName, phone, company,
  monthlyIncome, monthlyDebtPayments, monthlyHousing, monthlyInsurance, monthlyLivingExpenses,
  profileType, numChildren, childrenAges, financialGoals, filingStatus,
  yearsUntilRetirement, desiredRetirementIncome, retirementBalanceTotal, retirementContributionMonthly,
  healthInsurance, lifeInsurance, disabilityInsurance, longTermCareInsurance]
  );

  const getInitials = () => {
    if (fullName) {
      return fullName.
      split(' ').
      map((n) => n[0]).
      join('').
      toUpperCase().
      slice(0, 2);
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
      toast({
        title: 'Invalid file type',
        description: 'Please select an image file.',
        variant: 'destructive'
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please select an image under 5MB.',
        variant: 'destructive'
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => setPreviewUrl(e.target?.result as string);
    reader.readAsDataURL(file);

    setIsUploading(true);
    try {
      await uploadAvatar(file);
      toast({
        title: 'Avatar updated',
        description: 'Your profile picture has been updated.'
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: 'Failed to upload avatar. Please try again.',
        variant: 'destructive'
      });
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleGoalToggle = (goalValue: string) => {
    setFinancialGoals((prev) =>
    prev.includes(goalValue) ?
    prev.filter((g) => g !== goalValue) :
    [...prev, goalValue]
    );
  };

  const handleChildAgeChange = (index: number, value: string) => {
    const newAges = [...childrenAges];
    newAges[index] = parseInt(value) || 0;
    setChildrenAges(newAges);
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
        profile_type: profileType || null,
        num_children: numChildren || null,
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
      });

      setOriginalValues({
        fullName, phone, company,
        monthlyIncome, monthlyDebtPayments, monthlyHousing, monthlyInsurance, monthlyLivingExpenses,
        profileType, numChildren, childrenAges, financialGoals, filingStatus,
        yearsUntilRetirement, desiredRetirementIncome, retirementBalanceTotal, retirementContributionMonthly,
        healthInsurance, lifeInsurance, disabilityInsurance, longTermCareInsurance,
      });

      toast({
        title: 'Profile updated',
        description: 'Your profile has been saved.'
      });

      logActivity('profile_updated').then((awarded) => {
        awarded.forEach((badge) => showAchievementToast(badge));
      });
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: 'Save failed',
        description: 'Failed to save profile. Please try again.',
        variant: 'destructive'
      });
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [
  updateProfile, fullName, phone, company,
  monthlyIncome, monthlyDebtPayments, monthlyHousing, monthlyInsurance, monthlyLivingExpenses,
  profileType, numChildren, childrenAges, financialGoals, filingStatus,
  yearsUntilRetirement, desiredRetirementIncome, retirementBalanceTotal, retirementContributionMonthly,
  healthInsurance, lifeInsurance, disabilityInsurance, longTermCareInsurance]
  );

  // Validation: all fields required
  const validationErrors = useMemo(() => {
    const errors: Record<string, string> = {};
    if (!fullName.trim()) errors.fullName = 'Full name is required';
    if (!phone.trim()) errors.phone = 'Phone number is required';
    // company validation hidden for now
    if (!monthlyIncome) errors.monthlyIncome = 'Monthly income is required';
    if (!monthlyDebtPayments) errors.monthlyDebtPayments = 'Debt payments is required';
    if (!monthlyHousing) errors.monthlyHousing = 'Housing cost is required';
    if (!monthlyInsurance) errors.monthlyInsurance = 'Insurance cost is required';
    if (!monthlyLivingExpenses) errors.monthlyLivingExpenses = 'Living expenses is required';
    if (!profileType) errors.profileType = 'Profile type is required';
    if (financialGoals.length === 0) errors.financialGoals = 'Select at least one financial goal';
    if (!filingStatus) errors.filingStatus = 'Filing status is required';
    return errors;
  }, [fullName, phone, company, monthlyIncome, monthlyDebtPayments, monthlyHousing, monthlyInsurance, monthlyLivingExpenses, profileType, financialGoals, filingStatus]);

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
        // Reset status after 3s
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
                  className="absolute bottom-0 right-0 rounded-full bg-accent p-2 text-accent-foreground shadow-md hover:bg-accent/90 transition-colors disabled:opacity-50">

                  {isUploading ?
                  <Loader2 className="h-4 w-4 animate-spin" /> :

                  <Camera className="h-4 w-4" />
                  }
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden" />

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
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your name"
                className={validationErrors.fullName ? 'border-destructive' : ''} />

              {validationErrors.fullName && <p className="text-xs text-destructive">{validationErrors.fullName}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={user?.email || ''}
                disabled
                className="bg-muted" />

            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone <span className="text-destructive">*</span></Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter your phone number"
                className={validationErrors.phone ? 'border-destructive' : ''} />

              {validationErrors.phone && <p className="text-xs text-destructive">{validationErrors.phone}</p>}
            </div>

            {/* Company field hidden for now - keep state/save logic intact */}
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
            {/* Profile Type */}
            <div className="space-y-2">
              <Label htmlFor="profileType">I am a: <span className="text-destructive">*</span></Label>
              <Select value={profileType} onValueChange={setProfileType}>
                <SelectTrigger id="profileType" className={validationErrors.profileType ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select which one BEST applies to you..." />
                </SelectTrigger>
                <SelectContent>
                  {PROFILE_TYPES.map((type) =>
                  <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {validationErrors.profileType && <p className="text-xs text-destructive">{validationErrors.profileType}</p>}
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
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {validationErrors.filingStatus && <p className="text-xs text-destructive">{validationErrors.filingStatus}</p>}
            </div>

            {/* Number of Children */}
            <div className="space-y-2">
              <Label htmlFor="numChildren">Number of Children <span className="text-destructive">*</span></Label>
              <Input
                id="numChildren"
                type="number"
                min={0}
                max={10}
                value={numChildren}
                onChange={(e) => setNumChildren(parseInt(e.target.value) || 0)}
                placeholder="0"
                className="w-24" />

            </div>

            {/* Dynamic Children Ages */}
            {numChildren > 0 &&
            <div className="space-y-3">
                <Label>Children's Ages</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Array.from({ length: numChildren }).map((_, index) =>
                <div key={index} className="space-y-1">
                      <Label htmlFor={`childAge${index}`} className="text-sm text-muted-foreground">
                        Child {index + 1}
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                      id={`childAge${index}`}
                      type="number"
                      min={0}
                      max={25}
                      value={childrenAges[index] || ''}
                      onChange={(e) => handleChildAgeChange(index, e.target.value)}
                      placeholder="Age"
                      className="w-20" />

                        <span className="text-sm text-muted-foreground">years</span>
                      </div>
                    </div>
                )}
                </div>
              </div>
            }

            {/* Financial Goals */}
            <div className="space-y-3">
              <Label>Financial Goals <span className="text-destructive">*</span> <span className="text-xs font-normal text-muted-foreground">(select all that apply)</span></Label>
              <div className="space-y-3">
                {FINANCIAL_GOALS.map((goal) =>
                <div key={goal.value} className="flex items-center space-x-3">
                    <Checkbox
                    id={goal.value}
                    checked={financialGoals.includes(goal.value)}
                    onCheckedChange={() => handleGoalToggle(goal.value)} />

                    <Label
                    htmlFor={goal.value}
                    className="text-sm font-normal cursor-pointer">

                      {goal.label}
                    </Label>
                  </div>
                )}
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
              setMonthlyLivingExpenses={setMonthlyLivingExpenses} />
          </CardContent>
        </Card>

        {/* Your Lake — Retirement */}
        <Card>
          <CardHeader>
            <CardTitle>Your Lake — Retirement</CardTitle>
            <CardDescription>Help us understand your retirement outlook</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="yearsUntilRetirement">Years Until Retirement</Label>
              <Input
                id="yearsUntilRetirement"
                type="number"
                inputMode="numeric"
                min={0}
                max={80}
                value={yearsUntilRetirement}
                onChange={(e) => setYearsUntilRetirement(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="0"
                className="w-32" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="desiredRetirementIncome">Desired Retirement Income (annual)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="desiredRetirementIncome"
                  type="text"
                  inputMode="numeric"
                  value={desiredRetirementIncome ? Number(desiredRetirementIncome).toLocaleString() : ''}
                  onChange={(e) => setDesiredRetirementIncome(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="0"
                  className="pl-9" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="retirementBalanceTotal">Retirement Balance Total</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="retirementBalanceTotal"
                  type="text"
                  inputMode="numeric"
                  value={retirementBalanceTotal ? Number(retirementBalanceTotal).toLocaleString() : ''}
                  onChange={(e) => setRetirementBalanceTotal(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="0"
                  className="pl-9" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="retirementContributionMonthly">Monthly Retirement Contribution</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="retirementContributionMonthly"
                  type="text"
                  inputMode="numeric"
                  value={retirementContributionMonthly ? Number(retirementContributionMonthly).toLocaleString() : ''}
                  onChange={(e) => setRetirementContributionMonthly(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="0"
                  className="pl-9" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Your Rainbow — Insurance Coverage */}
        <Card>
          <CardHeader>
            <CardTitle>Your Rainbow — Insurance Coverage / Protection</CardTitle>
            <CardDescription>Let us know which coverages you currently have</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="healthInsurance" className="cursor-pointer">Health Insurance</Label>
              <Switch id="healthInsurance" checked={healthInsurance} onCheckedChange={setHealthInsurance} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="lifeInsurance" className="cursor-pointer">Life Insurance</Label>
              <Switch id="lifeInsurance" checked={lifeInsurance} onCheckedChange={setLifeInsurance} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="disabilityInsurance" className="cursor-pointer">Disability Insurance</Label>
              <Switch id="disabilityInsurance" checked={disabilityInsurance} onCheckedChange={setDisabilityInsurance} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="longTermCareInsurance" className="cursor-pointer">Long‑Term Care Insurance</Label>
              <Switch id="longTermCareInsurance" checked={longTermCareInsurance} onCheckedChange={setLongTermCareInsurance} />
            </div>
          </CardContent>
        </Card>
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
        {!isValid && isDirty &&
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
            <Info className="h-4 w-4 mt-0.5 shrink-0 text-destructive" />
            <p className="text-sm text-destructive">
              Please complete all required fields. Changes will auto-save once all required fields are filled.
            </p>
          </div>
        }

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
        onCancel={handleCancel} />

    </AuthenticatedLayout>);

}