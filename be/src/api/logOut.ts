import { getSession } from "../session";
import { ddb } from "../__generated/db";
import { Apis } from "../apis";

export const logOut: Apis["logOut"] = async ({}, req) => {
  const session = await getSession(req);
  if (!session) {
    return { ok: true };
  }
  await ddb.deleteSessionDoc({ id: session.id });
  delete req.cookies.sessionId;
  return { ok: true };
};