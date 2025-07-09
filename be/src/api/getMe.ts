import { getSession } from "../session";
import { ddb } from "../__generated/db";
import { Apis } from "../apis";

export const getMe: Apis["getMe"] = async ({}, req) => {
  const session = await getSession(req);
  if (!session) {
    return { ok: false, reason: "NOT_LOGGED_IN" };
  }
  const user = await ddb.getUserDoc({ id: session.userId });
  if (!user) {
    return { ok: false, reason: "NOT_LOGGED_IN" };
  }
  return { ok: true, tosAgreed: user.tosAgreed };
};