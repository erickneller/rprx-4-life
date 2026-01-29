import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// =====================================================
// STRATEGY DATABASE - Searchable array for fast lookup
// =====================================================

interface Strategy {
  id: string;
  horseman: string[];
  name: string;
  summary: string;
  savings: string;
  complexity: number;
  bestFor: string;
  requirements: string;
  implementationPlan: string[];
  taxReference: string;
  example: string;
  disclaimer: string;
  keywords: string[];
}

const STRATEGIES: Strategy[] = [
  // INTEREST STRATEGIES (10)
  {
    id: "I-1",
    horseman: ["Interest"],
    name: "Equity Recapture (Mortgage Acceleration)",
    summary: "Make extra payments toward mortgage principal to reduce total interest paid over the life of the loan.",
    savings: "$50,000 - $655,000+",
    complexity: 2,
    bestFor: "Homeowners with stable income and extra cash flow",
    requirements: "Active mortgage, discretionary income for extra payments",
    implementationPlan: [
      "Review current mortgage terms (rate, balance, remaining term)",
      "Calculate impact of additional principal payments",
      "Set up automatic extra principal payments (monthly or bi-weekly)",
      "Track progress and recalculate periodically"
    ],
    taxReference: "N/A (interest savings, not tax deduction)",
    example: "$400K mortgage at 6% over 30 years = $863K total. Extra $500/month saves $200K+ in interest.",
    disclaimer: "Results depend on loan terms and payment consistency.",
    keywords: ["mortgage", "home", "house", "principal", "payment", "loan", "interest", "homeowner", "equity", "acceleration"]
  },
  {
    id: "I-2",
    horseman: ["Interest"],
    name: "Refinance to Lower Rate",
    summary: "Refinance existing mortgage or loans to a lower interest rate to reduce monthly payments and total interest.",
    savings: "$20,000 - $150,000+",
    complexity: 2,
    bestFor: "Borrowers with improved credit or when market rates drop",
    requirements: "Good credit score, sufficient equity, closing cost funds",
    implementationPlan: [
      "Check current rates vs. your existing rate",
      "Calculate break-even point for closing costs",
      "Shop multiple lenders for best terms",
      "Complete application and appraisal process",
      "Close on new loan"
    ],
    taxReference: "N/A",
    example: "Refinancing from 7% to 5.5% on $300K saves $100+ monthly.",
    disclaimer: "Closing costs apply; ensure break-even makes sense.",
    keywords: ["refinance", "rate", "mortgage", "loan", "credit", "lender", "interest", "lower", "payment"]
  },
  {
    id: "I-3",
    horseman: ["Interest"],
    name: "HELOC for Debt Consolidation",
    summary: "Use Home Equity Line of Credit to consolidate high-interest debt (credit cards, personal loans) at lower rates.",
    savings: "$5,000 - $50,000+",
    complexity: 2,
    bestFor: "Homeowners with significant equity and high-interest debt",
    requirements: "Home equity (typically 15-20%), good credit",
    implementationPlan: [
      "Calculate total high-interest debt",
      "Determine available home equity",
      "Apply for HELOC with competitive rate",
      "Pay off high-interest debts",
      "Create payment plan for HELOC"
    ],
    taxReference: "HELOC interest may be deductible if used for home improvements (IRC §163)",
    example: "Consolidating $30K at 22% to HELOC at 8% saves $4,200/year in interest.",
    disclaimer: "Home is collateral; risk of foreclosure if payments missed.",
    keywords: ["heloc", "equity", "debt", "consolidation", "credit card", "loan", "home", "interest", "consolidate"]
  },
  {
    id: "I-4",
    horseman: ["Interest"],
    name: "Cash Value Life Insurance Loans",
    summary: "Borrow against cash value of permanent life insurance policy at favorable rates, often with flexible repayment.",
    savings: "$2,000 - $30,000+",
    complexity: 3,
    bestFor: "Those with funded whole/universal life policies needing liquidity",
    requirements: "Permanent life insurance with accumulated cash value",
    implementationPlan: [
      "Review policy's cash value and loan provisions",
      "Request loan from insurance company",
      "Use funds as needed (no restrictions)",
      "Establish repayment plan or let interest capitalize"
    ],
    taxReference: "Policy loans are generally tax-free (IRC §72(e))",
    example: "Borrow $50K at 5% vs. bank loan at 10% saves $2,500/year.",
    disclaimer: "Unpaid loans reduce death benefit; may trigger taxes if policy lapses.",
    keywords: ["life insurance", "cash value", "whole life", "universal life", "policy loan", "borrow", "liquidity"]
  },
  {
    id: "I-5",
    horseman: ["Interest"],
    name: "0% Balance Transfer Cards",
    summary: "Transfer high-interest credit card balances to cards offering 0% introductory APR.",
    savings: "$500 - $5,000+",
    complexity: 1,
    bestFor: "Those with good credit carrying credit card balances",
    requirements: "Good/excellent credit score, discipline to pay off during intro period",
    implementationPlan: [
      "Research 0% balance transfer offers",
      "Apply for card with longest intro period",
      "Transfer balances (watch for transfer fees)",
      "Create payoff plan before intro period ends"
    ],
    taxReference: "N/A",
    example: "Transfer $10K at 22% to 0% for 18 months saves $3,300 in interest.",
    disclaimer: "Rate jumps after intro period; transfer fees (typically 3-5%) apply.",
    keywords: ["balance transfer", "credit card", "apr", "0%", "zero percent", "debt", "interest"]
  },
  {
    id: "I-6",
    horseman: ["Interest"],
    name: "Negotiate Lower Interest Rates",
    summary: "Contact lenders to negotiate lower interest rates on existing credit cards and loans.",
    savings: "$200 - $3,000+",
    complexity: 1,
    bestFor: "Customers with good payment history",
    requirements: "Strong payment history, competitive offers from other lenders",
    implementationPlan: [
      "Review current rates on all accounts",
      "Research competitor rates",
      "Call each lender's retention department",
      "Present case for rate reduction",
      "Document new rates"
    ],
    taxReference: "N/A",
    example: "Reducing card rate from 24% to 18% on $8K balance saves $480/year.",
    disclaimer: "Not guaranteed; depends on creditworthiness and lender policy.",
    keywords: ["negotiate", "rate", "credit card", "lender", "lower", "interest", "call"]
  },
  {
    id: "I-7",
    horseman: ["Interest"],
    name: "Student Loan Refinancing",
    summary: "Refinance federal or private student loans to lower rate through private lenders.",
    savings: "$5,000 - $40,000+",
    complexity: 2,
    bestFor: "Graduates with stable income and good credit",
    requirements: "Steady income, good credit, graduation from eligible program",
    implementationPlan: [
      "Gather current loan details and rates",
      "Check rates from multiple refinance lenders",
      "Compare total cost including any fees",
      "Apply with chosen lender",
      "Set up autopay for additional rate reduction"
    ],
    taxReference: "Student loan interest deduction up to $2,500 (IRC §221)",
    example: "Refinancing $80K from 7% to 4% over 10 years saves $15K+.",
    disclaimer: "Refinancing federal loans loses federal benefits (PSLF, IDR plans).",
    keywords: ["student loan", "college", "university", "education debt", "refinance", "graduate", "federal loan"]
  },
  {
    id: "I-8",
    horseman: ["Interest"],
    name: "Auto Loan Refinancing",
    summary: "Refinance existing auto loan to lower rate to reduce monthly payments and total interest.",
    savings: "$500 - $3,000+",
    complexity: 1,
    bestFor: "Those with improved credit since original loan",
    requirements: "Vehicle with sufficient equity, improved credit",
    implementationPlan: [
      "Check current loan balance and rate",
      "Get quotes from banks, credit unions, online lenders",
      "Compare offers considering any fees",
      "Complete application with new lender",
      "New lender pays off old loan"
    ],
    taxReference: "N/A",
    example: "Refinancing $25K from 8% to 4% saves $50+/month.",
    disclaimer: "Extending term may increase total interest despite lower rate.",
    keywords: ["auto loan", "car loan", "vehicle", "refinance", "car payment", "auto"]
  },
  {
    id: "I-9",
    horseman: ["Interest"],
    name: "Biweekly Payment Strategy",
    summary: "Split monthly payment in half and pay every two weeks, resulting in one extra payment per year.",
    savings: "$10,000 - $50,000+",
    complexity: 1,
    bestFor: "Any borrower with monthly payment obligations",
    requirements: "Lender that accepts biweekly payments, consistent income",
    implementationPlan: [
      "Confirm lender accepts biweekly payments",
      "Set up automatic biweekly withdrawals",
      "Ensure extra payment applies to principal",
      "Track loan payoff acceleration"
    ],
    taxReference: "N/A",
    example: "On $300K mortgage, biweekly payments can pay off 4+ years early.",
    disclaimer: "Some lenders charge fees for biweekly programs.",
    keywords: ["biweekly", "payment", "mortgage", "accelerate", "payoff", "extra payment"]
  },
  {
    id: "I-10",
    horseman: ["Interest"],
    name: "Round-Up Payment Strategy",
    summary: "Round up monthly loan payments to nearest $50 or $100 to accelerate principal paydown.",
    savings: "$5,000 - $30,000+",
    complexity: 1,
    bestFor: "Anyone with loan payments",
    requirements: "Discretionary income for slightly higher payments",
    implementationPlan: [
      "Calculate rounded-up payment amount",
      "Specify extra goes to principal",
      "Set up automatic payment at new amount",
      "Track accelerated payoff date"
    ],
    taxReference: "N/A",
    example: "Rounding $1,847 payment to $1,900 adds $636/year to principal.",
    disclaimer: "Minimal impact individually but compounds over time.",
    keywords: ["round up", "payment", "principal", "extra", "loan", "payoff"]
  },

  // TAX STRATEGIES (20)
  {
    id: "T-1",
    horseman: ["Taxes"],
    name: "Maximize 401(k) Contributions",
    summary: "Contribute maximum allowed to employer 401(k) to reduce current taxable income.",
    savings: "$2,000 - $50,000+ (depends on tax bracket)",
    complexity: 1,
    bestFor: "Employees with 401(k) access",
    requirements: "Employer-sponsored 401(k), earned income",
    implementationPlan: [
      "Determine contribution limit ($23,000 for 2024, +$7,500 catch-up if 50+)",
      "Calculate percentage needed to max out",
      "Update payroll contribution election",
      "Maximize any employer match first"
    ],
    taxReference: "IRC §401(k), §402(g)",
    example: "$23K contribution in 32% bracket saves $7,360 in taxes.",
    disclaimer: "Funds locked until 59½ (with exceptions); required distributions start at 73.",
    keywords: ["401k", "retirement", "contribution", "employer", "tax deduction", "pretax", "payroll"]
  },
  {
    id: "T-2",
    horseman: ["Taxes", "Insurance"],
    name: "Health Savings Account (HSA) Triple Tax Benefit",
    summary: "Contribute to HSA for tax-deductible contributions, tax-free growth, and tax-free qualified withdrawals.",
    savings: "$1,000 - $15,000+ annually",
    complexity: 2,
    bestFor: "Those with high-deductible health plans (HDHPs)",
    requirements: "HDHP coverage, no Medicare enrollment",
    implementationPlan: [
      "Confirm HDHP enrollment",
      "Open HSA if not provided by employer",
      "Contribute max ($4,150 individual/$8,300 family for 2024)",
      "Invest HSA funds for long-term growth",
      "Save receipts for future tax-free withdrawals"
    ],
    taxReference: "IRC §223",
    example: "Family contributing $8,300 in 24% bracket saves $1,992 + payroll taxes.",
    disclaimer: "Non-qualified withdrawals incur taxes and 20% penalty before 65.",
    keywords: ["hsa", "health", "medical", "hdhp", "deductible", "healthcare", "triple tax"]
  },
  {
    id: "T-3",
    horseman: ["Taxes"],
    name: "Section 179 Deduction",
    summary: "Deduct full cost of qualifying business equipment in year of purchase instead of depreciating.",
    savings: "$5,000 - $300,000+ (depends on equipment cost)",
    complexity: 3,
    bestFor: "Business owners purchasing equipment",
    requirements: "Business income, qualifying property, placed in service during tax year",
    implementationPlan: [
      "Identify qualifying equipment purchases",
      "Confirm 179 limit ($1.16M for 2024) and phase-out threshold",
      "Elect 179 on tax return (Form 4562)",
      "Document business use percentage"
    ],
    taxReference: "IRC §179",
    example: "$100K equipment purchase in 35% bracket saves $35K in taxes immediately.",
    disclaimer: "Cannot exceed business income; some property types excluded.",
    keywords: ["section 179", "equipment", "depreciation", "business", "deduction", "purchase", "asset"]
  },
  {
    id: "T-4",
    horseman: ["Taxes"],
    name: "Qualified Business Income (QBI) Deduction",
    summary: "Deduct up to 20% of qualified business income from pass-through entities.",
    savings: "$2,000 - $100,000+",
    complexity: 3,
    bestFor: "Sole proprietors, S-corp/partnership owners, some trusts",
    requirements: "Pass-through income, income thresholds, non-SSTB or within limits",
    implementationPlan: [
      "Calculate qualified business income",
      "Determine if SSTB limitations apply",
      "Calculate W-2 wage/capital limitations if over threshold",
      "Claim deduction on Form 8995 or 8995-A"
    ],
    taxReference: "IRC §199A",
    example: "$200K QBI = $40K deduction = $12K+ tax savings.",
    disclaimer: "Complex limitations for high earners and specified service businesses.",
    keywords: ["qbi", "pass-through", "s-corp", "sole proprietor", "199a", "business income", "deduction"]
  },
  {
    id: "T-5",
    horseman: ["Taxes"],
    name: "Roth IRA Conversion Strategy",
    summary: "Convert traditional IRA to Roth in low-income years to reduce future required distributions and tax burden.",
    savings: "$10,000 - $500,000+ (lifetime)",
    complexity: 4,
    bestFor: "Those expecting higher future tax rates or with low-income years",
    requirements: "Traditional IRA or 401(k) funds, ability to pay conversion taxes",
    implementationPlan: [
      "Analyze current vs. expected future tax brackets",
      "Calculate optimal conversion amount to stay in current bracket",
      "Execute partial or full conversion",
      "Pay estimated taxes (don't withhold from conversion)",
      "Repeat annually as appropriate"
    ],
    taxReference: "IRC §408A",
    example: "Convert $100K in 22% bracket, save 10%+ if future rate is 32%.",
    disclaimer: "Conversion is taxable; no 5-year holding on contributions but earnings.",
    keywords: ["roth", "conversion", "ira", "traditional", "retirement", "tax bracket", "rmd"]
  },
  {
    id: "T-6",
    horseman: ["Taxes"],
    name: "Charitable Remainder Trust (CRT)",
    summary: "Transfer appreciated assets to CRT for income stream, avoid capital gains, and receive charitable deduction.",
    savings: "$50,000 - $1,000,000+",
    complexity: 5,
    bestFor: "High-net-worth individuals with appreciated assets and charitable intent",
    requirements: "Appreciated assets, irrevocable transfer, charitable remainder",
    implementationPlan: [
      "Consult with estate planning attorney",
      "Choose CRT type (annuity or unitrust)",
      "Transfer appreciated assets to trust",
      "Receive income stream for term/life",
      "Remainder goes to charity at trust termination"
    ],
    taxReference: "IRC §664",
    example: "Transfer $1M stock with $100K basis; avoid $180K capital gains, receive $50K+ annual income.",
    disclaimer: "Irrevocable; complex setup and administration costs.",
    keywords: ["charitable", "trust", "crt", "appreciated", "capital gains", "donation", "charity", "estate"]
  },
  {
    id: "T-7",
    horseman: ["Taxes"],
    name: "Donor-Advised Fund (DAF) Bunching",
    summary: "Bunch multiple years of charitable donations into one year via DAF to exceed standard deduction.",
    savings: "$2,000 - $20,000+",
    complexity: 2,
    bestFor: "Charitable givers whose annual donations don't exceed standard deduction",
    requirements: "Charitable intent, funds to bunch",
    implementationPlan: [
      "Calculate multiple years of intended giving",
      "Open DAF account",
      "Contribute bunched amount in one tax year",
      "Itemize deductions that year",
      "Distribute grants to charities over time"
    ],
    taxReference: "IRC §170",
    example: "Bunch 3 years ($15K/year = $45K) to itemize vs. standard deduction.",
    disclaimer: "Contribution to DAF is irrevocable (but grants are flexible).",
    keywords: ["donor advised", "daf", "charitable", "donation", "bunching", "itemize", "standard deduction"]
  },
  {
    id: "T-8",
    horseman: ["Taxes"],
    name: "Qualified Opportunity Zone Investment",
    summary: "Defer and reduce capital gains by investing in Qualified Opportunity Zone funds.",
    savings: "$10,000 - $500,000+",
    complexity: 5,
    bestFor: "Those with significant capital gains seeking deferral",
    requirements: "Capital gain within 180 days, investment in QOZ fund",
    implementationPlan: [
      "Realize capital gain from sale",
      "Invest gain in QOZ fund within 180 days",
      "Hold for 10+ years for maximum benefit",
      "Report on Form 8949 and 8997"
    ],
    taxReference: "IRC §1400Z-2",
    example: "Invest $500K gain, hold 10 years, pay zero tax on QOZ appreciation.",
    disclaimer: "Complex rules; risky investments; deadline sensitive.",
    keywords: ["opportunity zone", "qoz", "capital gains", "deferral", "investment", "real estate"]
  },
  {
    id: "T-9",
    horseman: ["Taxes"],
    name: "Cost Segregation Study",
    summary: "Accelerate depreciation on commercial/rental real estate by reclassifying components to shorter lives.",
    savings: "$25,000 - $500,000+",
    complexity: 4,
    bestFor: "Commercial/rental property owners",
    requirements: "Real estate purchase or improvement, engineering study",
    implementationPlan: [
      "Engage cost segregation specialist",
      "Complete engineering-based study",
      "Reclassify components (5, 7, 15-year vs. 27.5/39-year)",
      "Claim accelerated depreciation",
      "Consider bonus depreciation eligibility"
    ],
    taxReference: "IRC §168",
    example: "$2M property may yield $200K+ first-year deductions.",
    disclaimer: "May increase depreciation recapture on sale; professional study costs $5K-$15K.",
    keywords: ["cost segregation", "depreciation", "real estate", "rental", "commercial", "property", "accelerate"]
  },
  {
    id: "T-10",
    horseman: ["Taxes"],
    name: "Augusta Rule (Section 280A)",
    summary: "Rent your home to your business for up to 14 days tax-free for meetings/events.",
    savings: "$2,000 - $20,000+",
    complexity: 2,
    bestFor: "Business owners with suitable home spaces",
    requirements: "Legitimate business purpose, fair market rent documentation",
    implementationPlan: [
      "Document fair market rental rates (comparable venues)",
      "Hold legitimate business meetings/events at home",
      "Business pays rent to homeowner",
      "Business deducts rent; homeowner excludes income"
    ],
    taxReference: "IRC §280A(g)",
    example: "14 days × $1,500/day = $21,000 tax-free to homeowner.",
    disclaimer: "Must be legitimate business use; document extensively.",
    keywords: ["augusta rule", "280a", "home rental", "business", "meeting", "tax-free", "14 days"]
  },
  {
    id: "T-11",
    horseman: ["Taxes"],
    name: "Real Estate Professional Status",
    summary: "Qualify as real estate professional to deduct rental losses against ordinary income without passive activity limits.",
    savings: "$10,000 - $200,000+",
    complexity: 4,
    bestFor: "Those heavily involved in real estate with other high income",
    requirements: "750+ hours in real estate, more than half of personal services",
    implementationPlan: [
      "Track hours meticulously (use time log)",
      "Meet material participation in each rental (or elect grouping)",
      "Claim losses against ordinary income",
      "Document all real estate activities"
    ],
    taxReference: "IRC §469",
    example: "Deduct $100K rental losses against W-2 income = $32K+ tax savings.",
    disclaimer: "High audit risk; documentation is critical.",
    keywords: ["real estate professional", "rental", "passive", "loss", "469", "hours", "material participation"]
  },
  {
    id: "T-12",
    horseman: ["Taxes"],
    name: "Backdoor Roth IRA",
    summary: "High earners contribute to traditional IRA then convert to Roth to bypass income limits.",
    savings: "$5,000 - $100,000+ (lifetime)",
    complexity: 3,
    bestFor: "High earners above Roth IRA income limits",
    requirements: "No/minimal existing pre-tax IRA balances (to avoid pro-rata rule)",
    implementationPlan: [
      "Contribute non-deductible to traditional IRA",
      "Convert immediately to Roth",
      "File Form 8606",
      "Repeat annually"
    ],
    taxReference: "IRC §408A",
    example: "Convert $7,000/year for 20 years = $140K+ in Roth.",
    disclaimer: "Pro-rata rule applies if you have other traditional IRAs.",
    keywords: ["backdoor roth", "roth ira", "high income", "conversion", "income limit", "pro-rata"]
  },
  {
    id: "T-13",
    horseman: ["Taxes"],
    name: "Tax Loss Harvesting",
    summary: "Sell investments at a loss to offset gains and reduce tax liability.",
    savings: "$1,000 - $50,000+",
    complexity: 2,
    bestFor: "Investors with taxable accounts and realized gains",
    requirements: "Taxable investment account, losses available",
    implementationPlan: [
      "Review portfolio for positions at a loss",
      "Sell losing positions to realize losses",
      "Offset gains or deduct up to $3K against income",
      "Reinvest in similar (not identical) investment",
      "Avoid wash sale rule (30 days)"
    ],
    taxReference: "IRC §1211, §1091 (wash sale)",
    example: "$20K loss offsets $20K gain = $3K-$4K tax savings.",
    disclaimer: "Wash sale rule prohibits buying substantially identical securities within 30 days.",
    keywords: ["tax loss", "harvesting", "capital gains", "investment", "wash sale", "offset", "portfolio"]
  },
  {
    id: "T-14",
    horseman: ["Taxes"],
    name: "S-Corp Election for Self-Employment Tax Savings",
    summary: "Elect S-corp status to split income between salary and distributions, reducing self-employment tax.",
    savings: "$5,000 - $30,000+ annually",
    complexity: 3,
    bestFor: "Self-employed earning $50K+ annually",
    requirements: "Single-member LLC or eligible entity, reasonable salary",
    implementationPlan: [
      "File Form 2553 for S-corp election",
      "Set up payroll for reasonable salary",
      "Take remaining profits as distributions",
      "File S-corp return (Form 1120-S)"
    ],
    taxReference: "IRC §1361, §1362",
    example: "$150K profit: $80K salary + $70K distribution saves $10K+ in FICA.",
    disclaimer: "Must pay reasonable salary; payroll compliance required.",
    keywords: ["s-corp", "self-employment", "llc", "payroll", "fica", "distribution", "salary"]
  },
  {
    id: "T-15",
    horseman: ["Taxes"],
    name: "Home Office Deduction",
    summary: "Deduct home office expenses if you use part of your home regularly and exclusively for business.",
    savings: "$500 - $5,000+",
    complexity: 2,
    bestFor: "Self-employed individuals working from home",
    requirements: "Regular and exclusive use for business, principal place of business",
    implementationPlan: [
      "Measure square footage of office space",
      "Calculate percentage of home used for business",
      "Choose simplified ($5/sq ft up to 300 sq ft) or actual method",
      "Document home expenses (mortgage, utilities, etc.)"
    ],
    taxReference: "IRC §280A",
    example: "300 sq ft × $5 = $1,500 deduction (simplified).",
    disclaimer: "Employees cannot claim (post-2017); must meet exclusive use test.",
    keywords: ["home office", "work from home", "self-employed", "deduction", "280a", "remote work"]
  },
  {
    id: "T-16",
    horseman: ["Taxes"],
    name: "Depreciation of Rental Property",
    summary: "Deduct annual depreciation on residential (27.5 years) or commercial (39 years) rental property.",
    savings: "$3,000 - $50,000+ annually",
    complexity: 2,
    bestFor: "Rental property owners",
    requirements: "Rental property in service, proper cost basis calculation",
    implementationPlan: [
      "Calculate property cost basis (purchase price - land value + improvements)",
      "Divide by 27.5 (residential) or 39 (commercial)",
      "Claim annual depreciation on Schedule E",
      "Track accumulated depreciation"
    ],
    taxReference: "IRC §168",
    example: "$300K building / 27.5 years = $10,909 annual deduction.",
    disclaimer: "Depreciation recaptured at 25% on sale.",
    keywords: ["depreciation", "rental", "property", "27.5", "real estate", "landlord", "schedule e"]
  },
  {
    id: "T-17",
    horseman: ["Taxes"],
    name: "Charitable Stock Donation",
    summary: "Donate appreciated stock to charity to avoid capital gains and receive full fair market value deduction.",
    savings: "$2,000 - $100,000+",
    complexity: 2,
    bestFor: "Those with appreciated securities and charitable intent",
    requirements: "Appreciated stock held 1+ year, qualified charity",
    implementationPlan: [
      "Identify appreciated securities",
      "Confirm charity accepts stock donations",
      "Transfer shares directly to charity (don't sell first)",
      "Claim fair market value as deduction"
    ],
    taxReference: "IRC §170",
    example: "$50K stock with $10K basis: avoid $8K capital gains + $12K+ tax deduction.",
    disclaimer: "Must hold 1+ year for full benefit; deduction limited to 30% of AGI.",
    keywords: ["stock donation", "charitable", "appreciated", "capital gains", "donation", "securities"]
  },
  {
    id: "T-18",
    horseman: ["Taxes"],
    name: "1031 Like-Kind Exchange",
    summary: "Defer capital gains on investment property by exchanging into similar property.",
    savings: "$20,000 - $500,000+",
    complexity: 4,
    bestFor: "Real estate investors upgrading or diversifying",
    requirements: "Investment/business property, qualified intermediary, strict timelines",
    implementationPlan: [
      "Engage qualified intermediary before sale",
      "Sell relinquished property",
      "Identify replacement property within 45 days",
      "Close on replacement within 180 days"
    ],
    taxReference: "IRC §1031",
    example: "$200K gain deferred = $60K+ immediate tax savings.",
    disclaimer: "Strict rules; must use qualified intermediary; personal property excluded.",
    keywords: ["1031", "exchange", "like-kind", "real estate", "deferral", "investment property", "swap"]
  },
  {
    id: "T-19",
    horseman: ["Taxes"],
    name: "Installment Sale",
    summary: "Spread capital gains over multiple years by receiving sale proceeds over time.",
    savings: "$5,000 - $100,000+",
    complexity: 3,
    bestFor: "Those selling high-value assets wanting to manage tax brackets",
    requirements: "Seller financing, installment payments over 2+ years",
    implementationPlan: [
      "Structure sale with installment payments",
      "Calculate gross profit percentage",
      "Report gain proportionally each year received",
      "File Form 6252"
    ],
    taxReference: "IRC §453",
    example: "Spread $500K gain over 5 years to stay in lower bracket.",
    disclaimer: "Interest income is taxable; buyer credit risk.",
    keywords: ["installment", "sale", "spread", "capital gains", "payments", "seller financing"]
  },
  {
    id: "T-20",
    horseman: ["Taxes"],
    name: "Maximize Retirement Plan Contributions",
    summary: "Maximize contributions across all available retirement accounts (401k, IRA, SEP, Solo 401k).",
    savings: "$5,000 - $100,000+ annually",
    complexity: 2,
    bestFor: "High earners with multiple income sources",
    requirements: "Eligible retirement plans, earned income",
    implementationPlan: [
      "Identify all available plans (employer + personal)",
      "Calculate maximum contribution for each",
      "Prioritize employer match first",
      "Maximize HSA if eligible",
      "Fund remaining accounts in order of tax benefit"
    ],
    taxReference: "IRC §401(k), §408, §408(k)",
    example: "Max 401k + Solo 401k + HSA = $60K+ pre-tax savings.",
    disclaimer: "Contribution limits vary by plan; coordination rules apply.",
    keywords: ["retirement", "contribution", "401k", "ira", "sep", "solo 401k", "maximize", "pretax"]
  },

  // INSURANCE STRATEGIES (20)
  {
    id: "INS-1",
    horseman: ["Insurance"],
    name: "Shop Insurance Annually",
    summary: "Compare insurance quotes annually to ensure competitive rates across all policies.",
    savings: "$500 - $5,000+ annually",
    complexity: 1,
    bestFor: "Anyone with insurance policies",
    requirements: "Current policy information, time to compare",
    implementationPlan: [
      "List all current policies and premiums",
      "Get quotes from 3-5 competing insurers",
      "Compare coverage levels and exclusions",
      "Negotiate with current insurer or switch"
    ],
    taxReference: "N/A",
    example: "Switching auto and home saves $800-$1,500/year average.",
    disclaimer: "Ensure adequate coverage; cheapest isn't always best.",
    keywords: ["shop", "compare", "quote", "insurance", "premium", "rate", "switch"]
  },
  {
    id: "INS-2",
    horseman: ["Insurance"],
    name: "Increase Deductibles",
    summary: "Raise deductibles on auto, home, and health insurance to lower premiums.",
    savings: "$300 - $2,000+ annually",
    complexity: 1,
    bestFor: "Those with emergency savings who rarely file claims",
    requirements: "Emergency fund to cover higher deductible",
    implementationPlan: [
      "Review current deductibles across policies",
      "Calculate premium savings for higher deductibles",
      "Ensure emergency fund covers new deductible",
      "Update policies"
    ],
    taxReference: "N/A",
    example: "Raising auto deductible from $500 to $1,000 saves 15-20% on premium.",
    disclaimer: "Must have funds available for higher out-of-pocket costs.",
    keywords: ["deductible", "premium", "lower", "out-of-pocket", "savings", "emergency fund"]
  },
  {
    id: "INS-3",
    horseman: ["Insurance"],
    name: "Bundle Insurance Policies",
    summary: "Combine auto, home, umbrella, and other policies with one carrier for discounts.",
    savings: "$300 - $1,500+ annually",
    complexity: 1,
    bestFor: "Those with multiple insurance policies",
    requirements: "Multiple policies eligible for bundling",
    implementationPlan: [
      "List all current policies and carriers",
      "Get bundled quotes from 3-4 insurers",
      "Compare total cost vs. separate policies",
      "Switch to best bundle"
    ],
    taxReference: "N/A",
    example: "Bundling auto + home typically saves 10-25%.",
    disclaimer: "Bundle savings may not always beat separate best rates.",
    keywords: ["bundle", "combine", "discount", "auto", "home", "umbrella", "policy"]
  },
  {
    id: "INS-4",
    horseman: ["Insurance"],
    name: "Term Life Instead of Whole Life",
    summary: "Choose term life insurance for pure death benefit at fraction of whole life cost.",
    savings: "$2,000 - $10,000+ annually",
    complexity: 2,
    bestFor: "Those needing death benefit without investment component",
    requirements: "Insurability, understanding of coverage needs",
    implementationPlan: [
      "Calculate actual death benefit need",
      "Get term quotes for appropriate term length",
      "Compare to whole life premiums",
      "Invest premium difference for wealth building"
    ],
    taxReference: "N/A",
    example: "$500K term: $30/month vs. whole life $400/month. Invest $370/month difference.",
    disclaimer: "Term expires; no cash value. Whole life may suit estate planning needs.",
    keywords: ["term life", "whole life", "life insurance", "death benefit", "premium", "cost"]
  },
  {
    id: "INS-5",
    horseman: ["Insurance"],
    name: "Review and Reduce Unnecessary Coverage",
    summary: "Eliminate duplicate or unnecessary coverage across policies.",
    savings: "$200 - $2,000+ annually",
    complexity: 1,
    bestFor: "Those who haven't reviewed policies in years",
    requirements: "Access to all policy details",
    implementationPlan: [
      "Gather all insurance policies",
      "Identify duplicate coverage (e.g., rental car, travel)",
      "Remove riders and add-ons you don't need",
      "Adjust coverage limits to actual needs"
    ],
    taxReference: "N/A",
    example: "Dropping rental car coverage when credit card provides it saves $100+/year.",
    disclaimer: "Don't underinsure; focus on redundant coverage.",
    keywords: ["review", "coverage", "duplicate", "unnecessary", "rider", "reduce"]
  },
  {
    id: "INS-6",
    horseman: ["Insurance"],
    name: "Improve Credit Score for Lower Premiums",
    summary: "Many insurers use credit-based insurance scores; improving credit can lower rates.",
    savings: "$200 - $1,000+ annually",
    complexity: 2,
    bestFor: "Those with below-average credit scores",
    requirements: "Time and discipline to improve credit",
    implementationPlan: [
      "Check credit score and report",
      "Dispute any errors",
      "Pay down balances, pay on time",
      "Request re-quote after score improves"
    ],
    taxReference: "N/A",
    example: "Improving credit score 50 points can lower auto premium 10%+.",
    disclaimer: "Not used in all states; results vary by insurer.",
    keywords: ["credit score", "premium", "insurance score", "lower", "rate"]
  },
  {
    id: "INS-7",
    horseman: ["Insurance"],
    name: "Install Safety and Security Devices",
    summary: "Add security systems, smoke detectors, and safety features for insurance discounts.",
    savings: "$100 - $500+ annually",
    complexity: 1,
    bestFor: "Homeowners and vehicle owners",
    requirements: "Investment in safety devices",
    implementationPlan: [
      "Ask insurer what devices qualify for discounts",
      "Install qualifying devices (alarms, cameras, smoke detectors)",
      "Provide documentation to insurer",
      "Request updated premium"
    ],
    taxReference: "N/A",
    example: "Security system + smoke detectors save 5-15% on home insurance.",
    disclaimer: "Upfront cost of devices; verify discount before purchasing.",
    keywords: ["safety", "security", "alarm", "smoke detector", "discount", "device"]
  },
  {
    id: "INS-8",
    horseman: ["Insurance"],
    name: "Group Insurance Through Associations",
    summary: "Access group rates through professional associations, alumni groups, or employers.",
    savings: "$200 - $1,500+ annually",
    complexity: 1,
    bestFor: "Members of professional or alumni associations",
    requirements: "Eligible association membership",
    implementationPlan: [
      "List all associations/groups you belong to",
      "Check insurance benefits offered",
      "Compare group rates to individual rates",
      "Enroll in best option"
    ],
    taxReference: "N/A",
    example: "AARP, professional associations often offer 5-15% discounts.",
    disclaimer: "Group rates not always best; still compare.",
    keywords: ["group", "association", "discount", "alumni", "professional", "member"]
  },
  {
    id: "INS-9",
    horseman: ["Insurance"],
    name: "Pay Annual Premium Instead of Monthly",
    summary: "Pay insurance premiums annually to avoid monthly billing fees.",
    savings: "$50 - $300+ annually per policy",
    complexity: 1,
    bestFor: "Those with cash flow to pay upfront",
    requirements: "Funds available for annual payment",
    implementationPlan: [
      "Calculate total cost of monthly vs. annual",
      "Switch to annual billing on each policy",
      "Set aside monthly amount for next year's payment"
    ],
    taxReference: "N/A",
    example: "Avoiding $3/month fee saves $36/year per policy.",
    disclaimer: "Requires upfront cash; budget accordingly.",
    keywords: ["annual", "monthly", "billing", "fee", "payment", "premium"]
  },
  {
    id: "INS-10",
    horseman: ["Insurance"],
    name: "Good Driver and Safe Driving Discounts",
    summary: "Maintain clean driving record and use telematics programs for auto insurance discounts.",
    savings: "$200 - $1,000+ annually",
    complexity: 1,
    bestFor: "Safe drivers willing to use monitoring devices",
    requirements: "Clean driving record, willingness to be monitored",
    implementationPlan: [
      "Check eligibility for good driver discount",
      "Enroll in telematics/usage-based program",
      "Drive safely during monitoring period",
      "Receive personalized rate based on driving habits"
    ],
    taxReference: "N/A",
    example: "Telematics programs offer 10-30% discounts for safe driving.",
    disclaimer: "Poor driving habits can increase rates with telematics.",
    keywords: ["good driver", "safe", "telematics", "monitoring", "discount", "driving record"]
  },
  {
    id: "INS-11",
    horseman: ["Insurance"],
    name: "Umbrella Policy for Liability Protection",
    summary: "Add umbrella policy for additional liability coverage at low cost per dollar of coverage.",
    savings: "Risk mitigation (protects assets)",
    complexity: 2,
    bestFor: "Those with assets to protect",
    requirements: "Underlying auto/home policies meeting minimums",
    implementationPlan: [
      "Assess total liability exposure",
      "Determine coverage amount needed (typically $1-5M)",
      "Get quotes from current and competing insurers",
      "Ensure underlying policies meet umbrella requirements"
    ],
    taxReference: "N/A",
    example: "$1M umbrella costs $150-300/year; $2M costs $200-400/year.",
    disclaimer: "Doesn't cover everything; review exclusions.",
    keywords: ["umbrella", "liability", "protection", "coverage", "assets", "lawsuit"]
  },
  {
    id: "INS-12",
    horseman: ["Insurance"],
    name: "Long-Term Care Insurance Planning",
    summary: "Purchase LTC insurance earlier for lower premiums and guaranteed insurability.",
    savings: "Premium savings + asset protection",
    complexity: 3,
    bestFor: "Those 50-60 planning for retirement",
    requirements: "Insurability (health qualification)",
    implementationPlan: [
      "Research LTC costs in your area",
      "Get quotes at current age",
      "Consider hybrid policies (LTC + life insurance)",
      "Purchase while healthy for best rates"
    ],
    taxReference: "IRC §7702B (tax-qualified LTC)",
    example: "Buying at 55 vs. 65 can save 50%+ on premiums.",
    disclaimer: "Premiums can increase; some never use benefits.",
    keywords: ["long-term care", "ltc", "nursing home", "retirement", "planning", "elder care"]
  },
  {
    id: "INS-13",
    horseman: ["Insurance"],
    name: "Disability Insurance for Income Protection",
    summary: "Secure disability insurance to protect income if unable to work.",
    savings: "Income protection (60-70% of salary)",
    complexity: 2,
    bestFor: "Wage earners and self-employed",
    requirements: "Insurability, earned income",
    implementationPlan: [
      "Calculate how much income to replace",
      "Check employer-provided coverage",
      "Get individual policy quotes for gap coverage",
      "Choose own-occupation vs. any-occupation definition"
    ],
    taxReference: "N/A (premiums paid post-tax = tax-free benefits)",
    example: "Self-employed with no coverage loses all income if disabled.",
    disclaimer: "Own-occupation policies cost more but provide better protection.",
    keywords: ["disability", "income", "protection", "unable to work", "own occupation"]
  },
  {
    id: "INS-14",
    horseman: ["Insurance"],
    name: "Review Life Insurance Needs Annually",
    summary: "Adjust life insurance as family and financial situation changes.",
    savings: "$500 - $3,000+ annually",
    complexity: 1,
    bestFor: "Anyone with life insurance",
    requirements: "Access to current policies",
    implementationPlan: [
      "Recalculate actual death benefit need",
      "Compare to current coverage",
      "Reduce if over-insured; increase if under-insured",
      "Consider term conversion options"
    ],
    taxReference: "N/A",
    example: "Kids grown and mortgage paid = reduce coverage, save premiums.",
    disclaimer: "Don't cancel before new policy in place.",
    keywords: ["life insurance", "review", "coverage", "needs", "family", "adjust"]
  },
  {
    id: "INS-15",
    horseman: ["Insurance"],
    name: "Health Insurance Optimization",
    summary: "Choose the right health plan based on expected usage and costs.",
    savings: "$500 - $5,000+ annually",
    complexity: 2,
    bestFor: "Anyone selecting health insurance",
    requirements: "Understanding of health care needs",
    implementationPlan: [
      "Estimate annual health care usage",
      "Compare plan premiums, deductibles, and out-of-pocket max",
      "Factor in HSA eligibility for HDHP",
      "Choose plan with lowest total expected cost"
    ],
    taxReference: "IRC §223 (HSA)",
    example: "HDHP + HSA vs. traditional can save $2,000+/year for healthy families.",
    disclaimer: "Higher deductible means more out-of-pocket for unexpected care.",
    keywords: ["health insurance", "hdhp", "premium", "deductible", "healthcare", "plan"]
  },
  {
    id: "INS-16",
    horseman: ["Insurance"],
    name: "Avoid Overlapping Coverage",
    summary: "Identify and eliminate duplicate insurance coverage across policies.",
    savings: "$100 - $500+ annually",
    complexity: 1,
    bestFor: "Those with multiple insurance policies",
    requirements: "Review of all policies",
    implementationPlan: [
      "List all insurance policies and coverage",
      "Identify overlaps (e.g., travel insurance vs. credit card coverage)",
      "Eliminate redundant policies",
      "Redirect savings to needed coverage"
    ],
    taxReference: "N/A",
    example: "Credit card travel protection duplicates standalone travel insurance.",
    disclaimer: "Verify backup coverage before canceling.",
    keywords: ["overlap", "duplicate", "coverage", "redundant", "multiple", "policies"]
  },
  {
    id: "INS-17",
    horseman: ["Insurance"],
    name: "Self-Insure for Minor Risks",
    summary: "Skip insurance for small, manageable risks and self-insure by saving for potential losses.",
    savings: "$200 - $1,000+ annually",
    complexity: 1,
    bestFor: "Those with emergency savings",
    requirements: "Financial ability to cover minor losses",
    implementationPlan: [
      "Identify policies for minor risks",
      "Calculate expected loss vs. premium cost",
      "Cancel policies where self-insurance makes sense",
      "Set aside premium savings for potential losses"
    ],
    taxReference: "N/A",
    example: "Skip phone insurance ($10/month) if you can afford replacement.",
    disclaimer: "Only for risks you can financially absorb.",
    keywords: ["self-insure", "minor", "risk", "skip", "emergency fund", "small claims"]
  },
  {
    id: "INS-18",
    horseman: ["Insurance"],
    name: "Professional Liability Insurance",
    summary: "Protect against malpractice or errors and omissions claims for professionals.",
    savings: "Risk mitigation (protects income and assets)",
    complexity: 2,
    bestFor: "Professionals, consultants, advisors",
    requirements: "Professional services rendered",
    implementationPlan: [
      "Assess professional liability exposure",
      "Get quotes from specialty insurers",
      "Choose appropriate coverage limits",
      "Review policy exclusions carefully"
    ],
    taxReference: "Business expense (deductible)",
    example: "E&O insurance protects against client lawsuits claiming negligence.",
    disclaimer: "Coverage varies widely; read policy carefully.",
    keywords: ["professional liability", "malpractice", "errors", "omissions", "e&o", "consultant"]
  },
  {
    id: "INS-19",
    horseman: ["Insurance"],
    name: "Business Owner's Policy (BOP)",
    summary: "Bundle property, liability, and business interruption insurance for small businesses.",
    savings: "$500 - $3,000+ vs. separate policies",
    complexity: 2,
    bestFor: "Small business owners",
    requirements: "Small to medium-sized business",
    implementationPlan: [
      "Identify business insurance needs",
      "Get BOP quotes from multiple insurers",
      "Compare to cost of separate policies",
      "Choose BOP with appropriate coverage"
    ],
    taxReference: "Business expense (deductible)",
    example: "BOP costs $500-$3,000/year for small businesses.",
    disclaimer: "May not cover all needs; review for gaps.",
    keywords: ["bop", "business", "owner", "property", "liability", "bundle", "small business"]
  },
  {
    id: "INS-20",
    horseman: ["Insurance"],
    name: "Key Person Insurance",
    summary: "Insure key employees whose loss would significantly impact business.",
    savings: "Risk mitigation (protects business value)",
    complexity: 3,
    bestFor: "Businesses dependent on key individuals",
    requirements: "Identified key person, insurable",
    implementationPlan: [
      "Identify key employees critical to business",
      "Calculate financial impact of loss",
      "Purchase life and/or disability insurance on key persons",
      "Business owns policy and is beneficiary"
    ],
    taxReference: "Premiums not deductible; proceeds generally tax-free",
    example: "Losing key salesperson could cost $500K+; insurance covers transition.",
    disclaimer: "Must have insurable interest; employee consent required.",
    keywords: ["key person", "key man", "business", "employee", "life insurance", "critical"]
  },

  // EDUCATION STRATEGIES (20)
  {
    id: "E-1",
    horseman: ["Education"],
    name: "529 College Savings Plan",
    summary: "State-sponsored tax-advantaged savings for education expenses.",
    savings: "Tax-free growth + state tax deduction in some states",
    complexity: 2,
    bestFor: "Parents/grandparents saving for education",
    requirements: "Beneficiary, funds to invest",
    implementationPlan: [
      "Research state 529 plans (your state may offer tax deduction)",
      "Open account and name beneficiary",
      "Set up automatic contributions",
      "Invest according to time horizon"
    ],
    taxReference: "IRC §529",
    example: "Save $500/month for 18 years at 7% = $200K+ tax-free for education.",
    disclaimer: "Non-qualified withdrawals incur taxes + 10% penalty on earnings.",
    keywords: ["529", "college", "savings", "education", "tax-free", "university", "tuition"]
  },
  {
    id: "E-2",
    horseman: ["Education"],
    name: "Coverdell Education Savings Account (ESA)",
    summary: "Tax-advantaged account for K-12 and higher education expenses.",
    savings: "Tax-free growth on up to $2,000/year contribution",
    complexity: 2,
    bestFor: "Those with K-12 or specialized education expenses",
    requirements: "Income limits ($220K MAGI married), beneficiary under 18",
    implementationPlan: [
      "Open Coverdell ESA at brokerage",
      "Contribute up to $2,000/year",
      "Invest funds for growth",
      "Use for qualified K-12 or college expenses"
    ],
    taxReference: "IRC §530",
    example: "Use for private school tuition, computers, tutoring.",
    disclaimer: "Low contribution limit; income phase-out applies.",
    keywords: ["coverdell", "esa", "education", "k-12", "private school", "savings"]
  },
  {
    id: "E-3",
    horseman: ["Education"],
    name: "American Opportunity Tax Credit (AOTC)",
    summary: "Up to $2,500 tax credit for first four years of college.",
    savings: "$2,500/year ($10,000 over four years)",
    complexity: 2,
    bestFor: "Students in first four years of college",
    requirements: "Enrolled at least half-time, pursuing degree, income limits",
    implementationPlan: [
      "Ensure student meets eligibility requirements",
      "Pay qualified expenses (tuition, books, supplies)",
      "Claim credit on tax return (Form 8863)",
      "40% refundable up to $1,000"
    ],
    taxReference: "IRC §25A",
    example: "Claim full $2,500 credit each year of undergrad = $10K total.",
    disclaimer: "Income phase-out: $80K-$90K single, $160K-$180K married.",
    keywords: ["aotc", "college", "credit", "tax credit", "tuition", "university", "undergraduate"]
  },
  {
    id: "E-4",
    horseman: ["Education"],
    name: "Lifetime Learning Credit",
    summary: "Up to $2,000 tax credit for any year of college or courses.",
    savings: "$2,000/year",
    complexity: 2,
    bestFor: "Graduate students, part-time students, professional development",
    requirements: "Enrolled in eligible institution, income limits",
    implementationPlan: [
      "Pay qualified tuition and fees",
      "Cannot also claim AOTC for same student",
      "Claim on Form 8863",
      "20% of first $10,000 in expenses"
    ],
    taxReference: "IRC §25A",
    example: "Graduate student claims $2,000 credit annually.",
    disclaimer: "Not refundable; income limits apply.",
    keywords: ["lifetime learning", "credit", "graduate", "college", "professional", "education"]
  },
  {
    id: "E-5",
    horseman: ["Education"],
    name: "Employer Tuition Assistance",
    summary: "Receive up to $5,250 tax-free annually from employer for education.",
    savings: "$5,250/year tax-free",
    complexity: 1,
    bestFor: "Employees with tuition assistance benefits",
    requirements: "Employer offering educational assistance program",
    implementationPlan: [
      "Check if employer offers tuition assistance",
      "Understand program requirements",
      "Enroll in qualifying courses",
      "Submit for reimbursement"
    ],
    taxReference: "IRC §127",
    example: "Employer pays $5,250/year for MBA = tax-free to employee.",
    disclaimer: "May have service commitment; not all education qualifies.",
    keywords: ["employer", "tuition", "assistance", "reimbursement", "127", "tax-free", "benefit"]
  },
  {
    id: "E-6",
    horseman: ["Education"],
    name: "Student Loan Interest Deduction",
    summary: "Deduct up to $2,500 in student loan interest paid.",
    savings: "$500 - $900+ (depends on tax bracket)",
    complexity: 1,
    bestFor: "Those repaying student loans",
    requirements: "Paying interest on qualified student loan, income limits",
    implementationPlan: [
      "Receive Form 1098-E from loan servicer",
      "Claim deduction on Form 1040 (above-the-line)",
      "No itemizing required"
    ],
    taxReference: "IRC §221",
    example: "Pay $2,500 interest in 24% bracket = $600 tax savings.",
    disclaimer: "Phase-out: $75K-$90K single, $155K-$185K married.",
    keywords: ["student loan", "interest", "deduction", "college debt", "repayment"]
  },
  {
    id: "E-7",
    horseman: ["Education"],
    name: "Income-Driven Repayment Plans",
    summary: "Cap student loan payments at percentage of discretionary income.",
    savings: "Lower monthly payments + potential forgiveness",
    complexity: 2,
    bestFor: "Those with high student debt relative to income",
    requirements: "Federal student loans, income documentation",
    implementationPlan: [
      "Apply for IDR plan (SAVE, PAYE, IBR, ICR)",
      "Submit income documentation annually",
      "Payments capped at 5-20% of discretionary income",
      "Remaining balance forgiven after 20-25 years"
    ],
    taxReference: "N/A (forgiveness may be taxable)",
    example: "Reduce payments from $1,200 to $300/month based on income.",
    disclaimer: "Interest may accrue; longer repayment = more total paid.",
    keywords: ["idr", "income-driven", "student loan", "repayment", "forgiveness", "payment"]
  },
  {
    id: "E-8",
    horseman: ["Education"],
    name: "Public Service Loan Forgiveness (PSLF)",
    summary: "Forgive remaining student loan balance after 120 qualifying payments while in public service.",
    savings: "$50,000 - $200,000+ forgiven",
    complexity: 3,
    bestFor: "Public service employees (government, non-profit)",
    requirements: "Federal Direct Loans, IDR plan, qualifying employer",
    implementationPlan: [
      "Confirm employment at qualifying employer",
      "Consolidate to Direct Loans if needed",
      "Enroll in qualifying IDR plan",
      "Submit Employment Certification Form annually",
      "Apply for forgiveness after 120 payments"
    ],
    taxReference: "Forgiveness is tax-free",
    example: "$150K balance forgiven after 10 years of payments.",
    disclaimer: "Strict requirements; many applications previously denied.",
    keywords: ["pslf", "public service", "forgiveness", "student loan", "nonprofit", "government"]
  },
  {
    id: "E-9",
    horseman: ["Education"],
    name: "Maximize Financial Aid",
    summary: "Optimize asset positioning and timing to maximize need-based financial aid.",
    savings: "$5,000 - $50,000+ over college years",
    complexity: 3,
    bestFor: "Families applying for financial aid",
    requirements: "Understanding of FAFSA/CSS Profile formulas",
    implementationPlan: [
      "Understand EFC (Expected Family Contribution) formula",
      "Reduce reportable assets before filing",
      "Maximize retirement contributions (not counted)",
      "Consider timing of income recognition",
      "File FAFSA immediately when available"
    ],
    taxReference: "N/A",
    example: "Shifting $10K to retirement can increase aid by $560+.",
    disclaimer: "Don't harm finances just for aid; consult financial aid advisor.",
    keywords: ["financial aid", "fafsa", "efc", "aid", "college", "need-based", "scholarship"]
  },
  {
    id: "E-10",
    horseman: ["Education"],
    name: "Scholarship Searching",
    summary: "Apply for scholarships to reduce out-of-pocket education costs.",
    savings: "$1,000 - $100,000+",
    complexity: 2,
    bestFor: "Students at any education level",
    requirements: "Time to search and apply",
    implementationPlan: [
      "Use scholarship search tools (Fastweb, Scholarships.com, College Board)",
      "Check local organizations, employers, and community foundations",
      "Apply early and to multiple scholarships",
      "Tailor applications to each scholarship"
    ],
    taxReference: "Generally tax-free for qualified expenses (IRC §117)",
    example: "Several $1,000 scholarships add up to significant savings.",
    disclaimer: "Competitive; requires effort and persistence.",
    keywords: ["scholarship", "grant", "free money", "college", "aid", "search", "apply"]
  },
  {
    id: "E-11",
    horseman: ["Education"],
    name: "Community College Transfer Strategy",
    summary: "Start at community college then transfer to four-year university to save on tuition.",
    savings: "$20,000 - $60,000+",
    complexity: 1,
    bestFor: "Students planning to attend four-year college",
    requirements: "Community college access, transfer planning",
    implementationPlan: [
      "Research transfer agreements with target universities",
      "Complete general education at community college",
      "Maintain strong GPA for transfer admission",
      "Transfer with junior standing"
    ],
    taxReference: "N/A",
    example: "Two years at CC ($3,500/year) vs. university ($15K/year) = $23K savings.",
    disclaimer: "Some credits may not transfer; plan carefully.",
    keywords: ["community college", "transfer", "save", "tuition", "two-year", "university"]
  },
  {
    id: "E-12",
    horseman: ["Education"],
    name: "CLEP and AP Exams for College Credit",
    summary: "Earn college credit through exams to reduce time and cost of degree.",
    savings: "$5,000 - $30,000+",
    complexity: 2,
    bestFor: "Motivated high school or early college students",
    requirements: "Exam preparation, university acceptance of credits",
    implementationPlan: [
      "Identify which CLEP/AP exams university accepts",
      "Prepare for exams (self-study or courses)",
      "Take exams and submit scores",
      "Skip introductory courses"
    ],
    taxReference: "N/A",
    example: "5 AP exams = 15+ credits = one semester saved.",
    disclaimer: "Not all universities accept all credits; verify first.",
    keywords: ["clep", "ap", "exam", "credit", "test out", "advanced placement", "college credit"]
  },
  {
    id: "E-13",
    horseman: ["Education"],
    name: "In-State Tuition Strategies",
    summary: "Establish residency or use programs to qualify for in-state tuition rates.",
    savings: "$10,000 - $100,000+ over degree",
    complexity: 3,
    bestFor: "Those considering out-of-state schools",
    requirements: "State residency requirements, time to establish",
    implementationPlan: [
      "Research target state's residency requirements",
      "Consider gap year to establish residency",
      "Look for tuition reciprocity agreements (WICHE, NEBHE)",
      "Check if military or other exceptions apply"
    ],
    taxReference: "N/A",
    example: "Out-of-state: $30K/year vs. in-state: $12K/year = $72K savings over 4 years.",
    disclaimer: "Residency requirements vary; plan well in advance.",
    keywords: ["in-state", "residency", "tuition", "out-of-state", "reciprocity", "wiche"]
  },
  {
    id: "E-14",
    horseman: ["Education"],
    name: "Work-Study Programs",
    summary: "Participate in federal work-study for part-time jobs to help pay education costs.",
    savings: "$2,000 - $5,000+/year",
    complexity: 1,
    bestFor: "Students eligible for financial aid",
    requirements: "Demonstrated financial need, FAFSA",
    implementationPlan: [
      "File FAFSA and indicate interest in work-study",
      "Accept work-study award",
      "Apply for on-campus jobs",
      "Work part-time while attending classes"
    ],
    taxReference: "Earnings are taxable but may be excluded from future FAFSA",
    example: "Work 10 hours/week at $15/hour = $6,000/year.",
    disclaimer: "Limited positions; compete for best jobs.",
    keywords: ["work-study", "campus job", "part-time", "financial aid", "fafsa"]
  },
  {
    id: "E-15",
    horseman: ["Education"],
    name: "Tuition Payment Plans",
    summary: "Spread tuition payments over semester instead of lump sum.",
    savings: "Cash flow management (avoid loans for some)",
    complexity: 1,
    bestFor: "Families who can afford tuition over time but not upfront",
    requirements: "School offering payment plans",
    implementationPlan: [
      "Check if school offers tuition payment plan",
      "Enroll in plan (typically small fee)",
      "Make monthly payments",
      "Avoid taking loans for portion you can cash flow"
    ],
    taxReference: "N/A",
    example: "Pay $5K/month for 4 months instead of $20K upfront.",
    disclaimer: "Small fee may apply; doesn't reduce total cost.",
    keywords: ["payment plan", "tuition", "installment", "monthly", "cash flow"]
  },
  {
    id: "E-16",
    horseman: ["Education"],
    name: "Employer Student Loan Repayment Assistance",
    summary: "Receive tax-free student loan repayment assistance from employer.",
    savings: "Up to $5,250/year tax-free",
    complexity: 1,
    bestFor: "Employees with student loans",
    requirements: "Employer offering student loan repayment benefit",
    implementationPlan: [
      "Check if employer offers student loan repayment",
      "Enroll in program",
      "Employer payments go directly to loans",
      "Tax-free up to $5,250/year through 2025"
    ],
    taxReference: "IRC §127",
    example: "Employer pays $5,250/year toward loans = tax-free benefit.",
    disclaimer: "Not all employers offer; may have vesting requirements.",
    keywords: ["employer", "student loan", "repayment", "assistance", "127", "tax-free"]
  },
  {
    id: "E-17",
    horseman: ["Education"],
    name: "Education Tax Deductions for Self-Employed",
    summary: "Deduct education expenses that maintain or improve skills for current business.",
    savings: "$500 - $10,000+ (depends on expenses)",
    complexity: 2,
    bestFor: "Self-employed individuals seeking education",
    requirements: "Education related to current trade/business",
    implementationPlan: [
      "Ensure education maintains/improves current skills",
      "Document business purpose",
      "Deduct tuition, books, travel as business expense",
      "Cannot be to qualify for new career"
    ],
    taxReference: "IRC §162",
    example: "CPA taking tax update course deducts $2,000 as business expense.",
    disclaimer: "Cannot deduct education to qualify for new career.",
    keywords: ["self-employed", "education", "deduction", "business", "professional development", "training"]
  },
  {
    id: "E-18",
    horseman: ["Education"],
    name: "Grandparent-Owned 529 Strategy",
    summary: "Grandparents own 529 to minimize impact on financial aid while funding education.",
    savings: "Maximize aid + tax-free growth",
    complexity: 3,
    bestFor: "Grandparents wanting to help with education",
    requirements: "529 plan, understanding of financial aid timing",
    implementationPlan: [
      "Grandparent opens 529 in their name",
      "Contribute and grow funds",
      "Distribute after student files last FAFSA (junior year)",
      "Or use new simplified FAFSA rules (2024+)"
    ],
    taxReference: "IRC §529",
    example: "Grandparent 529 doesn't count as asset on FAFSA.",
    disclaimer: "Rules changed in 2024; distributions no longer count as income.",
    keywords: ["grandparent", "529", "financial aid", "fafsa", "gift", "education"]
  },
  {
    id: "E-19",
    horseman: ["Education"],
    name: "Qualified Tuition Programs (Prepaid)",
    summary: "Lock in current tuition rates through state prepaid tuition plans.",
    savings: "Hedge against tuition inflation",
    complexity: 2,
    bestFor: "Those certain about in-state public school attendance",
    requirements: "State offering prepaid plan, residency usually required",
    implementationPlan: [
      "Research state's prepaid tuition program",
      "Purchase tuition units or credits at current prices",
      "Use for tuition when student enrolls",
      "Understand transferability if plans change"
    ],
    taxReference: "IRC §529",
    example: "Buy 4 years of tuition now; use in 10 years at no additional cost.",
    disclaimer: "Limited to specific schools; value uncertain if student attends elsewhere.",
    keywords: ["prepaid tuition", "529", "lock in", "inflation", "state plan"]
  },
  {
    id: "E-20",
    horseman: ["Education"],
    name: "Direct Tuition Payment by Grandparents",
    summary: "Grandparents pay tuition directly to institution to avoid gift tax.",
    savings: "Estate tax savings + education funding",
    complexity: 2,
    bestFor: "Grandparents with assets wanting to help with education",
    requirements: "Payment directly to institution, tuition only",
    implementationPlan: [
      "Identify tuition amount",
      "Pay directly to school (not to parent/student)",
      "Unlimited gift tax exclusion for direct tuition payments",
      "Can still give $18K annual gift separately"
    ],
    taxReference: "IRC §2503(e)",
    example: "Grandparent pays $50K tuition directly + $18K gift = $68K transferred tax-free.",
    disclaimer: "Tuition only; not room/board. May affect financial aid.",
    keywords: ["grandparent", "direct payment", "tuition", "gift tax", "education", "2503"]
  }
];

