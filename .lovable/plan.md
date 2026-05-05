## Fix: module title not saving

**Cause:** In `CourseBuilder.tsx`, the module rename handler upserts `{ ...mod, title }`, but `mod` carries the joined `lessons` array from `useCourseByNavId`. Supabase rejects the upsert because `lessons` isn't a column on `course_modules`, so the title change is silently lost (toast error may also appear).

**Fix:** Strip joined fields before the upsert, exactly like the earlier lesson/attachments fix.

```ts
onBlur={(e) => {
  if (e.target.value === mod.title) return;
  const { lessons, ...modRow } = mod;
  upsertModule.mutate({ ...modRow, title: e.target.value });
}}
```

### Files touched
- `src/components/admin/course/CourseBuilder.tsx` — module title onBlur handler only

### Out of scope
- No DB schema changes
- No hook changes (`useUpsertModule` stays as-is)
