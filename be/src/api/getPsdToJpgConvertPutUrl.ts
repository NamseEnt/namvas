import { Apis } from "../apis";
import { s3 } from "../s3";
import { generateId } from "../utils/uuid";

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB (PSD 파일은 더 클 수 있음)

export const getPsdToJpgConvertPutUrl: Apis["getPsdToJpgConvertPutUrl"] =
  async ({ contentLength }) => {
    if (contentLength > MAX_FILE_SIZE) {
      return { ok: false, reason: "FILE_TOO_LARGE" };
    }

    const conversionId = generateId();

    const uploadUrl = await s3.getPresignedUploadUrl(
      `psd-temp/${conversionId}.psd`,
      contentLength,
      "image/vnd.adobe.photoshop"
    );

    return {
      ok: true,
      uploadUrl,
      conversionId,
    };
  };
