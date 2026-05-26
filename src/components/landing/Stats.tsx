interface Stat { value: string; label: string }
interface Content { heading?: string; subheading?: string; stats?: Stat[] }

const DEFAULTS: Content = { heading: '', subheading: '', stats: [] };

const Stats = ({ content }: { content?: Content }) => {
  const c = { ...DEFAULTS, ...(content || {}) };
  const stats = c.stats || [];

  return (
    <section className="py-20 md:py-28">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-3xl gradient-hero p-12 md:p-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">{c.heading}</h2>
              <p className="text-lg text-primary-foreground/80">{c.subheading}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-4xl md:text-5xl font-bold text-accent mb-3">{stat.value}</div>
                  <p className="text-primary-foreground/80 text-sm leading-relaxed">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Stats;
