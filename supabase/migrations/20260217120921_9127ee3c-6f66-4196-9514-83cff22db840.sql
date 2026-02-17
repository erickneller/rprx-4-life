
-- Bootstrap: insert first admin (bypasses RLS since migrations run as superuser)
INSERT INTO public.user_roles (user_id, role)
VALUES ('e7c50666-3724-44a0-906b-69047ab10646', 'admin');

-- Also allow admins to read their own role (so non-admins can check too)
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Create a secure function to list users for admin user management
CREATE OR REPLACE FUNCTION public.admin_list_users()
RETURNS TABLE(id uuid, email text, created_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT au.id, au.email::text, au.created_at
  FROM auth.users au
  ORDER BY au.created_at DESC
$$;
