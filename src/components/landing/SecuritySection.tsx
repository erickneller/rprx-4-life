import { Shield, Lock, Eye, Server } from 'lucide-react';

const SecuritySection = () => {
  const securityFeatures = [
    {
      icon: Shield,
      title: 'Bank-Level Encryption',
      description: '256-bit SSL encryption protects all your data in transit and at rest.',
    },
    {
      icon: Lock,
      title: 'SOC 2 Compliant',
      description: 'We meet the highest standards for security and data protection.',
    },
    {
      icon: Eye,
      title: 'Privacy First',
      description: 'We never sell your data. Your financial information stays yours.',
    },
    {
      icon: Server,
      title: 'Secure Infrastructure',
      description: 'Hosted on enterprise-grade cloud infrastructure with 99.9% uptime.',
    },
  ];

  return (
    <section className="py-20 md:py-28 bg-muted/50">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
            Security & Privacy
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Your Data is Safe With Us
          </h2>
          <p className="text-lg text-muted-foreground">
            We take security seriously. Your financial information is protected by industry-leading standards.
          </p>
        </div>

        {/* Security Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {securityFeatures.map((feature) => (
            <div
              key={feature.title}
              className="p-6 rounded-xl bg-card border border-border text-center"
            >
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <feature.icon className="h-6 w-6 text-accent" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SecuritySection;
