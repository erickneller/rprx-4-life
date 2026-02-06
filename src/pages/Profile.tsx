import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Loader2 } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { CashFlowSection } from '@/components/profile/CashFlowSection';

export default function Profile() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, updateProfile, uploadAvatar } = useProfile();
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

  // Sync form state when profile loads
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
      setCompany(profile.company || '');
      setMonthlyIncome(profile.monthly_income?.toString() || '');
      setMonthlyDebtPayments(profile.monthly_debt_payments?.toString() || '');
      setMonthlyHousing(profile.monthly_housing?.toString() || '');
      setMonthlyInsurance(profile.monthly_insurance?.toString() || '');
      setMonthlyLivingExpenses(profile.monthly_living_expenses?.toString() || '');
    }
  }, [profile]);

  const getInitials = () => {
    if (fullName) {
      return fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
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
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please select an image under 5MB.',
        variant: 'destructive',
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
        description: 'Your profile picture has been updated.',
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: 'Failed to upload avatar. Please try again.',
        variant: 'destructive',
      });
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
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
      });
      toast({
        title: 'Profile updated',
        description: 'Your profile has been saved.',
      });
      navigate(-1);
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: 'Save failed',
        description: 'Failed to save profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

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
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
              <p className="text-sm text-muted-foreground">Click the camera icon to upload a photo</p>
            </div>
          </CardContent>
        </Card>

        {/* Personal Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={user?.email || ''}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter your phone number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Enter your company name"
              />
            </div>
          </CardContent>
        </Card>

        {/* Cash Flow Card */}
        <Card>
          <CardHeader>
            <CardTitle>Cash Flow Snapshot</CardTitle>
            <CardDescription>Help us personalize your experience (optional)</CardDescription>
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

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pb-8">
          <Button variant="outline" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
