// src/utils/supabaseApi.ts
import { createClient } from "@supabase/supabase-js";

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://mhhmucxengkrgkwpecee.supabase.co";
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1oaG11Y3hlbmdrcmdrd3BlY2VlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTAzOTA0NTEsImV4cCI6MjAyNTk2NjQ1MX0.cThFgnLOpB2Ml4IWX7IWMsZAyzRfVZQLUSr1TTnjnIQ";

// Create a client with proper options
export const enhancedSupabase = createClient(supabaseUrl, supabaseKey, {
  global: {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  }
});

// Helper function to safely get username
export const getUsernameById = async (userId: string): Promise<string> => {
  try {
    const { data, error } = await enhancedSupabase
      .from("users")
      .select("username, name")
      .eq("id", userId)
      .single();
    
    if (error) {
      console.error("Error fetching username:", error);
      throw error;
    }
    
    if (!data || !data.username) {
      // Generate a fallback username based on name or a timestamp
      const fallbackUsername = data?.name 
        ? data.name.toLowerCase().replace(/\s+/g, "-") 
        : `user-${Date.now()}`;
      
      return fallbackUsername;
    }
    
    return data.username;
  } catch (error) {
    console.error("Error in getUsernameById:", error);
    return `user-${Date.now()}`;
  }
};