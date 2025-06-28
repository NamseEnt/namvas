import { type ArtworkDefinition } from "@/types/artwork";

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
    const fileHandle = await root.getFileHandle('artwork.json', { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(JSON.stringify(artwork));
    await writable.close();
  }

  async getArtwork(): Promise<ArtworkDefinition | null> {
    try {
      const root = await this.getRoot();
      const fileHandle = await root.getFileHandle('artwork.json');
      const file = await fileHandle.getFile();
      const text = await file.text();
      return JSON.parse(text) as ArtworkDefinition;
    } catch (error) {
      // File doesn't exist
      return null;
    }
  }

  async saveTexture(textureDataUrl: string): Promise<void> {
    const root = await this.getRoot();
    const fileHandle = await root.getFileHandle('texture.txt', { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(textureDataUrl);
    await writable.close();
  }

  async getTexture(): Promise<string | null> {
    try {
      const root = await this.getRoot();
      const fileHandle = await root.getFileHandle('texture.txt');
      const file = await fileHandle.getFile();
      return await file.text();
    } catch (error) {
      // File doesn't exist
      return null;
    }
  }

  async clear(): Promise<void> {
    const root = await this.getRoot();
    
    // Remove files if they exist
    try {
      await root.removeEntry('artwork.json');
    } catch (e) {
      // File doesn't exist, ignore
    }
    
    try {
      await root.removeEntry('texture.txt');
    } catch (e) {
      // File doesn't exist, ignore
    }
  }
}

// Export singleton instance
export const storageManager = new OPFSStorage();

// Export for compatibility
export const saveArtworkToStorage = (artwork: ArtworkDefinition) => storageManager.saveArtwork(artwork);
export const getArtworkFromStorage = () => storageManager.getArtwork();
export const saveTextureToStorage = (textureDataUrl: string) => storageManager.saveTexture(textureDataUrl);
export const getTextureFromStorage = () => storageManager.getTexture();
export const clearStorage = () => storageManager.clear();