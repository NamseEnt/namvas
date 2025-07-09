import { ddb } from "../__generated/db";
import { Apis } from "../apis";
import { isLocalDev } from "../isLocalDev";
import { generateId } from "../utils/uuid";

export const loginDev: Apis["loginDev"] = async ({ identifier }, req) => {
  if (!isLocalDev()) {
    return { ok: false, reason: "NOT_DEVELOPMENT_ENV" };
  }

  const { userId } = await createDevUserIfNotExists(identifier);

  const sessionId = generateId();
  await ddb.tx((tx) =>
    tx.createSessionDoc({
      id: sessionId,
      userId,
    })
  );

  req.cookies.sessionId = sessionId;

  return { ok: true };
};

async function createDevUserIfNotExists(identifier: string): Promise<{ userId: string }> {
  const identity = await ddb.getIdentityDoc({
    provider: "dev",
    providerId: identifier,
  });
  if (identity) {
    return { userId: identity.userId };
  }

  const userId = generateId();
  await ddb.tx((tx) =>
    tx
      .createUserDoc({
        id: userId,
        tosAgreed: true,
        createdAt: new Date().toISOString(),
      })
      .createIdentityDoc(
        {
          provider: "dev",
          providerId: identifier,
          userId,
        },
        { id: userId }
      )
  );

  return { userId };
}