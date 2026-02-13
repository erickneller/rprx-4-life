
-- Add motivation_images array to profiles
ALTER TABLE public.profiles
ADD COLUMN motivation_images text[] DEFAULT '{}';

-- Create storage bucket for motivation images
INSERT INTO storage.buckets (id, name, public)
VALUES ('motivation-images', 'motivation-images', true);

-- Storage policies
CREATE POLICY "Users can upload their own motivation images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'motivation-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own motivation images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'motivation-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own motivation images"
ON storage.objects FOR DELETE
USING (bucket_id = 'motivation-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Motivation images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'motivation-images');
