-- Allow users to view declarant profiles for job allocation
CREATE POLICY "Users can view declarant profiles for allocation"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = profiles.id
    AND user_roles.role = 'declarant'
  )
  OR auth.uid() = profiles.id
  OR public.is_admin_or_manager(auth.uid())
);

-- Allow allocaters to view declarant profiles
CREATE POLICY "Allocaters can view declarant profiles"
ON public.profiles
FOR SELECT
USING (
  public.has_role(auth.uid(), 'allocater')
  OR public.is_admin_or_manager(auth.uid())
);