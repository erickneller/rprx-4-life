-- Create plan status enum
CREATE TYPE plan_status AS ENUM ('not_started', 'in_progress', 'completed');

-- Create saved_plans table
CREATE TABLE public.saved_plans (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  title text NOT NULL,
  strategy_id text,
  strategy_name text NOT NULL,
  content jsonb NOT NULL DEFAULT '{}',
  status plan_status NOT NULL DEFAULT 'not_started',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.saved_plans ENABLE ROW LEVEL SECURITY;

-- RLS policies: users can only access their own plans
CREATE POLICY "Users can view their own plans"
  ON public.saved_plans FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY "Users can create their own plans"
  ON public.saved_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY "Users can update their own plans"
  ON public.saved_plans FOR UPDATE USING (auth.uid() = user_id);
  
CREATE POLICY "Users can delete their own plans"
  ON public.saved_plans FOR DELETE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger for updated_at
CREATE TRIGGER update_saved_plans_updated_at
  BEFORE UPDATE ON public.saved_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();