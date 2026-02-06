

# Expanded Profile for Smart Strategy Assistant Integration

## Overview
Add profile type, children info, and financial goals to the user profile. The Strategy Assistant will automatically use filled fields and only ask about unfilled ones, reducing friction while maintaining thoroughness.

---

## New Profile Fields

| Field | Type | UI Component | Options/Notes |
|-------|------|--------------|---------------|
| `profile_type` | text | Single-select dropdown | Business Owner, Retiree/Grandparent, Salesperson, Wage Earner, Investor, Farmer, Non-Profit |
| `num_children` | integer | Number input | 0-10 |
| `children_ages` | integer[] | Dynamic age inputs | One field per child, driven by num_children |
| `financial_goals` | text[] | Multi-select checkboxes | See below |

### Financial Goals Options (Multi-select)
- Increase Cash Flow
- Reduce Taxes
- Save for Education
- Improve Retirement
- Reduce Insurance Costs
- Large Purchase or Investment

---

## Dynamic Children Ages UI

When the user enters a number of children, that many age input fields appear dynamically:

```
Number of Children: [2]

  Child 1 Age: [5]  years
  Child 2 Age: [12] years
```

If they change to 3:

```
Number of Children: [3]

  Child 1 Age: [5]  years
  Child 2 Age: [12] years
  Child 3 Age: [__] years
```

If they change to 0 or leave empty, no age fields appear.

**Benefits:**
- Validated input (each age is a number 1-25)
- Clean array storage: `[5, 12, 8]`
- No text parsing needed
- Better UX - no formatting decisions

---

## Implementation Phases

### Phase 1: Database Migration
Add 4 new nullable columns to the `profiles` table:
- `profile_type` (text)
- `num_children` (integer)
- `children_ages` (integer array)
- `financial_goals` (text array)

### Phase 2: Profile Types and Constants
Create `src/lib/profileTypes.ts` with:
- Profile type options array
- Financial goals options array
- Type definitions

### Phase 3: Update Profile Hook
Update `src/hooks/useProfile.ts`:
- Add new fields to the `Profile` interface
- Include new fields in mutation

### Phase 4: Update Profile Page UI
Update `src/pages/Profile.tsx`:
- Add "Optional Information" section after Personal Information
- Include helper note about better experience
- Add Profile Type dropdown
- Add Number of Children input
- Add dynamic Child Age inputs (one per child)
- Add Financial Goals multi-select checkboxes

### Phase 5: Strategy Assistant Integration
Update `supabase/functions/rprx-chat/index.ts`:
- Fetch all new profile fields
- Generate dynamic profile context
- Instruct AI to skip questions for filled fields
- List unfilled fields that still need to be asked

---

## Profile Page Layout

```
+-------------------------------------------------------------+
| Profile Photo                                               |
|   [Avatar with camera button]                               |
+-------------------------------------------------------------+

+-------------------------------------------------------------+
| Personal Information                                        |
|   Full Name, Email, Phone, Company                          |
+-------------------------------------------------------------+

+-------------------------------------------------------------+
| Optional Information                                        |
| +----------------------------------------------------------+|
| | (i) Completing these fields is optional, but will        ||
| |     provide a better, more personalized experience.      ||
| +----------------------------------------------------------+|
|                                                             |
| Profile Type                                                |
| +---------------------------------------------------+      |
| | Select your profile type...                   [v] |      |
| +---------------------------------------------------+      |
|                                                             |
| Number of Children                                          |
| +-------+                                                   |
| |   2   |                                                   |
| +-------+                                                   |
|                                                             |
|   Child 1 Age    Child 2 Age                                |
|   +-------+      +-------+                                  |
|   |   5   |      |   12  |      (dynamic based on count)    |
|   +-------+      +-------+                                  |
|                                                             |
| Financial Goals (select all that apply)                     |
| [ ] Increase Cash Flow                                      |
| [x] Reduce Taxes                                            |
| [x] Save for Education                                      |
| [ ] Improve Retirement                                      |
| [ ] Reduce Insurance Costs                                  |
| [ ] Large Purchase or Investment                            |
+-------------------------------------------------------------+

+-------------------------------------------------------------+
| Cash Flow Snapshot                                          |
| Help us personalize your experience (optional)              |
|   [Existing cash flow fields...]                            |
+-------------------------------------------------------------+

              [Cancel]  [Save Changes]
```

---

## Strategy Assistant Integration Logic

### System Prompt Enhancement

The edge function will generate dynamic context based on filled vs. unfilled fields:

**When profile data exists:**
```
## USER PROFILE (Pre-filled - Do NOT ask these again)
- Profile Type: Business Owner
- Children: 2 (ages: 5, 12)
- Financial Goals: Reduce Taxes, Save for Education

## USER FINANCIAL PROFILE  
- Monthly Income: $8,500
- Monthly Surplus: $1,700
- Cash Flow Status: Healthy Surplus

IMPORTANT: Use this pre-filled information to tailor recommendations.
Skip intake questions for these topics - the user has already provided this data.
```

**When fields are missing:**
```
## STILL NEEDED (Ask about these)
The user has not filled the following in their profile. Please ask during intake:
- Profile type (what do they do for a living)
- Number and ages of children
- Primary financial goals
```

