import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

async function getInstagramCaptionBrightData(url: string, sourceId: string) {
  const brightDataApiUrl = "https://api.brightdata.com/datasets/v3/trigger";
  const isReelUrl = url.includes("/reel/");
  const brightDataDatasetId = isReelUrl 
    ? "gd_lyclm20il4r5helnj"  // Dataset ID for reels
    : "gd_l1vikfch901nx3by4"; // Dataset ID for profiles
    
  const brightDataApiKey =
    "f165e7955e480ffbf2dc42b008be22e86f0090e6e9cda60262140fca2334403e";
  const webhookAuthToken =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpZWtmbXdzdnNxdGR1dmNpaG5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTI1NTMyMDEsImV4cCI6MjAyODEyOTIwMX0.c52EK52kerYbPhT9wZ3Oy0OFSM5RQdv-uv_7sHg798E"; // Add your webhook auth token here

  // Define your webhook URL with the source_id
  const webhookUrl = `https://yiekfmwsvsqtduvcihni.supabase.co/functions/v1/webhook/${sourceId}`;

  // Prepare the payload
  const payload = [
    {
      url, // Instagram URL
    },
  ];

  try {
    // Make the API request with webhook configuration and auth_header
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
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("BrightData API Error:", errorText);
      throw new Error(
        `BrightData API failed with status ${response.status}: ${errorText}`
      );
    }

    const result = await response.json();
    console.log("BrightData API Result:", result);
    return result;
  } catch (error) {
    console.error("BrightData API Error:", error);
    throw error;
  }
}
// Function to get YouTube video metadata using oEmbed API
async function getYoutubeMetadata(url: string) {
  const oEmbedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(
    url
  )}&format=json`;

  const response = await fetch(oEmbedUrl);
  if (!response.ok) {
    throw new Error("Failed to fetch YouTube video metadata");
  }

  const data = await response.json();
  return {
    title: data.title || null,
    author: data.author_name || null,
    url: url,
    timestamp: new Date().toISOString()
  };
}

// Add new function to handle generic URL scraping
async function getGenericUrlContent(url: string) {
  try {
    const response = await fetch(`https://r.jina.ai/${encodeURIComponent(url)}`, {
      method: "GET",
      headers: {
        Authorization:
          "Bearer jina_26ae27b8c1754bff8f764bd837b6cbcefn-LJGLq_4XQjYrAReP2gEISYzqE",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch URL content");
    }

    const text = await response.text(); // First get the raw text
    try {
      // Try to parse as JSON first
      const jsonData = JSON.parse(text);
      return jsonData;
    } catch (parseError) {
      // If it's not JSON, return it as a structured object
      return {
        content: text,
        url: url,
        timestamp: new Date().toISOString()
      };
    }
  } catch (error) {
    console.error("Error fetching generic URL content:", error);
    throw error;
  }
}

