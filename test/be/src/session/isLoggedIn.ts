import { ApiRequest } from "../types";

export async function isLoggedIn(req: ApiRequest): Promise<boolean> {
  const sessionId = req.cookies.sessionId;
  if (!sessionId) {
    return false;
  }

  throw new Error("Not implemented");
}
