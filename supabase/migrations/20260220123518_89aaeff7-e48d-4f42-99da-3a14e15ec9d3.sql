
-- Create onboarding_content table
CREATE TABLE public.onboarding_content (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  day_number integer NOT NULL,
  phase text NOT NULL,
  horseman_type text NOT NULL,
  content_type text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  action_text text,
  action_type text,
  action_target text,
  quiz_data jsonb,
  points_reward integer NOT NULL DEFAULT 5,
  estimated_minutes integer NOT NULL DEFAULT 3,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.onboarding_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read onboarding content"
  ON public.onboarding_content FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert onboarding content"
  ON public.onboarding_content FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update onboarding content"
  ON public.onboarding_content FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete onboarding content"
  ON public.onboarding_content FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create user_onboarding_progress table
CREATE TABLE public.user_onboarding_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  onboarding_start_date date NOT NULL,
  current_day integer NOT NULL DEFAULT 1,
  completed_days jsonb NOT NULL DEFAULT '[]'::jsonb,
  current_phase text NOT NULL DEFAULT 'clarity',
  streak_count integer NOT NULL DEFAULT 0,
  total_points_earned integer NOT NULL DEFAULT 0,
  quiz_answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  reflections jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'active',
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE public.user_onboarding_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own onboarding progress"
  ON public.user_onboarding_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own onboarding progress"
  ON public.user_onboarding_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own onboarding progress"
  ON public.user_onboarding_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE TRIGGER update_user_onboarding_progress_updated_at
  BEFORE UPDATE ON public.user_onboarding_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add onboarding_completed column to profiles
ALTER TABLE public.profiles ADD COLUMN onboarding_completed boolean NOT NULL DEFAULT false;

-- Seed onboarding content: 30 days universal + horseman variants for days 2, 5, 6, 15
INSERT INTO public.onboarding_content (day_number, phase, horseman_type, content_type, title, body, action_text, action_type, action_target, quiz_data, points_reward, estimated_minutes, sort_order) VALUES
-- Day 1
(1, 'clarity', 'universal', 'milestone', 'Welcome to Your Financial Recovery', E'Most W2 employees are unknowingly leaving $2,000–$8,000 per year on the table through tax inefficiencies, unnecessary interest, insurance gaps, and missed education benefits.\n\nYou''ve already taken the biggest step — you showed up.\n\nYour Money Leak Estimator shows your personalized opportunity. Today, take 2 minutes to review it and let the number sink in.\n\nThis isn''t about cutting back. It''s about recovering what''s already yours.', 'View My Money Leak Estimate', 'navigate', '/dashboard', NULL, 10, 2, 0),

-- Day 2 universal
(2, 'clarity', 'universal', 'action_prompt', 'Your First Micro-Action', E'Take 10 minutes today to gather one key financial document or number you don''t have top of mind.\n\nIt could be your most recent tax refund amount, your highest interest rate, or your health insurance deductible.\n\nJust one number. Awareness starts with visibility.', 'I Found My Number ✓', 'complete_step', NULL, NULL, 10, 10, 0),

-- Day 2 interest
(2, 'clarity', 'interest', 'action_prompt', 'Know Your Debt Landscape', E'Here''s a 10-minute action that changes everything: list every debt you have with its balance, interest rate, and minimum payment.\n\nMost people have never seen all their debts side by side. When you do, patterns emerge — and so do opportunities.\n\nYou don''t need to fix anything today. Just see the full picture.', 'I''ve Listed My Debts ✓', 'complete_step', NULL, NULL, 10, 10, 0),

-- Day 2 taxes
(2, 'clarity', 'taxes', 'action_prompt', 'Check Your Last Tax Refund', E'Pull up your most recent tax return or refund amount. If you got a refund over $500, you''ve been giving the government an interest-free loan.\n\nA $3,000 refund means $250/month that could have been in YOUR paycheck all year.\n\nJust find the number today. We''ll show you what to do with it tomorrow.', 'I Found My Refund Amount ✓', 'complete_step', NULL, NULL, 10, 5, 0),

-- Day 2 insurance
(2, 'clarity', 'insurance', 'action_prompt', 'Your Insurance Reality Check', E'Take 5 minutes to answer this: Do you know exactly what your health insurance deductible is? Your life insurance coverage amount? Whether you have disability insurance?\n\nMost people pay hundreds per month for insurance they don''t fully understand. Today, just check one policy — your health plan. Find your deductible and out-of-pocket maximum.', 'I Checked My Health Plan ✓', 'complete_step', NULL, NULL, 10, 5, 0),

-- Day 2 education
(2, 'clarity', 'education', 'action_prompt', 'The Education Cost Reality', E'Whether you''re paying student loans, saving for your kids'' college, or both — take 5 minutes to write down:\n\n1. Current student loan balance (if any)\n2. Monthly payment amount\n3. Ages of children (if planning for their education)\n\nJust the facts. No stress. Awareness is the first step to strategy.', 'I''ve Written Down My Numbers ✓', 'complete_step', NULL, NULL, 10, 5, 0),

-- Day 3
(3, 'clarity', 'universal', 'milestone', 'You''re Already Ahead', E'In just 2 days, you''ve done more than 90% of people ever do — you''ve looked at your financial reality with clear eyes.\n\nYour RPRx Score reflects this. Check your dashboard to see your updated score and what''s driving it.\n\nRemember: this isn''t about perfection. It''s about progress. And you''re making it.', 'Check My RPRx Score', 'navigate', '/dashboard', NULL, 10, 2, 0),

-- Day 4
(4, 'awareness', 'universal', 'micro_lesson', 'Why These Four Areas Matter Most', E'Every dollar that leaves your household falls into one of four categories:\n\n🔵 Interest — What you pay to borrow money\n🟢 Taxes — What the government takes\n🟣 Insurance — What you pay for protection\n🟡 Education — What you invest in learning\n\nMost financial advice focuses on spending less. RPRx focuses on optimizing these four systems — because that''s where the real money is.\n\nYour assessment identified your primary pressure area. But all four are connected. Optimizing one often improves the others.', 'Got It ✓', 'complete_step', NULL, NULL, 5, 3, 0),

-- Day 5 universal
(5, 'awareness', 'universal', 'micro_lesson', 'Why Your Paycheck Is Smaller Than It Should Be', E'If you''re a W2 employee, your employer withholds taxes from every paycheck based on your W-4 form.\n\nHere''s what most people don''t know: the default W-4 settings almost always over-withhold. That tax refund you look forward to? It''s YOUR money that the government held for free all year.\n\nA $4,800 refund = $400/month you could have had in your pocket.\n\nThe RPRx Paycheck Maximizer™ strategy fixes this in one day. If taxes are your primary area, this might already be in your plan.', 'I Didn''t Know That ✓', 'complete_step', NULL, NULL, 5, 3, 0),

-- Day 6 universal
(6, 'awareness', 'universal', 'micro_lesson', 'The Real Cost of Minimum Payments', E'A $5,000 credit card balance at 22% interest with minimum payments takes 17 years to pay off — and you''ll pay over $8,000 in interest alone.\n\nThat''s $8,000 that could have gone to your retirement, your kids'' education, or your emergency fund.\n\nThe good news? Strategic debt restructuring can cut that timeline and cost dramatically. That''s what RPRx strategies like the Rate Crusher™ and Interest Freeze™ are designed to do.', 'Eye-Opening ✓', 'complete_step', NULL, NULL, 5, 3, 0),

-- Day 7 quiz
(7, 'awareness', 'universal', 'quiz', 'Week 1 Complete — Let''s Check In', 'You''ve completed your first week. Let''s see what stuck.\n\nQuick quiz — no wrong answers, just awareness:', 'Take the Quiz', 'answer_quiz', NULL, '{"questions":[{"question":"What does a large tax refund actually mean?","options":[{"label":"The government owed me money","value":"a"},{"label":"I over-withheld and gave the government an interest-free loan","value":"b"},{"label":"I made too much money","value":"c"}],"correct":"b"},{"question":"What''s the most effective way to reduce debt cost?","options":[{"label":"Pay minimums and wait","value":"a"},{"label":"Stop using credit cards","value":"b"},{"label":"Strategically restructure rates and payment order","value":"c"}],"correct":"c"},{"question":"RPRx focuses on:","options":[{"label":"Cutting your spending","value":"a"},{"label":"Optimizing the systems that take your money","value":"b"},{"label":"Investing in stocks","value":"c"}],"correct":"b"}]}', 15, 3, 0),

-- Day 8
(8, 'awareness', 'universal', 'micro_lesson', 'Are You Over-Insured, Under-Insured, or Both?', E'Here''s a surprising fact: most families are simultaneously over-insured in some areas and dangerously under-insured in others.\n\nYou might be paying for dental insurance that costs more than your dental bills. Meanwhile, you might have zero disability insurance — which protects your most valuable asset: your ability to earn income.\n\nThe RPRx Protection Scan™ helps you find both the waste and the gaps.', 'Makes Sense ✓', 'complete_step', NULL, NULL, 5, 3, 0),

-- Day 9
(9, 'awareness', 'universal', 'micro_lesson', 'The Education Money Most People Miss', E'Whether you''re paying student loans or saving for your kids'' college, there''s money being left on the table:\n\n• Education tax credits worth up to $2,500/year that many families don''t claim\n• 529 plans with state tax deductions most people don''t know about\n• Employer tuition assistance — up to $5,250/year tax-free that goes unclaimed\n• FAFSA strategies that can increase aid eligibility by thousands\n\nEducation is expensive. But it doesn''t have to cost as much as you think.', 'Good to Know ✓', 'complete_step', NULL, NULL, 5, 3, 0),

-- Day 10
(10, 'awareness', 'universal', 'reflection', 'Reflect: Where''s Your Biggest Opportunity?', E'You''ve now learned about all four areas where money leaks happen. Take a moment to reflect:\n\nWhich area surprised you the most? Which one do you think has the biggest untapped opportunity for YOUR situation?\n\nType your thoughts below. There''s no right answer — this is for you.', 'Save My Reflection', 'reflect', NULL, NULL, 10, 5, 0),

-- Day 11
(11, 'second_win', 'universal', 'action_prompt', 'How''s Your Plan Going?', E'You''ve been working on your focused plan. Let''s check in:\n\nOpen your plan and review your progress. Have you completed any steps? Are you stuck on one?\n\nIf you''re stuck, that''s normal. Most people hit a pause point around step 3-4. The key is to identify what''s blocking you and take one small action today.\n\nEven completing ONE more step today moves your recovery forward.', 'Go to My Plan', 'navigate', '/plans', NULL, 10, 5, 0),

-- Day 12
(12, 'second_win', 'universal', 'micro_lesson', 'Why Small Actions Create Big Results', E'Here''s the math most people miss:\n\n• Adjusting your W-4 = $200/month\n• Optimizing one insurance policy = $50/month\n• Restructuring one debt = $75/month\n• Claiming one missed tax credit = $200/year\n\nAlone, each feels small. Together? That''s $4,100/year back in your pocket.\n\nAnd that''s just the beginning. Each completed strategy unlocks the next opportunity.\n\nThis is the RPRx compound effect.', 'I See It Now ✓', 'complete_step', NULL, NULL, 5, 3, 0),

-- Day 13
(13, 'second_win', 'universal', 'action_prompt', 'What''s Next After Your Current Plan?', E'You''re working on your primary area. But your assessment showed pressure in other areas too.\n\nTake a look at your results page — what was your SECOND highest pressure area? That''s where your next opportunity lives.\n\nYou don''t need to act on it yet. Just be aware. When you finish your current plan, you''ll know exactly where to go next.', 'View My Assessment Results', 'navigate', '/results', NULL, 5, 3, 0),

-- Day 14
(14, 'second_win', 'universal', 'milestone', '14 Days of Financial Awareness', E'Two weeks ago, you started this journey. Think about what''s changed:\n\n✅ You know where your money pressure comes from\n✅ You have a plan with real steps\n✅ You''ve learned strategies most people never hear about\n✅ Your RPRx Score reflects your progress\n\nYou''re not just learning — you''re transforming how you relate to your finances.\n\nCheck your Money Leak Estimator to see how much you''ve already started recovering.', 'Check My Progress', 'navigate', '/dashboard', NULL, 15, 2, 0),

-- Day 15 universal
(15, 'second_win', 'universal', 'micro_lesson', 'A Strategy Deep Dive', E'By now you''ve learned the basics of all four horsemen. Today, let''s go deeper into your primary area.\n\nReview your current plan steps and identify any that feel unclear. Understanding WHY each step matters makes it easier to take action.\n\nEvery strategy in RPRx is CPA-proven and designed for W2 employees. You''re not experimenting — you''re following a tested playbook.', 'Review My Plan', 'navigate', '/plans', NULL, 5, 3, 0),

-- Day 15 interest
(15, 'second_win', 'interest', 'micro_lesson', 'The Rate Crusher Secret', E'Here''s something most people don''t realize: you can often negotiate lower interest rates just by calling your credit card company and asking.\n\nThe script is simple: ''I''ve been a customer for X years. I''ve seen offers for lower rates elsewhere. Can you match a lower rate to keep my business?''\n\nSuccess rate? About 70%. Average reduction? 3-6 percentage points.\n\nOn a $5,000 balance, that''s $150-300/year saved with one phone call.', 'Worth Trying ✓', 'complete_step', NULL, NULL, 5, 3, 0),

-- Day 15 taxes
(15, 'second_win', 'taxes', 'micro_lesson', 'The HSA Secret Weapon', E'If your employer offers a High Deductible Health Plan (HDHP), you have access to the most tax-advantaged account in existence: the HSA.\n\nTriple tax benefit:\n1. Contributions reduce your taxable income\n2. Growth is tax-free\n3. Withdrawals for medical expenses are tax-free\n\nAfter age 65, it works like a Traditional IRA for ANY purpose.\n\nMax contribution for 2026: $4,300 individual, $8,550 family.\n\nThat''s up to $3,000/year in tax savings most people miss.', 'I Need to Look Into This ✓', 'complete_step', NULL, NULL, 5, 3, 0),

-- Day 15 insurance
(15, 'second_win', 'insurance', 'micro_lesson', 'The Deductible Math Trick', E'Most people pick the lowest deductible health plan because it feels safer. But here''s the math:\n\nPlan A: $500 deductible, $600/month premium = $7,200/year\nPlan B: $2,000 deductible, $400/month premium = $4,800/year\n\nPlan B saves $2,400/year in premiums. Even if you hit the full deductible, you''re still ahead by $900.\n\nAnd if you put the premium savings into an HSA? You get a tax deduction too.\n\nThis is what the RPRx Smart Deductible™ strategy is all about.', 'The Math Makes Sense ✓', 'complete_step', NULL, NULL, 5, 3, 0),

-- Day 15 education
(15, 'second_win', 'education', 'micro_lesson', 'The FAFSA Timing Secret', E'FAFSA uses your income from TWO years prior (called the ''prior-prior year''). This means you can strategically reduce your reportable income BEFORE it counts.\n\nHow? Maximize 401(k), HSA, and FSA contributions in the year that FAFSA will look at.\n\nFor a family in the 47% financial aid assessment rate, every $1,000 of income reduction = $470 more in financial aid eligibility.\n\nTiming is everything. And most families don''t know this until it''s too late.', 'This Changes Things ✓', 'complete_step', NULL, NULL, 5, 3, 0),

-- Day 16
(16, 'second_win', 'universal', 'action_prompt', 'Take One Step Today', E'Open your active plan right now and complete the next unchecked step.\n\nDon''t overthink it. Don''t plan to do it later. Just one step, right now.\n\nThe difference between people who recover thousands and those who don''t? They take action in the moment, not "someday."', 'Go to My Plan', 'navigate', '/plans', NULL, 10, 5, 0),

-- Day 17
(17, 'second_win', 'universal', 'micro_lesson', 'Myth: You Need to Earn More to Get Ahead', E'Most people think the solution to financial pressure is earning more money. But here''s the truth:\n\nA $5,000 raise at a 30% tax bracket only puts $3,500 in your pocket.\n\nRecovering $5,000 through RPRx strategies? That''s $5,000 you actually keep — because you''re optimizing money you already earn.\n\nOptimizing beats earning. Every time.', 'Mind = Blown ✓', 'complete_step', NULL, NULL, 5, 3, 0),

-- Day 18
(18, 'second_win', 'universal', 'reflection', 'Your Halfway Reflection', E'You''re past the halfway point of your 30-day journey. Take a moment:\n\n• What''s been the most surprising insight so far?\n• What action have you taken that you''re most proud of?\n• What do you want to focus on in the second half?\n\nYour answers help solidify your progress and set your direction.', 'Save My Reflection', 'reflect', NULL, NULL, 10, 5, 0),

-- Day 19
(19, 'identity', 'universal', 'micro_lesson', 'The Truth Nobody Tells You', E'You''re not bad with money. You were never taught how the system works.\n\nSchools don''t teach W-4 optimization. Employers don''t explain HSA strategy. Nobody shows you how to sequence debt payoff for maximum impact.\n\nThe fact that you''re here, learning, and taking action? That makes you smarter than 95% of people when it comes to financial strategy.\n\nYou''re not catching up. You''re leveling up.', 'I Needed to Hear That ✓', 'complete_step', NULL, NULL, 10, 2, 0),

-- Day 20
(20, 'identity', 'universal', 'reflection', 'Who Are You Becoming?', E'Think about how you felt about money 20 days ago vs. today.\n\n20 days ago, you might have felt confused, stressed, or behind.\n\nToday, you have:\n• A clear picture of where pressure comes from\n• A plan with real steps\n• Knowledge that most people don''t have\n• A score that tracks your progress\n\nWrite one sentence that describes who you''re becoming financially. Not who you were. Who you''re becoming.', 'Save My Identity Statement', 'reflect', NULL, NULL, 10, 5, 0),

-- Day 21
(21, 'identity', 'universal', 'milestone', '21 Days — A Habit Is Forming', E'They say it takes 21 days to form a habit. You''ve just done it.\n\nYou now have a habit of:\n✅ Paying attention to your financial systems\n✅ Learning strategies that save real money\n✅ Taking action on your plan\n✅ Tracking your progress\n\nThis is what financial wellness looks like. Not restriction. Not sacrifice. Awareness, strategy, and momentum.\n\nYour RPRx Score reflects the real you. Check it now.', 'See My Score', 'navigate', '/dashboard', NULL, 20, 2, 0),

-- Day 22
(22, 'identity', 'universal', 'micro_lesson', 'Advanced Optimization Tips', E'Here''s a pro tip most financial advisors won''t tell you:\n\nThe order in which you optimize matters. Start with the highest-impact, lowest-effort strategies first.\n\nFor most W2 employees, that means:\n1. W-4 adjustment (immediate paycheck increase)\n2. HSA/FSA optimization (tax savings + protection)\n3. Debt restructuring (reduces ongoing drain)\n4. Insurance review (eliminates waste)\n\nYou don''t need to do everything at once. You need to do the right thing next.', 'Smart Approach ✓', 'complete_step', NULL, NULL, 5, 3, 0),

-- Day 23
(23, 'identity', 'universal', 'action_prompt', 'Share Your Progress', E'You''ve been on this journey for over three weeks. You''ve learned things most people never discover.\n\nIf you know someone who might benefit from understanding their financial pressure points, consider sharing what you''ve learned.\n\nYou don''t need to sell anything. Just share one insight that surprised you. That''s how financial awareness spreads.', 'I''ll Think About It ✓', 'complete_step', NULL, NULL, 5, 2, 0),

-- Day 24
(24, 'identity', 'universal', 'micro_lesson', 'The Cross-Horseman Connection', E'Here''s what makes RPRx powerful: the four horsemen are interconnected.\n\n• Reducing debt (Interest) frees up cash for tax-advantaged accounts (Taxes)\n• Optimizing insurance (Insurance) can lower your monthly obligations, accelerating debt payoff (Interest)\n• Education tax credits (Education) reduce your tax burden (Taxes)\n• A well-funded HSA (Taxes) IS your health insurance optimization (Insurance)\n\nWhen you optimize one area, you create opportunities in the others. That''s the RPRx system effect.', 'It All Connects ✓', 'complete_step', NULL, NULL, 5, 3, 0),

-- Day 25
(25, 'identity', 'universal', 'action_prompt', 'Finish Strong', E'You have 5 days left in your onboarding journey. Let''s make them count.\n\nOpen your active plan and look at your remaining steps. Can you complete one more before Day 30?\n\nEvery step you complete now builds momentum for your long-term financial transformation. You''re in the home stretch.', 'Go to My Plan', 'navigate', '/plans', NULL, 10, 5, 0),

-- Day 26
(26, 'vision', 'universal', 'micro_lesson', 'What Happens When You Keep Going', E'If you recover $3,000/year through RPRx strategies and invest it at 7% average return:\n\n• Year 1: $3,000\n• Year 3: $9,660\n• Year 5: $17,250\n• Year 10: $41,450\n\nThat''s from ONE area of optimization. Imagine optimizing all four horsemen.\n\nThis is why RPRx isn''t a one-time fix. It''s a system that compounds over your entire financial life.', 'Show Me More ✓', 'complete_step', NULL, NULL, 5, 3, 0),

-- Day 27
(27, 'vision', 'universal', 'action_prompt', 'What''s Your Next Move?', E'You''ve been working on your primary area. Your assessment showed other opportunities too.\n\nWith the full RPRx system, you can:\n• Work on multiple plans simultaneously\n• Access all 300+ CPA-proven strategies\n• Get personalized recommendations as your situation changes\n• Track your total recovery across all four horsemen\n\nYour next biggest lever is waiting. Are you ready to unlock it?', 'Explore Full Access', 'navigate', '/plans', NULL, 5, 3, 0),

-- Day 28
(28, 'vision', 'universal', 'action_prompt', 'How Do You Feel Now?', E'On Day 1, you answered three questions about how you feel about money. Let''s revisit them.\n\nHave your answers changed? Update your stress responses in your profile and watch your RPRx Score adjust.\n\nMost users see a meaningful improvement in their stress scores after 30 days — because awareness and action reduce anxiety.', 'Update My Stress Answers', 'navigate', '/profile', NULL, 10, 3, 0),

-- Day 29
(29, 'vision', 'universal', 'reflection', 'Look How Far You''ve Come', E'Tomorrow marks 30 days. Before we get there, take a moment:\n\n• What''s the most valuable thing you learned?\n• What action had the biggest impact?\n• What would you tell a friend about RPRx?\n\nWrite your thoughts below. Your journey is unique, and your insights matter.', 'Save My Reflection', 'reflect', NULL, NULL, 10, 5, 0),

-- Day 30
(30, 'vision', 'universal', 'milestone', '30 Days Complete — This Is Just the Start', E'🎉 You did it.\n\nIn 30 days, you''ve:\n✅ Discovered your hidden financial opportunities\n✅ Started recovering money you didn''t know you were missing\n✅ Learned strategies that most people never hear about\n✅ Built a habit of financial awareness\n✅ Shifted from stressed to strategic\n\nYour Money Leak Estimator shows what you''ve already started recovering. Your RPRx Score shows how much stronger your financial foundation is.\n\nBut here''s the truth: you''ve only scratched the surface. There are hundreds more strategies waiting for you across all four horsemen.\n\nYour financial paradise is being built. Keep going.', 'See My Full Dashboard', 'navigate', '/dashboard', NULL, 50, 3, 0);

-- Seed badge definitions for onboarding
INSERT INTO public.badge_definitions (id, name, description, icon, points, category, trigger_type, trigger_value, sort_order, is_active) VALUES
('onboarding_week1', 'Week 1 Complete', 'Complete your first 7 days of the RPRx journey', '📅', 25, 'milestone', 'onboarding_milestone', '{"day": 7}', 22, true),
('onboarding_week2', 'Two Weeks Strong', 'Complete 14 days of the RPRx journey', '💪', 40, 'milestone', 'onboarding_milestone', '{"day": 14}', 23, true),
('onboarding_month', '30-Day Transformer', 'Complete the full 30-day RPRx journey', '🏆', 100, 'milestone', 'onboarding_milestone', '{"day": 30}', 24, true),
('quiz_ace', 'Quiz Ace', 'Answer all quiz questions correctly', '🧠', 25, 'milestone', 'onboarding_milestone', '{"perfect_quiz": true}', 25, true);

-- Seed dashboard card config for onboarding
INSERT INTO public.dashboard_card_config (id, display_name, component_key, sort_order, is_visible, default_size, description) VALUES
('onboarding', 'Daily Journey', 'OnboardingCard', 2, true, 'full', '30-day onboarding journey with daily micro-lessons and actions');
