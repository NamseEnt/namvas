import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { isLocalDev } from "./isLocalDev";
import { s3ClientConfig } from "./config";

const s3Client = new S3Client(s3ClientConfig);
const localS3Client = new S3Client({
  ...s3ClientConfig,
  endpoint: "http://localhost:4566",
});

const BUCKET_NAME =
  process.env.S3_BUCKET_NAME || (isLocalDev() ? "namvas-local" : undefined);

export const s3 = {
  getPresignedUploadUrl: async (
    key: string,
    contentLength: number,
    contentType: string
  ): Promise<string> => {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentLength: contentLength,
      ContentType: contentType,
    });

    return await getSignedUrl(
      isLocalDev() ? localS3Client : s3Client,
      command,
      {
        expiresIn: 300,
      }
    );
  },

  async putObject(
    key: string,
    body: Buffer | Uint8Array | string,
    contentType?: string
  ): Promise<void> {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentType,
    });

    await s3Client.send(command);
  },

  async getObject(key: string): Promise<Uint8Array | undefined> {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const response = await s3Client.send(command);
    return response.Body?.transformToByteArray();
  },
};
