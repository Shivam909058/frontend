import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { urls, source_id } = await req.json();

    if (!urls || !source_id) {
      throw new Error("URLs and source_id are required");
    }

    const brightDataApiUrl = "https://api.brightdata.com/datasets/v3/trigger";
    const brightDataDatasetId = "gd_l1vikfch901nx3by4"; // Dataset ID for profiles
    const brightDataApiKey = "f165e7955e480ffbf2dc42b008be22e86f0090e6e9cda60262140fca2334403e";
    const webhookAuthToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpZWtmbXdzdnNxdGR1dmNpaG5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTI1NTMyMDEsImV4cCI6MjAyODEyOTIwMX0.c52EK52kerYbPhT9wZ3Oy0OFSM5RQdv-uv_7sHg798E";

    // Define webhook URL for profile data
    const webhookUrl = `https://yiekfmwsvsqtduvcihni.supabase.co/functions/v1/webhookReelProfile/${source_id}`;

    const response = await fetch(
      `${brightDataApiUrl}?dataset_id=${brightDataDatasetId}&endpoint=${encodeURIComponent(
        webhookUrl
      )}&auth_header=${encodeURIComponent(
        `Bearer ${webhookAuthToken}`
      )}&format=json&uncompressed_webhook=true&include_errors=true`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${brightDataApiKey}`,
        },
        body: JSON.stringify(urls),
      }
    );

    if (!response.ok) {
      throw new Error(`BrightData API failed: ${await response.text()}`);
    }

    const result = await response.json();
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}); 