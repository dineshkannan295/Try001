-- Add ETD (Estimated Time of Departure) column to jobs table
ALTER TABLE public.jobs 
ADD COLUMN etd date;