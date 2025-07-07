import { ApiSpec } from "shared";
import { getSession } from "../session";
import { ApiRequest } from "../types";
import { ddb } from "../__generated/db";

export const deleteArtwork = async (
  { artworkId }: ApiSpec["deleteArtwork"]["req"],
  req: ApiRequest
): Promise<ApiSpec["deleteArtwork"]["res"]> => {
  const session = await getSession(req);
  if (!session) {
    return { ok: false, reason: "PERMISSION_DENIED" };
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