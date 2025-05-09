import { createClient } from "https://esm.sh/@supabase/supabase-js@2.0.0";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../cors.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY");
const supabase = createClient(supabaseUrl!, supabaseKey!);

const handler = async (request: Request): Promise<Response> => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    console.log("Fetching verified users from the waitlist...");

    // Fetch all verified users from the waitlist
    const { data: waitlistData, error: waitlistError } = await supabase
      .from("waitlist")
      .select("email")
      .eq("is_verified", true);

    if (waitlistError) {
      console.error("Error fetching waitlist data:", waitlistError);
      throw waitlistError;
    }

    if (waitlistData.length === 0) {
      console.log("No verified users found.");
      return new Response("No verified users found.", { status: 200 });
    }

    for (const user of waitlistData) {
      const { email } = user;
      console.log(`Processing user: ${email}`);

      // Fetch the user details from the users table
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id_front, id_back")
        .eq("email", email)
        .single();

      if (userError) {
        console.error(`Error fetching user data for email ${email}:`, userError);
        throw userError;
      }

      const { id_front, id_back } = userData;

      // Delete the front ID document from storage
      if (id_front) {
        console.log(`Deleting front ID document: ${id_front}`);
        const { error: deleteFrontError } = await supabase.storage
          .from("id_documents")
          .remove([id_front]);

        if (deleteFrontError) {
          console.error(`Error deleting front ID document ${id_front}:`, deleteFrontError);
          throw deleteFrontError;
        } else {
          console.log(`Front ID document ${id_front} deleted successfully.`);
        }
      }

      // Delete the back ID document from storage
      if (id_back) {
        console.log(`Deleting back ID document: ${id_back}`);
        const { error: deleteBackError } = await supabase.storage
          .from("id_documents")
          .remove([id_back]);

        if (deleteBackError) {
          console.error(`Error deleting back ID document ${id_back}:`, deleteBackError);
          throw deleteBackError;
        } else {
          console.log(`Back ID document ${id_back} deleted successfully.`);
        }
      }
    }

    console.log("All verified user IDs deleted successfully.");
    return new Response("Verified user IDs deleted successfully.", { status: 200 });
  } catch (error) {
    console.error("Error:", error);
    return new Response(`Error: ${error.message}`, { status: 500 });
  }
};

serve(handler);
