import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Course, CourseModule, CourseLesson, LessonAttachment } from './useCourse';

export function useAdminCourses() {
  return useQuery({
    queryKey: ['admin-courses'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('courses').select('*').order('title');
      if (error) throw error;
      return (data || []) as Course[];
    },
  });
}

export function useUpsertCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<Course> & { nav_config_id: string; title: string }) => {
      const { data, error } = await (supabase as any)
        .from('courses')
        .upsert(input, { onConflict: 'nav_config_id' })
        .select()
        .single();
      if (error) throw error;
      return data as Course;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-courses'] });
      qc.invalidateQueries({ queryKey: ['course-by-nav'] });
    },
  });
}

export function useDeleteCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (courseId: string) => {
      const { error } = await (supabase as any).from('courses').delete().eq('id', courseId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-courses'] });
      qc.invalidateQueries({ queryKey: ['course-by-nav'] });
    },
  });
}

export function useUpsertModule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<CourseModule> & { course_id: string; title: string }) => {
      const { data, error } = await (supabase as any)
        .from('course_modules').upsert(input).select().single();
      if (error) throw error;
      return data as CourseModule;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['course-by-nav'] }),
  });
}

export function useDeleteModule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('course_modules').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['course-by-nav'] }),
  });
}

export function useUpsertLesson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<CourseLesson> & { module_id: string; title: string }) => {
      const { data, error } = await (supabase as any)
        .from('course_lessons').upsert(input).select().single();
      if (error) throw error;
      return data as CourseLesson;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['course-by-nav'] }),
  });
}

export function useDeleteLesson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('course_lessons').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['course-by-nav'] }),
  });
}

export function useUpsertAttachment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<LessonAttachment> & { lesson_id: string; kind: LessonAttachment['kind']; label: string }) => {
      const { data, error } = await (supabase as any)
        .from('course_lesson_attachments').upsert(input).select().single();
      if (error) throw error;
      return data as LessonAttachment;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['course-by-nav'] }),
  });
}

export function useDeleteAttachment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('course_lesson_attachments').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['course-by-nav'] }),
  });
}

export async function uploadCourseAsset(file: File, prefix: string): Promise<string> {
  const ext = file.name.split('.').pop();
  const path = `${prefix}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from('course-assets').upload(path, file);
  if (error) throw error;
  const { data } = supabase.storage.from('course-assets').getPublicUrl(path);
  return data.publicUrl;
}
