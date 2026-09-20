import { AfrinexCacheAdapter } from './adapter';
import { promises as fs } from 'fs';
import path from 'path';

export interface FsAdapterOptions {
  cacheDir?: string;
}

export class FsAdapter implements AfrinexCacheAdapter {
  private cacheDir: string;
  private initialized = false;

  constructor(options?: FsAdapterOptions) {
    this.cacheDir = options?.cacheDir ?? path.join(process.cwd(), '.afrinex', 'cache');
  }

  private sanitizeKey(key: string): string {
    return key.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 200) + '.json';
  }

  private async ensureDir(): Promise<void> {
    if (this.initialized) return;
    try {
      await fs.mkdir(this.cacheDir, { recursive: true });
      this.initialized = true;
    } catch (error) {
      // Ignore error, might already exist or fail on next write
    }
  }

  private getFilePath(key: string): string {
    return path.join(this.cacheDir, this.sanitizeKey(key));
  }

  async get(key: string): Promise<string | null> {
    try {
      const filePath = this.getFilePath(key);
      const data = await fs.readFile(filePath, 'utf-8');
      const parsed = JSON.parse(data);

      if (parsed.expiresAt !== null && Date.now() > parsed.expiresAt) {
        await this.delete(key);
        return null;
      }

      return parsed.value;
    } catch (error) {
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    await this.ensureDir();
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
    const filePath = this.getFilePath(key);
    const data = JSON.stringify({ value, expiresAt });
    
    try {
      await fs.writeFile(filePath, data, 'utf-8');
    } catch (error) {
      // Fail silently for cache
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await fs.unlink(this.getFilePath(key));
    } catch (error) {
      // Ignore if file doesn't exist
    }
  }

  async flush(): Promise<void> {
    try {
      const files = await fs.readdir(this.cacheDir);
      await Promise.all(
        files.map(file => fs.unlink(path.join(this.cacheDir, file)).catch(() => {}))
      );
    } catch (error) {
      // Ignore if dir doesn't exist
    }
  }
}
