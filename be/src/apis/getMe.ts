import type { ApiHandler } from "../types";
import { getSession } from "db";

export const getMe: ApiHandler<"getMe"> = async ({}, req) => {
  try {
    const sessionId = req.cookies.get("sessionId");
    
    if (!sessionId) {
      return {
        ok: false,
        reason: "NOT_LOGGED_IN",
      };
    }

    const session = await getSession({ id: sessionId });
    
    if (!session) {
      return {
        ok: false,
        reason: "NOT_LOGGED_IN",
      };
    }

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
