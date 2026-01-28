

# RPRx Financial Success Assessment MVP - Implementation Plan

## Overview

This plan implements all five Freemium MVP features for the RPRx 4 Life platform. The assessment will guide users through a 3-5 minute diagnostic experience, calculate pressure from the Four Horsemen, and provide educational feedback.

---

## Database Schema

### Tables to Create

```text
+------------------------+     +------------------------+     +---------------------------+
|  assessment_questions  |     |    user_assessments    |     |   assessment_responses    |
+------------------------+     +------------------------+     +---------------------------+
| id (uuid, PK)          |     | id (uuid, PK)          |     | id (uuid, PK)             |
| question_text (text)   |     | user_id (uuid, FK)     |     | assessment_id (uuid, FK)  |
| question_type (enum)   |     | completed_at (timestz) |     | question_id (uuid, FK)    |
| order_index (int)      |     | interest_score (int)   |     | response_value (jsonb)    |
| options (jsonb)        |     | taxes_score (int)      |     | created_at (timestamptz)  |
| horseman_weights (jsonb)    | insurance_score (int)  |     +---------------------------+
| category (text)        |     | education_score (int)  |
| created_at (timestamptz)    | primary_horseman (text)|
+------------------------+     | cash_flow_status (enum)|
                               | income_range (text)    |
                               | expense_range (text)   |
                               | created_at (timestamptz)
                               +------------------------+
```

### Enums

```sql
-- Question types
CREATE TYPE question_type AS ENUM ('slider', 'single_choice', 'yes_no', 'range_select');

-- Cash flow status
CREATE TYPE cash_flow_status AS ENUM ('surplus', 'tight', 'deficit');

-- Horseman types
CREATE TYPE horseman_type AS ENUM ('interest', 'taxes', 'insurance', 'education');
```

### RLS Policies

| Table | Policy | Rule |
|-------|--------|------|
| assessment_questions | Public read | Anyone can read questions |
| user_assessments | User owns | Users can only CRUD their own assessments |
| assessment_responses | User owns via assessment | Users can only CRUD responses for their own assessments |

---

## Assessment Questions (15 Total)

### Interest (Debt Pressure) - 4 Questions

| # | Question | Type | Options/Range |
|---|----------|------|---------------|
| 1 | How often do you think about debt payments when making everyday spending decisions? | slider | Never - Sometimes - Often - Always |
| 2 | Do you currently have any credit card balances that carry over month to month? | yes_no | Yes / No |
| 3 | How would you describe your comfort level with your current debt situation? | single_choice | Very comfortable / Somewhat comfortable / Somewhat uncomfortable / Very uncomfortable |
| 4 | In the past year, have you taken on new debt to cover unexpected expenses? | yes_no | Yes / No |

### Taxes (Tax Leakage) - 4 Questions

| # | Question | Type | Options/Range |
|---|----------|------|---------------|
| 5 | How confident are you that you're keeping as much of your income as possible? | slider | Not at all - Slightly - Moderately - Very |
| 6 | Do you have a clear understanding of how your income is taxed? | single_choice | Crystal clear / General idea / Somewhat fuzzy / No idea |
| 7 | Have you explored ways to reduce your tax burden in the past year? | yes_no | Yes / No |
| 8 | How often do you feel surprised by your tax bill or refund amount? | single_choice | Never / Rarely / Sometimes / Often |

### Insurance (Protection Costs) - 4 Questions

| # | Question | Type | Options/Range |
|---|----------|------|---------------|
| 9 | How confident are you that your insurance coverage matches your actual needs? | slider | Not at all - Slightly - Moderately - Very |
| 10 | When was the last time you reviewed all your insurance policies together? | single_choice | Within 6 months / Within 1 year / 1-3 years ago / Can't remember |
| 11 | Do you know approximately how much you pay monthly across all insurance types? | yes_no | Yes / No |
| 12 | Have you ever felt you were paying for coverage you don't need? | single_choice | Never / Once or twice / Sometimes / Often |

### Education (Future Funding) - 3 Questions

| # | Question | Type | Options/Range |
|---|----------|------|---------------|
| 13 | How prepared do you feel for future education costs (for yourself or children or grandchildren)? | slider | Not at all - Slightly - Moderately - Very |
| 14 | Do you have a specific savings plan for education expenses? | yes_no | Yes / No |
| 15 | How much do education funding concerns impact your current financial decisions? | single_choice | Not at all / Slightly / Moderately / Significantly |

### Cash Flow Questions (2 Additional)

| # | Question | Type | Purpose |
|---|----------|------|---------|
| 16 | What is your approximate monthly household income range? | range_select | Cash flow calculation |
| 17 | What is your approximate monthly household expense range? | range_select | Cash flow calculation |

**Income/Expense Ranges:**
- Under $3,000
- $3,000 - $5,000
- $5,000 - $7,500
- $7,500 - $10,000
- $10,000 - $15,000
- Over $15,000

---

## Scoring Logic

### Horseman Pressure Calculation

