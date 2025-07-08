import { getSession } from "../session";
import { ddb } from "../__generated/db";
import { generateId } from "../utils/uuid";
import { Apis } from "../apis";

export const newArtwork: Apis["newArtwork"] = async (
  { title, artwork },
  req
) => {
  const session = await getSession(req);
  if (!session) {
    return { ok: false, reason: "NOT_LOGGED_IN" };
  }

  const artworkId = generateId();

  await ddb.tx((tx) =>
    tx.createArtworkDoc(
      {
        id: artworkId,
        ownerId: session.userId,
        title,
        originalImageId: artwork.originalImageId,
        dpi: artwork.dpi,
        imageCenterXy: artwork.imageCenterXy,
        sideProcessing: artwork.sideProcessing,
      },
      { id: session.userId }
    )
  );

  return { ok: true, artworkId };
};
