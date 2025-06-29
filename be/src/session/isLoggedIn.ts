import { ApiRequest } from "../types";
import { db } from "db";

export async function isLoggedIn(req: ApiRequest): Promise<boolean> {
  const sessionId = req.cookies.sessionId;
  if (!sessionId) {
    return false;
  }

  const session = await db.getSession({ id: sessionId });
  return !!session;
}
