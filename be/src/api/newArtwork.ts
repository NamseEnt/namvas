import { ApiSpec } from "shared";
import { getSession } from "../session";
import { ApiRequest } from "../types";
import { ddb } from "../__generated/db";
import { generateId } from "../utils/uuid";

export const newArtwork = async (
  {}: ApiSpec["newArtwork"]["req"],
  req: ApiRequest
): Promise<ApiSpec["newArtwork"]["res"]> => {
  const session = await getSession(req);
  if (!session) {
    return { ok: false, reason: "NOT_LOGGED_IN" };
  }

  const artworkId = generateId();

  const newArtworkDoc = {
    id: artworkId,
    ownerId: session.userId,
    title: "Untitled Artwork",
    originalImageId: "",
    dpi: 300,
    imageCenterXy: { x: 0, y: 0 },
    sideProcessing: { type: "none" as const },
  };

  await ddb.putArtworkDoc({
    ...newArtworkDoc,
    $v: 1
  });

  return { ok: true, artworkId };
};