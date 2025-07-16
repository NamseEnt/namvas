import { getSession } from "../session";
import { ddb } from "../__generated/db";
import { Apis } from "../apis";

export const updateArtwork: Apis["updateArtwork"] = async (
  { artworkId, title, sideMode, imageOffset },
  req
) => {
  const session = await getSession(req);
  if (!session) {
    return { ok: false, reason: "NOT_LOGGED_IN" };
  }

  const artworkDoc = await ddb.getArtworkDoc({ id: artworkId });
  if (!artworkDoc) {
    return { ok: false, reason: "ARTWORK_NOT_FOUND" };
  }

  if (artworkDoc.ownerId !== session.userId) {
    return { ok: false, reason: "PERMISSION_DENIED" };
  }

  artworkDoc.title = title;
  artworkDoc.sideMode = sideMode;
  artworkDoc.imageOffset = imageOffset;

  await ddb.tx((tx) => tx.updateArtworkDoc(artworkDoc));

  return { ok: true };
};
