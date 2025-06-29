import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME!;

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

    return await getSignedUrl(s3Client, command, {
      expiresIn: 300, // 5 minutes
    });
  },

  async getPresignedDownloadUrl(key: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    return await getSignedUrl(s3Client, command, {
      expiresIn: 300, // 5 minutes
    });
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

  async getObject(key: string): Promise<Buffer> {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const response = await s3Client.send(command);
    if (!response.Body) {
      throw new Error(`Object not found: ${key}`);
    }

    const chunks: Uint8Array[] = [];
    const stream = response.Body as any;

    for await (const chunk of stream) {
      chunks.push(chunk);
    }

    return Buffer.concat(chunks);
  },
};
