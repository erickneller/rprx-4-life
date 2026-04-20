import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const Terms = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link to="/">
          <Button variant="ghost" size="sm" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
        </Link>

        <article className="prose prose-sm sm:prose max-w-none">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Terms of Service</h1>
          <p className="text-sm text-muted-foreground mb-8">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          <section className="space-y-4 text-sm leading-relaxed">
            <h2 className="text-xl font-semibold mt-6">1. Educational Purpose Only</h2>
            <p className="font-medium">
              RPRx 4 Life is an educational and diagnostic platform. The strategies, plans, scores, and AI-generated
              guidance provided are <strong>not</strong> tax, legal, accounting, investment, or financial advice. Always
              consult a qualified, licensed professional before acting on any recommendation.
            </p>

            <h2 className="text-xl font-semibold mt-6">2. Eligibility</h2>
            <p>
              You must be at least 18 years old and a resident of the United States to use this service. By
              creating an account you confirm you meet these requirements.
            </p>

            <h2 className="text-xl font-semibold mt-6">3. Account Responsibilities</h2>
            <p>
              You are responsible for maintaining the confidentiality of your login credentials and all activity
              under your account. Notify us immediately of any unauthorized use.
            </p>

            <h2 className="text-xl font-semibold mt-6">4. Acceptable Use</h2>
            <p>
              You agree not to: (a) misuse the AI Strategy Assistant, (b) attempt to reverse engineer or scrape
              the service, (c) submit content that is unlawful, harassing, or infringes third-party rights, or
              (d) impersonate any person or entity.
            </p>

            <h2 className="text-xl font-semibold mt-6">5. Subscription & Billing</h2>
            <p>
              Free accounts are limited to 1 active implementation plan. Paid tiers (when available) unlock
              additional plans, premium AI models, and advisor features. Pricing and billing terms will be
              presented before any charge.
            </p>

            <h2 className="text-xl font-semibold mt-6">6. No Warranty</h2>
            <p>
              The service is provided "as is" without warranties of any kind. Estimates of savings, scores, and
              outcomes are illustrative; actual results depend on your individual circumstances.
            </p>

            <h2 className="text-xl font-semibold mt-6">7. Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by law, RPRx 4 Life and its operators are not liable for any
              indirect, incidental, or consequential damages arising from your use of the service or any
              decision made based on its content.
            </p>

            <h2 className="text-xl font-semibold mt-6">8. Termination</h2>
            <p>
              We may suspend or terminate accounts that violate these terms. You may close your account at any
              time.
            </p>

            <h2 className="text-xl font-semibold mt-6">9. Changes to Terms</h2>
            <p>
              We may update these terms periodically. Continued use after changes constitutes acceptance.
            </p>

            <h2 className="text-xl font-semibold mt-6">10. Governing Law</h2>
            <p>
              These terms are governed by the laws of the United States and the state where the service is
              operated.
            </p>
          </section>
        </article>
      </div>
    </div>
  );
};

export default Terms;
