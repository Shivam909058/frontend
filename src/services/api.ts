// wandergals_fe/src/services/api.ts

import axios from 'axios';
import { supabase } from '../lib/supabase';

const API_URL = import.meta.env.VITE_SHAKTY_API_URL || "https://deployment-testing1.onrender.com";

// Helper function to get access token
export const getAccessToken = (): string | null => {
  try {
    const tokenString = localStorage.getItem(`${import.meta.env.VITE_TOKEN_ID}`);
    if (!tokenString) {
      console.log("No token in localStorage");
      return null;
    }
    
    const token = JSON.parse(tokenString);
    
    // Check if token exists and has an access_token property
    if (!token || !token.access_token) {
      console.warn("Invalid token format in localStorage");
      return null;
    }
    
    // Check token expiration if we have an expires_at field
    if (token.expires_at) {
      const now = Math.floor(Date.now() / 1000); // Current time in seconds
      const expiresAt = token.expires_at;
      
      // If token is expired or about to expire in the next minute
      if (expiresAt - now < 60) {
        console.log("Token expired or about to expire, refreshing...");
        return null; // This will trigger a token refresh in APIs using checkAndRefreshToken
      }
    }
    
    return token.access_token;
  } catch (error) {
    console.error("Error getting access token:", error);
    return null;
  }
};

// Update the refreshAuthToken function to use the new endpoint
export const refreshAuthToken = async (): Promise<string | null> => {
  try {
    // Get the current token from localStorage
    const tokenString = localStorage.getItem(`${import.meta.env.VITE_TOKEN_ID}`);
    if (!tokenString) {
      console.log("No token found in localStorage");
      return null;
    }
    
    let parsedToken;
    try {
      parsedToken = JSON.parse(tokenString);
    } catch (e) {
      console.error("Invalid token format in localStorage");
      return null;
    }
    
    // Check if we have a refresh token
    const refreshToken = parsedToken?.refresh_token;
    if (!refreshToken) {
      console.error("No refresh token available in stored token");
      return null;
    }
    
    console.log("Attempting to refresh token with Supabase directly");
    
    // Try to refresh token with Supabase directly
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken
    });
    
    if (error) {
      console.error("Supabase token refresh failed:", error);
      throw new Error(`Failed to refresh token: ${error.message}`);
    }
    
    if (data && data.session) {
      // Update the token in localStorage
      const newToken = {
        ...parsedToken,
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token
      };
      
      localStorage.setItem(`${import.meta.env.VITE_TOKEN_ID}`, JSON.stringify(newToken));
      console.log("Token refreshed successfully");
      
      return data.session.access_token;
    }
    
    console.error("Token refresh response has no session data");
    return null;
  } catch (error) {
    console.error('Error refreshing token:', error);
    
    // Handle authentication errors
    if (
      typeof error === 'object' &&
      error !== null &&
      'response' in error &&
      (error as any).response &&
      (error as any).response.status === 401
    ) {
      console.log("Authentication error during token refresh, redirecting to login");
      localStorage.removeItem(`${import.meta.env.VITE_TOKEN_ID}`);
      window.location.href = '/login';
    }
    
    return null;
  }
};

// Create axios instance with authorization
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to add auth token
apiClient.interceptors.request.use(
  config => {
    const token = getAccessToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Add response interceptor to automatically handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If error is 401 and we haven't retried yet
    if (error instanceof Error && error.message === 'Request failed with status code 401' && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh the token
        const newToken = await refreshAuthToken();
        
        if (newToken) {
          console.log("Token refreshed, retrying request...");
          // Update the request with new token
          originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
          return axios(originalRequest);
        } else {
          console.error("Token refresh failed");
          // Redirect to login page
          window.location.href = "/login";
          return Promise.reject(new Error("Session expired. Please log in again."));
        }
      } catch (refreshError) {
        console.error("Token refresh error:", refreshError);
        // Redirect to login page
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }
    
    // Return other errors
    return Promise.reject(error);
  }
);

