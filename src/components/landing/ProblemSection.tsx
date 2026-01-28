import { TrendingDown, AlertTriangle, HelpCircle } from 'lucide-react';

const ProblemSection = () => {
  const painPoints = [
    {
      icon: TrendingDown,
      title: 'Money Leaks Silently',
      description: 'Interest, taxes, insurance premiums, and education costs compound quietly—draining your wealth before you even notice.',
    },
    {
      icon: AlertTriangle,
      title: 'No Coordinated Strategy',
      description: 'Most people manage finances in isolation—savings here, insurance there, investments somewhere else—with no unified view.',
    },
    {
      icon: HelpCircle,
      title: 'Overwhelmed by Complexity',
      description: 'Financial advice often feels confusing, biased toward products, or too complex to act on with confidence.',
    },
  ];

  return (
    <section className="py-20 md:py-28 bg-muted/50">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            The Hidden Forces Draining Your Wealth
          </h2>
          <p className="text-lg text-muted-foreground">
            We call them the "Four Horsemen"—and they're quietly eroding your financial future.
          </p>
        </div>

        {/* Pain Points Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {painPoints.map((point, index) => (
            <div
              key={point.title}
              className="relative p-8 rounded-2xl bg-card border border-border hover:shadow-lg transition-shadow"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center mb-6">
                <point.icon className="h-6 w-6 text-destructive" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                {point.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {point.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;
