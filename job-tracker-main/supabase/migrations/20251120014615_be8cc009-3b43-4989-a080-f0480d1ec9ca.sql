-- Fix RLS policies to restrict data access

-- Profiles table: Remove overly permissive policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Profiles: Users can view their own profile
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Profiles: Admins can view all profiles
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'));

-- User roles table: Remove overly permissive policy
DROP POLICY IF EXISTS "Users can view all roles" ON public.user_roles;

-- User roles: Users can view their own roles
CREATE POLICY "Users can view own roles" 
ON public.user_roles 
FOR SELECT 
USING (user_id = auth.uid());

-- User roles: Admins can view all roles
CREATE POLICY "Admins can view all roles" 
ON public.user_roles 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'));

-- Jobs table: Remove overly permissive policy
DROP POLICY IF EXISTS "Users can view all jobs" ON public.jobs;

-- Jobs: Declarants can view their assigned jobs
CREATE POLICY "Declarants can view assigned jobs" 
ON public.jobs 
FOR SELECT 
USING (allocated_to = auth.uid());

-- Jobs: Allocaters and admins can view all jobs
CREATE POLICY "Allocaters and admins can view all jobs" 
ON public.jobs 
FOR SELECT 
USING (
  has_role(auth.uid(), 'allocater') OR 
  has_role(auth.uid(), 'admin') OR 
  is_admin_or_manager(auth.uid())
);

-- Add column length constraints for input validation
ALTER TABLE public.profiles 
  ALTER COLUMN employee_id TYPE VARCHAR(50),
  ALTER COLUMN full_name TYPE VARCHAR(100);

ALTER TABLE public.jobs 
  ALTER COLUMN job_ref TYPE VARCHAR(100),
  ALTER COLUMN importer_name TYPE VARCHAR(200);

COMMENT ON POLICY "Users can view own profile" ON public.profiles IS 'Users can only see their own profile data';
COMMENT ON POLICY "Admins can view all profiles" ON public.profiles IS 'Admins have full visibility to all profiles';
COMMENT ON POLICY "Users can view own roles" ON public.user_roles IS 'Users can only see their own role assignments';
COMMENT ON POLICY "Admins can view all roles" ON public.user_roles IS 'Admins can see all role assignments';
COMMENT ON POLICY "Declarants can view assigned jobs" ON public.jobs IS 'Declarants can only see jobs assigned to them';
COMMENT ON POLICY "Allocaters and admins can view all jobs" ON public.jobs IS 'Allocaters, admins, and managers can see all jobs';