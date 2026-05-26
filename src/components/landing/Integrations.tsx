interface Item { name: string; category: string }
interface Content { eyebrow?: string; heading?: string; subheading?: string; items?: Item[] }

const DEFAULTS: Content = { eyebrow: 'Integrations', heading: '', subheading: '', items: [] };

const Integrations = ({ content }: { content?: Content }) => {
  const c = { ...DEFAULTS, ...(content || {}) };
  const items = c.items || [];

  return (
    <section className="py-20 md:py-28">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-12">
          {c.eyebrow && (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
              {c.eyebrow}
            </div>
          )}
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{c.heading}</h2>
          <p className="text-lg text-muted-foreground">{c.subheading}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
          {items.map((item) => (
            <div key={item.name} className="p-6 rounded-xl bg-card border border-border hover:border-accent/30 hover:shadow-md transition-all text-center">
              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center mx-auto mb-3">
                <span className="text-lg font-bold text-foreground">{item.name.charAt(0)}</span>
              </div>
              <h3 className="font-semibold text-foreground text-sm">{item.name}</h3>
              <p className="text-xs text-muted-foreground">{item.category}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Integrations;
