import type { ApiHandler } from "../types";
import { getSession } from "db";

export const getMe: ApiHandler<"getMe"> = async (_req) => {
  try {
    // TODO: 쿠키에서 세션 ID 가져오기
    const sessionId = "temporary-session-id";
    
    const session = await getSession(sessionId);
    
    if (!session) {
      return {
        ok: false,
        reason: "NOT_LOGGED_IN",
      };
    }
    
    return {
      ok: true,
      tosAgreed: session.tosAgreed || false,
    };
  } catch (_error) {
    return {
      ok: false,
      reason: "NOT_LOGGED_IN",
    };
  }
};