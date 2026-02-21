
-- Create page_help_content table
CREATE TABLE public.page_help_content (
  id text PRIMARY KEY,
  page_name text NOT NULL,
  hint_text text NOT NULL,
  help_title text NOT NULL,
  help_body text NOT NULL,
  video_url text,
  video_placeholder_text text NOT NULL DEFAULT 'Video tutorial coming soon',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.page_help_content ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read
CREATE POLICY "Authenticated users can read page help"
  ON public.page_help_content FOR SELECT
  TO authenticated USING (true);

-- Admin CRUD
CREATE POLICY "Admins can insert page help"
  ON public.page_help_content FOR INSERT
  TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update page help"
  ON public.page_help_content FOR UPDATE
  TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete page help"
  ON public.page_help_content FOR DELETE
  TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Add updated_at trigger
CREATE TRIGGER update_page_help_content_updated_at
  BEFORE UPDATE ON public.page_help_content
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed data
INSERT INTO public.page_help_content (id, page_name, hint_text, help_title, help_body, video_url, video_placeholder_text, sort_order, is_active) VALUES
('dashboard', 'Dashboard', 'Learn how to read your dashboard', 'Your Dashboard', E'## Welcome to Your Dashboard\n\nThis is your financial command center. Here''s what each section means:\n\n**Money Leak Estimator** — Shows how much money you may be leaving on the table annually across the Four Horsemen (Interest, Taxes, Insurance, Education). As you complete strategies, the "recovered" amount grows.\n\n**RPRx Score** — Your personalized financial wellness score (0-100) based on five pillars: Cash Flow, Retirement, Insurance, Tax Efficiency, and Stress. Update your profile to improve your score.\n\n**Current Focus Plan** — Your active plan with step-by-step actions. Complete steps to make progress.\n\n**Daily Journey** — Your 30-day onboarding with daily micro-lessons and actions. Complete each day to build momentum.', NULL, 'Video walkthrough coming soon', 1, true),
('profile', 'My Profile', 'Learn what each profile section means', 'Your Profile', E'## Your Profile Powers Your Score\n\nEvery field you fill in helps RPRx give you a more accurate and personalized experience.\n\n**About You** — Basic info that helps us tailor strategies to your situation.\n\n**Cash Flow** — Your income and expenses. This feeds the River (cash flow) pillar of your RPRx Score.\n\n**Emergency Savings** — How much you have set aside. Even a small emergency fund improves your score.\n\n**Retirement Planning** — Your retirement timeline and savings. This feeds the Lake (retirement) pillar.\n\n**Tax Efficiency** — Which tax-advantaged accounts you use. More accounts = better tax score.\n\n**Insurance Coverage** — Simple yes/no for each type. This feeds the Rainbow (protection) pillar.\n\n**How You Feel About Money** — Three quick questions about your financial stress. Be honest — this helps us personalize your journey.', NULL, 'Video walkthrough coming soon', 2, true),
('assessment', 'Assessment', 'Learn how the assessment works', 'Four Horsemen Assessment', E'## How the Assessment Works\n\nThe assessment identifies which of the Four Horsemen — Interest, Taxes, Insurance, or Education — is creating the most financial pressure in your life.\n\n**Answer honestly** — There are no wrong answers. The assessment uses your responses to calculate pressure scores across all four areas.\n\n**It takes about 5 minutes** — Each question helps us understand your unique situation.\n\n**Your results are private** — Only you can see your assessment results.\n\nAfter completing the assessment, you''ll see your results with a personalized strategy recommendation.', NULL, 'Video walkthrough coming soon', 3, true),
('results', 'Results', 'Learn how to read your results', 'Understanding Your Results', E'## Your Assessment Results\n\n**Money Leak Estimator** — The dollar range at the top shows your estimated annual opportunity. This is money you may be able to recover through RPRx strategies.\n\n**Radar Chart** — Shows your pressure levels across all four horsemen. The larger the area, the more pressure in that category.\n\n**Quick Win** — A specific, actionable insight based on your primary pressure area.\n\n**Deep Dive** — Answer 5 additional questions to get more personalized strategy recommendations. This is optional but highly recommended.\n\n**Strategy Recommendations** — After the Deep Dive, you''ll see your top recommended RPRx strategies ranked by match strength and difficulty.', NULL, 'Video walkthrough coming soon', 4, true),
('plans', 'My Plans', 'Learn how plans and strategies work', 'Your Plans', E'## How Plans Work\n\n**Each plan is a step-by-step action guide** based on a specific RPRx strategy. Complete the steps in order to implement the strategy.\n\n**Focus Plan** — The plan with the star icon is your current focus. This is the plan that feeds your Money Leak recovery tracker.\n\n**Completing Steps** — Check off each step as you complete it. Your progress is tracked and contributes to your RPRx Score.\n\n**One Plan at a Time** — Focus on completing your current plan before starting a new one. Finishing one plan well beats starting three plans halfway.', NULL, 'Video walkthrough coming soon', 5, true),
('strategies', 'Strategies', 'Learn about RPRx strategies', 'RPRx Strategies', E'## What Are RPRx Strategies?\n\nRPRx strategies are CPA-proven approaches to reduce financial pressure across the Four Horsemen.\n\n**Each strategy includes:**\n- A clear description of what it does\n- Estimated financial impact\n- Difficulty level (Easy, Moderate, Advanced)\n- Step-by-step implementation plan\n\n**Difficulty Levels:**\n- ⚡ **Easy** — You can do this yourself in a day or two\n- 🔧 **Moderate** — May take 1-4 weeks and some research\n- 🎯 **Advanced** — May benefit from professional guidance\n\n**Activating a Strategy** — When you activate a strategy, it creates a plan with actionable steps tailored to your situation.', NULL, 'Video walkthrough coming soon', 6, true);
