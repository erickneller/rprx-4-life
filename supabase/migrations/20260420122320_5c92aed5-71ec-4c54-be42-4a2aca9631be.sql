
-- library_categories
CREATE TABLE public.library_categories (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.library_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage library categories"
  ON public.library_categories FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated can read library categories"
  ON public.library_categories FOR SELECT
  TO authenticated
  USING (true);

-- library_videos
CREATE TABLE public.library_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id text NOT NULL REFERENCES public.library_categories(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  video_url text NOT NULL DEFAULT '',
  thumbnail_url text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.library_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage library videos"
  ON public.library_videos FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated can read library videos"
  ON public.library_videos FOR SELECT
  TO authenticated
  USING (true);

CREATE TRIGGER update_library_videos_updated_at
  BEFORE UPDATE ON public.library_videos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_library_videos_category ON public.library_videos(category_id);

-- Seed starter category
INSERT INTO public.library_categories (id, name, description, sort_order)
VALUES ('getting-started', 'Getting Started', 'Intro videos to help you make the most of RPRx.', 0);

-- Sidebar nav entry
INSERT INTO public.sidebar_nav_config (id, label, sort_order, visible)
VALUES ('library', 'RPRx Library', 95, true)
ON CONFLICT (id) DO NOTHING;
