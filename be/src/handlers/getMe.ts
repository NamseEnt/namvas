import type { ApiHandler } from "../types";
import { getSession } from "db";

export const getMe: ApiHandler<"getMe"> = async (_body, req) => {
  try {
    const sessionId = req.cookies.get("sessionId") || "temporary-session-id";

    const session = await getSession({id: sessionId});

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
