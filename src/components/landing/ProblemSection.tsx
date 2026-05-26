import { getLandingIcon } from '@/lib/landingIconMap';

interface Item { icon?: string; title: string; description: string }
interface Content { heading?: string; subheading?: string; items?: Item[] }

const DEFAULTS: Content = {
  heading: 'The Hidden Forces Draining Your Wealth',
  subheading: 'We call them the "Four Horsemen"—and they\'re quietly eroding your financial future.',
  items: [],
};

const ProblemSection = ({ content }: { content?: Content }) => {
  const c = { ...DEFAULTS, ...(content || {}) };
  const items = c.items || [];

  return (
    <section className="py-20 md:py-28 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{c.heading}</h2>
          <p className="text-lg text-muted-foreground">{c.subheading}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {items.map((point, index) => {
            const Icon = getLandingIcon(point.icon);
            return (
              <div
                key={point.title}
                className="relative p-8 rounded-2xl bg-card border border-border hover:shadow-lg transition-shadow"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center mb-6">
                  <Icon className="h-6 w-6 text-destructive" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">{point.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{point.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;
