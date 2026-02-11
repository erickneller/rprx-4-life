ALTER TABLE assessment_responses
  DROP CONSTRAINT IF EXISTS assessment_responses_assessment_id_fkey,
  ADD CONSTRAINT assessment_responses_assessment_id_fkey
    FOREIGN KEY (assessment_id) REFERENCES user_assessments(id) ON DELETE CASCADE;