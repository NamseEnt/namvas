import { Docs } from "db/src/generated";
import { ApiRequest } from "../types";
import { ddb } from "db";

export async function getSession(
  req: ApiRequest
): Promise<Docs["session"] | undefined> {
  const sessionId = req.cookies.sessionId;
  if (!sessionId) {
    return;
  }

  return await ddb.getSession({ id: sessionId });
}

export async function isLoggedIn(req: ApiRequest): Promise<boolean> {
  return !!(await getSession(req));
}
