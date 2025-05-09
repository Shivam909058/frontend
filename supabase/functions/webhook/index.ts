import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

// Helper function to extract unique usernames from reel data
function extractUsernames(reelData: any): string[] {
  const usernames = new Set<string>();
  
  // Add user_posted
  if (reelData.user_posted) {
    usernames.add(reelData.user_posted);
  }
  
  // Add coauthor_producers
  if (Array.isArray(reelData.coauthor_producers)) {
    reelData.coauthor_producers.forEach((username: string) => usernames.add(username));
  }
  
  // Add tagged_users
  if (Array.isArray(reelData.tagged_users)) {
    reelData.tagged_users.forEach((user: any) => {
      if (user.username) usernames.add(user.username);
    });
  }
  
  return Array.from(usernames);
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Invalid method", { status: 405 });
  }

  try {
    const url = new URL(req.url);
    const sourceId = url.pathname.split("/").pop();

    if (!sourceId) {
      throw new Error("Source ID not found in webhook URL");
    }

    const data = await req.json();
    console.log("Received webhook data:", data);
    
    const currentTimestamp = new Date().toISOString();

    // Check if it's profile data by looking for the 'account' field
    if (Array.isArray(data) && data[0] && !data[0].account) {
      console.log("Processing Instagram Reel data");
      
      // Process reel data without top_comments
      const processedReelData = data.map(({ top_comments: _, ...rest }) => ({
        ...rest,
        scraped_timestamp: currentTimestamp
      }));

      // Extract usernames to scrape profiles
      const usernamesToScrape = extractUsernames(processedReelData[0]);
      console.log("Usernames to scrape:", usernamesToScrape);

      // Save reel data without setting status to completed
      const { error } = await supabase
        .from("sources")
        .update({
          scraped_content: `scraped_data: ${JSON.stringify(processedReelData)}`,
        })
        .eq("id", sourceId);

      if (error) throw error;

      // Trigger profile scraping if there are usernames to scrape
      if (usernamesToScrape.length > 0) {
        const profileUrls = usernamesToScrape.map(username => ({
          url: `https://www.instagram.com/${username}/`
        }));

        // Call scrapeReelProfiles edge function
        const scrapeResponse = await fetch(
          `${Deno.env.get("SUPABASE_URL")}/functions/v1/scrapeReelProfiles`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`
            },
            body: JSON.stringify({
              urls: profileUrls,
              source_id: sourceId
            })
          }
        );

        if (!scrapeResponse.ok) {
          console.error("Failed to trigger profile scraping");
        }
      }
    } else {
      // Handle regular profile data as before
      console.log("Processing Instagram Profile data");
      const scrapedContent = {
        input: data.input,
        account: data.account,
        followers: data.followers,
        posts_count: data.posts_count,
        is_business_account: data.is_business_account,
        is_professional_account: data.is_professional_account,
        is_verified: data.is_verified,
        avg_engagement: data.avg_engagement,
        external_url: data.external_url,
        biography: data.biography,
        category_name: data.category_name,
        following: data.following,
        profile_url: data.profile_url,
        full_name: data.full_name,
        scraped_timestamp: currentTimestamp,
      };

      const { error } = await supabase
        .from("sources")
        .update({
          scraped_content: `scraped_data: ${JSON.stringify(scrapedContent)}`,
          status: "completed",
        })
        .eq("id", sourceId);

      if (error) throw error;
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error handling webhook:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
