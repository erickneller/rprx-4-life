

# Company-Specific Links + Company Dashboard

## What's Already Built
- `/join?token=<invite_token>` page with signup + auto-join flow
- `companies` table with `invite_token` (auto-generated UUID per company)
- `company_members` table linking users to companies
- Admin `CompaniesTab` to create companies and copy invite links
- `profiles.company_id` populated on join

Each of the 10 companies already gets a unique invite link from the Admin panel. Employees who sign up via that link are automatically tagged as members of that company.

## What Needs to Be Built

### 1. Company Dashboard Page (`/company-dashboard`)
A new page accessible to company owners/admins showing aggregated, non-sensitive usage stats for their company's members:

- **Header**: Company name, member count, plan tier
- **Stats cards**: Total members, active this week, assessments completed, avg RPRx score, total strategies activated
- **Member activity table**: Name, join date, last active, assessment status (completed/not), current streak, tier — no financial data shown
- **Engagement chart**: Signups over time or weekly active users (simple bar chart)

### 2. Database: Company Dashboard RLS
The existing `company_members` SELECT policy only allows `user_id = auth.uid()`. To let a company admin see all members, add a policy:
- Company owners/admins can SELECT all `company_members` rows for their company
- Create a `company_dashboard_stats` SQL function (security definer) that aggregates profile data (streaks, tiers, last_active) for members of a given company — returns only non-sensitive fields

### 3. Hook: `useCompanyDashboard`
- Takes the user's company_id from their membership
- Calls the `company_dashboard_stats` RPC function
- Returns aggregated stats + member list (non-sensitive fields only)

### 4. Sidebar Navigation
- Add "Company" link in the sidebar, visible only to users who have a `company_members` row with role `owner` or `admin`

### 5. Route + Guard
- Add `/company-dashboard` route in `App.tsx`
- Protected route, only accessible if user has company owner/admin role

## Files to Create/Modify
- **New migration**: `company_dashboard_stats` RPC function + updated RLS policy on `company_members`
- **New**: `src/pages/CompanyDashboard.tsx`
- **New**: `src/hooks/useCompanyDashboard.ts`
- **Modify**: `src/components/layout/AppSidebar.tsx` — add Company nav link
- **Modify**: `src/App.tsx` — add route

## Security
- The RPC function uses `SECURITY DEFINER` and validates the caller is an owner/admin of the requested company
- No financial data (income, debts, scores) exposed — only engagement metrics (streak, tier, last active, assessment completion status)

