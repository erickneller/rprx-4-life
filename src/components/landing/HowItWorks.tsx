import { FileQuestion, BarChart2, Lightbulb } from 'lucide-react';

const HowItWorks = () => {
  const steps = [
    {
      icon: FileQuestion,
      step: '01',
      title: 'Take the Assessment',
      description: 'Answer a few simple questions about your financial situation, goals, and concerns. Takes just 3-5 minutes.',
    },
    {
      icon: BarChart2,
      step: '02',
      title: 'See Your Pressure Points',
      description: 'Get a visual breakdown of which of the Four Horsemen—Interest, Taxes, Insurance, Education—are impacting you most.',
    },
    {
      icon: Lightbulb,
      step: '03',
      title: 'Gain Clarity',
      description: 'Receive educational feedback to understand why these pressures persist and what areas to prioritize first.',
    },
  ];

  return (
    <section id="how-it-works" className="py-20 md:py-28">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
            How It Works
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Three Simple Steps to Financial Clarity
          </h2>
          <p className="text-lg text-muted-foreground">
            No commitments. No sales calls. Just clarity about where you stand.
          </p>
        </div>

        {/* Steps */}
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connector line (desktop only) */}
            <div className="hidden md:block absolute top-16 left-1/6 right-1/6 h-0.5 bg-gradient-to-r from-accent/20 via-accent to-accent/20" />

            {steps.map((step, index) => (
              <div key={step.title} className="relative">
                <div className="text-center">
                  {/* Step Number */}
                  <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent text-accent-foreground text-xl font-bold mb-6 z-10">
                    {step.step}
                  </div>

                  {/* Icon */}
                  <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center mx-auto mb-4">
                    <step.icon className="h-7 w-7 text-foreground" />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-semibold text-foreground mb-3">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
