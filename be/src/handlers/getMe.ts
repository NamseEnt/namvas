import type { ApiHandler } from "../types";
import { getDbClient } from "db";

export const getMe: ApiHandler<"getMe"> = async (_req) => {
  try {
    const isProduction = process.env.NODE_ENV === "production";
    const _dbClient = getDbClient(isProduction);
    
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