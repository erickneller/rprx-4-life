import { 
  ClipboardCheck, 
  BarChart3, 
  Wallet, 
  MessageSquareText, 
  UserCircle 
} from 'lucide-react';

const Features = () => {
  const features = [
    {
      icon: ClipboardCheck,
      title: 'Financial Success Assessment',
      description: 'A 3-5 minute diagnostic that maps your situation to the Four Horsemen and establishes baseline awareness.',
    },
    {
      icon: BarChart3,
      title: 'Four Horsemen Visualization',
      description: 'Visual progress indicators that rank all four pressures and highlight your primary area of concern.',
    },
    {
      icon: Wallet,
      title: 'Cash Flow Snapshot',
      description: 'A simple income vs. expenses view that identifies surplus, tight, or deficit patterns without complexity.',
    },
    {
      icon: MessageSquareText,
      title: 'Diagnostic Feedback',
      description: 'Educational feedback explaining what your pattern indicates and why these pressures persist.',
    },
    {
      icon: UserCircle,
      title: 'Saved Progress & History',
      description: 'Create a free account to save results, retake assessments, and track your progress over time.',
    },
  ];

  return (
    <section id="features" className="py-20 md:py-28 bg-muted/50">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
            Key Features
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Everything You Need to Understand Your Financial Pressure
          </h2>
          <p className="text-lg text-muted-foreground">
            Our freemium platform gives you the diagnostic tools to see clearly before you act.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className={`p-6 rounded-2xl bg-card border border-border hover:border-accent/30 hover:shadow-lg transition-all ${
                index === features.length - 1 && features.length % 3 !== 0 
                  ? 'md:col-span-2 lg:col-span-1' 
                  : ''
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                <feature.icon className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
