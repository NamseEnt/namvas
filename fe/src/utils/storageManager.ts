import { type ArtworkDefinition, type ArtworkMetadata } from "@/types/artwork";

// OPFS Storage Manager - Chrome 86+, Firefox 111+ only
class OPFSStorage {
  private rootHandle: FileSystemDirectoryHandle | null = null;

  private async getRoot(): Promise<FileSystemDirectoryHandle> {
    if (!this.rootHandle) {
      this.rootHandle = await navigator.storage.getDirectory();
    }
    return this.rootHandle;
  }

  async saveArtwork(artwork: ArtworkDefinition): Promise<void> {
    const root = await this.getRoot();
    const fileHandle = await root.getFileHandle("artwork.json", {
      create: true,
    });
    const writable = await fileHandle.createWritable();
    await writable.write(JSON.stringify(artwork));
    await writable.close();
  }

  async getArtwork(): Promise<ArtworkDefinition | undefined> {
    try {
      const root = await this.getRoot();
      const fileHandle = await root.getFileHandle("artwork.json");
      const file = await fileHandle.getFile();
      const text = await file.text();
      return JSON.parse(text) as ArtworkDefinition;
    } catch (error) {
      // File doesn't exist
      return undefined;
    }
  }

  async saveTexture(textureDataUrl: string): Promise<void> {
    const root = await this.getRoot();
    const fileHandle = await root.getFileHandle("texture.txt", {
      create: true,
    });
    const writable = await fileHandle.createWritable();
    await writable.write(textureDataUrl);
    await writable.close();
  }

  async getTexture(): Promise<string | undefined> {
    try {
      const root = await this.getRoot();
      const fileHandle = await root.getFileHandle("texture.txt");
      const file = await fileHandle.getFile();
      return await file.text();
    } catch (error) {
      // File doesn't exist
      return undefined;
    }
  }

  async saveImage(imageDataUrl: string): Promise<void> {
    const root = await this.getRoot();
    const fileHandle = await root.getFileHandle("image.txt", { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(imageDataUrl);
    await writable.close();
  }

  async getImage(): Promise<string | undefined> {
    try {
      const root = await this.getRoot();
      const fileHandle = await root.getFileHandle("image.txt");
      const file = await fileHandle.getFile();
      return await file.text();
    } catch (error) {
      // File doesn't exist
      return undefined;
    }
  }

  async saveMetadata(metadata: ArtworkMetadata): Promise<void> {
    const root = await this.getRoot();
    const fileHandle = await root.getFileHandle("metadata.json", {
      create: true,
    });
    const writable = await fileHandle.createWritable();
    await writable.write(JSON.stringify(metadata));
    await writable.close();
  }

  async getMetadata(): Promise<ArtworkMetadata | undefined> {
    try {
      const root = await this.getRoot();
      const fileHandle = await root.getFileHandle("metadata.json");
      const file = await fileHandle.getFile();
      const text = await file.text();
      return JSON.parse(text) as ArtworkMetadata;
    } catch (error) {
      // File doesn't exist
      return undefined;
    }
  }

  async clear(): Promise<void> {
    const root = await this.getRoot();

    // Remove files if they exist
    const filesToRemove = [
      "artwork.json",
      "texture.txt",
      "image.txt",
      "metadata.json",
    ];

    for (const filename of filesToRemove) {
      try {
        await root.removeEntry(filename);
      } catch (e) {
        // File doesn't exist, ignore
      }
    }
  }
}

// Export singleton instance
export const storageManager = new OPFSStorage();

// Export for compatibility
export const saveArtworkToStorage = (artwork: ArtworkDefinition) =>
  storageManager.saveArtwork(artwork);
export const getArtworkFromStorage = () => storageManager.getArtwork();
export const saveTextureToStorage = (textureDataUrl: string) =>
  storageManager.saveTexture(textureDataUrl);
export const getTextureFromStorage = () => storageManager.getTexture();
export const clearStorage = () => storageManager.clear();
// New efficient storage methods
export const saveImageToStorage = (imageDataUrl: string) =>
  storageManager.saveImage(imageDataUrl);
export const getImageFromStorage = () => storageManager.getImage();
export const saveMetadataToStorage = (metadata: ArtworkMetadata) =>
  storageManager.saveMetadata(metadata);
export const getMetadataFromStorage = () => storageManager.getMetadata();
