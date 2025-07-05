import { ApiRequest } from "../types";
import { getSession } from "../session";
import { ddb } from "../__generated/db";

export async function updateArtwork(params: { artworkId: string; title?: string; artwork?: any; thumbnailS3Key?: string }, req: ApiRequest) {
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

  const updatedArtwork = {
    ...existingArtwork,
    updatedAt: new Date().toISOString(),
    ...(params.title !== undefined && { title: params.title }),
    ...(params.artwork !== undefined && { artwork: params.artwork }),
    ...(params.thumbnailS3Key !== undefined && { thumbnailS3Key: params.thumbnailS3Key }),
  };

  await ddb.putSavedArtwork(updatedArtwork);

  return { ok: true } as const;
}