// Process a website URL
export const processUrl = async (url: string, bucketId: string, scraper = "JinaAI") => {
  console.log(`Processing URL: ${url} for bucket: ${bucketId} with scraper: ${scraper}`);
  
  try {
    const response = await apiClient.post('/api/sources/urls', {
    urls: [url],
    bucket_id: bucketId,
    chunk_size: 1500,
    chunk_overlap: 300,
    scraper
    });
    
    console.log('URL processing response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error processing URL:', error);
    if (axios.isAxiosError(error)) {
      console.error('API error response:', error.response?.data);
    }
    throw error;
  }
};

// Process a YouTube URL
export const processYouTube = async (url: string, bucketId: string) => {
  console.log(`Processing YouTube URL: ${url} for bucket: ${bucketId}`);
  
  try {
    const response = await apiClient.post('/api/sources/youtube', {
      urls: [url],
      bucket_id: bucketId,
      chunk_size: 1500,
      chunk_overlap: 300
    });
    
    console.log('YouTube processing response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error processing YouTube URL:', error);
    if (axios.isAxiosError(error)) {
      console.error('API error response:', error.response?.data);
    }
    throw error;
  }
};

/**
 * Process an Instagram URL to extract content
 */
export async function processInstagram(url: string, bucketId: string) {
  console.log(`Processing Instagram URL: ${url}`);
  
  // Input validation
  if (!url) throw new Error("URL is required");
  if (!bucketId) throw new Error("Bucket ID is required");
  
  try {
    // Format the Instagram URL properly
    const formattedUrl = formatInstagramUrl(url);
    console.log(`Formatted Instagram URL: ${formattedUrl}`);
    
    // Extract metadata for better content processing
    const metadata = extractInstagramMetadata(formattedUrl);
    console.log(`Instagram metadata:`, metadata);
    
    // Get access token
    const token = getAccessToken();
  if (!token) {
      throw new Error("Authentication required");
    }
    
    // Make the API request
    const response = await apiClient.post(`/api/sources/instagram`, {
      urls: [formattedUrl],
      bucket_id: bucketId,
      chunk_size: 1500,
      chunk_overlap: 300,
      // Include metadata to help with processing
      metadata: metadata
    });
    
    // Store Instagram metadata in localStorage for AI interaction
    if (response.data && response.data.success) {
      localStorage.setItem('has_ai_instagram_content', 'true');
      localStorage.setItem('ai_instagram_url', formattedUrl);
      
      if (metadata.postId) {
        localStorage.setItem('ai_instagram_postid', metadata.postId);
      }
      
      if (metadata.username) {
        // Store usernames for retrieval enhancement
        const storedUsernames = JSON.parse(localStorage.getItem('instagram_usernames') || '[]');
        if (!storedUsernames.includes(metadata.username)) {
          storedUsernames.push(metadata.username);
          localStorage.setItem('instagram_usernames', JSON.stringify(storedUsernames));
        }
      }
    }
    
    console.log(`Instagram processing response:`, response.data);
    return response.data;
  } catch (error) {
    console.error("Error processing Instagram URL:", error);
    
    // Handle token expiration
    if (
      typeof error === 'object' &&
      error !== null &&
      'response' in error &&
      (error as any).response &&
      (error as any).response.status === 401
    ) {
      console.log("Token expired, attempting to refresh...");
      
      // Try to refresh the token
      const refreshed = await refreshAuthToken();
      
      if (refreshed) {
        // Retry the request with the new token
        console.log("Token refreshed, retrying Instagram processing...");
        return processInstagram(url, bucketId);
      } else {
        console.error("Token refresh failed");
        throw new Error("Authentication failed after token refresh attempt");
      }
    }
    
    throw error;
  }
}

/**
 * Format Instagram URL to ensure it's in the correct format for the API
 */
function formatInstagramUrl(url: string): string {
  // First ensure URL has protocol
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  
  try {
    const urlObj = new URL(url);
    
    // Ensure it's an Instagram URL
    if (!urlObj.hostname.includes('instagram.com')) {
      throw new Error("Not a valid Instagram URL");
    }
    
    // Extract post ID and username from the path
    const pathParts = urlObj.pathname.split('/').filter(part => part);
    
    // Handle different Instagram URL formats
    // Format: /p/{postId}/ - posts
    // Format: /reel/{postId}/ - reels
    if (pathParts.length >= 2 && (pathParts[0] === 'p' || pathParts[0] === 'reel')) {
      // This is a post or reel URL with ID
      const postId = pathParts[1];
      return `https://www.instagram.com/${pathParts[0]}/${postId}/`;
    } 
    // Format: /{username}/reel/{postId}/
    else if (pathParts.length >= 3 && pathParts[1] === 'reel') {
      const username = pathParts[0];
      const postId = pathParts[2];
      return `https://www.instagram.com/${username}/reel/${postId}/`;
    }
    
    // If we can't parse it specially, return the original URL
    return url;
  } catch (error) {
    console.error("Error formatting Instagram URL:", error);
    return url;
  }
}

