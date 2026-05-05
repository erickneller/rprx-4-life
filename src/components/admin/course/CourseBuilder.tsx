import { useState } from 'react';
import { useCourseByNavId, type CourseLesson, type LessonAttachment } from '@/hooks/useCourse';
import {
  useUpsertCourse, useDeleteCourse,
  useUpsertModule, useDeleteModule,
  useUpsertLesson, useDeleteLesson,
  useUpsertAttachment, useDeleteAttachment,
  uploadCourseAsset,
} from '@/hooks/useCourseAdmin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus, Trash2, Pencil, Loader2, Upload, GripVertical } from 'lucide-react';
import { toast } from 'sonner';

interface Props { navConfigId: string; onClose: () => void; }

export function CourseBuilder({ navConfigId, onClose }: Props) {
  const { data, isLoading, refetch } = useCourseByNavId(navConfigId);
  const upsertCourse = useUpsertCourse();
  const deleteCourse = useDeleteCourse();
  const upsertModule = useUpsertModule();
  const deleteModule = useDeleteModule();
  const upsertLesson = useUpsertLesson();
  const deleteLesson = useDeleteLesson();
  const upsertAttachment = useUpsertAttachment();
  const deleteAttachment = useDeleteAttachment();

  const [editingLesson, setEditingLesson] = useState<{ moduleId: string; lesson?: any } | null>(null);

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  if (!data) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={onClose}><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
        <p className="text-muted-foreground">Course not found.</p>
      </div>
    );
  }

  const { course, modules } = data;

  const handleCourseField = async (patch: Partial<typeof course>) => {
    try {
      await upsertCourse.mutateAsync({ ...course, ...patch });
    } catch (e: any) { toast.error(e.message); }
  };

  const handleAddModule = async () => {
    await upsertModule.mutateAsync({
      course_id: course.id,
      title: 'New Module',
      sort_order: modules.length,
    });
  };

  const handleAddLesson = async (moduleId: string, count: number) => {
    await upsertLesson.mutateAsync({
      module_id: moduleId,
      title: 'New Lesson',
      sort_order: count,
      is_published: true,
    });
  };

  const handleCoverUpload = async (file: File) => {
    try {
      const url = await uploadCourseAsset(file, `covers/${course.id}`);
      await handleCourseField({ cover_image_url: url });
      toast.success('Cover updated');
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" onClick={onClose}><ArrowLeft className="h-4 w-4 mr-1" /> Back to courses</Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={async () => {
            if (confirm('Delete this entire course and all its content?')) {
              await deleteCourse.mutateAsync(course.id);
              onClose();
            }
          }}
        >
          <Trash2 className="h-4 w-4 mr-1" /> Delete course
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Course Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Title</Label>
            <Input
              defaultValue={course.title}
              onBlur={(e) => e.target.value !== course.title && handleCourseField({ title: e.target.value })}
            />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              defaultValue={course.description}
              rows={2}
              onBlur={(e) => e.target.value !== course.description && handleCourseField({ description: e.target.value })}
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label>Cover Image</Label>
              <div className="flex items-center gap-2 mt-1">
                {course.cover_image_url && (
                  <img src={course.cover_image_url} alt="cover" className="h-16 w-28 object-cover rounded border" />
                )}
                <label className="cursor-pointer">
                  <Button asChild variant="outline" size="sm"><span><Upload className="h-3 w-3 mr-1" /> Upload</span></Button>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleCoverUpload(e.target.files[0])} />
                </label>
                {course.cover_image_url && (
                  <Button variant="ghost" size="sm" onClick={() => handleCourseField({ cover_image_url: null })}>Clear</Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Recommended: <strong>1600×400 px</strong> (4:1 wide format), JPG or PNG under 500KB. Minimum 1280×320. Leave blank to use the default placeholder.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={course.is_published} onCheckedChange={(c) => handleCourseField({ is_published: c })} />
              <Label>Published</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Modules</h3>
          <Button size="sm" onClick={handleAddModule}><Plus className="h-4 w-4 mr-1" /> Add module</Button>
        </div>

        {modules.map(mod => (
          <Card key={mod.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
                <Input
                  defaultValue={mod.title}
                  className="font-semibold"
                  onBlur={(e) => {
                    if (e.target.value === mod.title) return;
                    const { lessons, ...modRow } = mod;
                    upsertModule.mutate({ ...modRow, title: e.target.value });
                  }}
                />
                <Button
                  variant="ghost" size="icon"
                  onClick={() => confirm('Delete this module and all its lessons?') && deleteModule.mutate(mod.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {mod.lessons.map(lesson => (
                <div key={lesson.id} className="flex items-center gap-2 rounded border p-2">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <span className="flex-1 text-sm truncate">{lesson.title}</span>
                  <span className="text-xs text-muted-foreground">{lesson.attachments.length} resources</span>
                  {!lesson.is_published && <span className="text-xs text-muted-foreground">(draft)</span>}
                  <Button variant="ghost" size="icon" onClick={() => setEditingLesson({ moduleId: mod.id, lesson })}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost" size="icon"
                    onClick={() => confirm('Delete this lesson?') && deleteLesson.mutate(lesson.id)}
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              ))}
              <Button size="sm" variant="outline" onClick={() => handleAddLesson(mod.id, mod.lessons.length)}>
                <Plus className="h-3 w-3 mr-1" /> Add lesson
              </Button>
            </CardContent>
          </Card>
        ))}
        {modules.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">No modules yet. Add one to get started.</p>
        )}
      </div>

      {editingLesson && (
        <LessonEditorDialog
          moduleId={editingLesson.moduleId}
          lesson={editingLesson.lesson}
          onClose={() => { setEditingLesson(null); refetch(); }}
        />
      )}
    </div>
  );
}

function LessonEditorDialog({ moduleId, lesson, onClose }: { moduleId: string; lesson: any; onClose: () => void }) {
  const upsertLesson = useUpsertLesson();
  const upsertAttachment = useUpsertAttachment();
  const deleteAttachment = useDeleteAttachment();
  const [title, setTitle] = useState(lesson?.title || '');
  const [body, setBody] = useState(lesson?.body_markdown || '');
  const [videoUrl, setVideoUrl] = useState(lesson?.video_url || '');
  const [isPublished, setIsPublished] = useState(lesson?.is_published ?? true);
  const [saving, setSaving] = useState(false);
  const [attachments, setAttachments] = useState<LessonAttachment[]>(lesson?.attachments || []);

  // Add attachment form
  const [newKind, setNewKind] = useState<'file' | 'link' | 'book_call'>('link');
  const [newLabel, setNewLabel] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await upsertLesson.mutateAsync({
        ...(lesson?.id ? { id: lesson.id } : {}),
        module_id: moduleId,
        sort_order: lesson?.sort_order ?? 0,
        title,
        body_markdown: body,
        video_url: videoUrl || null,
        is_published: isPublished,
      });
      toast.success('Lesson saved');
      onClose();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleVideoUpload = async (file: File) => {
    try {
      const url = await uploadCourseAsset(file, `videos/${lesson.id}`);
      setVideoUrl(url);
      toast.success('Video uploaded');
    } catch (e: any) { toast.error(e.message); }
  };

  const handleAddAttachment = async () => {
    if (!newLabel) { toast.error('Label required'); return; }
    if (newKind !== 'file' && !newUrl) { toast.error('URL required'); return; }
    try {
      const a = await upsertAttachment.mutateAsync({
        lesson_id: lesson.id,
        kind: newKind,
        label: newLabel,
        url: newKind === 'file' ? null : newUrl,
        sort_order: attachments.length,
      });
      setAttachments([...attachments, a]);
      setNewLabel(''); setNewUrl('');
    } catch (e: any) { toast.error(e.message); }
  };

  const handleAttachFileUpload = async (file: File) => {
    setUploadingFile(true);
    try {
      const path = `files/${lesson.id}/${Date.now()}-${file.name}`;
      const { error } = await (await import('@/integrations/supabase/client')).supabase.storage
        .from('course-assets').upload(path, file);
      if (error) throw error;
      const a = await upsertAttachment.mutateAsync({
        lesson_id: lesson.id,
        kind: 'file',
        label: newLabel || file.name,
        file_path: path,
        sort_order: attachments.length,
      });
      setAttachments([...attachments, a]);
      setNewLabel('');
      toast.success('File uploaded');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUploadingFile(false);
    }
  };

  const handleDeleteAttachment = async (id: string) => {
    await deleteAttachment.mutateAsync(id);
    setAttachments(attachments.filter(a => a.id !== id));
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Edit Lesson</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <Label>Video URL (YouTube, Vimeo, Loom, or MP4) — or upload</Label>
            <div className="flex gap-2 items-center">
              <Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://..." />
              <label className="cursor-pointer">
                <Button asChild variant="outline" size="sm" type="button"><span><Upload className="h-3 w-3" /></span></Button>
                <input type="file" accept="video/mp4" className="hidden" onChange={(e) => e.target.files?.[0] && handleVideoUpload(e.target.files[0])} />
              </label>
            </div>
          </div>
          <div>
            <Label>Body (Markdown)</Label>
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={8} className="font-mono text-sm" />
          </div>

          <div className="space-y-2">
            <Label>Attachments</Label>
            {attachments.map(a => (
              <div key={a.id} className="flex items-center gap-2 rounded border p-2 text-sm">
                <span className="text-xs uppercase px-1.5 py-0.5 bg-muted rounded">{a.kind.replace('_', ' ')}</span>
                <span className="flex-1 truncate">{a.label}</span>
                <span className="text-xs text-muted-foreground truncate max-w-[200px]">{a.url || a.file_path}</span>
                <Button size="icon" variant="ghost" onClick={() => handleDeleteAttachment(a.id)}>
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </div>
            ))}
            <div className="flex flex-wrap items-end gap-2 rounded border p-2 bg-muted/30">
              <div>
                <Label className="text-xs">Type</Label>
                <Select value={newKind} onValueChange={(v) => setNewKind(v as any)}>
                  <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="link">Link</SelectItem>
                    <SelectItem value="file">File</SelectItem>
                    <SelectItem value="book_call">Book a Call</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 min-w-[150px]">
                <Label className="text-xs">Label</Label>
                <Input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="e.g. Tax planning guide" />
              </div>
              {newKind !== 'file' ? (
                <div className="flex-1 min-w-[200px]">
                  <Label className="text-xs">URL</Label>
                  <Input value={newUrl} onChange={(e) => setNewUrl(e.target.value)} placeholder="https://..." />
                </div>
              ) : (
                <label className="cursor-pointer">
                  <Button asChild variant="outline" size="sm" type="button" disabled={uploadingFile}>
                    <span>{uploadingFile ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Upload className="h-3 w-3 mr-1" /> Upload</>}</span>
                  </Button>
                  <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && handleAttachFileUpload(e.target.files[0])} />
                </label>
              )}
              {newKind !== 'file' && (
                <Button size="sm" onClick={handleAddAttachment}><Plus className="h-3 w-3 mr-1" /> Add</Button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch checked={isPublished} onCheckedChange={setIsPublished} />
            <Label>Published</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-3 w-3 mr-1 animate-spin" />} Save lesson
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
