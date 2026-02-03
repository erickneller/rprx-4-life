-- Enhanced trigger function with ownership verification
CREATE OR REPLACE FUNCTION public.update_conversation_updated_at()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verify the current user owns the conversation
  SELECT user_id INTO v_user_id
  FROM public.conversations
  WHERE id = NEW.conversation_id;
  
  -- Only update if user owns the conversation
  IF v_user_id = auth.uid() THEN
    UPDATE public.conversations 
    SET updated_at = now() 
    WHERE id = NEW.conversation_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION public.update_conversation_updated_at() IS 
'SECURITY DEFINER function - updates conversation timestamp when messages are added. Includes ownership verification to ensure only conversation owners can trigger updates.';