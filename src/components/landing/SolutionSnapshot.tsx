import { CheckCircle2 } from 'lucide-react';

interface Content {
  eyebrow?: string;
  headline?: string;
  headlineAccent?: string;
  body?: string;
  benefits?: string[];
}

const DEFAULTS: Content = {
  eyebrow: 'The RPRx Solution',
  headline: 'Finally See the Full Picture of Your Financial Health',
  headlineAccent: 'Financial Health',
  body: '',
  benefits: [],
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

const SolutionSnapshot = ({ content }: { content?: Content }) => {
  const c = { ...DEFAULTS, ...(content || {}) };

  return (
    <section className="py-20 md:py-28">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          <div>
            {c.eyebrow && (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-sm font-medium mb-6">
                {c.eyebrow}
              </div>
            )}
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6 leading-tight">
              {highlight(c.headline || '', c.headlineAccent)}
            </h2>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">{c.body}</p>
            <ul className="space-y-4">
              {(c.benefits || []).map((benefit) => (
                <li key={benefit} className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-accent flex-shrink-0" />
                  <span className="text-foreground">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-border bg-card">
              <div className="p-6 bg-muted/30">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-destructive/60" />
                  <div className="w-3 h-3 rounded-full bg-warning/60" />
                  <div className="w-3 h-3 rounded-full bg-accent/60" />
                </div>
                <div className="space-y-4">
                  <div className="h-8 bg-muted rounded w-2/3" />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-24 bg-card rounded-lg border border-border p-4">
                      <div className="h-3 bg-accent/30 rounded w-3/4 mb-2" />
                      <div className="h-8 bg-accent/20 rounded w-1/2" />
                    </div>
                    <div className="h-24 bg-card rounded-lg border border-border p-4">
                      <div className="h-3 bg-primary/30 rounded w-3/4 mb-2" />
                      <div className="h-8 bg-primary/20 rounded w-1/2" />
                    </div>
                  </div>
                  <div className="h-32 bg-card rounded-lg border border-border p-4">
                    <div className="h-3 bg-muted rounded w-1/4 mb-4" />
                    <div className="flex gap-2">
                      {[60, 40, 80, 55].map((height, i) => (
                        <div key={i} className="flex-1 bg-accent/30 rounded-t" style={{ height: `${height}%` }} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 w-full h-full bg-accent/10 rounded-2xl -z-10" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default SolutionSnapshot;
