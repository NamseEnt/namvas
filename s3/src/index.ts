import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Environment detection and client setup
async function createS3Client() {
  if (process.env.LAMBDA) {
    // Lambda environment - use S3
    return new S3Client();
  }

  // Non-Lambda environment - try LocalS3, fallback to LLRT version
  try {
    const { LocalS3 } = await import("./LocalS3");
    return new LocalS3();
  } catch (error) {
    console.warn("LocalS3 (filesystem) not available, using LLRT-compatible version");
    // LLRT environment - use in-memory implementation
    const { LocalS3LLRT } = await import("./LocalS3LLRT");
    return new LocalS3LLRT();
  }
}

// Create client instance
const _s3Client = await createS3Client();
export const s3Client = _s3Client;

// Unified interface
export interface S3Object {
  Key: string;
  Body?: string | Uint8Array | Buffer;
  ContentType?: string;
  Metadata?: Record<string, string>;
}

export interface GetObjectResult {
  Body?: string | Uint8Array;
  ContentType?: string;
  Metadata?: Record<string, string>;
}

export interface S3Interface {
  getObject(bucket: string, key: string): Promise<GetObjectResult | null>;
  putObject(bucket: string, key: string, body: string | Uint8Array | Buffer, contentType?: string): Promise<void>;
  getPresignedUrl(bucket: string, key: string, operation: 'getObject' | 'putObject', expiresIn?: number): Promise<string>;
}

// Fallback implementations for LLRT
async function getObjectStub(bucket: string, key: string): Promise<GetObjectResult | null> {
  return null;
}

async function putObjectStub(bucket: string, key: string, body: string | Uint8Array | Buffer, contentType?: string): Promise<void> {
  // No-op
}

async function getPresignedUrlStub(bucket: string, key: string, operation: 'getObject' | 'putObject', expiresIn?: number): Promise<string> {
  return `https://stub-url.com/${bucket}/${key}`;
}

// Export unified functions
export const getObject = s3Client.getObject?.bind(s3Client) || getObjectStub;
export const putObject = s3Client.putObject?.bind(s3Client) || putObjectStub;
export const getPresignedUrl = s3Client.getPresignedUrl?.bind(s3Client) || getPresignedUrlStub;