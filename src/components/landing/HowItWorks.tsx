import { getLandingIcon } from '@/lib/landingIconMap';

interface Step { icon?: string; step: string; title: string; description: string }
interface Content { eyebrow?: string; heading?: string; subheading?: string; steps?: Step[] }

const DEFAULTS: Content = { eyebrow: 'How It Works', heading: '', subheading: '', steps: [] };

const HowItWorks = ({ content }: { content?: Content }) => {
  const c = { ...DEFAULTS, ...(content || {}) };
  const steps = c.steps || [];

  return (
    <section id="how-it-works" className="py-20 md:py-28">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-16">
          {c.eyebrow && (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
              {c.eyebrow}
            </div>
          )}
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{c.heading}</h2>
          <p className="text-lg text-muted-foreground">{c.subheading}</p>
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-16 left-1/6 right-1/6 h-0.5 bg-gradient-to-r from-accent/20 via-accent to-accent/20" />
            {steps.map((step) => {
              const Icon = getLandingIcon(step.icon);
              return (
                <div key={step.title} className="relative">
                  <div className="text-center">
                    <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent text-accent-foreground text-xl font-bold mb-6 z-10">
                      {step.step}
                    </div>
                    <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center mx-auto mb-4">
                      <Icon className="h-7 w-7 text-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-3">{step.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
