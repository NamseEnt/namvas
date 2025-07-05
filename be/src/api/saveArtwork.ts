import { ApiRequest } from "../types";
import { getSession } from "../session";
import { ddb } from "../__generated/db";
import { generateId } from "../utils/uuid";

export async function saveArtwork(
  params: { title: string; artwork: any; thumbnailS3Key: string },
  req: ApiRequest
) {
  const session = await getSession(req);
  if (!session) {
    return { ok: false, reason: "NOT_LOGGED_IN" } as const;
  }

  const artworkId = generateId();
  const now = new Date().toISOString();

  const savedArtwork = {
    id: artworkId,
    userId: session.userId,
    title: params.title,
    createdAt: now,
    updatedAt: now,
    artwork: params.artwork,
    thumbnailS3Key: params.thumbnailS3Key,
  };

  await ddb.putSavedArtwork(savedArtwork);

  return { ok: true, artworkId } as const;
}
