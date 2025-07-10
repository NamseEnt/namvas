import { getSession } from "../session";
import { ddb } from "../__generated/db";
import { Apis } from "../apis";

export const listMyArtworks: Apis["listMyArtworks"] = async (
  { nextToken, pageSize },
  req
) => {
  const session = await getSession(req);
  if (!session) {
    return { ok: false, reason: "NOT_LOGGED_IN" };
  }

  console.log("[DEBUG] listMyArtworks - session.userId:", session.userId);

  const { items: artworks, nextToken: resultNextToken } =
    await ddb.queryArtworksOfUser({
      id: session.userId,
      nextToken,
      limit: pageSize,
    });

  console.log("[DEBUG] listMyArtworks - found artworks:", artworks.length);

  return {
    ok: true,
    artworks,
    ...(resultNextToken && { nextToken: resultNextToken }),
  };
};