### Intake Question Mapping

| Profile Field | Skips This Intake Question |
|--------------|---------------------------|
| `profile_type` | "What do you do for work?" / "Tell me about yourself" |
| `num_children` / `children_ages` | "Do you have children?" / "How old are your kids?" |
| `financial_goals` | "What are your main financial priorities?" |
| `monthly_income` | "What is your approximate monthly income?" |
| Cash flow fields | Income/expense related questions |

---

## File Changes

### Database
| File | Action |
|------|--------|
| Migration file | Add 4 new columns to `profiles` table |

### Frontend
| File | Action |
|------|--------|
| `src/lib/profileTypes.ts` | NEW - Type definitions and option arrays |
| `src/hooks/useProfile.ts` | Update Profile interface with new fields |
| `src/pages/Profile.tsx` | Add Optional Information section with dynamic children inputs |

### Edge Function
| File | Action |
|------|--------|
| `supabase/functions/rprx-chat/index.ts` | Fetch new fields, generate dynamic context, update system prompt |

---

## Technical Details

### Profile Types Constant
```typescript
export const PROFILE_TYPES = [
  { value: 'business_owner', label: 'Business Owner' },
  { value: 'retiree', label: 'Retiree / Grandparent' },
  { value: 'salesperson', label: 'Salesperson' },
  { value: 'wage_earner', label: 'Wage Earner' },
  { value: 'investor', label: 'Investor' },
  { value: 'farmer', label: 'Farmer' },
  { value: 'nonprofit', label: 'Non-Profit' },
] as const;
```

### Financial Goals Constant
```typescript
export const FINANCIAL_GOALS = [
  { value: 'increase_cash_flow', label: 'Increase Cash Flow' },
  { value: 'reduce_taxes', label: 'Reduce Taxes' },
  { value: 'save_for_education', label: 'Save for Education' },
  { value: 'improve_retirement', label: 'Improve Retirement' },
  { value: 'reduce_insurance_costs', label: 'Reduce Insurance Costs' },
  { value: 'large_purchase', label: 'Large Purchase or Investment' },
] as const;
```

### Updated Profile Interface
```typescript
export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  company: string | null;
  created_at: string;
  updated_at: string;
  // Cash flow fields
  monthly_income: number | null;
  monthly_debt_payments: number | null;
  monthly_housing: number | null;
  monthly_insurance: number | null;
  monthly_living_expenses: number | null;
  // New profile fields
  profile_type: string | null;
  num_children: number | null;
  children_ages: number[] | null;  // Array of ages
  financial_goals: string[] | null;
}
```

### SQL Migration
```sql
ALTER TABLE profiles ADD COLUMN profile_type text;
ALTER TABLE profiles ADD COLUMN num_children integer;
ALTER TABLE profiles ADD COLUMN children_ages integer[];
ALTER TABLE profiles ADD COLUMN financial_goals text[];
```

### Dynamic Children Ages Component Logic
```typescript
// In Profile.tsx
const [numChildren, setNumChildren] = useState<number>(0);
const [childrenAges, setChildrenAges] = useState<number[]>([]);

// When numChildren changes, adjust the ages array
useEffect(() => {
  setChildrenAges(prev => {
    if (numChildren > prev.length) {
      // Add empty slots for new children
      return [...prev, ...Array(numChildren - prev.length).fill(0)];
    } else {
      // Trim excess children
      return prev.slice(0, numChildren);
    }
  });
}, [numChildren]);

// Render dynamic age inputs
{numChildren > 0 && (
  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
    {Array.from({ length: numChildren }).map((_, index) => (
      <div key={index} className="space-y-2">
        <Label>Child {index + 1} Age</Label>
        <Input
          type="number"
          min={0}
          max={25}
          value={childrenAges[index] || ''}
          onChange={(e) => {
            const newAges = [...childrenAges];
            newAges[index] = parseInt(e.target.value) || 0;
            setChildrenAges(newAges);
          }}
        />
      </div>
    ))}
  </div>
)}
```

---

## User Experience Flow

1. User visits Profile page
2. Sees info note: "Completing these fields is optional, but will provide a better, more personalized experience"
3. Selects profile type from dropdown
4. Enters number of children (e.g., 2)
5. Two age input fields appear - enters ages 5 and 12
6. Selects financial goals (checkboxes)
7. Saves profile
8. Opens Strategy Assistant
9. AI greets user: "Hi! I see you are a Business Owner focused on reducing taxes and saving for education, with two children ages 5 and 12. Let me ask a few more questions to give you the best recommendations..."
10. AI skips already-answered questions and focuses on missing info

---

## Benefits

| Benefit | Description |
|---------|-------------|
| Reduced friction | Skip 3-5 intake questions when profile is complete |
| Better UX | Users answer questions once, not repeatedly |
| Structured data | Clean integer arrays instead of free-text parsing |
| Validated input | Each age field is constrained to valid numbers |
| Dynamic UI | Fields appear/disappear based on child count |
| Personalized greetings | Assistant acknowledges user situation |
| Reusable data | Same profile data available across features |

