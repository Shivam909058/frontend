import { supabase } from "../lib/supabase";

// Maximum number of retry attempts
const MAX_RETRIES = 3;
// Delay between retries (in milliseconds)
const RETRY_DELAY = 1000;

/**
 * Verify OTP with retry mechanism for handling server errors
 */
export const verifyOtpWithRetry = async (email: string, token: string) => {
  let attempts = 0;
  let lastError: Error | null = null;

  while (attempts < MAX_RETRIES) {
    try {
      // Attempt to verify the OTP
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: "email",
      });

      if (error) throw error;
      
      return { data, error: null };
    } catch (error: any) {
      lastError = error;
      console.error(`OTP verification attempt ${attempts + 1} failed:`, error);
      
      // If error is not 500, don't retry
      if (error.status !== 500) {
        break;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      attempts++;
    }
  }

  // If all retries failed, try a fallback approach - check for existing session
  try {
    console.log("Trying fallback authentication method");
    
    // Check if the user already exists and is authenticated
    const { data: authData } = await supabase.auth.getSession();
    
    if (authData?.session) {
      return { data: authData, error: null };
    }
    
    // If no session exists, try to sign in again without the token
    await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false
      }
    });
    
    // This will send a new OTP, so we need to inform the user
    return { 
      data: null, 
      error: new Error("A new verification code has been sent to your email. Please check your inbox.") 
    };
  } catch (error: any) {
    console.error("Fallback authentication failed:", error);
    
    // Return the last error from the retry attempts
    return { data: null, error: lastError || new Error("Authentication failed") };
  }
};

/**
 * Get user data from Supabase
 */
export const getUserData = async () => {
  try {
    const { data, error } = await supabase.auth.getUser();
    
    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error("Error fetching user data:", error);
    return { data: null, error };
  }
};

/**
 * Gets the current access token from localStorage
 */
export const getAccessToken = (): string | null => {
  try {
    const tokenId = import.meta.env.VITE_TOKEN_ID;
    const tokenJson = localStorage.getItem(tokenId);
    
    if (!tokenJson) {
      console.error('No token found in localStorage');
      return null;
    }
    
    const parsedToken = JSON.parse(tokenJson);
    return parsedToken?.access_token || null;
  } catch (error) {
    console.error('Error retrieving access token:', error);
    return null;
  }
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  return !!getAccessToken();
}; 