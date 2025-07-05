import { ApiRequest } from "../types";
import { getSession } from "../session";
import { ddb } from "../__generated/db";

export async function getMyArtworks(params: {}, req: ApiRequest) {
  const session = await getSession(req);
  if (!session) {
    return { ok: false, reason: "NOT_LOGGED_IN" } as const;
  }

  const artworks = await ddb.getSavedArtworksByUserId({
    userId: session.userId,
  });

  // Sort by updatedAt descending (newest first)
  artworks.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  return { ok: true, artworks } as const;
}
