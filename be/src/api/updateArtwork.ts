import { ApiSpec } from "shared";
import { getSession } from "../session";
import { ApiRequest } from "../types";
import { ddb } from "../__generated/db";

export const updateArtwork = async (
  { id, title, artwork }: ApiSpec["updateArtwork"]["req"],
  req: ApiRequest
): Promise<ApiSpec["updateArtwork"]["res"]> => {
  const session = await getSession(req);
  if (!session) {
    return { ok: false, reason: "NOT_LOGGED_IN" };
  }

  const existingArtwork = await ddb.getArtworkDoc({ id });
  if (!existingArtwork) {
    return { ok: false, reason: "ARTWORK_NOT_FOUND" };
  }

  if (existingArtwork.ownerId !== session.userId) {
    return { ok: false, reason: "PERMISSION_DENIED" };
  }

  const updatedArtwork = {
    ...existingArtwork,
    ...(title !== undefined && { title }),
    ...(artwork !== undefined && {
      originalImageId: artwork.originalImageId,
      dpi: artwork.dpi,
      imageCenterXy: artwork.imageCenterXy,
      sideProcessing: artwork.sideProcessing
    }),
  };

  await ddb.putArtworkDoc({
    ...updatedArtwork,
    $v: (existingArtwork.$v || 1) + 1
  });

  return { ok: true };
};