/**
 * Extract metadata from Instagram URL for better processing
 */
function extractInstagramMetadata(url: string): any {
  const metadata: any = {
    type: 'instagram',
    platform: 'instagram'
  };

  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(part => part);
    
    // Determine content type (post, reel, story)
    if (pathParts.includes('reel')) {
      metadata.contentType = 'reel';
    } else if (pathParts.includes('p')) {
      metadata.contentType = 'post';
    } else if (pathParts.includes('stories')) {
      metadata.contentType = 'story';
    }
    
    // Extract post ID
    if (metadata.contentType === 'reel' && pathParts.length >= 2) {
      const reelIndex = pathParts.indexOf('reel');
      if (reelIndex !== -1 && reelIndex < pathParts.length - 1) {
        metadata.postId = pathParts[reelIndex + 1];
      }
    } else if (metadata.contentType === 'post' && pathParts.length >= 2) {
      const postIndex = pathParts.indexOf('p');
      if (postIndex !== -1 && postIndex < pathParts.length - 1) {
        metadata.postId = pathParts[postIndex + 1];
      }
    }
    
    // Extract username if available
    if (pathParts.length > 0 && 
        !['p', 'reel', 'stories'].includes(pathParts[0])) {
      metadata.username = pathParts[0];
    }
    
    return metadata;
  } catch (error) {
    console.error("Error extracting Instagram metadata:", error);
    return metadata;
  }
}

// Add a utility function to help with Instagram content retrieval
export const enhanceInstagramRetrieval = async (bucketId: string, question: string) => {
  // Only run for questions likely about Instagram content
  const instagramKeywords = ['instagram', 'reel', 'post', 'sundar pichai', 'pichai', 'meta', 'social media'];
  const isInstagramRelated = instagramKeywords.some(keyword => 
    question.toLowerCase().includes(keyword)
  );
  
  if (!isInstagramRelated) return;
  
  console.log('Detected Instagram-related question, enhancing retrieval');
  
  try {
    // Check if we have stored Instagram usernames
    const storedUsernames = JSON.parse(localStorage.getItem('instagram_usernames') || '[]');
    
    if (storedUsernames.length > 0) {
      console.log('Found stored Instagram usernames for retrieval enhancement:', storedUsernames);
      
      // We could potentially ping an endpoint to boost these usernames in the retrieval
      // But for now we'll just log that we've identified relevant Instagram content
    }
    
    // Check sources in this bucket for Instagram content
    const response = await apiClient.get(`/api/sources/${bucketId}`);
    const instagramSources = response.data.instagram || [];
    
    if (instagramSources.length > 0) {
      console.log(`Found ${instagramSources.length} Instagram sources that should be included in retrieval`);
      
      // Log the sources for debugging
      instagramSources.forEach((source: any, index: number) => {
        console.log(`Instagram source ${index + 1}:`, {
          id: source.id,
          url: source.source_url,
          status: source.status,
          message: source.source_message
        });
      });
    }
  } catch (error) {
    console.error('Error enhancing Instagram retrieval:', error);
  }
};

// Process text input
export const processText = async (text: string, title: string, bucketId: string) => {
  console.log(`Processing text for bucket: ${bucketId}`);
  console.log(`Text length: ${text.length} characters`);
  
  // Validate text length before making the API call
  if (text.length < 50) {
    console.error('Text is too short (<50 characters)');
    return {
      success: false,
      message: 'Text content too short. Please enter at least 50 characters.'
    };
  }
  
  try {
    const response = await apiClient.post('/api/sources/text', {
    text,
    title,
    bucket_id: bucketId,
    chunk_size: 1500,
    chunk_overlap: 300
    });
    
    console.log('Text processing response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error processing text:', error);
    if (axios.isAxiosError(error) && error.response) {
      console.error('API error response:', error.response.data);
      
      // Return a standardized error response
      return {
        success: false,
        message: error.response.data.detail || 'Failed to process text'
      };
    }
    throw error;
  }
};

