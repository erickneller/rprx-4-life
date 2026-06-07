import DOMPurify from 'dompurify';
import ReactMarkdown from 'react-markdown';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VideoPlayer } from '@/components/media/VideoPlayer';
import type { DashboardCardConfig } from '@/hooks/useDashboardConfig';

interface CustomCardProps {
  card: DashboardCardConfig;
}

const ALLOWED_IFRAME_HOSTS = [
  'youtube.com',
  'youtube-nocookie.com',
  'youtu.be',
  'player.vimeo.com',
  'vimeo.com',
  'loom.com',
  'share.descript.com',
  'descript.com',
  'calendly.com',
  'msgsndr.com',
  'gohighlevel.com',
  'leadconnectorhq.com',
  'typeform.com',
  'forms.gle',
  'docs.google.com',
];

function sanitizeEmbed(raw: string) {
  return DOMPurify.sanitize(raw, {
    ADD_TAGS: ['iframe'],
    ADD_ATTR: [
      'allow', 'allowfullscreen', 'frameborder', 'scrolling',
      'src', 'width', 'height', 'loading', 'referrerpolicy', 'title',
    ],
    ALLOWED_URI_REGEXP: new RegExp(
      `^(?:(?:https?:)?\\/\\/(?:[\\w-]+\\.)*(?:${ALLOWED_IFRAME_HOSTS.map(h => h.replace(/\./g, '\\.')).join('|')})\\/|mailto:|tel:|#|\\/)`,
      'i'
    ),
  });
}

export function CustomCard({ card }: CustomCardProps) {
  const title = card.title || card.display_name;
  const content = card.content || {};

  let body: React.ReactNode = null;

  switch (card.content_type) {
    case 'video':
      body = content.url ? (
        <div className="space-y-2">
          <VideoPlayer url={content.url} title={title} />
          {content.caption && (
            <p className="text-sm text-muted-foreground">{content.caption}</p>
          )}
        </div>
      ) : null;
      break;

    case 'image':
      if (content.url) {
        const img = (
          <img
            src={content.url}
            alt={content.alt || title}
            className="w-full h-auto rounded-md"
            loading="lazy"
          />
        );
        body = content.link ? (
          <a href={content.link} target="_blank" rel="noopener noreferrer">{img}</a>
        ) : img;
      }
      break;

    case 'text':
      body = content.markdown ? (
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown>{content.markdown}</ReactMarkdown>
        </div>
      ) : null;
      break;

    case 'embed':
      body = content.html ? (
        <div
          className="custom-embed"
          dangerouslySetInnerHTML={{ __html: sanitizeEmbed(content.html) }}
        />
      ) : null;
      break;
  }

  if (!body) return null;

  return (
    <Card>
      {title && (
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent>{body}</CardContent>
    </Card>
  );
}
