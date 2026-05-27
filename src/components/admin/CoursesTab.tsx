import { useState, useEffect } from 'react';
import { useSidebarConfig, useUpdateNavIsCourse } from '@/hooks/useSidebarConfig';
import { useAdminCourses, useUpsertCourse } from '@/hooks/useCourseAdmin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Loader2, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { CourseBuilder } from './course/CourseBuilder';
import {
  useCourseBannerSettings,
  useSetCourseBannerSettings,
  bannerGradientCss,
  DEFAULT_COURSE_BANNER,
} from '@/hooks/useCourseBannerSettings';

export function CoursesTab() {
  const { rows, isLoading } = useSidebarConfig();
  const { data: courses = [] } = useAdminCourses();
  const updateIsCourse = useUpdateNavIsCourse();
  const upsertCourse = useUpsertCourse();
  const [editingNavId, setEditingNavId] = useState<string | null>(null);

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  // Sidebar items only (skip section headers)
  const items = rows.filter(r => !r.id.startsWith('section:'));

  const handleToggle = async (id: string, label: string, checked: boolean) => {
    try {
      await updateIsCourse.mutateAsync({ id, isCourse: checked });
      // Auto-create empty course shell on enable
      if (checked && !courses.find(c => c.nav_config_id === id)) {
        await upsertCourse.mutateAsync({ nav_config_id: id, title: label, description: '', is_published: false });
      }
      toast.success(checked ? 'Marked as course' : 'Removed course flag');
    } catch (e: any) {
      toast.error(e.message || 'Failed');
    }
  };

  if (editingNavId) {
    return <CourseBuilder navConfigId={editingNavId} onClose={() => setEditingNavId(null)} />;
  }

  return (
    <div className="space-y-4">
      <BannerSettingsCard />

    <Card>
      <CardHeader>
        <CardTitle>Mini-Courses</CardTitle>
        <CardDescription>
          Toggle "Is course?" on any sidebar item to convert it into a mini-course. The sidebar link will route to the course view.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map(item => {
          const course = courses.find(c => c.nav_config_id === item.id);
          return (
            <div key={item.id} className="flex items-center justify-between rounded-md border p-3">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium truncate">{item.label}</div>
                <div className="text-xs text-muted-foreground font-mono truncate">{item.id}</div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {course && (
                  <span className={`text-xs px-2 py-0.5 rounded ${course.is_published ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'}`}>
                    {course.is_published ? 'Published' : 'Draft'}
                  </span>
                )}
                <Switch
                  checked={!!item.is_course}
                  onCheckedChange={(c) => handleToggle(item.id, item.label, c)}
                  disabled={updateIsCourse.isPending}
                />
                {item.is_course && (
                  <Button size="sm" variant="outline" onClick={() => setEditingNavId(item.id)}>
                    <Pencil className="h-3 w-3 mr-1" /> Edit course
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
    </div>
  );
}

function BannerSettingsCard() {
  const { settings, isLoading } = useCourseBannerSettings();
  const save = useSetCourseBannerSettings();
  const [from, setFrom] = useState(settings.from);
  const [to, setTo] = useState(settings.to);
  const [angle, setAngle] = useState(settings.angle);

  useEffect(() => {
    setFrom(settings.from);
    setTo(settings.to);
    setAngle(settings.angle);
  }, [settings.from, settings.to, settings.angle]);

  const handleSave = async () => {
    try {
      await save.mutateAsync({ from, to, angle });
      toast.success('Default banner updated');
    } catch (e: any) {
      toast.error(e.message || 'Failed to save');
    }
  };

  const handleReset = () => {
    setFrom(DEFAULT_COURSE_BANNER.from);
    setTo(DEFAULT_COURSE_BANNER.to);
    setAngle(DEFAULT_COURSE_BANNER.angle);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Default Course Banner</CardTitle>
        <CardDescription>
          Global gradient shown as the banner for any course that doesn't have its own cover image.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          className="h-24 rounded-md border"
          style={{ background: bannerGradientCss({ from, to, angle }) }}
          aria-label="Banner preview"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="banner-from">Start color</Label>
            <div className="flex items-center gap-2">
              <Input
                id="banner-from"
                type="color"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="h-10 w-14 p-1"
              />
              <Input value={from} onChange={(e) => setFrom(e.target.value)} className="font-mono" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="banner-to">End color</Label>
            <div className="flex items-center gap-2">
              <Input
                id="banner-to"
                type="color"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="h-10 w-14 p-1"
              />
              <Input value={to} onChange={(e) => setTo(e.target.value)} className="font-mono" />
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Angle: {angle}°</Label>
          <Slider
            value={[angle]}
            min={0}
            max={360}
            step={1}
            onValueChange={(v) => setAngle(v[0] ?? 0)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleSave} disabled={save.isPending || isLoading}>
            {save.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save banner
          </Button>
          <Button variant="outline" onClick={handleReset}>Reset to default</Button>
        </div>
      </CardContent>
    </Card>
  );
}
