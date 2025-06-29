import { getSession } from "../session";
import { Apis } from "../apis";
import { s3 } from "../s3";

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

export const getOriginalImageUploadUrl: Apis["getOriginalImageUploadUrl"] =
  async ({ contentLength }, req) => {
    try {
      // Check if user is logged in
      const session = await getSession(req);
      if (!session) {
        return { ok: false, reason: "INTERNAL_ERROR" };
      }

      // Check file size limit
      if (contentLength > MAX_FILE_SIZE) {
        return { ok: false, reason: "FILE_TOO_LARGE" };
      }

      // Generate unique image ID
      const imageId = crypto.randomUUID();

      // Create presigned URL for PUT operation
      const uploadUrl = await s3.getPresignedUploadUrl(
        imageId,
        contentLength,
        "image/*"
      );

      return {
        ok: true,
        uploadUrl,
        imageId,
      };
    } catch (error) {
      console.error("S3 upload URL generation error:", error);
      return { ok: false, reason: "INTERNAL_ERROR" };
    }
  };
