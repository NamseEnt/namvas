import { promises as fs } from "fs";
import { join, dirname } from "path";
import { S3Interface, GetObjectResult } from "./index";

export class LocalS3 implements S3Interface {
  private readonly baseDir = "./storage";

  private getFilePath(bucket: string, key: string): string {
    return join(this.baseDir, bucket, key);
  }

  private getMetadataPath(bucket: string, key: string): string {
    return join(this.baseDir, bucket, `.metadata_${key}.json`);
  }

  async getObject(bucket: string, key: string): Promise<GetObjectResult | null> {
    try {
      const filePath = this.getFilePath(bucket, key);
      const metadataPath = this.getMetadataPath(bucket, key);

      const body = await fs.readFile(filePath);
      
      let metadata: Record<string, string> = {};
      let contentType: string | undefined;
      
      try {
        const metadataContent = await fs.readFile(metadataPath, 'utf-8');
        const metadataObj = JSON.parse(metadataContent);
        metadata = metadataObj.metadata || {};
        contentType = metadataObj.contentType;
      } catch {
        // Metadata file doesn't exist, that's ok
      }

      return {
        Body: body,
        ContentType: contentType,
        Metadata: metadata,
      };
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  async putObject(bucket: string, key: string, body: string | Uint8Array | Buffer, contentType?: string): Promise<void> {
    const filePath = this.getFilePath(bucket, key);
    const metadataPath = this.getMetadataPath(bucket, key);

    // Ensure directory exists
    await fs.mkdir(dirname(filePath), { recursive: true });

    // Write file
    await fs.writeFile(filePath, body);

    // Write metadata if provided
    if (contentType) {
      const metadata = {
        contentType,
        metadata: {},
      };
      await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
    }
  }

  async getPresignedUrl(bucket: string, key: string, operation: 'getObject' | 'putObject', expiresIn: number = 3600): Promise<string> {
    // For local development, return a local file URL or a mock URL
    const timestamp = Date.now() + expiresIn * 1000;
    return `http://localhost:3000/storage/${bucket}/${key}?expires=${timestamp}&operation=${operation}`;
  }

  // Helper methods for testing
  async deleteObject(bucket: string, key: string): Promise<void> {
    try {
      const filePath = this.getFilePath(bucket, key);
      const metadataPath = this.getMetadataPath(bucket, key);
      
      await fs.unlink(filePath);
      
      try {
        await fs.unlink(metadataPath);
      } catch {
        // Metadata file might not exist
      }
    } catch (error) {
      if ((error as any).code !== 'ENOENT') {
        throw error;
      }
    }
  }

  async listObjects(bucket: string, prefix?: string): Promise<string[]> {
    try {
      const bucketDir = join(this.baseDir, bucket);
      const files = await fs.readdir(bucketDir);
      
      // Filter out metadata files and apply prefix filter
      const objectKeys = files
        .filter(file => !file.startsWith('.metadata_'))
        .filter(file => !prefix || file.startsWith(prefix));
      
      return objectKeys;
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      await fs.rm(this.baseDir, { recursive: true, force: true });
    } catch {
      // Directory might not exist
    }
  }
}