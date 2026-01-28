const Stats = () => {
  const stats = [
    {
      value: '87%',
      label: 'of users discover a major financial leak they were unaware of',
    },
    {
      value: '$18,000',
      label: 'average annual savings opportunity identified per household',
    },
    {
      value: '3 min',
      label: 'to complete the assessment and see your results',
    },
  ];

  return (
    <section className="py-20 md:py-28">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-3xl gradient-hero p-12 md:p-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
                Real Results for Real People
              </h2>
              <p className="text-lg text-primary-foreground/80">
                Our diagnostic approach delivers meaningful insights.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-4xl md:text-5xl font-bold text-accent mb-3">
                    {stat.value}
                  </div>
                  <p className="text-primary-foreground/80 text-sm leading-relaxed">
                    {stat.label}
                  </p>
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
