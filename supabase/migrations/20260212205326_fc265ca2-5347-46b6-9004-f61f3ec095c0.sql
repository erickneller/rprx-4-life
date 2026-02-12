
ALTER TABLE saved_plans ADD COLUMN is_focus boolean NOT NULL DEFAULT false;

-- Trigger: when a plan is set as focus, clear any other focused plan for that user
CREATE OR REPLACE FUNCTION public.clear_other_focus_plans()
RETURNS trigger AS $$
BEGIN
  IF NEW.is_focus = true THEN
    UPDATE saved_plans
    SET is_focus = false
    WHERE user_id = NEW.user_id AND id != NEW.id AND is_focus = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_clear_focus
BEFORE INSERT OR UPDATE ON saved_plans
FOR EACH ROW EXECUTE FUNCTION public.clear_other_focus_plans();
