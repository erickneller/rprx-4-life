import { ArrowRight } from 'lucide-react';
import { getLandingIcon } from '@/lib/landingIconMap';
import { LandingCtaButton } from './LandingCtaButton';
import type { LandingButton } from '@/lib/landingCards';

interface Stat { icon?: string; value: string; label: string }
interface HeroContent {
  badge?: string;
  headline?: string;
  headlineAccent?: string;
  subheadline?: string;
  buttons?: LandingButton[];
  stats?: Stat[];
}

const DEFAULTS: HeroContent = {
  badge: 'Financial Wellness Platform',
  headline: "Reduce, Pay & Recover the Cost of Life's Events while Enhancing Your Lifestyle",
  headlineAccent: "Life's Events",
  subheadline: 'A diagnostic financial wellness platform that helps you understand where money quietly leaks—through interest, taxes, insurance, and education costs—so you can take back control.',
  buttons: [
    { label: 'Start Free Assessment', url: '/auth', variant: 'accent' },
    { label: 'See How It Works', url: '#how-it-works', variant: 'outline' },
  ],
  stats: [],
};

function highlight(text: string, accent?: string) {
  if (!accent || !text.includes(accent)) return text;
  const [before, ...rest] = text.split(accent);
  return (
    <>
      {before}
      <span className="text-accent">{accent}</span>
      {rest.join(accent)}
    </>
  );
}

const Hero = ({ content }: { content?: HeroContent }) => {
  const c = { ...DEFAULTS, ...(content || {}) };
  const stats = c.stats || [];

  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden">
      <div className="absolute inset-0 gradient-hero opacity-5" />

      <div className="container mx-auto px-4 relative">
        <div className="max-w-4xl mx-auto text-center">
          {c.badge && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium mb-8">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              {c.badge}
            </div>
          )}

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6">
            {highlight(c.headline || '', c.headlineAccent)}
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            {c.subheadline}
          </p>

          {!!c.buttons?.length && (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              {c.buttons.map((b, i) => (
                <LandingCtaButton key={i} button={b}>
                  {i === 0 && b.variant !== 'outline' ? <ArrowRight className="ml-2 h-5 w-5" /> : null}
                </LandingCtaButton>
              ))}
            </div>
          )}

          {stats.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
              {stats.map((stat) => {
                const Icon = getLandingIcon(stat.icon);
                return (
                  <div key={stat.label} className="flex flex-col items-center gap-2">
                    <div className="flex items-center gap-2 text-foreground">
                      <Icon className="h-5 w-5 text-accent" />
                      <span className="text-2xl font-bold">{stat.value}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{stat.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="absolute top-1/4 left-10 w-72 h-72 bg-accent/10 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10" />
      </div>
    </section>
  );
};

export default Hero;
