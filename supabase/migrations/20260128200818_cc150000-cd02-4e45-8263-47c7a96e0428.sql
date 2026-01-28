-- Create enum types
CREATE TYPE question_type AS ENUM ('slider', 'single_choice', 'yes_no', 'range_select');
CREATE TYPE cash_flow_status AS ENUM ('surplus', 'tight', 'deficit');
CREATE TYPE horseman_type AS ENUM ('interest', 'taxes', 'insurance', 'education');

-- Create assessment_questions table
CREATE TABLE public.assessment_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_text TEXT NOT NULL,
  question_type question_type NOT NULL,
  order_index INTEGER NOT NULL,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  horseman_weights JSONB NOT NULL DEFAULT '{}'::jsonb,
  category TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_assessments table
CREATE TABLE public.user_assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  interest_score INTEGER NOT NULL DEFAULT 0,
  taxes_score INTEGER NOT NULL DEFAULT 0,
  insurance_score INTEGER NOT NULL DEFAULT 0,
  education_score INTEGER NOT NULL DEFAULT 0,
  primary_horseman horseman_type,
  cash_flow_status cash_flow_status,
  income_range TEXT,
  expense_range TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create assessment_responses table
CREATE TABLE public.assessment_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id UUID NOT NULL REFERENCES public.user_assessments(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.assessment_questions(id) ON DELETE CASCADE,
  response_value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.assessment_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_responses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for assessment_questions (public read)
CREATE POLICY "Anyone can read assessment questions"
  ON public.assessment_questions
  FOR SELECT
  USING (true);

-- RLS Policies for user_assessments (user owns)
CREATE POLICY "Users can view their own assessments"
  ON public.user_assessments
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own assessments"
  ON public.user_assessments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own assessments"
  ON public.user_assessments
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own assessments"
  ON public.user_assessments
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for assessment_responses (user owns via assessment)
CREATE POLICY "Users can view their own responses"
  ON public.assessment_responses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_assessments
      WHERE user_assessments.id = assessment_responses.assessment_id
      AND user_assessments.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create responses for their assessments"
  ON public.assessment_responses
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_assessments
      WHERE user_assessments.id = assessment_responses.assessment_id
      AND user_assessments.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own responses"
  ON public.assessment_responses
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_assessments
      WHERE user_assessments.id = assessment_responses.assessment_id
      AND user_assessments.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own responses"
  ON public.assessment_responses
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_assessments
      WHERE user_assessments.id = assessment_responses.assessment_id
      AND user_assessments.user_id = auth.uid()
    )
  );

-- Seed assessment questions
-- Interest (Debt Pressure) - Questions 1-4
INSERT INTO public.assessment_questions (question_text, question_type, order_index, options, horseman_weights, category) VALUES
(
  'How often do you think about debt payments when making everyday spending decisions?',
  'slider',
  1,
  '[{"value": "never", "label": "Never", "score": 0}, {"value": "sometimes", "label": "Sometimes", "score": 33}, {"value": "often", "label": "Often", "score": 66}, {"value": "always", "label": "Always", "score": 100}]'::jsonb,
  '{"interest": 1.0}'::jsonb,
  'interest'
),
(
  'Do you currently have any credit card balances that carry over month to month?',
  'yes_no',
  2,
  '[{"value": "yes", "label": "Yes", "score": 100}, {"value": "no", "label": "No", "score": 0}]'::jsonb,
  '{"interest": 1.0}'::jsonb,
  'interest'
),
(
  'How would you describe your comfort level with your current debt situation?',
  'single_choice',
  3,
  '[{"value": "very_comfortable", "label": "Very comfortable", "score": 0}, {"value": "somewhat_comfortable", "label": "Somewhat comfortable", "score": 33}, {"value": "somewhat_uncomfortable", "label": "Somewhat uncomfortable", "score": 66}, {"value": "very_uncomfortable", "label": "Very uncomfortable", "score": 100}]'::jsonb,
  '{"interest": 1.0}'::jsonb,
  'interest'
),
(
  'In the past year, have you taken on new debt to cover unexpected expenses?',
  'yes_no',
  4,
  '[{"value": "yes", "label": "Yes", "score": 100}, {"value": "no", "label": "No", "score": 0}]'::jsonb,
  '{"interest": 1.0}'::jsonb,
  'interest'
),

-- Taxes (Tax Leakage) - Questions 5-8
(
  'How confident are you that you''re keeping as much of your income as possible?',
  'slider',
  5,
  '[{"value": "not_at_all", "label": "Not at all", "score": 100}, {"value": "slightly", "label": "Slightly", "score": 66}, {"value": "moderately", "label": "Moderately", "score": 33}, {"value": "very", "label": "Very", "score": 0}]'::jsonb,
  '{"taxes": 1.0}'::jsonb,
  'taxes'
),
(
  'Do you have a clear understanding of how your income is taxed?',
  'single_choice',
  6,
  '[{"value": "crystal_clear", "label": "Crystal clear", "score": 0}, {"value": "general_idea", "label": "General idea", "score": 33}, {"value": "somewhat_fuzzy", "label": "Somewhat fuzzy", "score": 66}, {"value": "no_idea", "label": "No idea", "score": 100}]'::jsonb,
  '{"taxes": 1.0}'::jsonb,
  'taxes'
),
(
  'Have you explored ways to reduce your tax burden in the past year?',
  'yes_no',
  7,
  '[{"value": "yes", "label": "Yes", "score": 0}, {"value": "no", "label": "No", "score": 100}]'::jsonb,
  '{"taxes": 1.0}'::jsonb,
  'taxes'
),
(
  'How often do you feel surprised by your tax bill or refund amount?',
  'single_choice',
  8,
  '[{"value": "never", "label": "Never", "score": 0}, {"value": "rarely", "label": "Rarely", "score": 33}, {"value": "sometimes", "label": "Sometimes", "score": 66}, {"value": "often", "label": "Often", "score": 100}]'::jsonb,
  '{"taxes": 1.0}'::jsonb,
  'taxes'
),

