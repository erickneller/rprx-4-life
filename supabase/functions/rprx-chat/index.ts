import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// =====================================================
// RPRx STRATEGY KNOWLEDGE BASE (80 STRATEGIES)
// =====================================================

const KNOWLEDGE_BASE = `
# RPRx Four Horsemen Strategy Knowledge Base

This knowledge base contains 80 strategies across the Four Horsemen: Interest (10), Taxes (20), Insurance (20), and Education (20).

## INTEREST STRATEGIES (10 Strategies)

### Strategy I-1: Equity Recapture (Mortgage Acceleration)
- **Horseman(s):** Interest
- **Summary:** Make extra payments toward mortgage principal to reduce total interest paid over the life of the loan.
- **Projected Savings:** $50,000 - $655,000+
- **Complexity:** 2/5
- **Best For:** Homeowners with stable income and extra cash flow
- **Key Requirements:** Active mortgage, discretionary income for extra payments
- **Implementation Plan:**
  1. Review current mortgage terms (rate, balance, remaining term)
  2. Calculate impact of additional principal payments
  3. Set up automatic extra principal payments (monthly or bi-weekly)
  4. Track progress and recalculate periodically
- **Tax Code Reference:** N/A (interest savings, not tax deduction)
- **Example:** $400K mortgage at 6% over 30 years = $863K total. Extra $500/month saves $200K+ in interest.
- **Disclaimer:** Results depend on loan terms and payment consistency.

### Strategy I-2: Refinance to Lower Rate
- **Horseman(s):** Interest
- **Summary:** Refinance existing mortgage or loans to a lower interest rate to reduce monthly payments and total interest.
- **Projected Savings:** $20,000 - $150,000+
- **Complexity:** 2/5
- **Best For:** Borrowers with improved credit or when market rates drop
- **Key Requirements:** Good credit score, sufficient equity, closing cost funds
- **Implementation Plan:**
  1. Check current rates vs. your existing rate
  2. Calculate break-even point for closing costs
  3. Shop multiple lenders for best terms
  4. Complete application and appraisal process
  5. Close on new loan
- **Tax Code Reference:** N/A
- **Example:** Refinancing from 7% to 5.5% on $300K saves $100+ monthly.
- **Disclaimer:** Closing costs apply; ensure break-even makes sense.

### Strategy I-3: HELOC for Debt Consolidation
- **Horseman(s):** Interest
- **Summary:** Use Home Equity Line of Credit to consolidate high-interest debt (credit cards, personal loans) at lower rates.
- **Projected Savings:** $5,000 - $50,000+
- **Complexity:** 2/5
- **Best For:** Homeowners with significant equity and high-interest debt
- **Key Requirements:** Home equity (typically 15-20%), good credit
- **Implementation Plan:**
  1. Calculate total high-interest debt
  2. Determine available home equity
  3. Apply for HELOC with competitive rate
  4. Pay off high-interest debts
  5. Create payment plan for HELOC
- **Tax Code Reference:** HELOC interest may be deductible if used for home improvements (IRC §163)
- **Example:** Consolidating $30K at 22% to HELOC at 8% saves $4,200/year in interest.
- **Disclaimer:** Home is collateral; risk of foreclosure if payments missed.

### Strategy I-4: Cash Value Life Insurance Loans
- **Horseman(s):** Interest
- **Summary:** Borrow against cash value of permanent life insurance policy at favorable rates, often with flexible repayment.
- **Projected Savings:** $2,000 - $30,000+
- **Complexity:** 3/5
- **Best For:** Those with funded whole/universal life policies needing liquidity
- **Key Requirements:** Permanent life insurance with accumulated cash value
- **Implementation Plan:**
  1. Review policy's cash value and loan provisions
  2. Request loan from insurance company
  3. Use funds as needed (no restrictions)
  4. Establish repayment plan or let interest capitalize
- **Tax Code Reference:** Policy loans are generally tax-free (IRC §72(e))
- **Example:** Borrow $50K at 5% vs. bank loan at 10% saves $2,500/year.
- **Disclaimer:** Unpaid loans reduce death benefit; may trigger taxes if policy lapses.

### Strategy I-5: 0% Balance Transfer Cards
- **Horseman(s):** Interest
- **Summary:** Transfer high-interest credit card balances to cards offering 0% introductory APR.
- **Projected Savings:** $500 - $5,000+
- **Complexity:** 1/5
- **Best For:** Those with good credit carrying credit card balances
- **Key Requirements:** Good/excellent credit score, discipline to pay off during intro period
- **Implementation Plan:**
  1. Research 0% balance transfer offers
  2. Apply for card with longest intro period
  3. Transfer balances (watch for transfer fees)
  4. Create payoff plan before intro period ends
- **Tax Code Reference:** N/A
- **Example:** Transfer $10K at 22% to 0% for 18 months saves $3,300 in interest.
- **Disclaimer:** Rate jumps after intro period; transfer fees (typically 3-5%) apply.

### Strategy I-6: Negotiate Lower Interest Rates
- **Horseman(s):** Interest
- **Summary:** Contact lenders to negotiate lower interest rates on existing credit cards and loans.
- **Projected Savings:** $200 - $3,000+
- **Complexity:** 1/5
- **Best For:** Customers with good payment history
- **Key Requirements:** Strong payment history, competitive offers from other lenders
- **Implementation Plan:**
  1. Review current rates on all accounts
  2. Research competitor rates
  3. Call each lender's retention department
  4. Present case for rate reduction
  5. Document new rates
- **Tax Code Reference:** N/A
- **Example:** Reducing card rate from 24% to 18% on $8K balance saves $480/year.
- **Disclaimer:** Not guaranteed; depends on creditworthiness and lender policy.

### Strategy I-7: Student Loan Refinancing
- **Horseman(s):** Interest
- **Summary:** Refinance federal or private student loans to lower rate through private lenders.
- **Projected Savings:** $5,000 - $40,000+
- **Complexity:** 2/5
- **Best For:** Graduates with stable income and good credit
- **Key Requirements:** Steady income, good credit, graduation from eligible program
- **Implementation Plan:**
  1. Gather current loan details and rates
  2. Check rates from multiple refinance lenders
  3. Compare total cost including any fees
  4. Apply with chosen lender
  5. Set up autopay for additional rate reduction
- **Tax Code Reference:** Student loan interest deduction up to $2,500 (IRC §221)
- **Example:** Refinancing $80K from 7% to 4% over 10 years saves $15K+.
- **Disclaimer:** Refinancing federal loans loses federal benefits (PSLF, IDR plans).

### Strategy I-8: Auto Loan Refinancing
- **Horseman(s):** Interest
- **Summary:** Refinance existing auto loan to lower rate to reduce monthly payments and total interest.
- **Projected Savings:** $500 - $3,000+
- **Complexity:** 1/5
- **Best For:** Those with improved credit since original loan
- **Key Requirements:** Vehicle with sufficient equity, improved credit
- **Implementation Plan:**
  1. Check current loan balance and rate
  2. Get quotes from banks, credit unions, online lenders
  3. Compare offers considering any fees
  4. Complete application with new lender
  5. New lender pays off old loan
- **Tax Code Reference:** N/A
- **Example:** Refinancing $25K from 8% to 4% saves $50+/month.
- **Disclaimer:** Extending term may increase total interest despite lower rate.

### Strategy I-9: Biweekly Payment Strategy
- **Horseman(s):** Interest
- **Summary:** Split monthly payment in half and pay every two weeks, resulting in one extra payment per year.
- **Projected Savings:** $10,000 - $50,000+
- **Complexity:** 1/5
- **Best For:** Any borrower with monthly payment obligations
- **Key Requirements:** Lender that accepts biweekly payments, consistent income
- **Implementation Plan:**
  1. Confirm lender accepts biweekly payments
  2. Set up automatic biweekly withdrawals
  3. Ensure extra payment applies to principal
  4. Track loan payoff acceleration
- **Tax Code Reference:** N/A
- **Example:** On $300K mortgage, biweekly payments can pay off 4+ years early.
- **Disclaimer:** Some lenders charge fees for biweekly programs.

### Strategy I-10: Round-Up Payment Strategy
- **Horseman(s):** Interest
- **Summary:** Round up monthly loan payments to nearest $50 or $100 to accelerate principal paydown.
- **Projected Savings:** $5,000 - $30,000+
- **Complexity:** 1/5
- **Best For:** Anyone with loan payments
- **Key Requirements:** Discretionary income for slightly higher payments
- **Implementation Plan:**
  1. Calculate rounded-up payment amount
  2. Specify extra goes to principal
  3. Set up automatic payment at new amount
  4. Track accelerated payoff date
- **Tax Code Reference:** N/A
- **Example:** Rounding $1,847 payment to $1,900 adds $636/year to principal.
- **Disclaimer:** Minimal impact individually but compounds over time.

## TAX STRATEGIES (20 Strategies)

### Strategy T-1: Maximize 401(k) Contributions
- **Horseman(s):** Taxes
- **Summary:** Contribute maximum allowed to employer 401(k) to reduce current taxable income.
- **Projected Savings:** $2,000 - $50,000+ (depends on tax bracket)
- **Complexity:** 1/5
- **Best For:** Employees with 401(k) access
- **Key Requirements:** Employer-sponsored 401(k), earned income
- **Implementation Plan:**
  1. Determine contribution limit ($23,000 for 2024, +$7,500 catch-up if 50+)
  2. Calculate percentage needed to max out
  3. Update payroll contribution election
  4. Maximize any employer match first
- **Tax Code Reference:** IRC §401(k), §402(g)
- **Example:** $23K contribution in 32% bracket saves $7,360 in taxes.
- **Disclaimer:** Funds locked until 59½ (with exceptions); required distributions start at 73.

### Strategy T-2: Health Savings Account (HSA) Triple Tax Benefit
- **Horseman(s):** Taxes, Insurance
- **Summary:** Contribute to HSA for tax-deductible contributions, tax-free growth, and tax-free qualified withdrawals.
- **Projected Savings:** $1,000 - $15,000+ annually
- **Complexity:** 2/5
- **Best For:** Those with high-deductible health plans (HDHPs)
- **Key Requirements:** HDHP coverage, no Medicare enrollment
- **Implementation Plan:**
  1. Confirm HDHP enrollment
  2. Open HSA if not provided by employer
  3. Contribute max ($4,150 individual/$8,300 family for 2024)
  4. Invest HSA funds for long-term growth
  5. Save receipts for future tax-free withdrawals
- **Tax Code Reference:** IRC §223
- **Example:** Family contributing $8,300 in 24% bracket saves $1,992 + payroll taxes.
- **Disclaimer:** Non-qualified withdrawals incur taxes and 20% penalty before 65.

### Strategy T-3: Section 179 Deduction
- **Horseman(s):** Taxes
- **Summary:** Deduct full cost of qualifying business equipment in year of purchase instead of depreciating.
- **Projected Savings:** $5,000 - $300,000+ (depends on equipment cost)
- **Complexity:** 3/5
- **Best For:** Business owners purchasing equipment
- **Key Requirements:** Business income, qualifying property, placed in service during tax year
- **Implementation Plan:**
  1. Identify qualifying equipment purchases
  2. Confirm 179 limit ($1.16M for 2024) and phase-out threshold
  3. Elect 179 on tax return (Form 4562)
  4. Document business use percentage
- **Tax Code Reference:** IRC §179
- **Example:** $100K equipment purchase in 35% bracket saves $35K in taxes immediately.
- **Disclaimer:** Cannot exceed business income; some property types excluded.

### Strategy T-4: Qualified Business Income (QBI) Deduction
- **Horseman(s):** Taxes
- **Summary:** Deduct up to 20% of qualified business income from pass-through entities.
- **Projected Savings:** $2,000 - $100,000+
- **Complexity:** 3/5
- **Best For:** Sole proprietors, S-corp/partnership owners, some trusts
- **Key Requirements:** Pass-through income, income thresholds, non-SSTB or within limits
- **Implementation Plan:**
  1. Calculate qualified business income
  2. Determine if SSTB limitations apply
  3. Calculate W-2 wage/capital limitations if over threshold
  4. Claim deduction on Form 8995 or 8995-A
- **Tax Code Reference:** IRC §199A
- **Example:** $200K QBI = $40K deduction = $12K+ tax savings.
- **Disclaimer:** Complex limitations for high earners and specified service businesses.

### Strategy T-5: Roth IRA Conversion Strategy
- **Horseman(s):** Taxes
- **Summary:** Convert traditional IRA to Roth in low-income years to reduce future required distributions and tax burden.
- **Projected Savings:** $10,000 - $500,000+ (lifetime)
- **Complexity:** 4/5
- **Best For:** Those expecting higher future tax rates or with low-income years
- **Key Requirements:** Traditional IRA or 401(k) funds, ability to pay conversion taxes
- **Implementation Plan:**
  1. Analyze current vs. expected future tax brackets
  2. Calculate optimal conversion amount to stay in current bracket
  3. Execute partial or full conversion
  4. Pay estimated taxes (don't withhold from conversion)
  5. Repeat annually as appropriate
- **Tax Code Reference:** IRC §408A
- **Example:** Convert $100K in 22% bracket, save 10%+ if future rate is 32%.
- **Disclaimer:** Conversion is taxable; no 5-year holding on contributions but earnings.

### Strategy T-6: Charitable Remainder Trust (CRT)
- **Horseman(s):** Taxes
- **Summary:** Transfer appreciated assets to CRT for income stream, avoid capital gains, and receive charitable deduction.
- **Projected Savings:** $50,000 - $1,000,000+
- **Complexity:** 5/5
- **Best For:** High-net-worth individuals with appreciated assets and charitable intent
- **Key Requirements:** Appreciated assets, irrevocable transfer, charitable remainder
- **Implementation Plan:**
  1. Consult with estate planning attorney
  2. Choose CRT type (annuity or unitrust)
  3. Transfer appreciated assets to trust
  4. Receive income stream for term/life
  5. Remainder goes to charity at trust termination
- **Tax Code Reference:** IRC §664
- **Example:** Transfer $1M stock with $100K basis; avoid $180K capital gains, receive $50K+ annual income.
- **Disclaimer:** Irrevocable; complex setup and administration costs.

### Strategy T-7: Donor-Advised Fund (DAF) Bunching
- **Horseman(s):** Taxes
- **Summary:** Bunch multiple years of charitable donations into one year via DAF to exceed standard deduction.
- **Projected Savings:** $2,000 - $20,000+
- **Complexity:** 2/5
- **Best For:** Charitable givers whose annual donations don't exceed standard deduction
- **Key Requirements:** Charitable intent, funds to bunch
- **Implementation Plan:**
  1. Calculate multiple years of intended giving
  2. Open DAF account
  3. Contribute bunched amount in one tax year
  4. Itemize deductions that year
  5. Distribute grants to charities over time
- **Tax Code Reference:** IRC §170
- **Example:** Bunch 3 years ($15K/year = $45K) to itemize vs. standard deduction.
- **Disclaimer:** Contribution to DAF is irrevocable (but grants are flexible).

### Strategy T-8: Qualified Opportunity Zone Investment
- **Horseman(s):** Taxes
- **Summary:** Defer and reduce capital gains by investing in Qualified Opportunity Zone funds.
- **Projected Savings:** $10,000 - $500,000+
- **Complexity:** 5/5
- **Best For:** Those with significant capital gains seeking deferral
- **Key Requirements:** Capital gain within 180 days, investment in QOZ fund
- **Implementation Plan:**
  1. Realize capital gain from sale
  2. Invest gain in QOZ fund within 180 days
  3. Hold for 10+ years for maximum benefit
  4. Report on Form 8949 and 8997
- **Tax Code Reference:** IRC §1400Z-2
- **Example:** Invest $500K gain, hold 10 years, pay zero tax on QOZ appreciation.
- **Disclaimer:** Complex rules; risky investments; deadline sensitive.

### Strategy T-9: Cost Segregation Study
- **Horseman(s):** Taxes
- **Summary:** Accelerate depreciation on commercial/rental real estate by reclassifying components to shorter lives.
- **Projected Savings:** $25,000 - $500,000+
- **Complexity:** 4/5
- **Best For:** Commercial/rental property owners
- **Key Requirements:** Real estate purchase or improvement, engineering study
- **Implementation Plan:**
  1. Engage cost segregation specialist
  2. Complete engineering-based study
  3. Reclassify components (5, 7, 15-year vs. 27.5/39-year)
  4. Claim accelerated depreciation
  5. Consider bonus depreciation eligibility
- **Tax Code Reference:** IRC §168
- **Example:** $2M property may yield $200K+ first-year deductions.
- **Disclaimer:** May increase depreciation recapture on sale; professional study costs $5K-$15K.

### Strategy T-10: Augusta Rule (Section 280A)
- **Horseman(s):** Taxes
- **Summary:** Rent your home to your business for up to 14 days tax-free for meetings/events.
- **Projected Savings:** $2,000 - $20,000+
- **Complexity:** 2/5
- **Best For:** Business owners with suitable home spaces
- **Key Requirements:** Legitimate business purpose, fair market rent documentation
- **Implementation Plan:**
  1. Document fair market rental rates (comparable venues)
  2. Hold legitimate business meetings/events at home
  3. Business pays rent to homeowner
  4. Business deducts rent; homeowner excludes income
- **Tax Code Reference:** IRC §280A(g)
- **Example:** 14 days × $1,500/day = $21,000 tax-free to homeowner.
- **Disclaimer:** Must be legitimate business use; document extensively.

### Strategy T-11: Real Estate Professional Status
- **Horseman(s):** Taxes
- **Summary:** Qualify as real estate professional to deduct rental losses against ordinary income without passive activity limits.
- **Projected Savings:** $10,000 - $200,000+
- **Complexity:** 4/5
- **Best For:** Those heavily involved in real estate with other high income
- **Key Requirements:** 750+ hours in real estate, more than half of personal services
- **Implementation Plan:**
  1. Track hours meticulously (use time log)
  2. Meet material participation in each rental (or elect grouping)
  3. Document all real estate activities
  4. Claim losses against ordinary income
- **Tax Code Reference:** IRC §469(c)(7)
- **Example:** $100K rental losses offset $100K W-2 income = $30K+ tax savings.
- **Disclaimer:** IRS scrutinizes closely; excellent documentation required.

### Strategy T-12: S-Corporation Election
- **Horseman(s):** Taxes
- **Summary:** Elect S-corp status for LLC/sole prop to reduce self-employment taxes.
- **Projected Savings:** $5,000 - $50,000+
- **Complexity:** 3/5
- **Best For:** Self-employed with $50K+ net income
- **Key Requirements:** Reasonable salary, formal payroll, corporate formalities
- **Implementation Plan:**
  1. Evaluate SE tax savings vs. payroll costs
  2. File Form 2553 for S-corp election
  3. Set up payroll for reasonable salary
  4. Take remaining profits as distributions (no SE tax)
- **Tax Code Reference:** IRC §1361-1379
- **Example:** $150K profit: $70K salary + $80K distribution saves $12K+ in SE tax.
- **Disclaimer:** Must pay reasonable salary; payroll complexity and costs.

### Strategy T-13: Backdoor Roth IRA
- **Horseman(s):** Taxes
- **Summary:** Make non-deductible traditional IRA contribution then convert to Roth for high earners.
- **Projected Savings:** $5,000 - $100,000+ (lifetime tax-free growth)
- **Complexity:** 3/5
- **Best For:** High earners above Roth IRA income limits
- **Key Requirements:** No or low pre-tax IRA balances (pro-rata rule)
- **Implementation Plan:**
  1. Ensure no pre-tax traditional IRA balances
  2. Make non-deductible traditional IRA contribution
  3. Convert to Roth shortly after (ideally before gains)
  4. File Form 8606
- **Tax Code Reference:** IRC §408A
- **Example:** $7,000/year backdoor Roth × 20 years = $140K+ tax-free at retirement.
- **Disclaimer:** Pro-rata rule applies if pre-tax IRA exists; consult advisor.

### Strategy T-14: Mega Backdoor Roth
- **Horseman(s):** Taxes
- **Summary:** Contribute after-tax dollars to 401(k) above standard limits, then convert to Roth.
- **Projected Savings:** $20,000 - $500,000+ (lifetime)
- **Complexity:** 4/5
- **Best For:** High earners with 401(k) plans allowing after-tax contributions
- **Key Requirements:** 401(k) plan with after-tax option and in-plan/in-service conversion
- **Implementation Plan:**
  1. Verify plan allows after-tax contributions and conversions
  2. Max out pre-tax/Roth 401(k) first
  3. Contribute additional after-tax (up to $69K total limit for 2024)
  4. Convert after-tax to Roth immediately
- **Tax Code Reference:** IRC §401(k), §402A
- **Example:** Extra $30K+ annually to Roth = hundreds of thousands tax-free.
- **Disclaimer:** Not all plans allow; coordinate with plan administrator.

### Strategy T-15: Installment Sale
- **Horseman(s):** Taxes
- **Summary:** Spread capital gain over multiple years by receiving payments over time.
- **Projected Savings:** $10,000 - $200,000+
- **Complexity:** 3/5
- **Best For:** Sellers of appreciated assets (real estate, business)
- **Key Requirements:** Buyer willing to pay over time, proper documentation
- **Implementation Plan:**
  1. Negotiate installment terms with buyer
  2. Calculate interest rate (must meet AFR minimum)
  3. Document sale with promissory note
  4. Report gain proportionally each year (Form 6252)
- **Tax Code Reference:** IRC §453
- **Example:** $500K gain over 5 years stays in lower brackets each year.
- **Disclaimer:** Interest income is ordinary; buyer default risk.

### Strategy T-16: Qualified Small Business Stock (QSBS) Exclusion
- **Horseman(s):** Taxes
- **Summary:** Exclude up to 100% of gain (up to $10M) on qualified small business stock held 5+ years.
- **Projected Savings:** $100,000 - $3,000,000+
- **Complexity:** 4/5
- **Best For:** Founders, early employees, investors in C-corp startups
- **Key Requirements:** Original issue stock, C-corp, 5+ year holding, qualified business
- **Implementation Plan:**
  1. Confirm C-corp status and qualified trade/business
  2. Document original issue acquisition
  3. Track holding period (5 years minimum)
  4. Claim exclusion on Form 8949
- **Tax Code Reference:** IRC §1202
- **Example:** Sell $5M stock with $100K basis = $4.9M tax-free gain.
- **Disclaimer:** Complex requirements; not all businesses qualify.

### Strategy T-17: Net Unrealized Appreciation (NUA)
- **Horseman(s):** Taxes
- **Summary:** Pay capital gains rate instead of ordinary income on employer stock appreciation in 401(k).
- **Projected Savings:** $20,000 - $500,000+
- **Complexity:** 4/5
- **Best For:** Employees with highly appreciated company stock in 401(k)
- **Key Requirements:** Employer stock in 401(k), lump-sum distribution, triggering event
- **Implementation Plan:**
  1. Identify cost basis of employer stock
  2. Take lump-sum distribution after triggering event
  3. Transfer stock in-kind to taxable brokerage
  4. Pay ordinary tax on basis only; NUA taxed as LTCG when sold
- **Tax Code Reference:** IRC §402(e)(4)
- **Example:** Stock basis $50K, current value $500K. Pay ordinary on $50K, LTCG on $450K.
- **Disclaimer:** Complex rules; must be lump-sum in calendar year.

### Strategy T-18: Family Employment Tax Strategy
- **Horseman(s):** Taxes
- **Summary:** Hire children in family business to shift income to lower/zero tax bracket.
- **Projected Savings:** $2,000 - $15,000+
- **Complexity:** 2/5
- **Best For:** Family business owners with minor children
- **Key Requirements:** Legitimate work, reasonable pay, proper documentation
- **Implementation Plan:**
  1. Identify appropriate jobs for children
  2. Set reasonable hourly rate for work
  3. Document hours and work performed
  4. Pay via check/direct deposit
  5. Child can contribute to Roth IRA with earned income
- **Tax Code Reference:** IRC §3121(b)(3) - FICA exemption for children under 18
- **Example:** Pay child $13,850 (2024 standard deduction) = zero tax, full business deduction.
- **Disclaimer:** Work must be legitimate; pay must be reasonable.

### Strategy T-19: Solo 401(k) / SEP-IRA Maximization
- **Horseman(s):** Taxes
- **Summary:** Maximize retirement contributions for self-employed ($69K+ for 2024).
- **Projected Savings:** $5,000 - $100,000+ (current tax reduction)
- **Complexity:** 2/5
- **Best For:** Self-employed individuals and small business owners
- **Key Requirements:** Self-employment income, no full-time employees (for solo 401(k))
- **Implementation Plan:**
  1. Choose Solo 401(k) vs. SEP-IRA based on situation
  2. Open account before year-end (Solo 401k) or tax deadline (SEP)
  3. Contribute employee portion ($23K+$7.5K catch-up)
  4. Add employer contribution (up to 25% of comp)
- **Tax Code Reference:** IRC §401(k), §408
- **Example:** Self-employed with $200K income can shelter $69K+ from taxes.
- **Disclaimer:** Solo 401(k) requires plan documents; contribution limits complex.

### Strategy T-20: State Tax Optimization
- **Horseman(s):** Taxes
- **Summary:** Relocate business or residence to reduce state income tax burden.
- **Projected Savings:** $10,000 - $500,000+ annually
- **Complexity:** 4/5
- **Best For:** High earners with location flexibility
- **Key Requirements:** Genuine relocation, domicile change, business nexus considerations
- **Implementation Plan:**
  1. Compare state tax rates and rules
  2. Evaluate no-income-tax states (FL, TX, NV, WY, etc.)
  3. Establish genuine domicile (driver's license, voter registration, etc.)
  4. Update business registrations as needed
- **Tax Code Reference:** State-specific; IRC affects federal deductions
- **Example:** Move from CA (13.3%) to FL (0%) on $1M income saves $133K+/year.
- **Disclaimer:** Must be genuine move; states audit aggressively.

## INSURANCE STRATEGIES (20 Strategies)

### Strategy INS-1: High-Deductible Health Plan with HSA
- **Horseman(s):** Insurance, Taxes
- **Summary:** Choose HDHP with lower premiums and tax-advantaged HSA savings.
- **Projected Savings:** $1,000 - $10,000+ annually
- **Complexity:** 2/5
- **Best For:** Healthy individuals/families with emergency fund
- **Key Requirements:** HDHP-qualified plan, ability to cover deductible
- **Implementation Plan:**
  1. Compare HDHP premiums vs. traditional plans
  2. Calculate potential HSA contribution tax savings
  3. Enroll in HDHP during open enrollment
  4. Open and fund HSA to maximum
  5. Invest HSA for long-term growth
- **Tax Code Reference:** IRC §223
- **Example:** Save $4K in premiums + $2K tax savings = $6K total savings.
- **Disclaimer:** Must have funds for high deductible; not ideal for high utilizers.

### Strategy INS-2: Umbrella Insurance
- **Horseman(s):** Insurance
- **Summary:** Add umbrella policy for $1M+ liability coverage at low cost.
- **Projected Savings:** N/A (risk protection)
- **Complexity:** 1/5
- **Best For:** Anyone with assets to protect
- **Key Requirements:** Underlying auto/home policies, asset review
- **Implementation Plan:**
  1. Review current liability coverage limits
  2. Assess total assets needing protection
  3. Get umbrella quotes ($1-5M coverage)
  4. Coordinate with existing policies
- **Tax Code Reference:** N/A
- **Example:** $1M umbrella costs $150-300/year.
- **Disclaimer:** Doesn't cover everything; review exclusions.

### Strategy INS-3: Life Insurance Needs Analysis
- **Horseman(s):** Insurance
- **Summary:** Right-size life insurance coverage to avoid over/under-insuring.
- **Projected Savings:** $500 - $5,000+ annually
- **Complexity:** 2/5
- **Best For:** Anyone with dependents or significant debt
- **Key Requirements:** Income/expense analysis, debt review, goal assessment
- **Implementation Plan:**
  1. Calculate income replacement needs (10-15x annual income)
  2. Add outstanding debts and future obligations (college, etc.)
  3. Subtract existing coverage and savings
  4. Shop term life for gap coverage
- **Tax Code Reference:** IRC §101 (death benefits tax-free)
- **Example:** Replace $5K/month expenses for 20 years = $1.2M coverage need.
- **Disclaimer:** Health conditions affect premiums; shop multiple carriers.

### Strategy INS-4: Term Life Ladder Strategy
- **Horseman(s):** Insurance
- **Summary:** Layer multiple term policies of different lengths to match declining insurance needs.
- **Projected Savings:** $1,000 - $5,000+ (vs. single large policy)
- **Complexity:** 2/5
- **Best For:** Those with varying protection needs over time
- **Key Requirements:** Insurability, clear timeline of needs
- **Implementation Plan:**
  1. Identify coverage needs at different life stages
  2. Purchase layered policies (e.g., 30yr, 20yr, 10yr terms)
  3. As policies expire, coverage naturally decreases
  4. Premiums drop as shorter policies end
- **Tax Code Reference:** IRC §101
- **Example:** Instead of $2M 30-year, layer $1M/30yr + $500K/20yr + $500K/10yr.
- **Disclaimer:** Multiple applications; possible multiple underwriting.

### Strategy INS-5: Disability Insurance Review
- **Horseman(s):** Insurance
- **Summary:** Ensure adequate disability coverage to protect income.
- **Projected Savings:** N/A (income protection)
- **Complexity:** 2/5
- **Best For:** Anyone relying on earned income
- **Key Requirements:** Assessment of employer coverage, individual policy evaluation
- **Implementation Plan:**
  1. Review employer STD/LTD coverage and limitations
  2. Calculate income gap if disabled
  3. Shop individual disability policies
  4. Consider own-occupation definition for professionals
- **Tax Code Reference:** Premiums not deductible; benefits may be taxable (employer-paid)
- **Example:** Protect $200K income; individual policy costs $2-4K/year.
- **Disclaimer:** Pre-existing conditions may limit coverage; definition matters.

### Strategy INS-6: Long-Term Care Insurance
- **Horseman(s):** Insurance
- **Summary:** Protect assets from nursing home/care costs with LTC insurance.
- **Projected Savings:** N/A (asset protection from $100K+/year costs)
- **Complexity:** 3/5
- **Best For:** Ages 50-65 with assets to protect
- **Key Requirements:** Good health at application, ability to pay premiums
- **Implementation Plan:**
  1. Evaluate LTC risk and family history
  2. Compare traditional LTC vs. hybrid (life/LTC) policies
  3. Determine daily benefit and coverage period
  4. Apply while healthy for best rates
- **Tax Code Reference:** IRC §7702B (qualified LTC premiums may be deductible)
- **Example:** LTC policy costs $2-5K/year vs. $100K+/year nursing home.
- **Disclaimer:** Use it or lose it (traditional); rates can increase.

### Strategy INS-7: Hybrid Life/LTC Policies
- **Horseman(s):** Insurance
- **Summary:** Combine life insurance with long-term care benefits for guaranteed return of premium.
- **Projected Savings:** N/A (flexible benefits)
- **Complexity:** 3/5
- **Best For:** Those wanting LTC coverage with death benefit backstop
- **Key Requirements:** Lump sum or premium payments, insurability
- **Implementation Plan:**
  1. Compare hybrid vs. traditional LTC policies
  2. Evaluate death benefit vs. LTC benefit trade-offs
  3. Consider single-premium vs. payment plans
  4. Review cash value access
- **Tax Code Reference:** IRC §7702B, §101
- **Example:** $200K premium provides $400K LTC pool or $250K death benefit.
- **Disclaimer:** Higher premiums than standalone LTC; limited flexibility.

### Strategy INS-8: Captive Insurance Company
- **Horseman(s):** Insurance, Taxes
- **Summary:** Create own insurance company to insure business risks and potentially save taxes.
- **Projected Savings:** $50,000 - $500,000+
- **Complexity:** 5/5
- **Best For:** Profitable businesses with significant insurable risks
- **Key Requirements:** Legitimate insurance needs, proper structure, ongoing compliance
- **Implementation Plan:**
  1. Identify insurable business risks
  2. Engage captive insurance consultant
  3. Form captive in appropriate jurisdiction
  4. Pay premiums for coverage
  5. Manage captive investment and claims
- **Tax Code Reference:** IRC §831(b) (small insurance company election)
- **Example:** Business pays $1M premiums; captive accumulates reserves tax-advantaged.
- **Disclaimer:** IRS scrutinizes captives heavily; must be legitimate insurance.

### Strategy INS-9: Group Benefits Optimization
- **Horseman(s):** Insurance
- **Summary:** Maximize employer-provided benefits (life, disability, FSA, etc.).
- **Projected Savings:** $500 - $5,000+
- **Complexity:** 1/5
- **Best For:** All employees with benefit options
- **Key Requirements:** Review all employer benefit options
- **Implementation Plan:**
  1. Review all available employer benefits
  2. Maximize FSA/HSA contributions
  3. Evaluate supplemental life/disability
  4. Consider legal/ID theft/pet insurance if offered
- **Tax Code Reference:** Various (IRC §125, §129, §132)
- **Example:** Use FSA to pay $2,500 medical expenses with pre-tax dollars.
- **Disclaimer:** Use-it-or-lose-it for FSA (limited carryover available).

### Strategy INS-10: Insurance Audit
- **Horseman(s):** Insurance
- **Summary:** Review all policies annually to eliminate overlaps and gaps.
- **Projected Savings:** $500 - $3,000+
- **Complexity:** 2/5
- **Best For:** Everyone with multiple insurance policies
- **Key Requirements:** Gather all policy documents, systematic review
- **Implementation Plan:**
  1. List all insurance policies
  2. Review coverage limits and deductibles
  3. Identify overlaps (e.g., multiple travel insurance)
  4. Find gaps (e.g., liability, umbrella)
  5. Consolidate with single carrier for discounts
- **Tax Code Reference:** N/A
- **Example:** Eliminate duplicate coverage, bundle home/auto for 15% discount.
- **Disclaimer:** Don't sacrifice coverage for savings.

### Strategy INS-11: Multi-Policy Bundling
- **Horseman(s):** Insurance
- **Summary:** Bundle home, auto, umbrella with single carrier for discounts.
- **Projected Savings:** $300 - $1,500+
- **Complexity:** 1/5
- **Best For:** Those with multiple insurance needs
- **Key Requirements:** Multiple policies, comparison shopping
- **Implementation Plan:**
  1. Get bundled quotes from multiple carriers
  2. Compare total cost vs. separate policies
  3. Review coverage equivalence
  4. Switch to bundled carrier if savings justify
- **Tax Code Reference:** N/A
- **Example:** Bundle home + auto = 15-25% discount.
- **Disclaimer:** Bundling doesn't always save; compare carefully.

### Strategy INS-12: Increase Deductibles
- **Horseman(s):** Insurance
- **Summary:** Raise deductibles on home/auto to lower premiums if you have emergency fund.
- **Projected Savings:** $200 - $1,000+
- **Complexity:** 1/5
- **Best For:** Those with adequate savings
- **Key Requirements:** Emergency fund to cover higher deductible
- **Implementation Plan:**
  1. Review current deductibles
  2. Calculate premium savings at higher deductibles
  3. Ensure emergency fund covers new deductible
  4. Update policies
- **Tax Code Reference:** N/A
- **Example:** Raise auto deductible from $500 to $1,000; save $150/year.
- **Disclaimer:** Must have cash for higher out-of-pocket in claim.

### Strategy INS-13: Professional Liability Coverage Review
- **Horseman(s):** Insurance
- **Summary:** Ensure adequate errors & omissions or malpractice coverage.
- **Projected Savings:** N/A (risk protection)
- **Complexity:** 2/5
- **Best For:** Professionals (doctors, lawyers, consultants, etc.)
- **Key Requirements:** Professional practice, industry-standard coverage review
- **Implementation Plan:**
  1. Review current E&O/malpractice limits
  2. Assess claim exposure in your field
  3. Compare policies from multiple carriers
  4. Ensure tail coverage if changing policies
- **Tax Code Reference:** Premiums generally deductible as business expense
- **Example:** Increase E&O from $1M to $2M for modest premium increase.
- **Disclaimer:** Claims-made vs. occurrence policies differ significantly.

### Strategy INS-14: Business Owner's Policy (BOP)
- **Horseman(s):** Insurance
- **Summary:** Bundle business property and liability coverage for savings.
- **Projected Savings:** $500 - $2,000+
- **Complexity:** 2/5
- **Best For:** Small business owners
- **Key Requirements:** Small to medium business, standard risk profile
- **Implementation Plan:**
  1. Assess business property and liability needs
  2. Get BOP quotes from multiple carriers
  3. Compare to separate policies
  4. Add endorsements for specific risks
- **Tax Code Reference:** Premiums deductible as business expense
- **Example:** BOP costs $500-3,000/year vs. separate policies.
- **Disclaimer:** May not cover all risks; review exclusions.

### Strategy INS-15: Key Person Insurance
- **Horseman(s):** Insurance
- **Summary:** Insure key employees/owners to protect business from loss.
- **Projected Savings:** N/A (business continuity protection)
- **Complexity:** 2/5
- **Best For:** Businesses dependent on specific individuals
- **Key Requirements:** Identify key persons, determine replacement/transition cost
- **Implementation Plan:**
  1. Identify employees critical to business
  2. Calculate financial impact of their loss
  3. Purchase life/disability on key persons
  4. Business owns and is beneficiary of policy
- **Tax Code Reference:** Premiums not deductible; proceeds generally tax-free (IRC §101)
- **Example:** $1M policy on key salesperson costs $1-3K/year.
- **Disclaimer:** Insurable interest must exist; consent required.

### Strategy INS-16: Buy-Sell Agreement Funding
- **Horseman(s):** Insurance
- **Summary:** Fund buy-sell agreement with life insurance for business succession.
- **Projected Savings:** N/A (succession planning)
- **Complexity:** 3/5
- **Best For:** Multi-owner businesses
- **Key Requirements:** Written buy-sell agreement, valuation method, insurance
- **Implementation Plan:**
  1. Draft buy-sell agreement with attorney
  2. Determine valuation method
  3. Purchase life insurance on each owner
  4. Review and update annually
- **Tax Code Reference:** IRC §101 (death benefits), §2703 (valuation)
- **Example:** Two partners with 50/50 ownership each insure $2M.
- **Disclaimer:** Keep valuations current; agreement must be properly structured.

### Strategy INS-17: Workers' Compensation Audit
- **Horseman(s):** Insurance
- **Summary:** Review workers' comp classification and experience mod for savings.
- **Projected Savings:** $1,000 - $20,000+
- **Complexity:** 2/5
- **Best For:** Employers with workers' compensation insurance
- **Key Requirements:** Review classification codes, safety program
- **Implementation Plan:**
  1. Verify correct job classification codes
  2. Review experience modification factor
  3. Implement safety program to reduce claims
  4. Appeal incorrect classifications
- **Tax Code Reference:** Premiums deductible as business expense
- **Example:** Correct classification from "roofer" to "office admin" cuts premium 80%.
- **Disclaimer:** Misclassification can result in penalties.

### Strategy INS-18: Self-Insured Retention (SIR)
- **Horseman(s):** Insurance
- **Summary:** Use higher retention/deductible for commercial policies to reduce premiums.
- **Projected Savings:** $5,000 - $50,000+
- **Complexity:** 3/5
- **Best For:** Larger businesses with claims-paying capacity
- **Key Requirements:** Financial strength, claims management capability
- **Implementation Plan:**
  1. Analyze claims history
  2. Calculate optimal retention level
  3. Negotiate SIR with carrier
  4. Set aside reserves for retained claims
- **Tax Code Reference:** Self-insured reserves may be deductible
- **Example:** $50K SIR instead of $5K deductible saves 20% on premium.
- **Disclaimer:** Must have funds to pay retained claims.

### Strategy INS-19: Premium Financing
- **Horseman(s):** Insurance
- **Summary:** Finance large insurance premiums to preserve cash flow.
- **Projected Savings:** N/A (cash flow management)
- **Complexity:** 2/5
- **Best For:** Businesses/individuals with large premium payments
- **Key Requirements:** Good credit, premium size justifies financing
- **Implementation Plan:**
  1. Get premium financing quote
  2. Compare financing cost vs. investment return on preserved cash
  3. Complete financing application
  4. Make monthly payments
- **Tax Code Reference:** Interest may be deductible for business insurance
- **Example:** Finance $50K premium over 10 months instead of paying upfront.
- **Disclaimer:** Adds interest cost; policy may cancel for non-payment.

### Strategy INS-20: Annual Insurance Review Meeting
- **Horseman(s):** Insurance
- **Summary:** Schedule annual comprehensive review with insurance advisor.
- **Projected Savings:** Varies (optimization opportunity)
- **Complexity:** 1/5
- **Best For:** Everyone
- **Key Requirements:** Relationship with qualified insurance advisor
- **Implementation Plan:**
  1. Schedule annual review meeting
  2. Bring all policy documents
  3. Review life changes (marriage, kids, home, business)
  4. Update coverage accordingly
  5. Shop competitive quotes
- **Tax Code Reference:** N/A
- **Example:** Annual review catches $2K savings opportunity.
- **Disclaimer:** Advisor may have conflicts; get independent quotes.

## EDUCATION STRATEGIES (20 Strategies)

### Strategy E-1: 529 Plan Contributions
- **Horseman(s):** Education, Taxes
- **Summary:** Save for education with tax-free growth and withdrawals for qualified expenses.
- **Projected Savings:** $5,000 - $100,000+ (tax-free growth)
- **Complexity:** 1/5
- **Best For:** Parents, grandparents saving for education
- **Key Requirements:** Beneficiary, state plan comparison, qualified expenses
- **Implementation Plan:**
  1. Research 529 plans (home state for tax deduction?)
  2. Open account and name beneficiary
  3. Set up automatic contributions
  4. Invest based on time horizon
  5. Use for K-12 ($10K/year) or college
- **Tax Code Reference:** IRC §529
- **Example:** $10K/year for 18 years at 7% = $400K+ for education.
- **Disclaimer:** Non-qualified withdrawals incur tax + 10% penalty; limited investment changes.

### Strategy E-2: Coverdell Education Savings Account
- **Horseman(s):** Education, Taxes
- **Summary:** Tax-free education savings for K-12 and college with more investment options.
- **Projected Savings:** $1,000 - $10,000+ (tax-free growth)
- **Complexity:** 2/5
- **Best For:** Those wanting more investment flexibility for education
- **Key Requirements:** Income limits, $2K annual max, beneficiary under 18
- **Implementation Plan:**
  1. Verify income eligibility
  2. Open Coverdell ESA
  3. Contribute up to $2K annually
  4. Invest in any securities (more options than 529)
  5. Use for K-12 or higher education
- **Tax Code Reference:** IRC §530
- **Example:** $2K/year for 18 years at 8% = $75K+ for education.
- **Disclaimer:** Low contribution limit; must be used by age 30.

### Strategy E-3: American Opportunity Tax Credit (AOTC)
- **Horseman(s):** Education, Taxes
- **Summary:** Claim up to $2,500 credit per student for first 4 years of college.
- **Projected Savings:** $2,500 per student per year (up to $10K total)
- **Complexity:** 1/5
- **Best For:** Families paying college tuition
- **Key Requirements:** Half-time enrollment, first 4 years, income limits
- **Implementation Plan:**
  1. Verify student eligibility
  2. Track qualified education expenses
  3. Claim credit on Form 8863
  4. 40% refundable even with no tax liability
- **Tax Code Reference:** IRC §25A
- **Example:** $4K+ in expenses = $2,500 credit ($1,000 refundable).
- **Disclaimer:** Can't double-dip with 529 for same expenses; income phase-out.

### Strategy E-4: Lifetime Learning Credit
- **Horseman(s):** Education, Taxes
- **Summary:** Claim up to $2,000 credit for any level of education, unlimited years.
- **Projected Savings:** Up to $2,000 per return
- **Complexity:** 1/5
- **Best For:** Graduate students, professionals, part-time students
- **Key Requirements:** Enrolled at eligible institution, income limits
- **Implementation Plan:**
  1. Track qualified tuition and fees
  2. Claim credit on Form 8863
  3. Can use for any year of education
- **Tax Code Reference:** IRC §25A
- **Example:** $10K+ tuition = $2,000 credit.
- **Disclaimer:** Non-refundable; can't combine with AOTC for same student.

### Strategy E-5: Student Loan Interest Deduction
- **Horseman(s):** Education, Taxes
- **Summary:** Deduct up to $2,500 in student loan interest paid.
- **Projected Savings:** Up to $875 (35% bracket × $2,500)
- **Complexity:** 1/5
- **Best For:** Anyone paying student loan interest
- **Key Requirements:** Legal obligation to pay, income limits
- **Implementation Plan:**
  1. Receive Form 1098-E from lender
  2. Claim deduction (even if not itemizing)
  3. Reduces adjusted gross income
- **Tax Code Reference:** IRC §221
- **Example:** Pay $5K interest, deduct $2,500, save $875 at 35% rate.
- **Disclaimer:** Income phase-out; above-the-line deduction.

### Strategy E-6: Employer Tuition Reimbursement
- **Horseman(s):** Education, Taxes
- **Summary:** Receive up to $5,250 tax-free tuition assistance from employer.
- **Projected Savings:** $1,837 (35% × $5,250)
- **Complexity:** 1/5
- **Best For:** Employees with tuition assistance benefits
- **Key Requirements:** Employer program, job-related or any education
- **Implementation Plan:**
  1. Review employer education benefits
  2. Enroll in qualifying courses
  3. Submit for reimbursement
  4. Exclude from income up to $5,250
- **Tax Code Reference:** IRC §127
- **Example:** $5,250 tuition reimbursement = $5,250 tax-free.
- **Disclaimer:** Over $5,250 may be taxable (but deductible if job-related).

### Strategy E-7: CLEP/AP Testing Strategy
- **Horseman(s):** Education
- **Summary:** Test out of college courses to save tuition and time.
- **Projected Savings:** $5,000 - $30,000+
- **Complexity:** 2/5
- **Best For:** Self-motivated students willing to study independently
- **Key Requirements:** Research which credits transfer, test preparation
- **Implementation Plan:**
  1. Identify target school's CLEP/AP acceptance policy
  2. Study for relevant exams
  3. Take CLEP ($90/exam) or AP exams
  4. Earn credits without paying course tuition
- **Tax Code Reference:** N/A
- **Example:** 6 CLEP exams = 18 credits = $10K+ saved at state school.
- **Disclaimer:** Not all schools accept all credits; check policies first.

### Strategy E-8: Community College Transfer
- **Horseman(s):** Education
- **Summary:** Complete general education at community college before transferring to university.
- **Projected Savings:** $20,000 - $80,000+
- **Complexity:** 2/5
- **Best For:** Students willing to start at community college
- **Key Requirements:** Transfer agreement research, academic planning
- **Implementation Plan:**
  1. Research articulation agreements with target universities
  2. Enroll in community college
  3. Complete transferable general education courses
  4. Apply to transfer with strong GPA
- **Tax Code Reference:** N/A
- **Example:** 2 years CC ($3K/year) + 2 years state U ($15K/year) vs. 4 years at U ($60K+ saved).
- **Disclaimer:** Verify credit transfer; maintain strong GPA.

### Strategy E-9: In-State Tuition Strategies
- **Horseman(s):** Education
- **Summary:** Establish residency to qualify for lower in-state tuition rates.
- **Projected Savings:** $20,000 - $150,000+
- **Complexity:** 3/5
- **Best For:** Out-of-state students willing to plan ahead
- **Key Requirements:** Residency requirements (usually 12 months), documentation
- **Implementation Plan:**
  1. Research target state's residency requirements
  2. Establish domicile (driver's license, voter registration, etc.)
  3. Work in-state for required period if needed
  4. Apply for residency status
  5. Pay in-state tuition
- **Tax Code Reference:** N/A
- **Example:** UC Berkeley in-state: $15K vs. out-of-state: $45K = $30K/year savings.
- **Disclaimer:** States audit residency claims; must be genuine.

### Strategy E-10: Work-Study Programs
- **Horseman(s):** Education
- **Summary:** Participate in Federal Work-Study for part-time employment while in school.
- **Projected Savings:** $2,000 - $5,000 per year (earned)
- **Complexity:** 1/5
- **Best For:** Students with financial need
- **Key Requirements:** FAFSA, financial need, enrollment
- **Implementation Plan:**
  1. Complete FAFSA
  2. Accept work-study in financial aid package
  3. Find work-study job on/off campus
  4. Work part-time during school
- **Tax Code Reference:** Work-study income excluded from need calculation
- **Example:** Work 15 hours/week × $15/hour × 30 weeks = $6,750.
- **Disclaimer:** Limited positions; must balance work and study.

### Strategy E-11: Scholarship and Grant Maximization
- **Horseman(s):** Education
- **Summary:** Apply for multiple scholarships and grants to reduce tuition costs.
- **Projected Savings:** $1,000 - full tuition
- **Complexity:** 2/5
- **Best For:** All students
- **Key Requirements:** Research, applications, essays, deadlines
- **Implementation Plan:**
  1. Create scholarship search system (Fastweb, local sources)
  2. Apply to 20+ scholarships
  3. Tailor essays to each
  4. Track deadlines rigorously
  5. Accept and properly report scholarships
- **Tax Code Reference:** Scholarships for tuition generally tax-free (IRC §117)
- **Example:** 10 small scholarships of $1K each = $10K.
- **Disclaimer:** Taxable if used for room/board; may affect other aid.

### Strategy E-12: Graduate Assistantships
- **Horseman(s):** Education
- **Summary:** Work as graduate assistant for tuition waiver and stipend.
- **Projected Savings:** $20,000 - $60,000+ per year
- **Complexity:** 3/5
- **Best For:** Graduate students
- **Key Requirements:** Admission to graduate program, available positions
- **Implementation Plan:**
  1. Research GA positions in target programs
  2. Apply directly to departments
  3. Negotiate terms (tuition waiver, stipend, health insurance)
  4. Maintain performance requirements
- **Tax Code Reference:** Tuition waiver may be tax-free (IRC §117)
- **Example:** Full tuition waiver + $20K stipend vs. paying $40K.
- **Disclaimer:** Work requirements; may extend time to degree.

### Strategy E-13: Military Education Benefits
- **Horseman(s):** Education
- **Summary:** Use GI Bill, Tuition Assistance, or ROTC for education funding.
- **Projected Savings:** $50,000 - $200,000+
- **Complexity:** 2/5
- **Best For:** Military members, veterans, dependents
- **Key Requirements:** Military service, eligibility verification
- **Implementation Plan:**
  1. Verify GI Bill eligibility (Post-9/11, Montgomery, etc.)
  2. Apply for Certificate of Eligibility
  3. Submit to school's VA office
  4. Use benefits for tuition, books, housing
- **Tax Code Reference:** GI Bill benefits are tax-free
- **Example:** Post-9/11 GI Bill covers full tuition + housing allowance.
- **Disclaimer:** Limited months of eligibility; transfer rules complex.

### Strategy E-14: Income Share Agreements (ISA)
- **Horseman(s):** Education
- **Summary:** Pay for education with percentage of future income instead of loans.
- **Projected Savings:** Variable (risk-sharing)
- **Complexity:** 3/5
- **Best For:** Students in high-earning fields with ISA options
- **Key Requirements:** School offering ISA, understanding of terms
- **Implementation Plan:**
  1. Research schools offering ISAs
  2. Compare ISA terms to traditional loans
  3. Understand income threshold and percentage
  4. Sign agreement
  5. Pay percentage of income after graduation
- **Tax Code Reference:** Tax treatment evolving
- **Example:** Pay 10% of income for 5 years if earning above $40K.
- **Disclaimer:** High earners may pay more than loans; read terms carefully.

### Strategy E-15: 529 to Roth IRA Rollover
- **Horseman(s):** Education, Taxes
- **Summary:** Roll unused 529 funds to beneficiary's Roth IRA (starting 2024).
- **Projected Savings:** Avoids 10% penalty on unused funds
- **Complexity:** 2/5
- **Best For:** Families with excess 529 funds
- **Key Requirements:** 529 account 15+ years old, annual limits apply
- **Implementation Plan:**
  1. Verify 529 account age (15+ years)
  2. Roll over up to annual Roth contribution limit
  3. Lifetime limit of $35,000 per beneficiary
  4. Beneficiary must have earned income
- **Tax Code Reference:** SECURE 2.0 Act
- **Example:** Roll $35K unused 529 to child's Roth IRA over several years.
- **Disclaimer:** New rules; consult advisor for implementation.

### Strategy E-16: Education IRA to 529 Transfer
- **Horseman(s):** Education
- **Summary:** Consolidate Coverdell ESA funds into 529 for simpler management.
- **Projected Savings:** Simplification, continued tax-free growth
- **Complexity:** 1/5
- **Best For:** Those with both Coverdell and 529 accounts
- **Key Requirements:** Same beneficiary, age considerations
- **Implementation Plan:**
  1. Review Coverdell balance
  2. Roll over to 529 before beneficiary turns 30
  3. Consolidate accounts
- **Tax Code Reference:** IRC §529, §530
- **Example:** Move $20K Coverdell to 529 for continued growth.
- **Disclaimer:** Must be used by 30 (Coverdell) unless rolled over.

### Strategy E-17: Kiddie Tax Planning for Education
- **Horseman(s):** Education, Taxes
- **Summary:** Structure investment accounts to minimize kiddie tax on education savings.
- **Projected Savings:** $500 - $5,000+
- **Complexity:** 3/5
- **Best For:** Families with significant assets in child's name
- **Key Requirements:** Understanding of kiddie tax rules
- **Implementation Plan:**
  1. Understand kiddie tax thresholds
  2. Consider shifting to 529 or UTMA
  3. Time asset sales for child's low-income years
  4. Consider municipal bonds (tax-exempt)
- **Tax Code Reference:** IRC §1(g)
- **Example:** Keep child's investment income under $2,500 to avoid parent's rate.
- **Disclaimer:** Kiddie tax applies until age 19 (24 if student).

### Strategy E-18: Tuition and Fees Deduction Alternative
- **Horseman(s):** Education, Taxes
- **Summary:** Evaluate deduction vs. credit for education expenses.
- **Projected Savings:** Varies based on situation
- **Complexity:** 2/5
- **Best For:** Those who don't qualify for education credits
- **Key Requirements:** Tax situation analysis
- **Implementation Plan:**
  1. Calculate education credits eligibility
  2. If ineligible, explore other deductions
  3. Maximize QBI or business education deductions if applicable
  4. Consider timing of payments
- **Tax Code Reference:** IRC §25A, §222 (expired but may return)
- **Example:** If over income limit for AOTC, maximize other tax strategies.
- **Disclaimer:** Laws change; consult current tax code.

### Strategy E-19: Educational Travel Deductions (Business)
- **Horseman(s):** Education, Taxes
- **Summary:** Deduct education-related travel as business expense.
- **Projected Savings:** $500 - $5,000+
- **Complexity:** 3/5
- **Best For:** Self-employed/business owners attending conferences/training
- **Key Requirements:** Business purpose, maintains/improves current skills
- **Implementation Plan:**
  1. Attend industry conferences/training
  2. Document business purpose
  3. Keep receipts for travel, lodging, registration
  4. Deduct as business expense
- **Tax Code Reference:** IRC §162 (trade or business expenses)
- **Example:** $3K conference + $1.5K travel = $4.5K deduction.
- **Disclaimer:** Must maintain/improve skills in current business; not for new career.

### Strategy E-20: Grandparent Direct Payment Strategy
- **Horseman(s):** Education, Taxes
- **Summary:** Grandparents pay tuition directly to institution to avoid gift tax.
- **Projected Savings:** Estate tax savings + education funding
- **Complexity:** 2/5
- **Best For:** Grandparents with assets wanting to help with education
- **Key Requirements:** Payment directly to institution, tuition only
- **Implementation Plan:**
  1. Identify tuition amount
  2. Pay directly to school (not to parent/student)
  3. Unlimited gift tax exclusion for direct tuition payments
  4. Can still give $18K annual gift separately
- **Tax Code Reference:** IRC §2503(e)
- **Example:** Grandparent pays $50K tuition directly + $18K gift = $68K transferred tax-free.
- **Disclaimer:** Tuition only; not room/board. May affect financial aid.

---

## IMPORTANT NOTES

- **Disclaimer**: This is educational information only. These are sample strategies and not tax, legal, or financial advice. Results are not guaranteed and depend on individual circumstances. Always consult a qualified professional before implementing any strategy.
- **For personalized guidance**: Visit rprx4life.com to speak with a qualified RPRx Advisor.
- **Dollar Impact**: Savings ranges are estimates based on typical scenarios. Your actual results may vary significantly.
- **Complexity Rating**: 1 = Simple (DIY possible), 5 = Complex (professional help recommended)
`;

