import { Play } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ProductDemo = () => {
  return (
    <section className="py-20 md:py-28 bg-muted/50">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
            Product Demo
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            See RPRx in Action
          </h2>
          <p className="text-lg text-muted-foreground">
            Watch how the assessment works and what insights you'll receive.
          </p>
        </div>

        {/* Video/Demo Placeholder */}
        <div className="max-w-4xl mx-auto">
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-primary shadow-2xl">
            {/* Placeholder content - mockup of dashboard */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full h-full p-8">
                {/* Dashboard Mockup */}
                <div className="h-full rounded-xl bg-card/10 backdrop-blur border border-primary-foreground/10 p-6">
                  <div className="grid grid-cols-4 gap-4 h-full">
                    {/* Sidebar */}
                    <div className="col-span-1 bg-primary-foreground/5 rounded-lg p-4 space-y-3">
                      <div className="h-8 bg-primary-foreground/10 rounded w-full" />
                      <div className="h-4 bg-primary-foreground/10 rounded w-3/4" />
                      <div className="h-4 bg-primary-foreground/10 rounded w-1/2" />
                      <div className="h-4 bg-primary-foreground/10 rounded w-2/3" />
                    </div>
                    
                    {/* Main content */}
                    <div className="col-span-3 space-y-4">
                      <div className="h-12 bg-primary-foreground/10 rounded-lg w-1/2" />
                      <div className="grid grid-cols-2 gap-4 flex-1">
                        <div className="bg-primary-foreground/5 rounded-lg p-4">
                          <div className="h-4 bg-accent/30 rounded w-1/2 mb-2" />
                          <div className="h-16 bg-accent/20 rounded" />
                        </div>
                        <div className="bg-primary-foreground/5 rounded-lg p-4">
                          <div className="h-4 bg-primary-foreground/10 rounded w-1/2 mb-2" />
                          <div className="h-16 bg-primary-foreground/10 rounded" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Play Button Overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-primary/50">
              <Button 
                size="lg" 
                className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-full w-20 h-20 p-0"
              >
                <Play className="h-8 w-8 ml-1" />
              </Button>
            </div>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-4">
            2-minute product walkthrough
          </p>
        </div>
      </div>
    </section>
  );
};

export default ProductDemo;
