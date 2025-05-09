-- Create function to call edge function
CREATE OR REPLACE FUNCTION public.handle_source_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if:
  -- 1. It's a new row with status 'completed' OR
  -- 2. It's an update from 'pending' to 'completed'
  IF (
    (TG_OP = 'INSERT' AND NEW.status = 'completed') OR 
    (TG_OP = 'UPDATE' AND OLD.status = 'pending' AND NEW.status = 'completed')
  ) THEN
    -- Make HTTP request to edge function
    PERFORM
      net.http_post(
        url := 'https://yiekfmwsvsqtduvcihni.supabase.co/functions/v1/createSourceIndex',
        headers := jsonb_build_object(
          'Content-Type', 'application/json'
        ),
        body := jsonb_build_object('bucket_id', NEW.bucket_id)
      );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS on_source_completion ON public.sources;
CREATE TRIGGER on_source_completion
  AFTER INSERT OR UPDATE OF status
  ON public.sources
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_source_completion();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_source_completion() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_source_completion() TO service_role; 