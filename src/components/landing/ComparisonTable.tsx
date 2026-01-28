import { Check, X } from 'lucide-react';

const ComparisonTable = () => {
  const features = [
    { feature: 'Diagnostic-first approach', rprx: true, alternative: false },
    { feature: 'No product sales', rprx: true, alternative: false },
    { feature: 'Works with existing advisors', rprx: true, alternative: false },
    { feature: 'Visual pressure mapping', rprx: true, alternative: false },
    { feature: 'Free tier available', rprx: true, alternative: true },
    { feature: 'Quick assessment (< 5 min)', rprx: true, alternative: false },
    { feature: 'Educational focus', rprx: true, alternative: false },
    { feature: 'No hidden fees', rprx: true, alternative: false },
  ];

  return (
    <section className="py-20 md:py-28 bg-muted/50">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
            Comparison
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Why Choose RPRx?
          </h2>
          <p className="text-lg text-muted-foreground">
            See how we stack up against traditional financial planning tools.
          </p>
        </div>

        {/* Comparison Table */}
        <div className="max-w-3xl mx-auto">
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-3 bg-muted/50 border-b border-border">
              <div className="p-4 text-sm font-semibold text-foreground">Feature</div>
              <div className="p-4 text-sm font-semibold text-foreground text-center bg-accent/10">RPRx</div>
              <div className="p-4 text-sm font-semibold text-muted-foreground text-center">Other Tools</div>
            </div>

            {/* Rows */}
            {features.map((row, index) => (
              <div
                key={row.feature}
                className={`grid grid-cols-3 ${
                  index < features.length - 1 ? 'border-b border-border' : ''
                }`}
              >
                <div className="p-4 text-sm text-foreground">{row.feature}</div>
                <div className="p-4 flex items-center justify-center bg-accent/5">
                  {row.rprx ? (
                    <Check className="h-5 w-5 text-accent" />
                  ) : (
                    <X className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="p-4 flex items-center justify-center">
                  {row.alternative ? (
                    <Check className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <X className="h-5 w-5 text-muted-foreground/50" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ComparisonTable;