// =====================================================
// CONDENSED SYSTEM PROMPT (No embedded knowledge base)
// =====================================================

const BASE_SYSTEM_PROMPT = `You are an expert RPRx financial strategy assistant.

## YOUR WORKFLOW
1. Greet the user and explain you help reduce the impact of the Four Horsemen (Interest, Taxes, Insurance, Education) on their finances.
2. Ask intake questions one at a time to understand their situation.
3. Recommend the most relevant strategies from those provided to you, prioritizing dollar impact and applicability.
4. Present strategies in a clear numbered list format.
5. Offer detailed implementation plans for strategies they select.
6. Always include disclaimers and refer to rprx4life.com for professional guidance.

## INTAKE QUESTIONS (Ask one at a time)

### User Profile
- Which describes you? (Business Owner, Retiree/Grandparent, Salesperson, Wage Earner, Investor, Farmer, Non-Profit)
- Main financial goals? (Increase Cash Flow, Reduce Taxes, Save for Education, Improve Retirement, Reduce Insurance Costs)

### Financial Snapshot
- Approximate annual household income? (<$100K, $100-250K, $250-500K, $500K-$1M, $1M+)
- Total household debt? (<$50K, $50-200K, $200-500K, $500K+)
- Children or dependents? (If yes, how many and ages?)
- Currently paying for or planning education expenses?
- Biggest financial concerns?

## STRATEGY OUTPUT FORMAT

When presenting strategies, ALWAYS use this NUMBERED LIST format:

**Strategy #1: [Strategy Name]**
- **Horseman(s):** [Interest/Taxes/Insurance/Education]
- **Savings Range:** [e.g., $5,000 - $50,000+]
- **Complexity:** [1-5]/5
- **Summary:** [One sentence description]

IMPORTANT: Do NOT use markdown tables with pipe characters (|). Always use the numbered list format as it displays better on all devices.

After listing strategies, ask: "Which of these would you like a step-by-step implementation plan for? Reply with the strategy numbers."

## IMPLEMENTATION PLAN FORMAT

For selected strategies provide:
- **Title**
- **Who it's best for**
- **Key Requirements**
- **Step-by-Step Implementation Plan**
- **What to bring to your CPA/Advisor**
- **Disclaimer** + rprx4life.com referral

## GUARDRAILS
- Do not provide tax/legal advice - only educational information
- Do not promise results or guaranteed savings
- Do not invent IRS references not in the provided strategies
- Do not generate images unless explicitly asked

## DISCLAIMER
This is educational information only. Always consult a qualified professional before implementing any strategy. For personalized guidance, visit rprx4life.com.`;

