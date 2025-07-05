import { ApiRequest } from "../types";
import { getSession } from "../session";
import { ddb } from "../__generated/db";
import { generateId } from "../utils/uuid";

export async function duplicateArtwork(
  params: { artworkId: string; title: string },
  req: ApiRequest
) {
  const session = await getSession(req);
  if (!session) {
    return { ok: false, reason: "NOT_LOGGED_IN" } as const;
  }

  const existingArtwork = await ddb.getSavedArtwork({ id: params.artworkId });
  if (!existingArtwork) {
    return { ok: false, reason: "ARTWORK_NOT_FOUND" } as const;
  }

  if (existingArtwork.userId !== session.userId) {
    return { ok: false, reason: "NOT_AUTHORIZED" } as const;
  }

  const newArtworkId = generateId();
  const now = new Date().toISOString();

  const duplicatedArtwork = {
    ...existingArtwork,
    id: newArtworkId,
    title: params.title,
    createdAt: now,
    updatedAt: now,
  };

  await ddb.putSavedArtwork(duplicatedArtwork);

  return { ok: true, artworkId: newArtworkId } as const;
}