Each question contributes 0-100 points to its associated Horseman:

| Response Type | Score Mapping |
|---------------|---------------|
| Slider (4 positions) | Position 1=0, 2=33, 3=66, 4=100 |
| Yes/No (pressure = yes) | Yes=100, No=0 |
| Yes/No (pressure = no) | Yes=0, No=100 |
| Single Choice (4 options) | Varies by question context |

**Final Score:** Average of all question scores per Horseman (0-100 scale)

**Primary Horseman:** Highest scoring category becomes the primary pressure area

### Cash Flow Calculation

```text
Cash Flow Status Logic:
- Surplus: Income range midpoint > Expense range midpoint + 20%
- Deficit: Expense range midpoint > Income range midpoint
- Tight: Everything else
```

---

## UI Component Structure

```text
src/
  components/
    assessment/
      AssessmentWizard.tsx       # Main container with step management
      ProgressIndicator.tsx      # Step progress bar
      QuestionCard.tsx           # Renders individual questions
      SliderQuestion.tsx         # Slider input component
      SingleChoiceQuestion.tsx   # Radio button choices
      YesNoQuestion.tsx          # Yes/No toggle
      RangeSelectQuestion.tsx    # Income/expense range picker
      CashFlowSnapshot.tsx       # Cash flow input section
      
    results/
      ResultsPage.tsx            # Main results container
      HorsemenRadarChart.tsx     # Radial/spider chart visualization
      PrimaryHorsemanCard.tsx    # Highlighted primary pressure
      CashFlowIndicator.tsx      # Visual cash flow status
      DiagnosticFeedback.tsx     # Educational feedback section
      
    dashboard/
      DashboardHome.tsx          # Authenticated user home
      AssessmentHistory.tsx      # List of past assessments
      AssessmentSummaryCard.tsx  # Individual assessment preview
      StartAssessmentCTA.tsx     # Begin assessment button

  hooks/
    useAssessment.ts             # Assessment state management
    useAssessmentHistory.ts      # Fetch user's past assessments
    
  lib/
    scoringEngine.ts             # Calculate horseman scores
    feedbackEngine.ts            # Generate diagnostic feedback
    cashFlowCalculator.ts        # Determine cash flow status
```

---

## Radial Chart Visualization

The Four Horsemen will be displayed using a radar/spider chart:

```text
                    INTEREST
                       /\
                      /  \
                     /    \
                    /      \
        EDUCATION  /--------\  TAXES
                   \        /
                    \      /
                     \    /
                      \  /
                       \/
                   INSURANCE
```

**Visual Specifications:**
- Primary Horseman: Cobalt blue fill with full opacity
- Secondary Horsemen: Muted gray with 40% opacity
- Grid lines: Light gray dashed
- Labels: Dark text, primary label in Cobalt blue
- Animation: Smooth expansion on load (0.5s)
- No numeric values displayed - visual proportion only

**Implementation:** Use Recharts RadarChart component (already installed)

---

## Diagnostic Feedback Templates

### Primary Horseman: Interest (Debt Pressure)

> **Your Primary Pressure: Interest & Debt**
>
> Your assessment indicates that debt-related costs are creating the most significant 
> pressure on your financial picture. This is common when payments accumulate across 
> multiple accounts, each quietly consuming resources through interest charges.
>
> **What This Means:**
> When debt payments command a large portion of income, less remains for building 
> stability or responding to unexpected needs. The compounding nature of interest 
> means this pressure can grow over time if not addressed systematically.
>
> **Why It Matters:**
> Interest costs interact with your other financial areas. Debt pressure can limit 
> your ability to optimize taxes, maintain appropriate insurance coverage, or save 
> for education goals.

### Primary Horseman: Taxes

> **Your Primary Pressure: Tax Efficiency**
>
> Your assessment suggests that tax-related awareness is an area where attention 
> could yield meaningful improvements. This is particularly relevant when income 
> changes or life circumstances evolve without corresponding adjustments to tax planning.
>
> **What This Means:**
> Without proactive awareness, tax obligations can take more than necessary from 
> your income. Small inefficiencies accumulate over years, representing significant 
> unrealized resources.
>
> **Why It Matters:**
> Tax efficiency affects how much remains for debt management, insurance costs, and 
> savings goals. Clarity here creates ripple effects across your entire financial picture.

### Primary Horseman: Insurance

> **Your Primary Pressure: Insurance Costs**
>
> Your assessment indicates that insurance costs and coverage alignment represent 
> your most significant pressure area. This often develops gradually as policies 
> accumulate without regular review or coordination.
>
> **What This Means:**
> Insurance is essential protection, but misaligned coverage—either gaps or 
> redundancies—creates unnecessary financial drag. Premiums paid for unneeded 
> coverage are resources that could serve you elsewhere.
>
> **Why It Matters:**
> Insurance costs affect your monthly cash flow, which influences your ability to 
> manage debt, save for education, and optimize your overall financial efficiency.

### Primary Horseman: Education

