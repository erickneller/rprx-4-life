import { useEffect, useRef } from 'react';
import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Phone } from 'lucide-react';
import { useAdvisorEmbed } from '@/hooks/useAdvisorEmbed';

const VirtualAdvisor = () => {
  const { embed, isLoading } = useAdvisorEmbed();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !embed) return;

    // Parse embed snippet — execute scripts properly (innerHTML alone won't run them)
    const template = document.createElement('template');
    template.innerHTML = embed;

    const appended: Node[] = [];
    template.content.childNodes.forEach((node) => {
      if (node.nodeName === 'SCRIPT') {
        const oldScript = node as HTMLScriptElement;
        const newScript = document.createElement('script');
        for (const attr of Array.from(oldScript.attributes)) {
          newScript.setAttribute(attr.name, attr.value);
        }
        newScript.text = oldScript.textContent ?? '';
        container.appendChild(newScript);
        appended.push(newScript);
      } else {
        const cloned = node.cloneNode(true);
        container.appendChild(cloned);
        appended.push(cloned);
      }
    });

    return () => {
      appended.forEach((n) => {
        try { container.removeChild(n); } catch { /* noop */ }
      });
    };
  }, [embed]);

  return (
    <AuthenticatedLayout title="Virtual Advisor">
      <div className="flex min-h-[calc(100vh-12rem)] items-center justify-center p-4">
        <Card className="w-full max-w-3xl">
          <CardContent className="p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-full bg-primary/10 p-3">
                <Phone className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Speak With A Virtual Advisor</h1>
                <p className="text-sm text-muted-foreground">Connect with an advisor right here in the app.</p>
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : embed ? (
              <div ref={containerRef} className="min-h-[400px] w-full" />
            ) : (
              <div className="rounded-md border border-dashed border-border bg-muted/30 p-10 text-center">
                <p className="text-muted-foreground">
                  Advisor widget not configured yet. Please check back soon.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
};

export default VirtualAdvisor;
