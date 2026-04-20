import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout';
import { useLibraryCategories, useLibraryVideos, toYouTubeEmbedUrl } from '@/hooks/useLibrary';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { AspectRatio } from '@/components/ui/aspect-ratio';

export default function Library() {
  const { data: categories = [], isLoading: catLoading } = useLibraryCategories();
  const { data: videos = [], isLoading: vidLoading } = useLibraryVideos();

  const isLoading = catLoading || vidLoading;

  // Group by category
  const grouped = categories
    .map(cat => ({
      ...cat,
      videos: videos.filter(v => v.category_id === cat.id),
    }))
    .filter(g => g.videos.length > 0);

  return (
    <AuthenticatedLayout title="RPRx Library">
      <div className="p-4 md:p-6 space-y-8 max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          <BookOpen className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">RPRx Library</h1>
        </div>
        <p className="text-muted-foreground">
          Browse our curated video library to deepen your financial knowledge.
        </p>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-64 rounded-lg" />
            ))}
          </div>
        ) : grouped.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No library videos available yet. Check back soon!
            </CardContent>
          </Card>
        ) : (
          grouped.map(cat => (
            <section key={cat.id} className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold">{cat.name}</h2>
                {cat.description && (
                  <p className="text-sm text-muted-foreground">{cat.description}</p>
                )}
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {cat.videos.map(video => {
                  const embedUrl = toYouTubeEmbedUrl(video.video_url);
                  return (
                    <Card key={video.id} className="flex flex-col overflow-hidden">
                      {embedUrl ? (
                        <AspectRatio ratio={16 / 9}>
                          <iframe
                            src={embedUrl}
                            title={video.title}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="w-full h-full border-0"
                          />
                        </AspectRatio>
                      ) : video.thumbnail_url ? (
                        <AspectRatio ratio={16 / 9}>
                          <img
                            src={video.thumbnail_url}
                            alt={video.title}
                            className="w-full h-full object-cover"
                          />
                        </AspectRatio>
                      ) : null}
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">{video.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="flex-1">
                        <CardDescription>{video.description}</CardDescription>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </section>
          ))
        )}
      </div>
    </AuthenticatedLayout>
  );
}
