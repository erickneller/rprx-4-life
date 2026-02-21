

# Remove Duplicate Onboarding Progress Bar from Dashboard Top

## What's Happening
The Clarity-to-Vision progress bar (`OnboardingProgressBar`) appears twice on the dashboard -- once at the very top of the page and again inside the Onboarding Day card. They show the same data and are the same component.

## Change
Remove the standalone `OnboardingProgressBar` from `src/components/dashboard/DashboardContent.tsx` (lines 121-123). The progress bar inside the `OnboardingCard` remains untouched.

## Technical Detail

**File: `src/components/dashboard/DashboardContent.tsx`**
- Remove the `OnboardingProgressBar` rendering block (the `{isOnboarding && (...)}` block on lines 121-123)
- Remove the unused import of `OnboardingProgressBar` (line 13)
- Remove `onboardingCompletedDays` and `onboardingCurrentDay` from the `useOnboarding()` destructure if no longer needed (line 27) -- keep `isOnboarding` since it may be used elsewhere, but checking... it is not used elsewhere in this file after removing the bar, so the entire `useOnboarding()` call and import can be removed from this file.

No other files are affected.
