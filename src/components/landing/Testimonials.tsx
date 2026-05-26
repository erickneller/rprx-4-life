import { Star } from 'lucide-react';

interface Testimonial { name: string; role: string; content: string; rating: number }
interface Content {
  eyebrow?: string;
  heading?: string;
  subheading?: string;
  testimonials?: Testimonial[];
  featuredInLabel?: string;
  logos?: string[];
}

const DEFAULTS: Content = {
  eyebrow: 'Social Proof', heading: '', subheading: '', testimonials: [], featuredInLabel: 'Featured in', logos: [],
};

const Testimonials = ({ content }: { content?: Content }) => {
  const c = { ...DEFAULTS, ...(content || {}) };
  const testimonials = c.testimonials || [];
  const logos = c.logos || [];

  return (
    <section className="py-20 md:py-28 bg-muted/50">
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
          {testimonials.map((t) => (
            <div key={t.name} className="p-6 rounded-2xl bg-card border border-border">
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-warning text-warning" />
                ))}
              </div>
              <p className="text-foreground mb-6 leading-relaxed">"{t.content}"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                  <span className="text-accent font-semibold text-sm">{t.name.charAt(0)}</span>
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">{t.name}</p>
                  <p className="text-muted-foreground text-xs">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {logos.length > 0 && (
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-6">{c.featuredInLabel}</p>
            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
              {logos.map((logo) => (
                <div key={logo} className="text-xl font-bold text-muted-foreground/40 hover:text-muted-foreground transition-colors">
                  {logo}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default Testimonials;
