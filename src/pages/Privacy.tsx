import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link to="/">
          <Button variant="ghost" size="sm" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
        </Link>

        <article className="prose prose-sm sm:prose max-w-none">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground mb-8">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          <section className="space-y-4 text-sm leading-relaxed">
            <h2 className="text-xl font-semibold mt-6">1. Information We Collect</h2>
            <p>
              RPRx 4 Life collects only the information you provide directly: name, email, phone number, and the
              financial profile data you enter (income ranges, expenses, goals, assessment answers). We do not
              collect or store account numbers, Social Security numbers, or actual tax-return data.
            </p>

            <h2 className="text-xl font-semibold mt-6">2. How We Use Your Information</h2>
            <p>
              Your data is used solely to generate personalized educational guidance, populate your dashboard,
              and contact you about your account. We do not sell your information to third parties.
            </p>

            <h2 className="text-xl font-semibold mt-6">3. Data Storage & Security</h2>
            <p>
              Data is stored in encrypted Supabase databases protected by Row Level Security — meaning each user
              can only read or modify their own records. Authentication is handled by Supabase Auth with industry-standard
              password hashing and OAuth.
            </p>

            <h2 className="text-xl font-semibold mt-6">4. Email Communications</h2>
            <p>
              We send transactional emails (signup confirmation, password reset) via our authentication provider.
              We do not send marketing emails without explicit opt-in.
            </p>

            <h2 className="text-xl font-semibold mt-6">5. Your Rights</h2>
            <p>
              You may request deletion of your account and associated data at any time by contacting support.
              You may export your saved plans and assessment history from within the app.
            </p>

            <h2 className="text-xl font-semibold mt-6">6. Cookies & Tracking</h2>
            <p>
              We use only essential cookies required for authentication. We do not run third-party advertising
              trackers in the application.
            </p>

            <h2 className="text-xl font-semibold mt-6">7. Changes to This Policy</h2>
            <p>
              We may update this policy as the product evolves. Material changes will be communicated via email
              or an in-app notice.
            </p>

            <h2 className="text-xl font-semibold mt-6">8. Contact</h2>
            <p>
              Questions about this policy? Contact us through the in-app feedback widget or your account
              administrator.
            </p>
          </section>
        </article>
      </div>
    </div>
  );
};

export default Privacy;
