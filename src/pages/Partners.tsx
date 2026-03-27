import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout';
import { usePartnerCategories, usePartners, useCompanyPartnerVisibility, toYouTubeEmbedUrl } from '@/hooks/usePartners';
import { useCompany } from '@/hooks/useCompany';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, Handshake, Play } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { AspectRatio } from '@/components/ui/aspect-ratio';

export default function Partners() {
  const { data: categories = [], isLoading: catLoading } = usePartnerCategories();
  const { data: partners = [], isLoading: partLoading } = usePartners();
  const { membership } = useCompany();
  const companyId = membership?.company_id;
  const { data: visibility = [] } = useCompanyPartnerVisibility(companyId);

  const isLoading = catLoading || partLoading;

  // Build hidden set from company visibility
  const hiddenPartnerIds = new Set(
    visibility.filter(v => !v.visible).map(v => v.partner_id)
  );

  // Filter partners by company visibility
  const visiblePartners = partners.filter(p => !hiddenPartnerIds.has(p.id));

  // Group by category
  const grouped = categories
    .map(cat => ({
      ...cat,
      partners: visiblePartners.filter(p => p.category_id === cat.id),
    }))
    .filter(g => g.partners.length > 0);

  return (
    <AuthenticatedLayout title="RPRx Partners">
      <div className="p-4 md:p-6 space-y-8 max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          <Handshake className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">RPRx Partners</h1>
        </div>
        <p className="text-muted-foreground">
          Explore our trusted partner programs to help you achieve your financial goals.
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
              No partner programs are available at this time. Check back soon!
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
                {cat.partners.map(partner => {
                  const embedUrl = partner.video_url ? toYouTubeEmbedUrl(partner.video_url) : null;
                  return (
                    <Card key={partner.id} className="flex flex-col overflow-hidden">
                      {embedUrl && (
                        <AspectRatio ratio={16 / 9}>
                          <iframe
                            src={embedUrl}
                            title={partner.name}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="w-full h-full border-0"
                          />
                        </AspectRatio>
                      )}
                      {!embedUrl && partner.logo_url && (
                        <div className="p-4 flex justify-center bg-muted/30">
                          <img
                            src={partner.logo_url}
                            alt={partner.name}
                            className="h-16 object-contain"
                          />
                        </div>
                      )}
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">{partner.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="flex-1 flex flex-col gap-4">
                        <CardDescription className="flex-1">{partner.description}</CardDescription>
                        {partner.partner_url && (
                          <Button asChild className="w-full gap-2">
                            <a href={partner.partner_url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4" />
                              Visit Partner
                            </a>
                          </Button>
                        )}
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
