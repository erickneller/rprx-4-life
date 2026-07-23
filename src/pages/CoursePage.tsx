import { useState, useMemo, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout';
import { useCourseByNavId, useCourseProgress } from '@/hooks/useCourse';
import { useSidebarConfig } from '@/hooks/useSidebarConfig';
import { Loader2, CheckCircle2, Circle, FileText, ExternalLink, Phone, ChevronLeft, ChevronRight, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeRaw from 'rehype-raw';
import { supabase } from '@/integrations/supabase/client';
import { useCourseBannerSettings, bannerGradientCss } from '@/hooks/useCourseBannerSettings';
import { cn } from '@/lib/utils';
import { useLogVideoOpen } from '@/hooks/useLogVideoOpen';
import { VideoPlayer } from '@/components/media/VideoPlayer';


function AttachmentRow({ a }: { a: { kind: string; label: string; url: string | null; file_path: string | null } }) {
  const href = a.url || (a.file_path ? supabase.storage.from('course-assets').getPublicUrl(a.file_path).data.publicUrl : '#');
  const Icon = a.kind === 'file' ? FileText : a.kind === 'book_call' ? Phone : ExternalLink;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 rounded-md bg-accent px-4 py-3 text-sm text-accent-foreground hover:bg-accent/90 transition-colors"
    >
      <Icon className="h-4 w-4 text-accent-foreground shrink-0" />
      <span className="flex-1">{a.label}</span>
      <span className="text-xs text-accent-foreground/80 capitalize">{a.kind.replace('_', ' ')}</span>
    </a>
  );
}

export default function CoursePage() {
  const { navConfigId } = useParams<{ navConfigId: string }>();
  const { isVisible, isLoading: navLoading } = useSidebarConfig();
  const { data, isLoading } = useCourseByNavId(navConfigId);
  const isMobile = useIsMobile();
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [treeOpen, setTreeOpen] = useState(false);

  const courseId = data?.course.id;
  const { completedLessonIds, toggle } = useCourseProgress(courseId);
  const { settings: bannerSettings } = useCourseBannerSettings();

  const flatLessons = useMemo(
    () => (data?.modules.flatMap(m => m.lessons.filter(l => l.is_published)) || []),
    [data]
  );

  useEffect(() => {
    setActiveLessonId(null);
  }, [navConfigId]);

  useEffect(() => {
    if (flatLessons.length === 0) return;
    if (!activeLessonId || !flatLessons.some(l => l.id === activeLessonId)) {
      setActiveLessonId(flatLessons[0].id);
    }
  }, [flatLessons, activeLessonId]);

  const logVideoOpen = useLogVideoOpen();
  useEffect(() => {
    if (!activeLessonId) return;
    const lesson = flatLessons.find(l => l.id === activeLessonId);
    if (lesson?.video_url) {
      logVideoOpen({
        source: 'course_lesson',
        sourceId: lesson.id,
        title: lesson.title,
        videoUrl: lesson.video_url,
      });
    }
  }, [activeLessonId, flatLessons, logVideoOpen]);

  if (navLoading || isLoading) {
    return (
      <AuthenticatedLayout title="Course">
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      </AuthenticatedLayout>
    );
  }

  if (!navConfigId || !isVisible(navConfigId)) {
    return <Navigate to="/dashboard" replace />;
  }

  if (!data || !data.course.is_published) {
    return (
      <AuthenticatedLayout title="Course">
        <div className="p-6 max-w-3xl mx-auto">
          <div className="rounded-lg border border-border bg-card p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">Course coming soon</h2>
            <p className="text-muted-foreground">This course is being prepared. Check back shortly.</p>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  const { course, modules } = data;
  const totalLessons = flatLessons.length;
  const completedCount = flatLessons.filter(l => completedLessonIds.includes(l.id)).length;
  const progressPct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  const activeLesson = flatLessons.find(l => l.id === activeLessonId);
  const activeIdx = flatLessons.findIndex(l => l.id === activeLessonId);
  const prev = activeIdx > 0 ? flatLessons[activeIdx - 1] : null;
  const next = activeIdx >= 0 && activeIdx < flatLessons.length - 1 ? flatLessons[activeIdx + 1] : null;
  const isCompleted = activeLessonId ? completedLessonIds.includes(activeLessonId) : false;

  const tree = (
    <div className="p-4 space-y-4">
      <div>
        <div className="flex items-center justify-between mb-2 text-xs text-muted-foreground">
          <span>{completedCount} / {totalLessons} lessons</span>
          <span>{progressPct}%</span>
        </div>
        <Progress value={progressPct} className="h-2" />
      </div>
      <div className="space-y-3">
        {modules.map(mod => (
          <div key={mod.id}>
            <h3 className="text-sm font-semibold mb-1">{mod.title}</h3>
            <ul className="space-y-0.5">
              {mod.lessons.filter(l => l.is_published).map(lesson => {
                const done = completedLessonIds.includes(lesson.id);
                const isActive = lesson.id === activeLessonId;
                return (
                  <li key={lesson.id}>
                    <button
                      onClick={() => { setActiveLessonId(lesson.id); setTreeOpen(false); }}
                      className={cn(
                        'flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm transition-colors',
                        isActive ? 'bg-accent font-medium' : 'hover:bg-accent/50'
                      )}
                    >
                      {done ? <CheckCircle2 className="h-4 w-4 text-primary shrink-0" /> : <Circle className="h-4 w-4 text-muted-foreground shrink-0" />}
                      <span className="flex-1 min-w-0 truncate">{lesson.title}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <AuthenticatedLayout title={course.title}>
      <div className="flex flex-col md:flex-row min-h-[calc(100vh-3.5rem)]">
        {!isMobile && (
          <aside className="w-72 shrink-0 border-r bg-muted/30 overflow-y-auto">
            {tree}
          </aside>
        )}
        {isMobile && (
          <div className="border-b p-2">
            <Sheet open={treeOpen} onOpenChange={setTreeOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Menu className="h-4 w-4 mr-2" /> {completedCount}/{totalLessons} lessons
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 p-0 overflow-y-auto">{tree}</SheetContent>
            </Sheet>
          </div>
        )}
        <main className="flex-1 min-w-0">
          <div className="relative h-32 md:h-40 overflow-hidden">
            {course.cover_image_url ? (
              <img
                src={course.cover_image_url}
                alt=""
                loading="lazy"
                width={1280}
                height={720}
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                className="w-full h-full"
                style={{ background: bannerGradientCss(bannerSettings) }}
                aria-hidden
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/10" />
            <div className="absolute bottom-3 left-4 right-4">
              <h1 className="text-xl md:text-2xl font-bold text-foreground [text-shadow:_0_1px_8px_rgb(0_0_0_/_40%)]">{course.title}</h1>
              {course.description && <p className="text-sm text-foreground/80 line-clamp-1 [text-shadow:_0_1px_6px_rgb(0_0_0_/_40%)]">{course.description}</p>}
            </div>
          </div>

          {activeLesson ? (
            <article className="p-4 md:p-8 max-w-3xl mx-auto space-y-6">
              <h2 className="text-2xl font-bold">{activeLesson.title}</h2>
              {activeLesson.video_url && <VideoPlayer url={activeLesson.video_url} title={activeLesson.title} />}
              {activeLesson.body_markdown && (
                <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} rehypePlugins={[rehypeRaw]}>{activeLesson.body_markdown}</ReactMarkdown>
                </div>
              )}
              {activeLesson.attachments.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Resources</h3>
                  {activeLesson.attachments.map(a => <AttachmentRow key={a.id} a={a} />)}
                </div>
              )}
              <div className="flex items-center justify-between gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  disabled={!prev}
                  onClick={() => prev && setActiveLessonId(prev.id)}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" /> Prev
                </Button>
                <Button
                  className="bg-success text-success-foreground hover:bg-success/90"
                  onClick={() => toggle.mutate({ lessonId: activeLesson.id, completed: !isCompleted })}
                >
                  {isCompleted ? (<><CheckCircle2 className="h-4 w-4 mr-1" /> Completed</>) : 'Mark complete'}
                </Button>
                <Button
                  className="bg-accent text-accent-foreground hover:bg-accent/90"
                  disabled={!next}
                  onClick={() => next && setActiveLessonId(next.id)}
                >
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </article>
          ) : (
            <div className="p-8 text-center text-muted-foreground">No lessons yet.</div>
          )}
        </main>
      </div>
    </AuthenticatedLayout>
  );
}
