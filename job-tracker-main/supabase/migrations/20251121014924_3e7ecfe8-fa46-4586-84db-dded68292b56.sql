-- Drop constraints if they somehow exist
ALTER TABLE public.jobs DROP CONSTRAINT IF EXISTS jobs_allocated_by_fkey;
ALTER TABLE public.jobs DROP CONSTRAINT IF EXISTS jobs_allocated_to_fkey;
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;

-- Add foreign key constraints to jobs table
ALTER TABLE public.jobs 
ADD CONSTRAINT jobs_allocated_by_fkey 
FOREIGN KEY (allocated_by) 
REFERENCES public.profiles(id) 
ON DELETE SET NULL;

ALTER TABLE public.jobs 
ADD CONSTRAINT jobs_allocated_to_fkey 
FOREIGN KEY (allocated_to) 
REFERENCES public.profiles(id) 
ON DELETE SET NULL;

-- Add foreign key constraint to user_roles table
ALTER TABLE public.user_roles 
ADD CONSTRAINT user_roles_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';