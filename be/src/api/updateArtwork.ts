import { ApiSpec } from "shared";
import { getSession } from "../session";
import { ApiRequest } from "../types";
import { ddb } from "../__generated/db";

export const updateArtwork = async (
  { artworkId, title, artwork }: ApiSpec["updateArtwork"]["req"],
  req: ApiRequest
): Promise<ApiSpec["updateArtwork"]["res"]> => {
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

  const updatedArtwork = {
    ...existingArtwork,
    ...(title !== undefined && { title }),
    ...(artwork !== undefined && {
      originalImageId: artwork.originalImageId,
      imageCenterXy: artwork.imageCenterXy,
      sideProcessing: artwork.sideProcessing as any,
      canvasBackgroundColor: artwork.canvasBackgroundColor
    }),
  };

  await ddb.tx(tx => tx.updateArtworkDoc({
    ...updatedArtwork,
    $v: existingArtwork.$v
  }));

  return { ok: true };
};