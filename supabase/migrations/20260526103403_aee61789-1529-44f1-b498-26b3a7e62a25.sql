
CREATE TABLE public.landing_card_config (
  id text PRIMARY KEY,
  component_key text NOT NULL,
  display_name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.landing_card_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read landing cards"
  ON public.landing_card_config FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can insert landing cards"
  ON public.landing_card_config FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update landing cards"
  ON public.landing_card_config FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete landing cards"
  ON public.landing_card_config FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER set_landing_card_config_updated_at
  BEFORE UPDATE ON public.landing_card_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed sections
INSERT INTO public.landing_card_config (id, component_key, display_name, sort_order, content) VALUES
('hero', 'Hero', 'Hero', 10, '{
  "badge": "Financial Wellness Platform",
  "headline": "Reduce, Pay & Recover the Cost of Life''s Events while Enhancing Your Lifestyle",
  "headlineAccent": "Life''s Events",
  "subheadline": "A diagnostic financial wellness platform that helps you understand where money quietly leaks—through interest, taxes, insurance, and education costs—so you can take back control.",
  "buttons": [
    {"label": "Start Free Assessment", "url": "/auth", "variant": "primary"},
    {"label": "See How It Works", "url": "#how-it-works", "variant": "outline"}
  ],
  "stats": [
    {"icon": "Users", "value": "10,000+", "label": "Active Users"},
    {"icon": "TrendingUp", "value": "$2.4M", "label": "Identified Savings"},
    {"icon": "Shield", "value": "99.9%", "label": "Uptime"}
  ]
}'::jsonb),
('problem', 'ProblemSection', 'Problem', 20, '{
  "heading": "The Hidden Forces Draining Your Wealth",
  "subheading": "We call them the \"Four Horsemen\"—and they''re quietly eroding your financial future.",
  "items": [
    {"icon": "TrendingDown", "title": "Money Leaks Silently", "description": "Interest, taxes, insurance premiums, and education costs compound quietly—draining your wealth before you even notice."},
    {"icon": "AlertTriangle", "title": "No Coordinated Strategy", "description": "Most people manage finances in isolation—savings here, insurance there, investments somewhere else—with no unified view."},
    {"icon": "HelpCircle", "title": "Overwhelmed by Complexity", "description": "Financial advice often feels confusing, biased toward products, or too complex to act on with confidence."}
  ]
}'::jsonb),
('solution', 'SolutionSnapshot', 'Solution Snapshot', 30, '{
  "eyebrow": "The RPRx Solution",
  "headline": "Finally See the Full Picture of Your Financial Health",
  "headlineAccent": "Financial Health",
  "body": "RPRx provides a diagnostic, system-level view of where money quietly leaks over time. We help you identify which pressures are hitting hardest and prioritize what actually matters—without selling products or replacing your trusted advisors.",
  "benefits": ["Diagnostic-first approach", "No product sales or hidden agendas", "Works with your existing advisors", "Clarity before action"]
}'::jsonb),
('features', 'Features', 'Features', 40, '{
  "eyebrow": "Key Features",
  "heading": "Everything You Need to Understand Your Financial Pressure",
  "subheading": "Our freemium platform gives you the diagnostic tools to see clearly before you act.",
  "items": [
    {"icon": "ClipboardCheck", "title": "Financial Success Assessment", "description": "A 3-5 minute diagnostic that maps your situation to the Four Horsemen and establishes baseline awareness."},
    {"icon": "BarChart3", "title": "Four Horsemen Visualization", "description": "Visual progress indicators that rank all four pressures and highlight your primary area of concern."},
    {"icon": "Wallet", "title": "Cash Flow Snapshot", "description": "A simple income vs. expenses view that identifies surplus, tight, or deficit patterns without complexity."},
    {"icon": "MessageSquareText", "title": "Diagnostic Feedback", "description": "Educational feedback explaining what your pattern indicates and why these pressures persist."},
    {"icon": "UserCircle", "title": "Saved Progress & History", "description": "Create a free account to save results, retake assessments, and track your progress over time."}
  ]
}'::jsonb),
('how-it-works', 'HowItWorks', 'How It Works', 50, '{
  "eyebrow": "How It Works",
  "heading": "Three Simple Steps to Financial Clarity",
  "subheading": "No commitments. No sales calls. Just clarity about where you stand.",
  "steps": [
    {"icon": "FileQuestion", "step": "01", "title": "Take the Assessment", "description": "Answer a few simple questions about your financial situation, goals, and concerns. Takes just 3-5 minutes."},
    {"icon": "BarChart2", "step": "02", "title": "See Your Pressure Points", "description": "Get a visual breakdown of which of the Four Horsemen—Interest, Taxes, Insurance, Education—are impacting you most."},
    {"icon": "Lightbulb", "step": "03", "title": "Gain Clarity", "description": "Receive educational feedback to understand why these pressures persist and what areas to prioritize first."}
  ]
}'::jsonb),
('testimonials', 'Testimonials', 'Testimonials', 60, '{
  "eyebrow": "Social Proof",
  "heading": "Trusted by Thousands",
  "subheading": "Join the community of people taking control of their financial wellness.",
  "testimonials": [
    {"name": "Sarah M.", "role": "Small Business Owner", "content": "RPRx showed me exactly where my money was leaking. I had no idea how much interest and insurance costs were eating into my profits until I saw the visualization.", "rating": 5},
    {"name": "Michael T.", "role": "Family of Four", "content": "Finally, a financial tool that doesn''t try to sell me something. It just helps me understand my situation so I can have better conversations with my advisor.", "rating": 5},
    {"name": "Jennifer K.", "role": "Retiree", "content": "The Four Horsemen concept made everything click for me. I now understand why coordinating my strategies matters more than optimizing individual products.", "rating": 5}
  ],
  "featuredInLabel": "Featured in",
  "logos": ["Forbes", "Bloomberg", "WSJ", "CNBC", "Kiplinger"]
}'::jsonb),
('stats', 'Stats', 'Stats', 70, '{
  "heading": "Real Results for Real People",
  "subheading": "Our diagnostic approach delivers meaningful insights.",
  "stats": [
    {"value": "87%", "label": "of users discover a major financial leak they were unaware of"},
    {"value": "$18,000", "label": "average annual savings opportunity identified per household"},
    {"value": "3 min", "label": "to complete the assessment and see your results"}
  ]
}'::jsonb),
('product-demo', 'ProductDemo', 'Product Demo', 80, '{
  "eyebrow": "Product Info",
  "heading": "What is RPRx?",
  "subheading": "You can decide to have the River, the Lake, and the Rainbow.",
  "videoUrl": "https://youtu.be/SjSOlKpCGfg",
  "videoTitle": "What is RPRx? - Product explainer",
  "caption": "2-minute explainer"
}'::jsonb),
('pricing', 'Pricing', 'Pricing', 90, '{
  "eyebrow": "Pricing",
  "heading": "Simple, Transparent Pricing",
  "subheading": "Start free. Upgrade when you''re ready.",
  "plans": [
    {"name": "Free", "key": "free", "monthly": 0, "yearly": 0, "description": "Get started with financial awareness.", "features": ["Financial Success Assessment", "Four Horsemen Visualization", "Cash Flow Snapshot", "Diagnostic Feedback", "Saved Results & History"], "cta": "Get Started Free", "ctaUrl": "/auth", "highlighted": false},
    {"name": "Partner", "key": "partner", "monthly": 49.97, "yearly": 497, "description": "Personalized strategies and deeper insight.", "features": ["Everything in Free", "AI Strategy Assistant", "Personalized Implementation Plans", "Progress Tracking Dashboard", "Priority Recommendations", "Priority Email Support"], "cta": "Start Partner", "ctaUrl": "", "highlighted": true},
    {"name": "Pro", "key": "pro", "monthly": 997, "yearly": 9997, "description": "Full advisor coordination and unlimited access.", "features": ["Everything in Partner", "Unlimited AI Strategy Sessions", "Advisor Collaboration Tools", "CPA-Led Advisor Sessions", "Family Financial Overview", "Dedicated Support"], "cta": "Start Pro", "ctaUrl": "", "highlighted": false}
  ]
}'::jsonb),
('comparison', 'ComparisonTable', 'Comparison Table', 100, '{
  "eyebrow": "Comparison",
  "heading": "Why Choose RPRx?",
  "subheading": "See how we stack up against traditional financial planning tools.",
  "rprxLabel": "RPRx",
  "alternativeLabel": "Other Tools",
  "rows": [
    {"feature": "Diagnostic-first approach", "rprx": true, "alternative": false},
    {"feature": "No product sales", "rprx": true, "alternative": false},
    {"feature": "Works with existing advisors", "rprx": true, "alternative": false},
    {"feature": "Visual pressure mapping", "rprx": true, "alternative": false},
    {"feature": "Free tier available", "rprx": true, "alternative": true},
    {"feature": "Quick assessment (< 5 min)", "rprx": true, "alternative": false},
    {"feature": "Educational focus", "rprx": true, "alternative": false},
    {"feature": "No hidden fees", "rprx": true, "alternative": false}
  ]
}'::jsonb),
('integrations', 'Integrations', 'Integrations', 110, '{
  "eyebrow": "Integrations",
  "heading": "Works With Your Favorite Tools",
  "subheading": "Connect RPRx with the tools you already use to get a complete financial picture.",
  "items": [
    {"name": "Plaid", "category": "Banking"},
    {"name": "Stripe", "category": "Payments"},
    {"name": "QuickBooks", "category": "Accounting"},
    {"name": "Xero", "category": "Accounting"},
    {"name": "Google Drive", "category": "Storage"},
    {"name": "Dropbox", "category": "Storage"},
    {"name": "Slack", "category": "Communication"},
    {"name": "Zapier", "category": "Automation"}
  ]
}'::jsonb),
('security', 'SecuritySection', 'Security', 120, '{
  "eyebrow": "Security & Privacy",
  "heading": "Your Data is Safe With Us",
  "subheading": "We take security seriously. Your financial information is protected by industry-leading standards.",
  "items": [
    {"icon": "Shield", "title": "Bank-Level Encryption", "description": "256-bit SSL encryption protects all your data in transit and at rest."},
    {"icon": "Lock", "title": "SOC 2 Compliant", "description": "We meet the highest standards for security and data protection."},
    {"icon": "Eye", "title": "Privacy First", "description": "We never sell your data. Your financial information stays yours."},
    {"icon": "Server", "title": "Secure Infrastructure", "description": "Hosted on enterprise-grade cloud infrastructure with 99.9% uptime."}
  ]
}'::jsonb),
('faq', 'FAQ', 'FAQ', 130, '{
  "eyebrow": "FAQ",
  "heading": "Frequently Asked Questions",
  "subheading": "Got questions? We''ve got answers.",
  "items": [
    {"question": "What are the \"Four Horsemen\" of financial apocalypse?", "answer": "The Four Horsemen are the four compounding forces that silently drain wealth over time: Interest (debt costs), Taxes (inefficient tax strategies), Insurance Costs (misaligned coverage), and Education Costs (including opportunity costs of financial illiteracy). Our assessment helps you identify which is impacting you most."},
    {"question": "Is RPRx trying to sell me financial products?", "answer": "No. RPRx is a diagnostic platform focused on awareness and education. We don''t sell insurance, investments, or any financial products. We help you understand your situation so you can have better conversations with qualified professionals."},
    {"question": "How is RPRx different from budgeting apps?", "answer": "While budgeting apps track where your money goes, RPRx identifies systemic pressure points—the underlying forces causing financial leakage. Think of us as a diagnostic tool that reveals the \"why\" behind your financial challenges, not just the \"what.\""},
    {"question": "Can RPRx replace my financial advisor?", "answer": "No, and that''s by design. RPRx is meant to work alongside your existing advisors, not replace them. We provide clarity and awareness that helps you have more productive conversations with licensed professionals."},
    {"question": "How long does the assessment take?", "answer": "The RPRx Financial Success Assessment takes just 3-5 minutes to complete. It''s designed to gather meaningful insights without overwhelming you with complex questions."},
    {"question": "Is my data secure?", "answer": "Absolutely. We use bank-level 256-bit SSL encryption, are SOC 2 compliant, and never sell your data. Your financial information is stored securely and accessed only by you."}
  ]
}'::jsonb),
('final-cta', 'FinalCTA', 'Final CTA', 140, '{
  "heading": "Ready to Take Control of Your Financial Future?",
  "headlineAccent": "Financial Future?",
  "subheading": "Join thousands who have discovered where their money quietly leaks—and what to do about it. Start your free assessment today.",
  "buttons": [
    {"label": "Start Free Assessment", "url": "/auth", "variant": "primary"},
    {"label": "View Pricing", "url": "#pricing", "variant": "outline"}
  ],
  "trustNote": "No credit card required • Free forever tier • Cancel anytime"
}'::jsonb);
