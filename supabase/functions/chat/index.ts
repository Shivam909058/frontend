import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../cors.ts";

const RAG_API_URL = "https://rag.zonate.net/api/chat";
const API_ACCESS_TOKEN = Deno.env.get("RAG_API_KEY");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { message, user_id, bucket_id, session_id } = await req.json();
    
    if (!message || !user_id) {
      throw new Error("message and user_id are required");
    }

    console.log("Request payload:", { message, user_id, bucket_id, session_id });

    const requestBody: {
      message: string;
      user_id: string;
      bucket_id?: string;
      session_id?: string;
    } = {
      message,
      user_id,
    };

    // Only add optional fields if they are provided
    if (bucket_id) requestBody.bucket_id = bucket_id;
    if (session_id) requestBody.session_id = session_id;

    const response = await fetch(RAG_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Return the response with CORS headers
    return new Response(response.body, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": response.headers.get("Content-Type") || "application/json",
      },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});