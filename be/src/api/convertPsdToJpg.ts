import { Apis } from "../apis";
import { s3 } from "../s3";
import { imagick } from "../binary";
import { createHash } from "crypto";
import { readFile } from "fs/promises";

export const convertPsdToJpg: Apis["convertPsdToJpg"] = async ({
  conversionId,
}) => {
  const psdS3Key = `psd-temp/${conversionId}.psd`;
  console.log("psdS3Key", psdS3Key);

  const bytes = await s3.getObject(psdS3Key);
  if (!bytes) {
    return { ok: false, reason: "CONVERSION_NOT_FOUND" };
  }

  const hash = sha256Hash(bytes);

  const jpgPath = `/tmp/${hash}.jpg`;

  const statusCode = await imagick(
    ["psd:-", "-flatten", "-quality", "90", jpgPath],
    bytes
  );
  if (statusCode) {
    console.error(`PSD conversion failed for ${conversionId}:`, statusCode);
    return { ok: false, reason: "CONVERSION_FAILED" };
  }

  const uploadResult = await uploadJpgToS3(jpgPath, hash);
  if (!uploadResult.success) {
    console.error(`PSD upload failed for ${conversionId}:`, uploadResult.error);
    return { ok: false, reason: "INTERNAL_ERROR" };
  }
  return { ok: true };
};

function sha256Hash(bytes: Uint8Array): string {
  const hash = createHash("sha256");
  hash.update(bytes);
  return hash.digest("hex");
}

async function uploadJpgToS3(
  filePath: string,
  hash: string
): Promise<{ success: true } | { success: false; error: string }> {
  const fileBuffer = await readFile(filePath);
  await s3.putObject(`psd-converted/${hash}.jpg`, fileBuffer, "image/jpeg");

  return { success: true };
}
