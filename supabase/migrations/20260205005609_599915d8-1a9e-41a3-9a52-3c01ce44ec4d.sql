-- Create trigger function to auto-create notifications on bot_commands changes
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on bot_commands table
DROP TRIGGER IF EXISTS bot_commands_notify_trigger ON public.bot_commands;
CREATE TRIGGER bot_commands_notify_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.bot_commands
FOR EACH ROW
EXECUTE FUNCTION public.notify_bot_command_change();

-- Insert the apistats command
INSERT INTO public.bot_commands (name, description, category, usage, is_enabled, cooldown_seconds)
VALUES (
  'apistats',
  '📊 Zeigt API Request Statistiken (Requests, Erfolgsrate, Fehler)',
  'utility',
  '/apistats',
  true,
  5
)
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  usage = EXCLUDED.usage,
  updated_at = now();