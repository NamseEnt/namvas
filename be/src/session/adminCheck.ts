import { getSession } from "./index";
import { ApiRequest } from "../types";

// Hardcoded admin provider IDs  
// TODO: Replace with actual admin provider IDs
const ADMIN_PROVIDER_IDS = new Set([
  "google:admin_google_id_here", // Replace with actual Google ID
  "twitter:admin_twitter_id_here", // Replace with actual Twitter ID
]);

export const isAdmin = async (req: ApiRequest): Promise<boolean> => {
  const session = await getSession(req);
  if (!session) {
    return false;
  }

  // Get all identities for this user and check if any match admin provider IDs
  try {
    // TODO: Implement efficient query to get identities by userId
    // For now, we'll need to check against known admin identities
    // This is a placeholder implementation
    
    // Check if any provider ID matches hardcoded admin IDs
    // This would need a proper implementation with identity lookup by userId
    return false; // TODO: Implement proper admin check based on provider ID
  } catch (error) {
    console.error("Admin check error:", error);
    return false;
  }
};