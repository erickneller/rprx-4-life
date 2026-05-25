import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout';
import { useLibraryCategories, useLibraryVideos } from '@/hooks/useLibrary';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Lock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { VideoPlayer } from '@/components/media/VideoPlayer';
import { resolveVideoSource } from '@/lib/videoSource';
import { useSubscription } from '@/hooks/useSubscription';
import { useUpgradeGate } from '@/contexts/UpgradeGateContext';
import { normalizeRequiredTier, tierMeets } from '@/lib/upgradeFeatures';

export default function Library() {
  const { data: categories = [], isLoading: catLoading } = useLibraryCategories();
  const { data: videos = [], isLoading: vidLoading } = useLibraryVideos();
  const { tier } = useSubscription();
  const { requireUpgrade } = useUpgradeGate();

  const isLoading = catLoading || vidLoading;

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
                  const required = normalizeRequiredTier(video.required_tier);
                  const locked = !tierMeets(tier, required);
                  const source = resolveVideoSource(video.video_url);

                  if (locked) {
                    const label = required === 'pro' ? 'Pro' : 'Partner';
                    return (
                      <Card key={video.id} className="flex flex-col overflow-hidden">
                        <AspectRatio ratio={16 / 9}>
                          <div className="relative w-full h-full bg-muted">
                            {video.thumbnail_url && (
                              <img
                                src={video.thumbnail_url}
                                alt={video.title}
                                className="w-full h-full object-cover opacity-40"
                              />
                            )}
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/60 backdrop-blur-sm">
                              <Lock className="h-8 w-8 text-primary" />
                              <span className="text-xs font-medium uppercase tracking-wide text-primary">
                                {label} only
                              </span>
                            </div>
                          </div>
                        </AspectRatio>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <span className="truncate">{video.title}</span>
                            <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col justify-between gap-3">
                          <CardDescription>{video.description}</CardDescription>
                          <Button
                            size="sm"
                            onClick={() => requireUpgrade({ feature: 'library', requiredTier: required })}
                          >
                            Unlock with {label}
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  }

                  return (
                    <Card key={video.id} className="flex flex-col overflow-hidden">
                      {source.kind !== 'unknown' ? (
                        <VideoPlayer url={video.video_url} title={video.title} />
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
