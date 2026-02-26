UPDATE profiles SET
  filing_status = CASE filing_status
    WHEN 'Single' THEN 'single'
    WHEN 'Married Filing Jointly' THEN 'married_jointly'
    WHEN 'Married Filing Separately' THEN 'married_separately'
    WHEN 'Head of Household' THEN 'head_of_household'
    ELSE filing_status
  END,
  employer_match_captured = CASE employer_match_captured
    WHEN 'Yes' THEN 'yes'
    WHEN 'No' THEN 'no'
    WHEN 'Not Applicable' THEN 'na'
    WHEN 'Not Sure' THEN 'not_sure'
    ELSE employer_match_captured
  END,
  stress_money_worry = CASE stress_money_worry
    WHEN 'Never' THEN 'never'
    WHEN 'Sometimes' THEN 'sometimes'
    WHEN 'Often' THEN 'often'
    WHEN 'Always' THEN 'always'
    ELSE stress_money_worry
  END,
  stress_emergency_confidence = CASE stress_emergency_confidence
    WHEN 'Not Confident' THEN 'not_confident'
    WHEN 'Somewhat Confident' THEN 'somewhat_confident'
    WHEN 'Very Confident' THEN 'very_confident'
    WHEN 'Completely Confident' THEN 'completely_confident'
    ELSE stress_emergency_confidence
  END,
  stress_control_feeling = CASE stress_control_feeling
    WHEN 'Not at All' THEN 'not_at_all'
    WHEN 'Somewhat' THEN 'somewhat'
    WHEN 'Mostly' THEN 'mostly'
    WHEN 'Completely' THEN 'completely'
    ELSE stress_control_feeling
  END
WHERE
  filing_status IN ('Single','Married Filing Jointly','Married Filing Separately','Head of Household')
  OR employer_match_captured IN ('Yes','No','Not Applicable','Not Sure')
  OR stress_money_worry IN ('Never','Sometimes','Often','Always')
  OR stress_emergency_confidence IN ('Not Confident','Somewhat Confident','Very Confident','Completely Confident')
  OR stress_control_feeling IN ('Not at All','Somewhat','Mostly','Completely');