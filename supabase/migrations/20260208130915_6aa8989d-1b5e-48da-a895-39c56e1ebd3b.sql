-- Remove the cached surplus column since we now compute it from profile data
ALTER TABLE debt_journeys DROP COLUMN IF EXISTS monthly_surplus;