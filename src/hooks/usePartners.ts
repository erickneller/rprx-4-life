import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface PartnerCategory {
  id: string;
  name: string;
  description: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface Partner {
  id: string;
  category_id: string;
  name: string;
  description: string;
  logo_url: string | null;
  video_url: string | null;
  partner_url: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CompanyPartnerVisibility {
  id: string;
  company_id: string;
  partner_id: string;
  visible: boolean;
}

export function usePartnerCategories() {
  return useQuery({
    queryKey: ['partner-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partner_categories' as any)
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return (data as any[]) as PartnerCategory[];
    },
  });
}

export function useAllPartnerCategories() {
  return useQuery({
    queryKey: ['partner-categories-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partner_categories' as any)
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return (data as any[]) as PartnerCategory[];
    },
  });
}

export function usePartners() {
  return useQuery({
    queryKey: ['partners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partners' as any)
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return (data as any[]) as Partner[];
    },
  });
}

export function useAllPartners() {
  return useQuery({
    queryKey: ['partners-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partners' as any)
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return (data as any[]) as Partner[];
    },
  });
}

export function useCompanyPartnerVisibility(companyId: string | undefined) {
  return useQuery({
    queryKey: ['company-partner-visibility', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('company_partner_visibility' as any)
        .select('*')
        .eq('company_id', companyId);
      if (error) throw error;
      return (data as any[]) as CompanyPartnerVisibility[];
    },
    enabled: !!companyId,
  });
}

export function useUpsertCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (cat: Partial<PartnerCategory> & { id: string }) => {
      const { error } = await supabase
        .from('partner_categories' as any)
        .upsert(cat as any, { onConflict: 'id' });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['partner-categories'] });
      qc.invalidateQueries({ queryKey: ['partner-categories-all'] });
    },
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('partner_categories' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['partner-categories'] });
      qc.invalidateQueries({ queryKey: ['partner-categories-all'] });
      qc.invalidateQueries({ queryKey: ['partners'] });
      qc.invalidateQueries({ queryKey: ['partners-all'] });
    },
  });
}

export function useUpsertPartner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (partner: Partial<Partner> & { name: string; category_id: string }) => {
      const { error } = await supabase
        .from('partners' as any)
        .upsert({ ...partner, updated_at: new Date().toISOString() } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['partners'] });
      qc.invalidateQueries({ queryKey: ['partners-all'] });
    },
  });
}

export function useDeletePartner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('partners' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['partners'] });
      qc.invalidateQueries({ queryKey: ['partners-all'] });
    },
  });
}

export function useToggleCompanyPartnerVisibility() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ companyId, partnerId, visible }: { companyId: string; partnerId: string; visible: boolean }) => {
      const { error } = await supabase
        .from('company_partner_visibility' as any)
        .upsert(
          { company_id: companyId, partner_id: partnerId, visible } as any,
          { onConflict: 'company_id,partner_id' }
        );
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['company-partner-visibility', vars.companyId] });
    },
  });
}

/** Convert a YouTube URL to an embeddable format */
export function toYouTubeEmbedUrl(url: string): string | null {
  if (!url) return null;
  // Already embed format
  if (url.includes('youtube.com/embed/')) return url;
  // Standard watch URL
  const watchMatch = url.match(/[?&]v=([^&]+)/);
  if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}`;
  // Short URL
  const shortMatch = url.match(/youtu\.be\/([^?&]+)/);
  if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`;
  return null;
}
