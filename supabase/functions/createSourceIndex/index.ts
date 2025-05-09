import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../cors.ts";

const RAG_API_URL = "https://rag.zonate.net/api/upload";
const RAG_API_KEY = Deno.env.get("RAG_API_KEY") ?? "";
const EDGE_FUNCTION_SECRET = Deno.env.get("EDGE_FUNCTION_SECRET") ?? "";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Check for secret key in Authorization header
    const authHeader = req.headers.get("Authorization");
    const secret = authHeader?.replace("Bearer ", "");

    if (!secret || secret !== EDGE_FUNCTION_SECRET) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Unauthorized",
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { bucket_id } = await req.json();

    if (!bucket_id) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Bucket ID is required",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Call the RAG API to create index
    const response = await fetch(`${RAG_API_URL}/${bucket_id}`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RAG_API_KEY}`,
        "Content-Type": "application/json",
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`RAG API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();

    return new Response(
      JSON.stringify({
        success: true,
        message: "Index created successfully",
        data: result,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
}); 