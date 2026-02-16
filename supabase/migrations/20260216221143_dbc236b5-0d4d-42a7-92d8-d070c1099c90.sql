-- Change profile_type from text to text array to support multi-select
ALTER TABLE public.profiles 
  ALTER COLUMN profile_type TYPE text[] 
  USING CASE 
    WHEN profile_type IS NOT NULL THEN ARRAY[profile_type]
    ELSE NULL
  END;