// src/utils/supabaseApi.ts
import { supabase } from "../lib/supabase";

// Enhanced Supabase client with proper headers
export const enhancedSupabase = {
  from: (table: string) => {
    const query = supabase.from(table);
    
    // Add necessary headers for Postgres REST API
    // This fixes the 406 Not Acceptable error
    query.headers({
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'apikey': supabase.supabaseKey,
      'Prefer': 'return=representation'
    });
    
    return query;
  }
};