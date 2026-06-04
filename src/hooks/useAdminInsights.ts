import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AdminUserRow {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  last_active_date: string | null;
  current_streak: number;
  total_points_earned: number;
  onboarding_completed: boolean;
  company_id: string | null;
  company_name: string | null;
  tier: 'free' | 'partner' | 'pro' | string;
}

export interface AdminUserActivity {
  user_id: string;
  email: string;
  full_name: string | null;
  company_id: string | null;
  company_name: string | null;
  tier: string;
  last_active_date: string | null;
  current_streak: number;
  total_points_earned: number;
  onboarding_completed: boolean;
  assessments_completed: number;
  plans_saved: number;
  focus_plan_title: string | null;
  badges_earned: number;
  course_lessons_opened: number;
  library_videos_opened: number;
  total_video_opens: number;
  last_video_opened_at: string | null;
}

export interface CompanyRollup {
  company_id: string;
  company_name: string;
  plan: string;
  member_count: number;
  free_count: number;
  partner_count: number;
  pro_count: number;
  active_last_7d: number;
  active_last_30d: number;
  assessments_completed: number;
  plans_saved: number;
  total_video_opens: number;
  course_opens: number;
  library_opens: number;
  avg_streak: number;
}

export interface VideoOpenRow {
  id: string;
  user_id: string;
  source: 'course_lesson' | 'library_video' | string;
  source_id: string | null;
  title: string | null;
  video_url: string | null;
  opened_at: string;
}

export function useAdminUsersWithTier() {
  return useQuery<AdminUserRow[]>({
    queryKey: ['admin-users-with-tier'],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)('admin_list_users_with_tier');
      if (error) throw error;
      return (data ?? []) as AdminUserRow[];
    },
  });
}

export function useAdminUserActivity(userId: string | null) {
  return useQuery<AdminUserActivity | null>({
    queryKey: ['admin-user-activity', userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await (supabase.rpc as any)('admin_user_activity_summary', {
        _user_id: userId,
      });
      if (error) throw error;
      const rows = (data ?? []) as AdminUserActivity[];
      return rows[0] ?? null;
    },
    enabled: !!userId,
  });
}

export function useAdminCompanyRollup() {
  return useQuery<CompanyRollup[]>({
    queryKey: ['admin-company-rollup'],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)('admin_company_activity_rollup');
      if (error) throw error;
      return (data ?? []) as CompanyRollup[];
    },
  });
}

export function useAdminVideoOpens(params: {
  userId?: string | null;
  companyId?: string | null;
  limit?: number;
}) {
  const { userId, companyId, limit = 50 } = params;
  return useQuery<VideoOpenRow[]>({
    queryKey: ['admin-video-opens', userId ?? null, companyId ?? null, limit],
    queryFn: async () => {
      let q: any = (supabase.from('video_open_events' as any) as any)
        .select('*')
        .order('opened_at', { ascending: false })
        .limit(limit);
      if (userId) q = q.eq('user_id', userId);
      const { data, error } = await q;
      if (error) throw error;
      let rows = (data ?? []) as VideoOpenRow[];
      if (companyId) {
        // company filter is handled by caller using already-scoped userIds
      }
      return rows;
    },
    enabled: !!(userId || companyId),
  });
}
