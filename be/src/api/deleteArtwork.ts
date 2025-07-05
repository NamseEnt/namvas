import { ApiRequest } from "../types";
import { getSession } from "../session";
import { ddb } from "../__generated/db";

export async function deleteArtwork(params: { artworkId: string }, req: ApiRequest) {
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

  await ddb.deleteSavedArtwork({ id: params.artworkId });

  return { ok: true } as const;
}