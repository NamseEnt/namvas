import { ddb } from "../__generated/db";
import { Session } from "../schema";
import { ApiRequest } from "../types";

export async function getSession(
  req: ApiRequest
): Promise<Session | undefined> {
  const sessionId = req.cookies.sessionId;
  if (!sessionId) {
    return;
  }

  return await ddb.getSession({ id: sessionId });
}

export async function isLoggedIn(req: ApiRequest): Promise<boolean> {
  return !!(await getSession(req));
}
