import { getSession } from "../session";
import { ddb } from "../__generated/db";
import { Apis } from "../apis";

export const updateArtwork: Apis["updateArtwork"] = async (
  { artworkId, title, artwork },
  req
) => {
  const session = await getSession(req);
  if (!session) {
    return { ok: false, reason: "NOT_LOGGED_IN" };
  }

  const existingArtworkDoc = await ddb.getArtworkDoc({ id: artworkId });
  if (!existingArtworkDoc) {
    return { ok: false, reason: "ARTWORK_NOT_FOUND" };
  }

  if (existingArtworkDoc.ownerId !== session.userId) {
    return { ok: false, reason: "PERMISSION_DENIED" };
  }

  if (title) {
    existingArtworkDoc.title = title;
  }

  if (artwork) {
    existingArtworkDoc.originalImageId = artwork.originalImageId;
    existingArtworkDoc.imageCenterXy = artwork.imageCenterXy;
    existingArtworkDoc.dpi = artwork.dpi;
    existingArtworkDoc.sideProcessing = artwork.sideProcessing;
  }

  await ddb.tx((tx) => tx.updateArtworkDoc(existingArtworkDoc));

  return { ok: true };
};
