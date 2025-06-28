import type { ApiHandler } from "../types";

export const getMe: ApiHandler<"getMe"> = async (_body, req) => {
  try {
    const sessionId = req.cookies.get("sessionId") || "temporary-session-id";

    // TODO: Implement actual session lookup
    // For now, return mock data
    return {
      ok: true,
      tosAgreed: false,
    };
  } catch (_error) {
    return {
      ok: false,
      reason: "NOT_LOGGED_IN",
    };
  }
};
