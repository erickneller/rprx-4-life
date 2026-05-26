## Issue

When switching from one course to another, `activeLessonId` from the previous course is retained. The `useEffect` only sets a default when `activeLessonId` is falsy, so on the new course it stays pointing at a lesson ID that doesn't exist in the new course's `flatLessons` — `activeLesson` becomes `undefined` and the panel shows "No lessons yet."

## Fix

In `src/pages/CoursePage.tsx`:

1. Reset `activeLessonId` to `null` whenever `navConfigId` changes (new `useEffect` keyed on `navConfigId`).
2. Update the default-selection `useEffect` so it also kicks in when the current `activeLessonId` is not present in `flatLessons` (covers edge cases where lessons reload).

Result: navigating to any course always defaults to the first published lesson of that course.

No other files affected.