// =====================================================
// KEYWORD MATCHING FOR RELEVANT STRATEGIES
// =====================================================

function findRelevantStrategies(userMessage: string, conversationHistory: string): Strategy[] {
  const combinedText = (userMessage + ' ' + conversationHistory).toLowerCase();
  
  // Score each strategy based on keyword matches
  const scoredStrategies = STRATEGIES.map(strategy => {
    let score = 0;
    
    // Check keywords
    for (const keyword of strategy.keywords) {
      if (combinedText.includes(keyword.toLowerCase())) {
        score += 2;
      }
    }
    
    // Check horseman mentions
    for (const horseman of strategy.horseman) {
      if (combinedText.includes(horseman.toLowerCase())) {
        score += 3;
      }
    }
    
    // Check strategy name
    if (combinedText.includes(strategy.name.toLowerCase())) {
      score += 5;
    }
    
    // Boost for explicit category mentions
    if (combinedText.includes('interest') && strategy.horseman.includes('Interest')) score += 2;
    if (combinedText.includes('tax') && strategy.horseman.includes('Taxes')) score += 2;
    if (combinedText.includes('insurance') && strategy.horseman.includes('Insurance')) score += 2;
    if (combinedText.includes('education') && strategy.horseman.includes('Education')) score += 2;
    
    // Common financial terms
    if (combinedText.includes('mortgage') && strategy.keywords.includes('mortgage')) score += 3;
    if (combinedText.includes('401k') && strategy.keywords.includes('401k')) score += 3;
    if (combinedText.includes('college') && strategy.keywords.includes('college')) score += 3;
    if (combinedText.includes('student loan') && strategy.keywords.includes('student loan')) score += 3;
    if (combinedText.includes('retirement') && strategy.keywords.includes('retirement')) score += 3;
    if (combinedText.includes('business') && strategy.keywords.includes('business')) score += 2;
    if (combinedText.includes('self-employed') && strategy.keywords.includes('self-employed')) score += 3;
    
    return { strategy, score };
  });
  
  // Sort by score and take top 15 most relevant
  scoredStrategies.sort((a, b) => b.score - a.score);
  
  // If no strong matches, include a diverse set
  const topStrategies = scoredStrategies
    .filter(s => s.score > 0)
    .slice(0, 15)
    .map(s => s.strategy);
  
  // If we have less than 10 matches, add some high-impact defaults
  if (topStrategies.length < 10) {
    const defaults = STRATEGIES.filter(s => 
      ['T-1', 'T-2', 'T-5', 'I-1', 'I-2', 'INS-1', 'INS-3', 'E-1', 'E-3', 'E-6'].includes(s.id) &&
      !topStrategies.includes(s)
    );
    topStrategies.push(...defaults.slice(0, 10 - topStrategies.length));
  }
  
  return topStrategies;
}