-- Insurance (Protection Costs) - Questions 9-12
(
  'How confident are you that your insurance coverage matches your actual needs?',
  'slider',
  9,
  '[{"value": "not_at_all", "label": "Not at all", "score": 100}, {"value": "slightly", "label": "Slightly", "score": 66}, {"value": "moderately", "label": "Moderately", "score": 33}, {"value": "very", "label": "Very", "score": 0}]'::jsonb,
  '{"insurance": 1.0}'::jsonb,
  'insurance'
),
(
  'When was the last time you reviewed all your insurance policies together?',
  'single_choice',
  10,
  '[{"value": "within_6_months", "label": "Within 6 months", "score": 0}, {"value": "within_1_year", "label": "Within 1 year", "score": 33}, {"value": "1_3_years", "label": "1-3 years ago", "score": 66}, {"value": "cant_remember", "label": "Can''t remember", "score": 100}]'::jsonb,
  '{"insurance": 1.0}'::jsonb,
  'insurance'
),
(
  'Do you know approximately how much you pay monthly across all insurance types?',
  'yes_no',
  11,
  '[{"value": "yes", "label": "Yes", "score": 0}, {"value": "no", "label": "No", "score": 100}]'::jsonb,
  '{"insurance": 1.0}'::jsonb,
  'insurance'
),
(
  'Have you ever felt you were paying for coverage you don''t need?',
  'single_choice',
  12,
  '[{"value": "never", "label": "Never", "score": 0}, {"value": "once_or_twice", "label": "Once or twice", "score": 33}, {"value": "sometimes", "label": "Sometimes", "score": 66}, {"value": "often", "label": "Often", "score": 100}]'::jsonb,
  '{"insurance": 1.0}'::jsonb,
  'insurance'
),

-- Education (Future Funding) - Questions 13-15
(
  'How prepared do you feel for future education costs (for yourself or children or grandchildren)?',
  'slider',
  13,
  '[{"value": "not_at_all", "label": "Not at all", "score": 100}, {"value": "slightly", "label": "Slightly", "score": 66}, {"value": "moderately", "label": "Moderately", "score": 33}, {"value": "very", "label": "Very", "score": 0}]'::jsonb,
  '{"education": 1.0}'::jsonb,
  'education'
),
(
  'Do you have a specific savings plan for education expenses?',
  'yes_no',
  14,
  '[{"value": "yes", "label": "Yes", "score": 0}, {"value": "no", "label": "No", "score": 100}]'::jsonb,
  '{"education": 1.0}'::jsonb,
  'education'
),
(
  'How much do education funding concerns impact your current financial decisions?',
  'single_choice',
  15,
  '[{"value": "not_at_all", "label": "Not at all", "score": 0}, {"value": "slightly", "label": "Slightly", "score": 33}, {"value": "moderately", "label": "Moderately", "score": 66}, {"value": "significantly", "label": "Significantly", "score": 100}]'::jsonb,
  '{"education": 1.0}'::jsonb,
  'education'
),

-- Cash Flow Questions 16-17
(
  'What is your approximate monthly household income range?',
  'range_select',
  16,
  '[{"value": "under_3000", "label": "Under $3,000", "midpoint": 2000}, {"value": "3000_5000", "label": "$3,000 - $5,000", "midpoint": 4000}, {"value": "5000_7500", "label": "$5,000 - $7,500", "midpoint": 6250}, {"value": "7500_10000", "label": "$7,500 - $10,000", "midpoint": 8750}, {"value": "10000_15000", "label": "$10,000 - $15,000", "midpoint": 12500}, {"value": "over_15000", "label": "Over $15,000", "midpoint": 20000}]'::jsonb,
  '{}'::jsonb,
  'cash_flow'
),
(
  'What is your approximate monthly household expense range?',
  'range_select',
  17,
  '[{"value": "under_3000", "label": "Under $3,000", "midpoint": 2000}, {"value": "3000_5000", "label": "$3,000 - $5,000", "midpoint": 4000}, {"value": "5000_7500", "label": "$5,000 - $7,500", "midpoint": 6250}, {"value": "7500_10000", "label": "$7,500 - $10,000", "midpoint": 8750}, {"value": "10000_15000", "label": "$10,000 - $15,000", "midpoint": 12500}, {"value": "over_15000", "label": "Over $15,000", "midpoint": 20000}]'::jsonb,
  '{}'::jsonb,
  'cash_flow'
);

-- Create indexes for performance
CREATE INDEX idx_user_assessments_user_id ON public.user_assessments(user_id);
CREATE INDEX idx_user_assessments_created_at ON public.user_assessments(created_at DESC);
CREATE INDEX idx_assessment_responses_assessment_id ON public.assessment_responses(assessment_id);
CREATE INDEX idx_assessment_questions_order ON public.assessment_questions(order_index);