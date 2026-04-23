import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface LibraryCategory {
  id: string;
  name: string;
  description: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface LibraryVideo {
  id: string;
  category_id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useLibraryCategories() {
  return useQuery({
    queryKey: ['library-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('library_categories' as any)
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return (data as any[]) as LibraryCategory[];
    },
  });
}

export function useAllLibraryCategories() {
  return useQuery({
    queryKey: ['library-categories-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('library_categories' as any)
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return (data as any[]) as LibraryCategory[];
    },
  });
}

export function useLibraryVideos() {
  return useQuery({
    queryKey: ['library-videos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('library_videos' as any)
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return (data as any[]) as LibraryVideo[];
    },
  });
}

export function useAllLibraryVideos() {
  return useQuery({
    queryKey: ['library-videos-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('library_videos' as any)
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return (data as any[]) as LibraryVideo[];
    },
  });
}

export function useUpsertLibraryCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (cat: Partial<LibraryCategory> & { id: string }) => {
      const { error } = await supabase
        .from('library_categories' as any)
        .upsert(cat as any, { onConflict: 'id' });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['library-categories'] });
      qc.invalidateQueries({ queryKey: ['library-categories-all'] });
    },
  });
}

export function useDeleteLibraryCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('library_categories' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['library-categories'] });
      qc.invalidateQueries({ queryKey: ['library-categories-all'] });
      qc.invalidateQueries({ queryKey: ['library-videos'] });
      qc.invalidateQueries({ queryKey: ['library-videos-all'] });
    },
  });
}

export function useUpsertLibraryVideo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (video: Partial<LibraryVideo> & { title: string; category_id: string }) => {
      const { error } = await supabase
        .from('library_videos' as any)
        .upsert({ ...video, updated_at: new Date().toISOString() } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['library-videos'] });
      qc.invalidateQueries({ queryKey: ['library-videos-all'] });
    },
  });
}

export function useDeleteLibraryVideo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('library_videos' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['library-videos'] });
      qc.invalidateQueries({ queryKey: ['library-videos-all'] });
    },
  });
}

/** @deprecated Use resolveVideoSource / toEmbedUrl from '@/lib/videoSource'. */
export { getYouTubeVideoId, getYouTubeThumbnail, toEmbedUrl as toYouTubeEmbedUrl } from '@/lib/videoSource';