function formatStrategiesForPrompt(strategies: Strategy[]): string {
  if (strategies.length === 0) {
    return "No specific strategies selected for this context.";
  }
  
  return strategies.map(s => `
### ${s.id}: ${s.name}
- **Horseman(s):** ${s.horseman.join(', ')}
- **Summary:** ${s.summary}
- **Projected Savings:** ${s.savings}
- **Complexity:** ${s.complexity}/5
- **Best For:** ${s.bestFor}
- **Key Requirements:** ${s.requirements}
- **Implementation Plan:**
${s.implementationPlan.map((step, i) => `  ${i + 1}. ${step}`).join('\n')}
- **Tax Code Reference:** ${s.taxReference}
- **Example:** ${s.example}
- **Disclaimer:** ${s.disclaimer}
`).join('\n---\n');
}

// =====================================================
// MAIN HANDLER
// =====================================================

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

    // OPTIMIZATION: Parallelize save user message + fetch history
    const [saveResult, historyResult] = await Promise.all([
      // Save user message
      supabase.from('messages').insert({
        conversation_id: conversationId,
        role: 'user',
        content: user_message.trim(),
      }),
      // Fetch conversation history (last 20 messages only)
      supabase
        .from('messages')
        .select('role, content')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(20)
    ]);

    if (saveResult.error) {
      console.error('Error saving user message:', saveResult.error);
      return new Response(
        JSON.stringify({ error: 'Failed to save message' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (historyResult.error) {
      console.error('Error fetching messages:', historyResult.error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch conversation history' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Reverse to get chronological order and add current message
    const messages = [...(historyResult.data || [])].reverse();
    // Add the current message since it was just inserted
    messages.push({ role: 'user', content: user_message.trim() });

    // Build conversation history text for keyword matching
    const conversationText = messages.map(m => m.content).join(' ');
    
    // Find relevant strategies based on conversation context
    const relevantStrategies = findRelevantStrategies(user_message, conversationText);
    const strategiesContext = formatStrategiesForPrompt(relevantStrategies);
    
    console.log(`Selected ${relevantStrategies.length} relevant strategies for context`);

    // Build dynamic system prompt with only relevant strategies
    const dynamicSystemPrompt = `${BASE_SYSTEM_PROMPT}

## RELEVANT STRATEGIES FOR THIS CONVERSATION
Use these strategies when making recommendations. Only reference strategies from this list:

${strategiesContext}

---
Remember: Only recommend strategies from the list above. If the user asks about something not covered, acknowledge the limitation and suggest consulting rprx4life.com for additional strategies.`;

    // Build OpenAI messages array
    const openaiMessages = [
      { role: 'system', content: dynamicSystemPrompt },
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
          model: 'gpt-4o-mini',
          messages: openaiMessages,
          temperature: 0.7,
          max_tokens: 1500, // Reduced from 2000
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

    // Save assistant message (don't wait, fire and forget)
    supabase.from('messages').insert({
      conversation_id: conversationId,
      role: 'assistant',
      content: assistantMessage,
    }).then(({ error }) => {
      if (error) console.error('Error saving assistant message:', error);
    });

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
