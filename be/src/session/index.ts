import { ddb } from "../__generated/db";
import { SessionDoc } from "../schema";
import { ApiRequest } from "../types";

export async function getSession(
  req: ApiRequest
): Promise<SessionDoc | undefined> {
  const sessionId = req.cookies.sessionId;
  if (!sessionId) {
    return;
  }

  return await ddb.getSessionDoc({ id: sessionId });
}

export async function isLoggedIn(req: ApiRequest): Promise<boolean> {
  return !!(await getSession(req));
}
