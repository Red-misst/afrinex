import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryAdapter } from '../src/cache/memory.adapter';
import { FsAdapter } from '../src/cache/fs.adapter';
import os from 'os';
import path from 'path';
import { promises as fs } from 'fs';

describe('MemoryAdapter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('sets and gets a value', async () => {
    const cache = new MemoryAdapter();
    await cache.set('key1', 'value1');
    expect(await cache.get('key1')).toBe('value1');
  });

  it('expires a value with TTL', async () => {
    const cache = new MemoryAdapter();
    await cache.set('key1', 'value1', 5);
    expect(await cache.get('key1')).toBe('value1');

    vi.advanceTimersByTime(6000);
    expect(await cache.get('key1')).toBeNull();
  });

  it('returns null for missing key', async () => {
    const cache = new MemoryAdapter();
    expect(await cache.get('missing')).toBeNull();
  });

  it('deletes a value', async () => {
    const cache = new MemoryAdapter();
    await cache.set('key1', 'value1');
    await cache.delete('key1');
    expect(await cache.get('key1')).toBeNull();
  });
});

describe('FsAdapter', () => {
  let cacheDir: string;
  let cache: FsAdapter;

  beforeEach(async () => {
    vi.useFakeTimers();
    cacheDir = await fs.mkdtemp(path.join(os.tmpdir(), 'afrinex-cache-'));
    cache = new FsAdapter({ cacheDir });
  });

  afterEach(async () => {
    vi.useRealTimers();
    try {
      await fs.rm(cacheDir, { recursive: true, force: true });
    } catch {}
  });

  it('sets and gets a value', async () => {
    await cache.set('key1', 'value1');
    expect(await cache.get('key1')).toBe('value1');
  });

  it('expires a value with TTL', async () => {
    await cache.set('key1', 'value1', 5);
    expect(await cache.get('key1')).toBe('value1');

    vi.advanceTimersByTime(6000);
    expect(await cache.get('key1')).toBeNull();
  });

  it('returns null for missing key', async () => {
    expect(await cache.get('missing')).toBeNull();
  });

  it('deletes a value', async () => {
    await cache.set('key1', 'value1');
    await cache.delete('key1');
    expect(await cache.get('key1')).toBeNull();
  });
});
