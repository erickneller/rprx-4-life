import { VideoPlayer } from '@/components/media/VideoPlayer';

const ProductDemo = () => {
  const videoUrl = 'https://youtu.be/SjSOlKpCGfg';

  return (
    <section className="py-20 md:py-28 bg-muted/50">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
            Product Info
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            What is RPRx?
          </h2>
          <p className="text-lg text-muted-foreground">
            You can decide to have the River, the Lake, and the Rainbow.
          </p>
        </div>

        {/* Video Embed */}
        <div className="max-w-4xl mx-auto">
          <div className="rounded-2xl overflow-hidden bg-primary shadow-2xl">
            <VideoPlayer url={videoUrl} title="What is RPRx? - Product explainer" />
          </div>

          <p className="text-center text-sm text-muted-foreground mt-4">
            2-minute explainer
          </p>
        </div>
      </div>
    </section>
  );
};

export default ProductDemo;
