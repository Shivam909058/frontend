import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  "https://mhhmucxengkrgkwpecee.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1oaG11Y3hlbmdrcmdrd3BlY2VlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTAzOTA0NTEsImV4cCI6MjAyNTk2NjQ1MX0.cThFgnLOpB2Ml4IWX7IWMsZAyzRfVZQLUSr1TTnjnIQ"
);
