import { ApiSpec } from "shared";
import { getSession } from "../session";
import { ApiRequest } from "../types";
import { ddb } from "../__generated/db";

export const queryArtworksOfUser = async (
  {}: ApiSpec["queryArtworksOfUser"]["req"],
  req: ApiRequest
): Promise<ApiSpec["queryArtworksOfUser"]["res"]> => {
  const session = await getSession(req);
  if (!session) {
    return { ok: false, reason: "NOT_LOGGED_IN" };
  }

  const { items: artworks } = await ddb.queryArtworksOfUser({
    id: session.userId
  });

  // ArtworkDoc을 Artwork 타입으로 변환
  const convertedArtworks = artworks.map(artwork => ({
    id: artwork.id,
    title: artwork.title,
    originalImageId: artwork.originalImageId,
    dpi: artwork.dpi,
    imageCenterXy: artwork.imageCenterXy,
    sideProcessing: artwork.sideProcessing as any,
    thumbnailId: "", // 임시 값
    createdAt: new Date().toISOString(), // 임시 값
    canvasBackgroundColor: "#ffffff" // 임시 값
  }));

  return {
    ok: true,
    artworks: convertedArtworks
  };
};