> **Your Primary Pressure: Education Funding**
>
> Your assessment shows that education-related costs—current or future—are creating 
> the most significant pressure on your financial outlook. This is common when 
> education needs are approaching without a clear funding pathway.
>
> **What This Means:**
> Education costs continue to rise faster than general inflation, creating a moving 
> target for planning. Without awareness and structured preparation, these costs 
> often require last-minute borrowing, which compounds pressure in other areas.
>
> **Why It Matters:**
> Education funding pressure can influence decisions about debt, tax strategies, 
> and how you allocate resources across all financial priorities.

### Compounding Pressure Explanation

> **How These Pressures Interact**
>
> The Four Horsemen—Interest, Taxes, Insurance, and Education costs—don't exist in 
> isolation. They compound and interact:
>
> - Debt pressure can limit funds available for tax-efficient savings
> - Tax inefficiency reduces resources for managing other costs
> - Uncoordinated insurance creates cash flow drain affecting all areas
> - Education funding gaps often lead to future debt, restarting the cycle
>
> Understanding which area to address first creates clarity and prevents scattered 
> efforts that rarely produce lasting change.

---

## User Flow

```text
1. LANDING PAGE
   |
   v
2. SIGN UP / LOG IN
   |
   v
3. DASHBOARD (First Time)
   +-- "Welcome! Take your first assessment"
   +-- [Start Assessment] button
   |
   v
4. ASSESSMENT WIZARD
   +-- Progress bar (17 steps)
   +-- Question 1-15 (Four Horsemen)
   +-- Questions 16-17 (Cash Flow)
   +-- [Submit Assessment]
   |
   v
5. RESULTS PAGE
   +-- Radial Chart (Four Horsemen)
   +-- Primary Horseman Highlight
   +-- Cash Flow Status Indicator
   +-- Diagnostic Feedback
   +-- [Return to Dashboard] / [Retake Assessment]
   |
   v
6. DASHBOARD (Returning)
   +-- Latest Assessment Summary
   +-- Assessment History
   +-- [Take New Assessment] button
   +-- Compare results over time
```

---

## File Changes Summary

### New Files (22)

| Category | Files |
|----------|-------|
| Components - Assessment | `AssessmentWizard.tsx`, `ProgressIndicator.tsx`, `QuestionCard.tsx`, `SliderQuestion.tsx`, `SingleChoiceQuestion.tsx`, `YesNoQuestion.tsx`, `RangeSelectQuestion.tsx`, `CashFlowSnapshot.tsx` |
| Components - Results | `ResultsPage.tsx`, `HorsemenRadarChart.tsx`, `PrimaryHorsemanCard.tsx`, `CashFlowIndicator.tsx`, `DiagnosticFeedback.tsx` |
| Components - Dashboard | `DashboardHome.tsx`, `AssessmentHistory.tsx`, `AssessmentSummaryCard.tsx`, `StartAssessmentCTA.tsx` |
| Hooks | `useAssessment.ts`, `useAssessmentHistory.ts` |
| Lib | `scoringEngine.ts`, `feedbackEngine.ts`, `cashFlowCalculator.ts` |

### Modified Files (3)

| File | Change |
|------|--------|
| `src/App.tsx` | Add routes for `/assessment`, `/results/:id` |
| `src/components/Dashboard.tsx` | Replace placeholder with `DashboardHome` |
| `src/integrations/supabase/types.ts` | Auto-updated after migration |

### Database Migrations (1)

Single migration file containing:
- Enum type definitions
- Three tables with proper constraints
- RLS policies for all tables
- Seed data for assessment questions

---

## Technical Considerations

### Data Types for horseman_weights

```json
{
  "interest": 1.0,
  "taxes": 0,
  "insurance": 0,
  "education": 0
}
```
Each question can weight to multiple Horsemen if needed (most will be single-Horseman).

### Question Options Format

```json
{
  "options": [
    {"value": "never", "label": "Never", "score": 0},
    {"value": "rarely", "label": "Rarely", "score": 33},
    {"value": "sometimes", "label": "Sometimes", "score": 66},
    {"value": "often", "label": "Often", "score": 100}
  ]
}
```

### Responsive Design

- Mobile-first approach
- Questions display one at a time on mobile
- Swipe gestures for navigation
- Radial chart scales proportionally
- Touch-friendly slider and button sizes

---

## Implementation Phases

| Phase | Description | Deliverables |
|-------|-------------|--------------|
| **1** | Database Foundation | Migration, tables, RLS, seed questions |
| **2** | Assessment UI | Wizard flow, all question types, progress |
| **3** | Scoring Engine | Calculate scores, determine primary Horseman |
| **4** | Results Visualization | Radial chart, primary highlight, cash flow |
| **5** | Feedback System | Generate and display diagnostic content |
| **6** | Dashboard Integration | History, retake, comparison |

---

## Compliance Notes

- No financial advice or specific recommendations
- Language uses "pressure" and "awareness" not "problems" or "failures"
- Educational tone throughout
- No action steps or strategies revealed
- Positions as diagnostic tool complementing advisors

