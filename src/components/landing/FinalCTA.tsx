import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

const FinalCTA = () => {
  return (
    <section className="py-20 md:py-28 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Headline */}
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6 leading-tight">
            Ready to Take Control of Your{' '}
            <span className="text-accent">Financial Future?</span>
          </h2>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Join thousands who have discovered where their money quietly leaks—and what to do about it. 
            Start your free assessment today.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/auth">
              <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground px-8 h-12 text-base">
                Start Free Assessment
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <a href="#pricing">
              <Button size="lg" variant="outline" className="px-8 h-12 text-base">
                View Pricing
              </Button>
            </a>
          </div>

          {/* Trust note */}
          <p className="text-sm text-muted-foreground mt-8">
            No credit card required • Free forever tier • Cancel anytime
          </p>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;
