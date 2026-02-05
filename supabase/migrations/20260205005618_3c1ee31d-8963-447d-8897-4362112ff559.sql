-- Fix search_path for the trigger function
CREATE OR REPLACE FUNCTION public.notify_bot_command_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.bot_command_notifications (command_name, action, changes, processed)
    VALUES (
      NEW.name,
      'created',
      jsonb_build_object(
        'description', NEW.description,
        'category', NEW.category,
        'usage', NEW.usage
      ),
      false
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.bot_command_notifications (command_name, action, changes, processed)
    VALUES (
      NEW.name,
      'updated',
      jsonb_build_object(
        'description', NEW.description,
        'category', NEW.category,
        'is_enabled', NEW.is_enabled
      ),
      false
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.bot_command_notifications (command_name, action, changes, processed)
    VALUES (
      OLD.name,
      'deleted',
      jsonb_build_object('deleted_at', now()),
      false
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;