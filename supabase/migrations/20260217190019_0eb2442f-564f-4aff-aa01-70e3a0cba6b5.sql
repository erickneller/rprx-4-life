
-- badge_definitions: admin CRUD
CREATE POLICY "Admins can insert badges" ON badge_definitions FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update badges" ON badge_definitions FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete badges" ON badge_definitions FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- assessment_questions: admin CRUD
CREATE POLICY "Admins can insert questions" ON assessment_questions FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update questions" ON assessment_questions FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete questions" ON assessment_questions FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- deep_dive_questions: admin CRUD
CREATE POLICY "Admins can insert deep dive questions" ON deep_dive_questions FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update deep dive questions" ON deep_dive_questions FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete deep dive questions" ON deep_dive_questions FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'));
