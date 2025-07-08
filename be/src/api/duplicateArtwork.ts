import { getSession } from "../session";
import { ddb } from "../__generated/db";
import { generateId } from "../utils/uuid";
import { Apis } from "../apis";

export const duplicateArtwork: Apis["duplicateArtwork"] = async (
  { artworkId, title },
  req
) => {
  const session = await getSession(req);
  if (!session) {
    return { ok: false, reason: "NOT_LOGGED_IN" };
  }

  const existingArtwork = await ddb.getArtworkDoc({ id: artworkId });
  if (!existingArtwork) {
    return { ok: false, reason: "ARTWORK_NOT_FOUND" };
  }

  if (existingArtwork.ownerId !== session.userId) {
    return { ok: false, reason: "PERMISSION_DENIED" };
  }

  const newArtworkId = generateId();

  const duplicatedArtwork = {
    ...existingArtwork,
    id: newArtworkId,
    title,
  };

  await ddb.tx((tx) =>
    tx.createArtworkDoc(duplicatedArtwork, { id: session.userId })
  );

  return { ok: true, artworkId: newArtworkId };
};
