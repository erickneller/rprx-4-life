-- Add new profile fields for expanded user profile
ALTER TABLE profiles ADD COLUMN profile_type text;
ALTER TABLE profiles ADD COLUMN num_children integer;
ALTER TABLE profiles ADD COLUMN children_ages integer[];
ALTER TABLE profiles ADD COLUMN financial_goals text[];