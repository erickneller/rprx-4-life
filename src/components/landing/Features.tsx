import { getLandingIcon } from '@/lib/landingIconMap';

interface Item { icon?: string; title: string; description: string }
interface Content { eyebrow?: string; heading?: string; subheading?: string; items?: Item[] }

const DEFAULTS: Content = { eyebrow: 'Key Features', heading: '', subheading: '', items: [] };

const Features = ({ content }: { content?: Content }) => {
  const c = { ...DEFAULTS, ...(content || {}) };
  const items = c.items || [];

  return (
    <section id="features" className="py-20 md:py-28 bg-muted/50">
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {items.map((feature, index) => {
            const Icon = getLandingIcon(feature.icon);
            return (
              <div
                key={feature.title}
                className={`p-6 rounded-2xl bg-card border border-border hover:border-accent/30 hover:shadow-lg transition-all ${
                  index === items.length - 1 && items.length % 3 !== 0 ? 'md:col-span-2 lg:col-span-1' : ''
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                  <Icon className="h-6 w-6 text-accent" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Features;
