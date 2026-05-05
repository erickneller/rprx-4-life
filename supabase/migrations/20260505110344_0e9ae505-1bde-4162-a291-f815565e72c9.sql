
-- Add is_course flag
ALTER TABLE public.sidebar_nav_config
  ADD COLUMN IF NOT EXISTS is_course boolean NOT NULL DEFAULT false;

-- courses
CREATE TABLE public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nav_config_id text NOT NULL UNIQUE REFERENCES public.sidebar_nav_config(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  cover_image_url text,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage courses" ON public.courses
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authenticated read published courses" ON public.courses
  FOR SELECT TO authenticated
  USING (is_published = true OR has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_courses_updated BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- modules
CREATE TABLE public.course_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_course_modules_course ON public.course_modules(course_id, sort_order);

CREATE POLICY "Admins manage modules" ON public.course_modules
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authenticated read modules of published courses" ON public.course_modules
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND (c.is_published = true OR has_role(auth.uid(), 'admin'::app_role)))
  );

CREATE TRIGGER trg_course_modules_updated BEFORE UPDATE ON public.course_modules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- lessons
CREATE TABLE public.course_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
  title text NOT NULL,
  body_markdown text NOT NULL DEFAULT '',
  video_url text,
  sort_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.course_lessons ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_course_lessons_module ON public.course_lessons(module_id, sort_order);

CREATE POLICY "Admins manage lessons" ON public.course_lessons
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authenticated read published lessons" ON public.course_lessons
  FOR SELECT TO authenticated
  USING (
    (is_published = true AND EXISTS (
      SELECT 1 FROM public.course_modules m
      JOIN public.courses c ON c.id = m.course_id
      WHERE m.id = module_id AND c.is_published = true
    ))
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE TRIGGER trg_course_lessons_updated BEFORE UPDATE ON public.course_lessons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- attachments
CREATE TYPE public.course_attachment_kind AS ENUM ('file', 'link', 'book_call');

CREATE TABLE public.course_lesson_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  kind public.course_attachment_kind NOT NULL,
  label text NOT NULL,
  url text,
  file_path text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.course_lesson_attachments ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_attachments_lesson ON public.course_lesson_attachments(lesson_id, sort_order);

CREATE POLICY "Admins manage attachments" ON public.course_lesson_attachments
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authenticated read attachments of published lessons" ON public.course_lesson_attachments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.course_lessons l
      JOIN public.course_modules m ON m.id = l.module_id
      JOIN public.courses c ON c.id = m.course_id
      WHERE l.id = lesson_id
        AND ((l.is_published = true AND c.is_published = true) OR has_role(auth.uid(), 'admin'::app_role))
    )
  );

-- progress
CREATE TABLE public.user_course_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  lesson_id uuid NOT NULL REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  completed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, lesson_id)
);
ALTER TABLE public.user_course_progress ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_user_course_progress_user ON public.user_course_progress(user_id);

CREATE POLICY "Users view own progress" ON public.user_course_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own progress" ON public.user_course_progress
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own progress" ON public.user_course_progress
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('course-assets', 'course-assets', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read course-assets" ON storage.objects
  FOR SELECT USING (bucket_id = 'course-assets');
CREATE POLICY "Admins upload course-assets" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'course-assets' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins update course-assets" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'course-assets' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins delete course-assets" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'course-assets' AND has_role(auth.uid(), 'admin'::app_role));
