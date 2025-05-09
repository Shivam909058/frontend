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