// Enhanced version of checkSourceStatus to include detailed information
export const checkSourceStatus = async (bucketId: string) => {
  try {
    console.log(`Checking source status for bucket: ${bucketId}`);
    const token = getAccessToken();
    
    if (!token) {
      console.warn("No valid token available for checkSourceStatus");
      return {
        success: false,
        error: "No valid token available",
        total_sources: 0,
        status_summary: { success: 0, processing: 0, pending: 0, failed: 0 },
        isFullyProcessed: false,
        completionPercentage: 0
      };
    }
    
    const response = await fetch(`${API_URL}/api/sources/status/${bucketId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.warn(`Failed to check source status: ${response.status}`);
      return {
        success: false,
        error: `Failed to check source status: ${response.status}`,
        total_sources: 0,
        status_summary: { success: 0, processing: 0, pending: 0, failed: 0 },
        isFullyProcessed: false,
        completionPercentage: 0
      };
    }
    
    const data = await response.json();
    console.log("Source status data:", data);
    
    // Ensure the status_summary exists to avoid null errors
    const statusSummary = data.status_summary || { success: 0, processing: 0, pending: 0, failed: 0 };
    const totalSources = data.total_sources || 0;
    
    // Calculate the processing completion percentage
    let completionPercentage = 0;
    if (totalSources > 0) {
      completionPercentage = Math.round(
        (statusSummary.success / totalSources) * 100
      );
    }
    
    return {
      ...data,
      total_sources: totalSources,
      status_summary: statusSummary,
      completionPercentage,
      isFullyProcessed: statusSummary.pending === 0 && 
                      statusSummary.processing === 0 &&
                      totalSources > 0
    };
  } catch (error) {
    console.error("Error checking source status:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      total_sources: 0,
      status_summary: { success: 0, processing: 0, pending: 0, failed: 0 },
      isFullyProcessed: false,
      completionPercentage: 0
    };
  }
};

// Add a new function to wait for source processing
export const waitForSourceProcessing = async (bucketId: string, timeoutSeconds = 120) => {
  console.log(`Waiting for sources in bucket ${bucketId} to complete processing...`);
  const startTime = Date.now();
  const maxWaitTime = timeoutSeconds * 1000; // convert to milliseconds
  
  // Initial delay to allow processing to start
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  while (Date.now() - startTime < maxWaitTime) {
    try {
      const status = await checkSourceStatus(bucketId);
      
      // If all sources are processed or at least some are ready
      if (status.isFullyProcessed) {
        console.log(`All sources in bucket ${bucketId} have been processed!`);
        return true;
      }
      
      // If we have at least some processed sources and it's been more than 30 seconds
      if (status.status_summary?.success > 0 && (Date.now() - startTime > 30000)) {
        console.log(`Some sources in bucket ${bucketId} are ready (${status.status_summary.success}/${status.total_sources})`);
        return true;
      }
      
      console.log(`Processing: ${status.completionPercentage}% complete. Waiting...`);
      
      // Wait before checking again
      await new Promise(resolve => setTimeout(resolve, 5000));
    } catch (error) {
      console.error(`Error waiting for source processing: ${error}`);
      // Wait a bit longer before retrying after an error
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }
  
  console.log(`Timeout reached waiting for sources in bucket ${bucketId}`);
  return false;
};

// List sources for a bucket
export const listSources = async (bucketId: string) => {
  console.log(`Listing sources for bucket: ${bucketId}`);
  
  try {
    const response = await apiClient.get(`/api/sources/${bucketId}`);
    console.log('List sources response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error listing sources:', error);
    throw error;
  }
};

// Chat with a bucket
export const chatWithBucket = async (bucketId: string, question: string, chatHistory = []) => {
  console.log(`Chatting with bucket: ${bucketId}, question: ${question}`);
  
  try {
    const response = await apiClient.post('/api/chat', {
      bucket_id: bucketId,
      question,
      chat_history: chatHistory,
      model: "gpt-4o"
    });
    
    console.log('Chat response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error chatting with bucket:', error);
    throw error;
  }
};

// Save chat message
export const saveChatMessage = async (sessionId: string | object, message: string, sender: 'user' | 'llm') => {
  try {
    console.log(`Saving ${sender} message to session:`, sessionId);
    
    // Validate session ID
    if (!sessionId) {
      console.error("No session ID provided");
      throw new Error("Cannot save message: No session ID provided");
    }
    
    // Make sure sessionId is a string
    let sessionIdString: string;
    if (typeof sessionId === 'string') {
      sessionIdString = sessionId;
    } else if (sessionId && typeof sessionId === 'object' && 'id' in sessionId) {
      sessionIdString = (sessionId as { id: string }).id;
    } else {
      sessionIdString = JSON.stringify(sessionId);
    }
    
    // Check and refresh token if needed
    const isTokenValid = await checkAndRefreshToken();
    if (!isTokenValid) {
      throw new Error("Session expired. Please log in again.");
    }
    
    // Get the token after refresh
    const token = getAccessToken();
    if (!token) {
      throw new Error("Authentication required");
    }
    
    const response = await apiClient.post('/api/chat/message', null, {
      params: {
        session_id: sessionIdString,
        message: message,
        sender: sender
      },
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error saving message:', error);
    
    // Check if this is an authentication error
    if (
      typeof error === 'object' &&
      error !== null &&
      'response' in error &&
      (error as any).response &&
      (error as any).response.status === 401
    ) {
      // Redirect to login page
      window.location.href = '/login';
    }
    
    throw error;
  }
};

// Add a new function to check if a source has been processed
export const pollUntilSourcesProcessed = async (bucketId: string, timeoutMs = 30000): Promise<boolean> => {
  console.log(`Polling until sources are processed for bucket: ${bucketId}`);
  
  const startTime = Date.now();
  const pollInterval = 3000; // Poll every 3 seconds
  
  try {
    while (Date.now() - startTime < timeoutMs) {
      // Check source status
      const status = await checkSourceStatus(bucketId);
      
      // If there are no pending or processing sources, we're done
      if (status.status_summary && 
          status.status_summary.pending === 0 && 
          status.status_summary.processing === 0) {
        console.log(`All sources for bucket ${bucketId} have been processed`);
        return true;
      }
      
      // If we have successful sources but still some processing, consider it ready
      if (status.status_summary && 
          status.status_summary.success > 0 && 
          status.total_sources > 0) {
        console.log(`Some sources (${status.status_summary.success} of ${status.total_sources}) for bucket ${bucketId} are ready, can proceed`);
        return true;
      }
      
      console.log(`Waiting for sources to process: ${JSON.stringify(status.status_summary)}`);
      
      // Wait before polling again
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
    
    console.log(`Timeout reached while waiting for sources to process for bucket ${bucketId}`);
    return false;
  } catch (error) {
    console.error(`Error polling for source processing: ${error}`);
    return false;
  }
};

// Enhance the chatWithShakty function to better handle the RAG pipeline
export const chatWithShakty = async (
  bucketId: string, 
  question: string, 
  chatHistory: Array<[string, string]> = []
) => {
  console.log(`Chatting with Shakty bucket: ${bucketId}`);
  console.log(`Question: ${question}`);
  
  try {
    // Check source status first
    const sourceStatus = await checkSourceStatus(bucketId);
    console.log("Source status before chat:", sourceStatus);
    
    // If no sources are processed yet but some are being processed, wait a bit
    if (sourceStatus.total_sources > 0 && 
        sourceStatus.status_summary?.success === 0 && 
        (sourceStatus.status_summary?.processing > 0 || sourceStatus.status_summary?.pending > 0)) {
      
      console.log("Sources are still processing. Waiting for some to complete...");
      // Wait up to 30 seconds for at least one source to complete
      await waitForSourceProcessing(bucketId, 30);
    }
    
    // Get a fresh token for the chat request
    const token = getAccessToken();
    if (!token) {
      throw new Error("No valid token available");
    }
    
    // Make the chat request with a longer timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60-second timeout
    
    const response = await fetch(`${API_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        bucket_id: bucketId,
        question,
        chat_history: chatHistory
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Chat API error (${response.status}): ${errorText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        answer: "I'm sorry, the request took too long to process. Please try asking a simpler question or try again later when all your sources have finished processing.",
        sources: []
      };
    }
    
    console.error("Error in chat with Shakty:", error);
    return {
      answer: `I encountered an error while trying to answer: ${error instanceof Error ? error.message : String(error)}. Please try again or add more sources if you're asking about content I don't have yet.`,
      sources: []
    };
  }
};

// Add a dedicated function to check and handle existing YouTube content
export const checkForExistingYouTubeContent = async (bucketId: string) => {
  try {
    const response = await apiClient.get(`/api/sources/${bucketId}`);
    const youtubeContent = response.data.youtube || [];
    
    if (youtubeContent.length > 0) {
      console.log(`Found ${youtubeContent.length} existing YouTube videos in the bucket`);
      // You might want to store this information for later reference
      localStorage.setItem('has_youtube_content', 'true');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error("Error checking for YouTube content:", error);
    return false;
  }
};

/**
 * Add a source URL to a bucket using the improved endpoint
 * This is more reliable than the older endpoints for handling URLs
 */
export const addSource = async (url: string, bucketId: string) => {
  try {
    console.log("Adding source URL to bucket:", bucketId);
    console.log("URL:", url);
    
    // Check and refresh token if needed
    const isTokenValid = await checkAndRefreshToken();
    if (!isTokenValid) {
      console.error("Authentication failed - could not get valid token");
      return { success: false, message: "Authentication required. Please log in again." };
    }
    
    // Get a fresh token after refresh
    const token = getAccessToken();
    if (!token) {
      console.error("No token available after refresh attempt");
      // Redirect to login
      window.location.href = '/login';
      return { success: false, message: "Session expired. Please log in again." };
    }
    
    // Make the request with the refreshed token
    const response = await fetch(`${API_URL}/api/sources/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        source_url: url,
        bucket_id: bucketId
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API error response:", errorText);
      
      // Handle 401/403 authentication errors
      if (response.status === 401 || response.status === 403) {
        // Try one more token refresh as a last resort
        const newToken = await refreshAuthToken();
        if (newToken) {
          // Retry the request with the new token
          const retryResponse = await fetch(`${API_URL}/api/sources/add`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${newToken}`
            },
            body: JSON.stringify({
              source_url: url,
              bucket_id: bucketId
            })
          });
          
          if (retryResponse.ok) {
            const retryData = await retryResponse.json();
            return retryData;
          } else {
            // If retry fails, redirect to login
            window.location.href = '/login';
            return { success: false, message: "Authentication failed. Please log in again." };
          }
        } else {
          // If refresh fails, redirect to login
          window.location.href = '/login';
          return { success: false, message: "Authentication failed. Please log in again." };
        }
      }
      
      try {
        const errorJson = JSON.parse(errorText);
        return { success: false, message: errorJson.detail || "Failed to add source" };
      } catch {
        return { success: false, message: errorText || "Failed to add source" };
      }
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error adding source:", error);
    
    if (typeof error === 'object' && error !== null && 'response' in error) {
      console.error("API error response:", (error as any).response.data);
    }
    
    return { success: false, message: error instanceof Error ? error.message : String(error) || "An error occurred" };
  }
};

// Make apiClient available for import in other files
export { apiClient };

export const createChatSession = async (bucketId: string, topic: string) => {
  try {
    const token = getAccessToken();
    if (!token) {
      throw new Error("No valid token available");
    }

    console.log(`Creating chat session for bucket: ${bucketId} with topic: ${topic}`);
    
    const response = await axios.post(
      `${API_URL}/api/chat/session/create`,
      { topic },
      {
        params: { bucket_id: bucketId },
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    // Log the response shape for debugging
    console.log('Create session response:', response.data);
    
    // Make sure we return just the session_id as a string if that's what the client expects
    return response.data;
  } catch (error) {
    console.error('Error creating chat session:', error);
    throw error;
  }
};

export const checkAndRefreshToken = async (): Promise<boolean> => {
  try {
    // First check if we already have a valid token
    let token = getAccessToken();
    
    // If no valid token, try to refresh
    if (!token) {
      console.log("No valid token, attempting refresh");
      token = await refreshAuthToken();
      
      // If refresh failed, we have no valid token
      if (!token) {
        console.error("Token refresh failed");
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error("Error checking/refreshing token:", error);
    return false;
  }
};