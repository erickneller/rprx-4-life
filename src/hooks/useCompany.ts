import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Company {
  id: string;
  name: string;
  slug: string;
  owner_id: string | null;
  ghl_location_id: string | null;
  plan: string;
  created_at: string;
  updated_at: string;
}

export interface CompanyMember {
  id: string;
  company_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  invited_by: string | null;
  joined_at: string;
}

export interface CompanyWithMembership {
  company: Company;
  membership: CompanyMember;
}

/** Build invite URL from token */
export function buildInviteUrl(token: string): string {
  return `${window.location.origin}/join?token=${token}`;
}

/** Convert a company name to a URL-safe slug */
function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * useCompany — fetches the current user's company + membership.
 *
 * Also exposes:
 *   joinByToken(token)   — join a company via its invite_token
 *   createCompany(name)  — create a new company (business-owner flow)
 */
export function useCompany() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // ─── Query ──────────────────────────────────────────────────────────────────
  const companyQuery = useQuery<CompanyWithMembership | null>({
    queryKey: ['company', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      // Fetch membership first (profiles.company_id may not be populated yet)
      const { data: membership, error: memErr } = await (supabase
        .from('company_members') as any)
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (memErr) throw memErr;
      if (!membership) return null;

      const { data: company, error: compErr } = await (supabase
        .from('companies') as any)
        .select('id, name, slug, owner_id, ghl_location_id, plan, created_at, updated_at')
        .eq('id', membership.company_id)
        .single();

      if (compErr) throw compErr;

      return { company, membership } as CompanyWithMembership;
    },
    enabled: !!user?.id,
  });

  // ─── joinByToken ─────────────────────────────────────────────────────────────
  const joinByTokenMutation = useMutation({
    mutationFn: async (token: string): Promise<Company> => {
      if (!user?.id) throw new Error('Not authenticated');

      // Look up company by invite_token
      const { data: company, error: lookupErr } = await (supabase
        .from('companies') as any)
        .select('*')
        .eq('invite_token', token)
        .maybeSingle();

      if (lookupErr) throw lookupErr;
      if (!company) throw new Error('Invalid or expired invite link.');

      // Insert company_members row (upsert so re-joining is safe)
      const { error: memberErr } = await (supabase
        .from('company_members') as any)
        .upsert(
          { company_id: company.id, user_id: user.id, role: 'member' },
          { onConflict: 'company_id,user_id', ignoreDuplicates: true }
        );

      if (memberErr) throw memberErr;

      // Update profile.company_id + company_role
      const { error: profileErr } = await supabase
        .from('profiles')
        .update({ company_id: company.id, company_role: 'member' } as any)
        .eq('id', user.id);

      if (profileErr) throw profileErr;

      return company as Company;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      localStorage.removeItem('pending_invite_token');
    },
  });

  // ─── createCompany ───────────────────────────────────────────────────────────
  const createCompanyMutation = useMutation({
    mutationFn: async (name: string): Promise<Company> => {
      if (!user?.id) throw new Error('Not authenticated');

      const baseSlug = toSlug(name);
      // Append a short random suffix to avoid slug collisions
      const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 7)}`;

      const { data: company, error: createErr } = await (supabase
        .from('companies') as any)
        .insert({ name: name.trim(), slug, owner_id: user.id, plan: 'free' })
        .select()
        .single();

      if (createErr) throw createErr;

      // Add owner as member
      const { error: memberErr } = await (supabase
        .from('company_members') as any)
        .insert({ company_id: company.id, user_id: user.id, role: 'owner' });

      if (memberErr) throw memberErr;

      // Update profile
      const { error: profileErr } = await supabase
        .from('profiles')
        .update({ company_id: company.id, company_role: 'owner' } as any)
        .eq('id', user.id);

      if (profileErr) throw profileErr;

      return company as Company;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    },
  });

  return {
    company: companyQuery.data?.company ?? null,
    membership: companyQuery.data?.membership ?? null,
    isLoading: companyQuery.isLoading,
    error: companyQuery.error,
    joinByToken: joinByTokenMutation.mutateAsync,
    joinByTokenPending: joinByTokenMutation.isPending,
    joinByTokenError: joinByTokenMutation.error,
    createCompany: createCompanyMutation.mutateAsync,
    createCompanyPending: createCompanyMutation.isPending,
    createCompanyError: createCompanyMutation.error,
    buildInviteUrl,
  };
}

/**
 * useCompanyInviteToken — fetches the invite token for a company via RPC.
 * Only returns a token if the caller is an owner/admin of the company or a platform admin.
 */
export function useCompanyInviteToken(companyId: string | null) {
  const { user } = useAuth();

  return useQuery<string | null>({
    queryKey: ['company-invite-token', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data, error } = await supabase
        .rpc('get_company_invite_token', { _company_id: companyId });
      if (error) throw error;
      return data as string | null;
    },
    enabled: !!user?.id && !!companyId,
  });
}
