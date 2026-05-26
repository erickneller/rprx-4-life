import { ArrowRight } from 'lucide-react';
import { LandingCtaButton } from './LandingCtaButton';
import type { LandingButton } from '@/lib/landingCards';

interface Content {
  heading?: string;
  headlineAccent?: string;
  subheading?: string;
  buttons?: LandingButton[];
  trustNote?: string;
}

const DEFAULTS: Content = { heading: '', headlineAccent: '', subheading: '', buttons: [], trustNote: '' };

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

const FinalCTA = ({ content }: { content?: Content }) => {
  const c = { ...DEFAULTS, ...(content || {}) };
  return (
    <section className="py-20 md:py-28 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6 leading-tight">
            {highlight(c.heading || '', c.headlineAccent)}
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">{c.subheading}</p>
          {!!c.buttons?.length && (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {c.buttons.map((b, i) => (
                <LandingCtaButton key={i} button={b}>
                  {i === 0 && b.variant !== 'outline' ? <ArrowRight className="ml-2 h-5 w-5" /> : null}
                </LandingCtaButton>
              ))}
            </div>
          )}
          {c.trustNote && <p className="text-sm text-muted-foreground mt-8">{c.trustNote}</p>}
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;
