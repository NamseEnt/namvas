import { S3Interface, GetObjectResult } from "./index";

interface StoredObject {
  body: Uint8Array;
  contentType?: string;
  metadata?: Record<string, string>;
}

export class LocalS3LLRT implements S3Interface {
  private readonly storage = new Map<string, Map<string, StoredObject>>();

  private getBucket(bucketName: string): Map<string, StoredObject> {
    if (!this.storage.has(bucketName)) {
      this.storage.set(bucketName, new Map());
    }
    return this.storage.get(bucketName)!;
  }

  private convertToUint8Array(body: string | Uint8Array | Buffer): Uint8Array {
    if (typeof body === 'string') {
      return new TextEncoder().encode(body);
    }
    if (body instanceof Buffer) {
      return new Uint8Array(body);
    }
    return body;
  }

  async getObject(bucket: string, key: string): Promise<GetObjectResult | null> {
    const bucketStorage = this.getBucket(bucket);
    const object = bucketStorage.get(key);
    
    if (!object) {
      return null;
    }

    return {
      Body: object.body,
      ContentType: object.contentType,
      Metadata: object.metadata,
    };
  }

  async putObject(bucket: string, key: string, body: string | Uint8Array | Buffer, contentType?: string): Promise<void> {
    const bucketStorage = this.getBucket(bucket);
    const bodyUint8 = this.convertToUint8Array(body);
    
    bucketStorage.set(key, {
      body: bodyUint8,
      contentType,
      metadata: {},
    });
  }

  async getPresignedUrl(bucket: string, key: string, operation: 'getObject' | 'putObject', expiresIn: number = 3600): Promise<string> {
    // For LLRT/testing, return a mock URL
    const timestamp = Date.now() + expiresIn * 1000;
    return `https://mock-s3.example.com/${bucket}/${key}?expires=${timestamp}&operation=${operation}`;
  }

  // Helper methods for testing
  deleteObject(bucket: string, key: string): void {
    const bucketStorage = this.getBucket(bucket);
    bucketStorage.delete(key);
  }

  listObjects(bucket: string, prefix?: string): string[] {
    const bucketStorage = this.getBucket(bucket);
    const keys = Array.from(bucketStorage.keys());
    
    if (prefix) {
      return keys.filter(key => key.startsWith(prefix));
    }
    
    return keys;
  }

  clear(): void {
    this.storage.clear();
  }

  // Helper method to get storage stats (useful for debugging)
  getStats(): { buckets: number; totalObjects: number } {
    let totalObjects = 0;
    for (const bucket of this.storage.values()) {
      totalObjects += bucket.size;
    }
    return {
      buckets: this.storage.size,
      totalObjects,
    };
  }

  // Helper method to get object as string (useful for testing)
  async getObjectAsString(bucket: string, key: string): Promise<string | null> {
    const result = await this.getObject(bucket, key);
    if (!result || !result.Body) {
      return null;
    }
    
    if (result.Body instanceof Uint8Array) {
      return new TextDecoder().decode(result.Body);
    }
    
    return result.Body as string;
  }
}