import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

// In-memory dedupe: once per (user, source_id) per 5 minutes
const recent = new Map<string, number>();
const WINDOW_MS = 5 * 60 * 1000;

export type VideoOpenSource = 'course_lesson' | 'library_video';

export function useLogVideoOpen() {
  const { user } = useAuth();

  return useCallback(
    async (params: {
      source: VideoOpenSource;
      sourceId: string | null | undefined;
      title?: string | null;
      videoUrl?: string | null;
    }) => {
      if (!user?.id || !params.sourceId) return;
      const key = `${user.id}:${params.source}:${params.sourceId}`;
      const now = Date.now();
      const last = recent.get(key);
      if (last && now - last < WINDOW_MS) return;
      recent.set(key, now);

      try {
        await (supabase.from('video_open_events' as any) as any).insert({
          user_id: user.id,
          source: params.source,
          source_id: params.sourceId,
          title: params.title ?? null,
          video_url: params.videoUrl ?? null,
        });
      } catch (e) {
        // Silent — analytics shouldn't break UX
        console.warn('video_open_events insert failed', e);
      }
    },
    [user?.id],
  );
}
