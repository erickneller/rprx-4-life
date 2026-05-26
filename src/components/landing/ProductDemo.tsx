import { VideoPlayer } from '@/components/media/VideoPlayer';

interface Content {
  eyebrow?: string;
  heading?: string;
  subheading?: string;
  videoUrl?: string;
  videoTitle?: string;
  caption?: string;
}

const DEFAULTS: Content = {
  eyebrow: 'Product Info',
  heading: 'What is RPRx?',
  subheading: '',
  videoUrl: 'https://youtu.be/SjSOlKpCGfg',
  videoTitle: 'What is RPRx? - Product explainer',
  caption: '2-minute explainer',
};

const ProductDemo = ({ content }: { content?: Content }) => {
  const c = { ...DEFAULTS, ...(content || {}) };
  return (
    <section className="py-20 md:py-28 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-12">
          {c.eyebrow && (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
              {c.eyebrow}
            </div>
          )}
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{c.heading}</h2>
          <p className="text-lg text-muted-foreground">{c.subheading}</p>
        </div>
        <div className="max-w-4xl mx-auto">
          <div className="rounded-2xl overflow-hidden bg-primary shadow-2xl">
            {c.videoUrl && <VideoPlayer url={c.videoUrl} title={c.videoTitle || 'Product demo'} />}
          </div>
          {c.caption && <p className="text-center text-sm text-muted-foreground mt-4">{c.caption}</p>}
        </div>
      </div>
    </section>
  );
};

export default ProductDemo;
