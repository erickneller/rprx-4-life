
-- Create deep_dive_questions table
CREATE TABLE public.deep_dive_questions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  horseman_type text NOT NULL,
  question_text text NOT NULL,
  question_type text NOT NULL,
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  order_index integer NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.deep_dive_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read deep dive questions"
  ON public.deep_dive_questions FOR SELECT USING (true);

-- Create user_deep_dives table
CREATE TABLE public.user_deep_dives (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  assessment_id uuid NOT NULL REFERENCES public.user_assessments(id) ON DELETE CASCADE,
  horseman_type text NOT NULL,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  completed_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.user_deep_dives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own deep dives"
  ON public.user_deep_dives FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own deep dives"
  ON public.user_deep_dives FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own deep dives"
  ON public.user_deep_dives FOR DELETE USING (auth.uid() = user_id);

-- Seed: Interest questions
INSERT INTO public.deep_dive_questions (horseman_type, question_text, question_type, options, order_index) VALUES
('interest', 'Which types of debt do you currently carry?', 'multi_select',
 '[{"value":"credit_cards","label":"Credit Cards","score":3},{"value":"student_loans","label":"Student Loans","score":2},{"value":"auto_loans","label":"Auto Loans","score":2},{"value":"mortgage","label":"Mortgage","score":1},{"value":"medical","label":"Medical Debt","score":3},{"value":"personal_loans","label":"Personal Loans","score":3},{"value":"heloc","label":"HELOC","score":1}]', 1),
('interest', 'What is your approximate total non-mortgage debt?', 'range_select',
 '[{"value":"under_5k","label":"Under $5K","score":1},{"value":"5k_15k","label":"$5K-$15K","score":2},{"value":"15k_30k","label":"$15K-$30K","score":3},{"value":"30k_50k","label":"$30K-$50K","score":4},{"value":"over_50k","label":"Over $50K","score":5}]', 2),
('interest', 'What is the highest interest rate you''re currently paying on any debt?', 'range_select',
 '[{"value":"under_5","label":"Under 5%","score":1},{"value":"5_10","label":"5-10%","score":2},{"value":"10_18","label":"10-18%","score":3},{"value":"18_25","label":"18-25%","score":4},{"value":"over_25","label":"Over 25%","score":5},{"value":"not_sure","label":"Not sure","score":3}]', 3),
('interest', 'Have you ever consolidated or refinanced any debt?', 'single_choice',
 '[{"value":"yes","label":"Yes","score":1},{"value":"no","label":"No","score":3},{"value":"didnt_know","label":"I didn''t know I could","score":5}]', 4),
('interest', 'If you could eliminate one financial stress tomorrow, what would it be?', 'single_choice',
 '[{"value":"credit_cards","label":"Credit card payments","score":5},{"value":"student_loans","label":"Student loan payments","score":4},{"value":"car","label":"Car payment","score":3},{"value":"medical","label":"Medical bills","score":4},{"value":"breathing_room","label":"Just having breathing room","score":3}]', 5);

-- Seed: Taxes questions
INSERT INTO public.deep_dive_questions (horseman_type, question_text, question_type, options, order_index) VALUES
('taxes', 'What was your approximate tax refund or amount owed last year?', 'range_select',
 '[{"value":"owed_1k_plus","label":"Owed $1K+","score":4},{"value":"owed_under_1k","label":"Owed under $1K","score":3},{"value":"broke_even","label":"Broke even","score":1},{"value":"refund_500_2k","label":"Refund $500-$2K","score":2},{"value":"refund_2k_5k","label":"Refund $2K-$5K","score":3},{"value":"refund_over_5k","label":"Refund over $5K","score":5}]', 1),
('taxes', 'Do you currently contribute to any of these?', 'multi_select',
 '[{"value":"401k","label":"401(k)/403(b)","score":1},{"value":"trad_ira","label":"Traditional IRA","score":1},{"value":"roth_ira","label":"Roth IRA","score":1},{"value":"hsa","label":"HSA","score":1},{"value":"fsa","label":"FSA","score":1},{"value":"529","label":"529 Plan","score":1},{"value":"none","label":"None of these","score":5}]', 2),
('taxes', 'Does your employer offer a retirement contribution match?', 'single_choice',
 '[{"value":"yes","label":"Yes","score":1},{"value":"no","label":"No","score":3},{"value":"not_sure","label":"Not sure","score":4}]', 3),
('taxes', 'Do you itemize deductions or take the standard deduction?', 'single_choice',
 '[{"value":"itemize","label":"I itemize","score":1},{"value":"standard","label":"Standard deduction","score":2},{"value":"not_sure","label":"Not sure","score":4}]', 4),
('taxes', 'Have you ever worked with a tax professional to optimize your withholdings?', 'single_choice',
 '[{"value":"yes_regularly","label":"Yes regularly","score":1},{"value":"once_twice","label":"Once or twice","score":2},{"value":"never","label":"Never","score":4},{"value":"software_only","label":"I use tax software only","score":3}]', 5);

-- Seed: Insurance questions
INSERT INTO public.deep_dive_questions (horseman_type, question_text, question_type, options, order_index) VALUES
('insurance', 'Which insurance types do you currently pay for?', 'multi_select',
 '[{"value":"health","label":"Health","score":1},{"value":"life","label":"Life","score":1},{"value":"disability","label":"Disability","score":1},{"value":"auto","label":"Auto","score":1},{"value":"home_renters","label":"Home/Renters","score":1},{"value":"umbrella","label":"Umbrella","score":1},{"value":"dental_vision","label":"Dental/Vision","score":1},{"value":"ltc","label":"Long-term Care","score":1}]', 1),
('insurance', 'What is your approximate total monthly insurance spend?', 'range_select',
 '[{"value":"under_200","label":"Under $200","score":1},{"value":"200_500","label":"$200-$500","score":2},{"value":"500_1000","label":"$500-$1,000","score":3},{"value":"1000_1500","label":"$1,000-$1,500","score":4},{"value":"over_1500","label":"Over $1,500","score":5}]', 2),
('insurance', 'Do you have life insurance through your employer?', 'single_choice',
 '[{"value":"yes","label":"Yes","score":1},{"value":"no","label":"No","score":3},{"value":"not_sure","label":"Not sure","score":4}]', 3),
('insurance', 'Have you ever had a claim denied or a coverage gap when you needed it?', 'single_choice',
 '[{"value":"yes","label":"Yes","score":5},{"value":"no","label":"No","score":1}]', 4),
('insurance', 'If you could change one thing about your insurance, what would it be?', 'single_choice',
 '[{"value":"pay_less","label":"Pay less for it","score":3},{"value":"better_coverage","label":"Get better coverage","score":4},{"value":"understand","label":"Understand what I actually have","score":5},{"value":"protect_family","label":"Better protect my family","score":4}]', 5);

-- Seed: Education questions
INSERT INTO public.deep_dive_questions (horseman_type, question_text, question_type, options, order_index) VALUES
('education', 'Who are you planning education funding for?', 'multi_select',
 '[{"value":"myself","label":"Myself","score":2},{"value":"spouse","label":"Spouse/Partner","score":2},{"value":"children","label":"Child(ren)","score":3},{"value":"grandchildren","label":"Grandchild(ren)","score":2}]', 1),
('education', 'When do you anticipate needing education funding?', 'single_choice',
 '[{"value":"already_paying","label":"Already paying","score":5},{"value":"1_3_years","label":"Within 1-3 years","score":4},{"value":"3_5_years","label":"3-5 years","score":3},{"value":"5_10_years","label":"5-10 years","score":2},{"value":"10_plus","label":"10+ years","score":1}]', 2),
('education', 'What type of education are you planning for?', 'multi_select',
 '[{"value":"community_college","label":"Community College","score":2},{"value":"4_year","label":"4-Year University","score":4},{"value":"graduate","label":"Graduate/Professional School","score":5},{"value":"trade","label":"Trade/Vocational","score":2},{"value":"certification","label":"Certification Programs","score":1}]', 3),
('education', 'Have you explored financial aid, scholarships, or education tax credits?', 'single_choice',
 '[{"value":"yes_actively","label":"Yes actively","score":1},{"value":"somewhat","label":"Somewhat","score":2},{"value":"no","label":"No","score":4},{"value":"didnt_know","label":"Didn''t know these applied to me","score":5}]', 4),
('education', 'Do you currently have a 529 plan or education savings account?', 'single_choice',
 '[{"value":"yes","label":"Yes","score":1},{"value":"no","label":"No","score":3},{"value":"whats_that","label":"What''s that?","score":5}]', 5);
