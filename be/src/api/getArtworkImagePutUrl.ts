import { getSession } from "../session";
import { Apis } from "../apis";
import { s3 } from "../s3";

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

export const getArtworkImagePutUrl: Apis["getArtworkImagePutUrl"] = async (
  { artworkId, contentLength },
  req
) => {
  const session = await getSession(req);
  if (!session) {
    return { ok: false, reason: "NOT_LOGGED_IN" };
  }

  if (contentLength > MAX_FILE_SIZE) {
    return { ok: false, reason: "FILE_TOO_LARGE" };
  }

  const uploadUrl = await s3.getPresignedUploadUrl(
    artworkId,
    contentLength,
    "image/*"
  );

  return {
    ok: true,
    uploadUrl,
  };
};
