import { ApiSpec } from "shared";
import { getSession } from "../session";
import { ApiRequest } from "../types";
import { ddb } from "../__generated/db";
import { generateId } from "../utils/uuid";

export const duplicateArtwork = async (
  { artworkId, title }: ApiSpec["duplicateArtwork"]["req"],
  req: ApiRequest
): Promise<ApiSpec["duplicateArtwork"]["res"]> => {
  const session = await getSession(req);
  if (!session) {
    return { ok: false, reason: "PERMISSION_DENIED" };
  }

  const existingArtwork = await ddb.getArtworkDoc({ id: artworkId });
  if (!existingArtwork) {
    return { ok: false, reason: "ARTWORK_NOT_FOUND" };
  }

  if (existingArtwork.ownerId !== session.userId) {
    return { ok: false, reason: "PERMISSION_DENIED" };
  }

  const newArtworkId = generateId();
  const now = new Date().toISOString();

  const duplicatedArtwork = {
    ...existingArtwork,
    id: newArtworkId,
    title,
  };

  await ddb.tx(tx => tx.createArtworkDoc(duplicatedArtwork, { id: session.userId }));

  return { ok: true, artworkId: newArtworkId };
};
