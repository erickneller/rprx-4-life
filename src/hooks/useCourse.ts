import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Course {
  id: string;
  nav_config_id: string;
  title: string;
  description: string;
  cover_image_url: string | null;
  is_published: boolean;
}

export interface CourseModule {
  id: string;
  course_id: string;
  title: string;
  description: string;
  sort_order: number;
}

export interface CourseLesson {
  id: string;
  module_id: string;
  title: string;
  body_markdown: string;
  video_url: string | null;
  sort_order: number;
  is_published: boolean;
}

export interface LessonAttachment {
  id: string;
  lesson_id: string;
  kind: 'file' | 'link' | 'book_call';
  label: string;
  url: string | null;
  file_path: string | null;
  sort_order: number;
}

export interface FullCourse {
  course: Course;
  modules: (CourseModule & { lessons: (CourseLesson & { attachments: LessonAttachment[] })[] })[];
}

export function useCourseByNavId(navConfigId: string | undefined) {
  return useQuery({
    queryKey: ['course-by-nav', navConfigId],
    enabled: !!navConfigId,
    queryFn: async (): Promise<FullCourse | null> => {
      const { data: course, error } = await (supabase as any)
        .from('courses')
        .select('*')
        .eq('nav_config_id', navConfigId)
        .maybeSingle();
      if (error) throw error;
      if (!course) return null;

      const { data: modules } = await (supabase as any)
        .from('course_modules')
        .select('*')
        .eq('course_id', course.id)
        .order('sort_order');

      const moduleIds = (modules || []).map((m: any) => m.id);
      const { data: lessons } = moduleIds.length
        ? await (supabase as any)
            .from('course_lessons')
            .select('*')
            .in('module_id', moduleIds)
            .order('sort_order')
        : { data: [] };

      const lessonIds = (lessons || []).map((l: any) => l.id);
      const { data: attachments } = lessonIds.length
        ? await (supabase as any)
            .from('course_lesson_attachments')
            .select('*')
            .in('lesson_id', lessonIds)
            .order('sort_order')
        : { data: [] };

      return {
        course: course as Course,
        modules: (modules || []).map((m: any) => ({
          ...m,
          lessons: (lessons || [])
            .filter((l: any) => l.module_id === m.id)
            .map((l: any) => ({
              ...l,
              attachments: (attachments || []).filter((a: any) => a.lesson_id === l.id),
            })),
        })),
      };
    },
  });
}

export function useCourseProgress(courseId: string | undefined) {
  const qc = useQueryClient();

  const { data: completedLessonIds = [] } = useQuery({
    queryKey: ['course-progress', courseId],
    enabled: !!courseId,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      // Fetch lessons for the course
      const { data: modules } = await (supabase as any)
        .from('course_modules').select('id').eq('course_id', courseId);
      const moduleIds = (modules || []).map((m: any) => m.id);
      if (!moduleIds.length) return [];
      const { data: lessons } = await (supabase as any)
        .from('course_lessons').select('id').in('module_id', moduleIds);
      const lessonIds = (lessons || []).map((l: any) => l.id);
      if (!lessonIds.length) return [];
      const { data } = await (supabase as any)
        .from('user_course_progress')
        .select('lesson_id')
        .eq('user_id', user.id)
        .in('lesson_id', lessonIds);
      return ((data || []) as any[]).map(r => r.lesson_id as string);
    },
  });

  const toggle = useMutation({
    mutationFn: async ({ lessonId, completed }: { lessonId: string; completed: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      if (completed) {
        const { error } = await (supabase as any)
          .from('user_course_progress')
          .upsert({ user_id: user.id, lesson_id: lessonId }, { onConflict: 'user_id,lesson_id' });
        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from('user_course_progress')
          .delete()
          .eq('user_id', user.id)
          .eq('lesson_id', lessonId);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['course-progress', courseId] }),
  });

  return { completedLessonIds, toggle };
}
