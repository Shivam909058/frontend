import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://mhhmucxengkrgkwpecee.supabase.co";
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1oaG11Y3hlbmdrcmdrd3BlY2VlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTAzOTA0NTEsImV4cCI6MjAyNTk2NjQ1MX0.cThFgnLOpB2Ml4IWX7IWMsZAyzRfVZQLUSr1TTnjnIQ";

// Create a client with global headers
export const supabase = createClient(supabaseUrl, supabaseKey, {
  global: {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  }
});
