import { ApiSpec } from "shared";
import { getSession } from "../session";
import { ApiRequest } from "../types";
import { ddb } from "../__generated/db";

export const queryMyArtworks = async (
  { nextToken, pageSize = 20 }: ApiSpec["queryMyArtworks"]["req"],
  req: ApiRequest
): Promise<ApiSpec["queryMyArtworks"]["res"]> => {
  const session = await getSession(req);
  if (!session) {
    return { ok: false, reason: "NOT_LOGGED_IN" };
  }

  const { items: artworks, nextToken: resultNextToken } = await ddb.queryArtworksOfUser({
    id: session.userId,
    nextToken,
  });

  return {
    ok: true,
    artworks,
    ...(resultNextToken && { nextToken: resultNextToken }),
  };
};
