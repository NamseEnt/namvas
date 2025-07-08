import { getSession } from "../session";
import { ddb } from "../__generated/db";
import { Apis } from "../apis";

export const deleteArtwork: Apis["deleteArtwork"] = async (
  { artworkId },
  req
) => {
  const session = await getSession(req);
  if (!session) {
    return { ok: false, reason: "NOT_LOGGED_IN" };
  }

  const existingArtwork = await ddb.getArtworkDoc({ id: artworkId });
  if (!existingArtwork) {
    return { ok: true };
  }

  if (existingArtwork.ownerId !== session.userId) {
    return { ok: false, reason: "PERMISSION_DENIED" };
  }

  await ddb.deleteArtworkDoc({ id: artworkId });

  return { ok: true };
};
