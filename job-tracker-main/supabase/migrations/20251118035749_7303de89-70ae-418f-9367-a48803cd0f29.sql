-- Create enum for roles
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'allocater', 'declarant');

-- Create enum for job status
CREATE TYPE public.job_status AS ENUM ('pending', 'processing', 'query', 'complete');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_id TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Create jobs table
CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_ref TEXT UNIQUE NOT NULL,
  importer_name TEXT NOT NULL,
  received_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  allocated_by UUID REFERENCES auth.users(id),
  allocated_to UUID REFERENCES auth.users(id),
  status job_status DEFAULT 'pending' NOT NULL,
  query_details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create function to check if user has admin or manager role
CREATE OR REPLACE FUNCTION public.is_admin_or_manager(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin', 'manager')
  )
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.is_admin_or_manager(auth.uid()));

-- RLS Policies for jobs
CREATE POLICY "Users can view all jobs"
  ON public.jobs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and managers can do anything"
  ON public.jobs FOR ALL
  TO authenticated
  USING (public.is_admin_or_manager(auth.uid()));

CREATE POLICY "Allocaters can create and update jobs"
  ON public.jobs FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'allocater') OR public.is_admin_or_manager(auth.uid()));

CREATE POLICY "Allocaters can update jobs"
  ON public.jobs FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'allocater') OR public.is_admin_or_manager(auth.uid()));

CREATE POLICY "Declarants can update their assigned jobs"
  ON public.jobs FOR UPDATE
  TO authenticated
  USING (
    allocated_to = auth.uid() OR 
    public.has_role(auth.uid(), 'allocater') OR 
    public.is_admin_or_manager(auth.uid())
  );

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, employee_id, full_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'employee_id',
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Enable realtime for jobs table
ALTER PUBLICATION supabase_realtime ADD TABLE public.jobs;