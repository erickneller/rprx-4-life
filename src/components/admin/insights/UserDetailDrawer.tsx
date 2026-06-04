import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { useAdminUserActivity, useAdminVideoOpens } from '@/hooks/useAdminInsights';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Video, BookOpen, ClipboardCheck, Target, Award, Flame, Star } from 'lucide-react';
import { format } from 'date-fns';

interface Props {
  userId: string | null;
  onOpenChange: (open: boolean) => void;
}

export function UserDetailDrawer({ userId, onOpenChange }: Props) {
  const { data: activity, isLoading } = useAdminUserActivity(userId);
  const { data: recentOpens = [] } = useAdminVideoOpens({ userId, limit: 20 });

  return (
    <Sheet open={!!userId} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        {isLoading || !activity ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                {activity.full_name || 'Unnamed user'}
                <Badge variant="outline" className="capitalize text-xs">{activity.tier}</Badge>
              </SheetTitle>
              <SheetDescription>{activity.email}</SheetDescription>
            </SheetHeader>

            <div className="mt-6 space-y-6">
              <div className="grid grid-cols-2 gap-3">
                <Stat icon={ClipboardCheck} label="Assessments" value={activity.assessments_completed} />
                <Stat icon={Target} label="Plans saved" value={activity.plans_saved} />
                <Stat icon={Award} label="Badges" value={activity.badges_earned} />
                <Stat icon={Video} label="Video opens" value={activity.total_video_opens} />
                <Stat icon={BookOpen} label="Course lessons" value={activity.course_lessons_opened} />
                <Stat icon={Video} label="Library videos" value={activity.library_videos_opened} />
                <Stat icon={Flame} label="Streak" value={activity.current_streak} />
                <Stat icon={Star} label="XP" value={activity.total_points_earned} />
              </div>

              <Card>
                <CardContent className="p-4 space-y-1 text-sm">
                  <Row label="Company" value={activity.company_name || '—'} />
                  <Row label="Onboarding" value={activity.onboarding_completed ? 'Complete' : 'Incomplete'} />
                  <Row label="Focus plan" value={activity.focus_plan_title || '—'} />
                  <Row
                    label="Last active"
                    value={activity.last_active_date ? format(new Date(activity.last_active_date), 'MMM d, yyyy') : '—'}
                  />
                  <Row
                    label="Last video open"
                    value={activity.last_video_opened_at ? format(new Date(activity.last_video_opened_at), 'MMM d, yyyy h:mm a') : '—'}
                  />
                </CardContent>
              </Card>

              <div>
                <h3 className="text-sm font-semibold mb-2">Recent video opens</h3>
                {recentOpens.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No video opens recorded yet.</p>
                ) : (
                  <div className="space-y-2">
                    {recentOpens.map(o => (
                      <Card key={o.id}>
                        <CardContent className="p-3 flex items-start gap-3">
                          {o.source === 'library_video' ? (
                            <Video className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                          ) : (
                            <BookOpen className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{o.title || o.source_id || '(untitled)'}</p>
                            <p className="text-xs text-muted-foreground">
                              {o.source === 'library_video' ? 'Library' : 'Course'} ·{' '}
                              {format(new Date(o.opened_at), 'MMM d, h:mm a')}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-3 flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary shrink-0" />
        <div className="min-w-0">
          <p className="text-lg font-bold leading-none">{value}</p>
          <p className="text-xs text-muted-foreground truncate">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}
