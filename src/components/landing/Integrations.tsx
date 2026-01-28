const Integrations = () => {
  const integrations = [
    { name: 'Plaid', category: 'Banking' },
    { name: 'Stripe', category: 'Payments' },
    { name: 'QuickBooks', category: 'Accounting' },
    { name: 'Xero', category: 'Accounting' },
    { name: 'Google Drive', category: 'Storage' },
    { name: 'Dropbox', category: 'Storage' },
    { name: 'Slack', category: 'Communication' },
    { name: 'Zapier', category: 'Automation' },
  ];

  return (
    <section className="py-20 md:py-28">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
            Integrations
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Works With Your Favorite Tools
          </h2>
          <p className="text-lg text-muted-foreground">
            Connect RPRx with the tools you already use to get a complete financial picture.
          </p>
        </div>

        {/* Integration Logos */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
          {integrations.map((integration) => (
            <div
              key={integration.name}
              className="p-6 rounded-xl bg-card border border-border hover:border-accent/30 hover:shadow-md transition-all text-center"
            >
              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center mx-auto mb-3">
                <span className="text-lg font-bold text-foreground">
                  {integration.name.charAt(0)}
                </span>
              </div>
              <h3 className="font-semibold text-foreground text-sm">{integration.name}</h3>
              <p className="text-xs text-muted-foreground">{integration.category}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Integrations;