// Add new function to handle Google Maps URLs
async function getGoogleMapsDetails(url: string) {
  const GOOGLE_MAPS_API_KEY = Deno.env.get("GOOGLE_MAP_API_KEY") ?? "";
  
  // First resolve the short URL to get the full URL
  const response = await fetch(url, { redirect: 'follow' });
  const fullUrl = response.url;
  
  console.log("Resolved URL:", fullUrl);
  
  let placeId;
  let businessName;
  let coordinates;
  let viewport;

  // Extract coordinates and viewport if available in the URL
  const coordsMatch = fullUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+),(\d+\.?\d*?)z/);
  if (coordsMatch) {
    coordinates = {
      lat: parseFloat(coordsMatch[1]),
      lng: parseFloat(coordsMatch[2])
    };
    const zoomLevel = parseFloat(coordsMatch[3]);
    // Calculate viewport based on zoom level
    const latOffset = 0.01 * Math.pow(2, (15 - zoomLevel));
    const lngOffset = 0.01 * Math.pow(2, (15 - zoomLevel));
    viewport = {
      northeast: { lat: coordinates.lat + latOffset, lng: coordinates.lng + lngOffset },
      southwest: { lat: coordinates.lat - latOffset, lng: coordinates.lng - lngOffset }
    };
    console.log("Found coordinates and viewport:", { coordinates, viewport });
  }

  // Extract business name and address from q parameter
  const qMatch = fullUrl.match(/[?&]q=([^&]+)/);
  if (qMatch) {
    const fullLocation = decodeURIComponent(qMatch[1].replace(/\+/g, ' '));
    const [name, ...addressParts] = fullLocation.split(',');
    businessName = name;
    const address = addressParts.join(',').trim();
    
    console.log("Found business name and address:", { businessName, address });

    // Use Places API Text Search with location bias
    const searchUrl = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
    searchUrl.searchParams.append('query', `${businessName}, ${address}`);
    searchUrl.searchParams.append('key', GOOGLE_MAPS_API_KEY);
    
    if (coordinates) {
      searchUrl.searchParams.append('location', `${coordinates.lat},${coordinates.lng}`);
      searchUrl.searchParams.append('radius', '500'); // Reduced radius for more precise results
    }
    
    console.log("Search URL:", searchUrl.toString());
    const searchResponse = await fetch(searchUrl.toString());
    const searchData = await searchResponse.json();
    
    console.log("Search Response:", searchData);
    
    if (searchData.results?.length > 0) {
      // Find the most relevant result based on location if coordinates are available
      if (coordinates) {
        const closestPlace = searchData.results.reduce((closest, current) => {
          const currentDist = calculateDistance(
            coordinates.lat,
            coordinates.lng,
            current.geometry.location.lat,
            current.geometry.location.lng
          );
          const closestDist = closest ? calculateDistance(
            coordinates.lat,
            coordinates.lng,
            closest.geometry.location.lat,
            closest.geometry.location.lng
          ) : Infinity;
          
          return currentDist < closestDist ? current : closest;
        }, null);
        
        if (closestPlace) {
          placeId = closestPlace.place_id;
          console.log("Found closest place:", closestPlace.name);
        }
      } else {
        placeId = searchData.results[0].place_id;
      }
    }
  }

  // Fallback: Try to extract from place URL format
  if (!placeId) {
    const placeMatch = fullUrl.match(/place\/([^/@]+)/);
    if (placeMatch) {
      businessName = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
      console.log("Found business name from place URL:", businessName);
      
      const searchUrl = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
      searchUrl.searchParams.append('query', businessName);
      searchUrl.searchParams.append('key', GOOGLE_MAPS_API_KEY);
      
      if (coordinates) {
        searchUrl.searchParams.append('location', `${coordinates.lat},${coordinates.lng}`);
        searchUrl.searchParams.append('radius', '500');
      }
      
      const searchResponse = await fetch(searchUrl.toString());
      const searchData = await searchResponse.json();
      
      if (searchData.results?.[0]?.place_id) {
        placeId = searchData.results[0].place_id;
      }
    }
  }

  if (!placeId) {
    console.error("Failed to extract place ID from URL:", fullUrl);
    throw new Error(`Could not extract place information from Google Maps URL: ${url}`);
  }

  // Get detailed place information using place ID
  const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,geometry,rating,formatted_phone_number,website,opening_hours,photos,reviews,price_level,user_ratings_total&key=${GOOGLE_MAPS_API_KEY}`;
  
  const detailsResponse = await fetch(detailsUrl);
  const detailsData = await detailsResponse.json();

  if (!detailsData.result) {
    console.error("Failed to get place details:", detailsData);
    throw new Error(`Could not fetch place details. Status: ${detailsData.status}, Message: ${detailsData.error_message || 'Unknown error'}`);
  }

  return {
    platform: "Google Maps",
    details: detailsData.result,
    coordinates: coordinates || {
      lat: detailsData.result.geometry.location.lat,
      lng: detailsData.result.geometry.location.lng
    },
    timestamp: new Date().toISOString()
  };
}

// Helper function to calculate distance between two points
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in km
}

// Add helper function to resolve Instagram share URLs
async function resolveInstagramUrl(url: string) {
  let finalUrl = url;
  
  // First handle share URLs
  if (url.includes("/share/")) {
    const response = await fetch(url, { redirect: 'follow' });
    finalUrl = response.url;
  }
  
  // Replace /p/ with /reel/ in the URL
  if (finalUrl.includes("/p/")) {
    finalUrl = finalUrl.replace("/p/", "/reel/");
    console.log("Converted /p/ to /reel/ URL:", finalUrl);
  }
  
  return finalUrl;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { url, source_id } = await req.json();

    if (!url || !source_id) {
      return new Response(
        JSON.stringify({ error: "URL and source_id are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Enhanced Instagram URL detection
    if (url.includes("instagram.com")) {
      // Resolve share URLs to their final destination
      const resolvedUrl = await resolveInstagramUrl(url);
      console.log("Resolved Instagram URL:", resolvedUrl);

      const isReel = resolvedUrl.includes("/reel/") || resolvedUrl.includes("/p/");
      const brightDataResult = await getInstagramCaptionBrightData(
        resolvedUrl,
        source_id
      );
      return new Response(
        JSON.stringify({ 
          platform: "Instagram", 
          type: isReel ? "reel" : "profile",
          data: brightDataResult 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } else if (url.includes("maps.app.goo.gl") || url.includes("google.com/maps")) {
      const mapsData = await getGoogleMapsDetails(url);
      
      // Update database
      const { error } = await supabase
        .from("sources")
        .update({
          scraped_content: `scraped_data: ${JSON.stringify(mapsData)}`,
          status: "completed",
        })
        .eq("id", source_id);

      if (error) throw error;

      return new Response(JSON.stringify(mapsData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else if (url.includes("youtube.com") || url.includes("youtu.be")) {
      // YouTube metadata fetching and direct database update
      const { title, author, timestamp} = await getYoutubeMetadata(url);
      const youtubeData = { platform: "YouTube", title, author, timestamp, url };
      
      // Update database
      const { error } = await supabase
        .from("sources")
        .update({
          scraped_content: `scraped_data: ${JSON.stringify(youtubeData)}`,
          status: "completed",
        })
        .eq("id", source_id);

      if (error) throw error;

      return new Response(JSON.stringify(youtubeData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else {
      // Generic URL scraping and direct database update
      const content = await getGenericUrlContent(url);
      const genericData = { platform: "website/webapp", content };

      // Update database
      const { error } = await supabase
        .from("sources")
        .update({
          scraped_content: `scraped_data: ${JSON.stringify(genericData)}`,
          status: "completed",
        })
        .eq("id", source_id);

      if (error) throw error;

      return new Response(JSON.stringify(genericData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
