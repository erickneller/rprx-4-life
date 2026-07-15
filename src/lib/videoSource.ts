/**
 * Resolves a user-provided video URL to a renderable source.
 * Supports YouTube, Loom, Descript, and direct file URLs (including GHL Media Library).
 */

export type VideoSource =
  | { kind: 'youtube'; embedUrl: string }
  | { kind: 'loom'; embedUrl: string }
  | { kind: 'descript'; embedUrl: string }
  | { kind: 'vimeo'; embedUrl: string }
  | { kind: 'file'; src: string }
  | { kind: 'unknown' };


const FILE_EXT_RE = /\.(mp4|webm|mov|m4v|ogg)(\?.*)?$/i;
const GHL_HOST_RE = /storage\.googleapis\.com\/msgsndr\//i;

export function getYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  const embed = url.match(/youtube\.com\/embed\/([^?&/]+)/);
  if (embed) return embed[1];
  const watch = url.match(/[?&]v=([^&]+)/);
  if (watch) return watch[1];
  const short = url.match(/youtu\.be\/([^?&/]+)/);
  if (short) return short[1];
  return null;
}

export function getLoomVideoId(url: string): string | null {
  if (!url) return null;
  const m = url.match(/loom\.com\/(?:share|embed)\/([a-zA-Z0-9]+)/);
  return m ? m[1] : null;
}

export function getDescriptVideoId(url: string): string | null {
  if (!url) return null;
  const m = url.match(/share\.descript\.com\/(?:view|embed)\/([a-zA-Z0-9]+)/);
  return m ? m[1] : null;
}

export function getVimeoVideoId(url: string): string | null {
  if (!url) return null;
  // Matches vimeo.com/{id}, vimeo.com/video/{id}, player.vimeo.com/video/{id},
  // and unlisted links vimeo.com/{id}/{hash} — hash preserved separately.
  const player = url.match(/player\.vimeo\.com\/video\/(\d+)(?:\?h=([a-zA-Z0-9]+))?/);
  if (player) return player[2] ? `${player[1]}?h=${player[2]}` : player[1];
  const unlisted = url.match(/vimeo\.com\/(\d+)\/([a-zA-Z0-9]+)/);
  if (unlisted) return `${unlisted[1]}?h=${unlisted[2]}`;
  const std = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (std) return std[1];
  return null;
}


export function resolveVideoSource(url: string | null | undefined): VideoSource {
  if (!url) return { kind: 'unknown' };
  const trimmed = url.trim();

  const ytId = getYouTubeVideoId(trimmed);
  if (ytId) return { kind: 'youtube', embedUrl: `https://www.youtube.com/embed/${ytId}` };

  const loomId = getLoomVideoId(trimmed);
  if (loomId) return { kind: 'loom', embedUrl: `https://www.loom.com/embed/${loomId}` };

  const descriptId = getDescriptVideoId(trimmed);
  if (descriptId) return { kind: 'descript', embedUrl: `https://share.descript.com/embed/${descriptId}` };

  if (FILE_EXT_RE.test(trimmed) || GHL_HOST_RE.test(trimmed)) {
    return { kind: 'file', src: trimmed };
  }

  return { kind: 'unknown' };
}

/** Backwards-compatible helper: returns an iframe-embeddable URL for YouTube/Loom/Descript only. */
export function toEmbedUrl(url: string | null | undefined): string | null {
  const src = resolveVideoSource(url);
  if (src.kind === 'youtube' || src.kind === 'loom' || src.kind === 'descript') return src.embedUrl;
  return null;
}

/** Get the YouTube hqdefault thumbnail for a video URL (returns null for non-YouTube). */
export function getYouTubeThumbnail(url: string): string | null {
  const id = getYouTubeVideoId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
}
