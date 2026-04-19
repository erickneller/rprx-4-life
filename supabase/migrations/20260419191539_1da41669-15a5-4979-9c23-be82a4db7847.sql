-- Clean prefixes and inline section labels from strategy detail fields in both tables.

-- strategy_catalog_v2: strip the "Strategy Topic:" lead-in and split out trailing
-- "Potential Savings/Benefits:" / "Example:" sections that were dumped into strategy_details.
UPDATE public.strategy_catalog_v2
SET strategy_details = TRIM(BOTH E' \n\r\t' FROM
  regexp_replace(
    regexp_replace(
      regexp_replace(strategy_details, '(?is)\s*Potential Savings/Benefits:.*$', '', 'g'),
      '(?is)\s*Example:.*$', '', 'g'
    ),
    '(?is)^\s*Strategy (Topic|Details):\s*', '', 'g'
  )
)
WHERE strategy_details ~* '(strategy topic:|strategy details:|potential savings/benefits:|^\s*example:)';

UPDATE public.strategy_catalog_v2
SET example = TRIM(BOTH E' \n\r\t' FROM regexp_replace(example, '(?is)^\s*Example:\s*', '', 'g'))
WHERE example IS NOT NULL AND example ~* '^\s*example:';

UPDATE public.strategy_catalog_v2
SET potential_savings_benefits = TRIM(BOTH E' \n\r\t' FROM regexp_replace(potential_savings_benefits, '(?is)^\s*Potential Savings/Benefits:\s*', '', 'g'))
WHERE potential_savings_benefits IS NOT NULL AND potential_savings_benefits ~* '^\s*potential savings';

UPDATE public.strategy_catalog_v2
SET title = TRIM(BOTH E' \n\r\t' FROM regexp_replace(title, '(?is)^\s*(Strategy Topic|Strategy Details):\s*', '', 'g'))
WHERE title ~* '^\s*(strategy topic|strategy details):';

-- Ensure imported rows are active
UPDATE public.strategy_catalog_v2 SET is_active = true WHERE is_active = false;

-- strategy_definitions (legacy): same cleanup on description
UPDATE public.strategy_definitions
SET description = TRIM(BOTH E' \n\r\t' FROM
  regexp_replace(
    regexp_replace(
      regexp_replace(description, '(?is)\s*Potential Savings/Benefits:.*$', '', 'g'),
      '(?is)\s*Example:.*$', '', 'g'
    ),
    '(?is)^\s*Strategy (Topic|Details):\s*', '', 'g'
  )
)
WHERE description ~* '(strategy topic:|strategy details:|potential savings/benefits:|^\s*example:)';

UPDATE public.strategy_definitions
SET name = TRIM(BOTH E' \n\r\t' FROM regexp_replace(name, '(?is)^\s*(Strategy Topic|Strategy Details):\s*', '', 'g'))
WHERE name ~* '^\s*(strategy topic|strategy details):';