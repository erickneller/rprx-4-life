import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatPhone, isValidUSPhone } from '@/lib/phoneFormat';

const CompletePhone = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, updateProfile } = useProfile();
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If profile already has phone, redirect away
  if (profile?.phone?.trim()) {
    navigate('/', { replace: true });
    return null;
  }

  const handleContinue = async () => {
    setError(null);

    if (!isValidUSPhone(phone)) {
      setError('Please enter a valid US phone number');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateProfile.mutateAsync({ phone });
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Failed to save phone number. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">One more thing...</CardTitle>
          <CardDescription>
            We need your phone number to complete your profile
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="(555) 555-5555"
              value={phone}
              onChange={(e) => setPhone(formatPhone(e.target.value))}
              disabled={isSubmitting}
              autoFocus
            />
          </div>
          <Button
            className="w-full bg-accent hover:bg-accent/90"
            onClick={handleContinue}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Continue →'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompletePhone;