const SYSTEM_PROMPT = `You are an expert RPRx financial strategy assistant.

1. Greet the user and explain you will help them find the best strategies to reduce the impact of the Four Horsemen (Interest, Taxes, Insurance, Education) on their finances.

2. Ask the user the intake questions below, one at a time, and collect their answers.

3. Analyze their responses and select the top 20 most relevant strategies from the knowledge base, prioritizing dollar impact, ease of implementation, and applicability.

4. Present the strategies in a clear, organized list, with summaries and projected savings.

5. Invite the user to select any strategies for which they want a detailed implementation plan, and provide step-by-step instructions for those (using the KB implementation plans).

6. Remind the user that these are sample strategies, not tax or legal advice, and recommend consulting an RPRx advisor for full support. For more help and to speak with a qualified RPRx Advisor, visit: rprx4life.com

7. Always include a disclaimer and offer to answer follow-up questions.

8. Do not create any images while responding. Only create an image if explicitly asked by the user for their own data or strategies.

## INTAKE QUESTIONS (ASK ONE AT A TIME)

### A. User Profile
- Which of the following best describes you? (Select all that apply)
  - Business Owner
  - Retiree/Grandparent
  - Salesperson
  - Wage Earner
  - Investor
  - Farmer
  - Non-Profit

- What are your main financial goals? (Select all that apply)
  - Increase Cash Flow
  - Reduce Taxes
  - Save for Education
  - Improve Retirement Readiness
  - Reduce Insurance Costs
  - Other (please specify)

### B. Financial Snapshot
- What is your approximate annual household income?
  - <$100K
  - $100–250K
  - $250–500K
  - $500K–$1M
  - $1M+

- What is your total household debt (mortgage, loans, credit cards, etc.)?
  - <$50K
  - $50–200K
  - $200–500K
  - $500K+

- Do you have children or dependents? (Y/N)
  - If yes: How many, and what are their ages?

- Are you currently paying for or planning for education expenses? (K-12, college, etc.)

- What are your biggest financial pain points or concerns? (Open-ended)

### C. Optional
- Would you like to upload your tax return for a more detailed analysis? (For future phases - not currently available)

## STRATEGY OUTPUT FORMAT (TOP 20)

When presenting the top 20 strategies, show a table or structured list with:
| # | Strategy | Horseman(s) | Savings Range | Complexity | Summary |
|---|----------|-------------|---------------|------------|---------|

Then ask: "Which of these would you like a step-by-step implementation plan for? Reply with the strategy numbers."

## IMPLEMENTATION PLAN FORMAT

For each selected strategy:
- **Title**
- **Who it's best for** (1 line)
- **Key Requirements** (from KB)
- **Step-by-Step Implementation Plan** (from KB)
- **What to bring to your CPA/Advisor** (short bullet list)
- **Disclaimer** + rprx4life.com referral line

## GUARDRAILS
- Do not provide tax/legal advice
- Do not promise results or guaranteed savings
- Do not invent IRS references or forms not in the knowledge base
- Do not generate images unless explicitly asked by the user

## KNOWLEDGE BASE
${KNOWLEDGE_BASE}
`;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with user's token
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Validate JWT and get user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = user.id;
    console.log('Authenticated user:', userId);

    // Parse request body
    const { conversation_id, user_message } = await req.json();

    if (!user_message || typeof user_message !== 'string' || user_message.trim() === '') {
      return new Response(
        JSON.stringify({ error: 'User message is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let conversationId = conversation_id;

    // If no conversation_id, create a new conversation
    if (!conversationId) {
      const title = user_message.length > 50 
        ? user_message.substring(0, 47) + '...' 
        : user_message;

      const { data: newConv, error: convError } = await supabase
        .from('conversations')
        .insert({ user_id: userId, title })
        .select()
        .single();

      if (convError) {
        console.error('Error creating conversation:', convError);
        return new Response(
          JSON.stringify({ error: 'Failed to create conversation' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      conversationId = newConv.id;
      console.log('Created new conversation:', conversationId);
    }

    // Save user message
    const { error: userMsgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role: 'user',
        content: user_message.trim(),
      });

    if (userMsgError) {
      console.error('Error saving user message:', userMsgError);
      return new Response(
        JSON.stringify({ error: 'Failed to save message' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch conversation history
    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (msgError) {
      console.error('Error fetching messages:', msgError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch conversation history' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build OpenAI messages array
    const openaiMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ];

    console.log('Calling OpenAI with', openaiMessages.length, 'messages');

    // Call OpenAI API with retry logic for rate limits
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      console.error('OPENAI_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Retry logic with exponential backoff
    const maxRetries = 3;
    let lastError: string | null = null;
    let openaiData: any = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      if (attempt > 0) {
        // Wait before retry with exponential backoff
        const waitTime = Math.min(1000 * Math.pow(2, attempt), 10000);
        console.log(`Retry attempt ${attempt + 1}, waiting ${waitTime}ms`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }

      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini', // Use mini model to reduce token usage and avoid rate limits
          messages: openaiMessages,
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });

      if (openaiResponse.ok) {
        openaiData = await openaiResponse.json();
        break;
      }

      const errorText = await openaiResponse.text();
      console.error(`OpenAI API error (attempt ${attempt + 1}):`, openaiResponse.status, errorText);
      
      // Check if it's a rate limit error (429)
      if (openaiResponse.status === 429) {
        lastError = 'The AI is currently busy. Please wait a moment and try again.';
        // Parse retry-after if available
        const retryAfter = openaiResponse.headers.get('retry-after');
        if (retryAfter) {
          const waitMs = parseInt(retryAfter) * 1000;
          console.log(`Rate limited, server suggests waiting ${waitMs}ms`);
          await new Promise(resolve => setTimeout(resolve, Math.min(waitMs, 15000)));
        }
        continue; // Retry
      }

      // For non-retryable errors, break immediately
      lastError = 'Failed to get AI response';
      break;
    }

    if (!openaiData) {
      return new Response(
        JSON.stringify({ error: lastError || 'Failed to get AI response' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const assistantMessage = openaiData.choices[0]?.message?.content;

    if (!assistantMessage) {
      console.error('No message in OpenAI response');
      return new Response(
        JSON.stringify({ error: 'No response from AI' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Received OpenAI response, length:', assistantMessage.length);

    // Save assistant message
    const { error: assistantMsgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role: 'assistant',
        content: assistantMessage,
      });

    if (assistantMsgError) {
      console.error('Error saving assistant message:', assistantMsgError);
      // Don't fail the request - user got the response
    }

    // Return response
    return new Response(
      JSON.stringify({
        conversation_id: conversationId,
        assistant_message: assistantMessage,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
