import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

interface Profile {
  username: string;
  account: string;
  followers: number;
  posts_count: number;
  is_business_account: boolean;
  is_professional_account: boolean;
  is_verified: boolean;
  avg_engagement: number;
  external_url: string;
  biography: string;
  category_name: string;
  following: number;
  profile_url: string;
  full_name: string;
}

interface TaggedUser {
  username: string;
}

interface ReelData {
  tagged_users?: TaggedUser[];
  coauthor_producers?: string[];
  user_posted: string;
}

interface CategorizedProfiles {
  poster?: ProfileData;
  coauthors?: ProfileData[];
  tagged?: ProfileData[];
}

interface ProfileData {
  username: string;
  followers: number;
  posts_count: number;
  is_business_account: boolean;
  is_professional_account: boolean;
  is_verified: boolean;
  avg_engagement: number;
  external_url: string;
  biography: string;
  category_name: string;
  following: number;
  profile_url: string;
  full_name: string;
  scraped_timestamp: string;
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

    const profilesData = await req.json() as Profile[];
    console.log("Received profiles data:", JSON.stringify(profilesData, null, 2));
    
    // Get existing scraped content
    const { data: sourceData, error: fetchError } = await supabase
      .from("sources")
      .select("scraped_content")
      .eq("id", sourceId)
      .single();

    if (fetchError) throw fetchError;
    console.log("Retrieved source data:", sourceData);

    // Parse existing scraped content
    const existingContent = JSON.parse(sourceData.scraped_content.replace("scraped_data: ", ""));
    console.log("Parsed existing content:", existingContent);
    
    // Get the reel data
    const reelData = existingContent["0"] as ReelData;
    console.log("Reel data:", reelData);
    
    // Create sets for different types of users
    const taggedUsernames = new Set(reelData.tagged_users?.map((user: TaggedUser) => user.username) || []);
    const coauthorUsernames = new Set(reelData.coauthor_producers || []);
    const posterUsername = reelData.user_posted;

    console.log("Tagged usernames:", Array.from(taggedUsernames));
    console.log("Coauthor usernames:", Array.from(coauthorUsernames));
    console.log("Poster username:", posterUsername);

    // Categorize profiles based on their role
    const categorizedProfiles = profilesData.reduce((acc: CategorizedProfiles, profile: Profile) => {
      const username = profile.account;
      console.log("Processing profile for username:", username);
      
      const profileData: ProfileData = {
        username: profile.account,
        followers: profile.followers,
        posts_count: profile.posts_count,
        is_business_account: profile.is_business_account,
        is_professional_account: profile.is_professional_account,
        is_verified: profile.is_verified,
        avg_engagement: profile.avg_engagement,
        external_url: profile.external_url,
        biography: profile.biography,
        category_name: profile.category_name,
        following: profile.following,
        profile_url: profile.profile_url,
        full_name: profile.full_name,
        scraped_timestamp: new Date().toISOString(),
      };

      if (username === posterUsername) {
        console.log("Found poster profile:", username);
        acc.poster = profileData;
      } else if (coauthorUsernames.has(username)) {
        console.log("Found coauthor profile:", username);
        if (!acc.coauthors) acc.coauthors = [];
        acc.coauthors.push(profileData);
      } else if (taggedUsernames.has(username)) {
        console.log("Found tagged profile:", username);
        if (!acc.tagged) acc.tagged = [];
        acc.tagged.push(profileData);
      } else {
        console.log("Profile not categorized:", username);
      }

      return acc;
    }, {});

    console.log("Categorized profiles:", categorizedProfiles);

    // Restructure the content
    const { "0": reelContent, ...restContent } = existingContent;
    
    // Create new reel content with replaced profile data
    const updatedReelContent = {
      ...reelContent,
      user_posted: categorizedProfiles.poster ? {
        username: categorizedProfiles.poster.username,
        followers: categorizedProfiles.poster.followers,
        posts_count: categorizedProfiles.poster.posts_count,
        is_business_account: categorizedProfiles.poster.is_business_account,
        is_professional_account: categorizedProfiles.poster.is_professional_account,
        is_verified: categorizedProfiles.poster.is_verified,
        avg_engagement: categorizedProfiles.poster.avg_engagement,
        external_url: categorizedProfiles.poster.external_url,
        biography: categorizedProfiles.poster.biography,
        category_name: categorizedProfiles.poster.category_name,
        following: categorizedProfiles.poster.following,
        profile_url: categorizedProfiles.poster.profile_url,
        full_name: categorizedProfiles.poster.full_name,
      } : reelContent.user_posted,
      coauthor_producers: categorizedProfiles.coauthors ? 
        categorizedProfiles.coauthors.map(profile => ({
          username: profile.username,
          followers: profile.followers,
          posts_count: profile.posts_count,
          is_business_account: profile.is_business_account,
          is_professional_account: profile.is_professional_account,
          is_verified: profile.is_verified,
          avg_engagement: profile.avg_engagement,
          external_url: profile.external_url,
          biography: profile.biography,
          category_name: profile.category_name,
          following: profile.following,
          profile_url: profile.profile_url,
          full_name: profile.full_name,
        })) : reelContent.coauthor_producers,
      tagged_users: categorizedProfiles.tagged ? 
        categorizedProfiles.tagged.map(profile => ({
          username: profile.username,
          followers: profile.followers,
          posts_count: profile.posts_count,
          is_business_account: profile.is_business_account,
          is_professional_account: profile.is_professional_account,
          is_verified: profile.is_verified,
          avg_engagement: profile.avg_engagement,
          external_url: profile.external_url,
          biography: profile.biography,
          category_name: profile.category_name,
          following: profile.following,
          profile_url: profile.profile_url,
          full_name: profile.full_name,
        })) : reelContent.tagged_users,
    };

    const updatedContent = {
      "0": updatedReelContent,
      ...restContent
    };

    console.log("Updated content to save:", updatedContent);

    // Update the database
    const { error: updateError } = await supabase
      .from("sources")
      .update({
        scraped_content: `scraped_data: ${JSON.stringify(updatedContent)}`,
        status: "completed",
      })
      .eq("id", sourceId);

    if (updateError) {
      console.error("Error updating database:", updateError);
      throw updateError;
    }

    console.log("Successfully updated database");

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