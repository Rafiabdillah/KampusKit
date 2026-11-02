import { describe, it, expect } from 'vitest';
import { prepareCloudValue } from '../src/services/storage';
import { STORAGE_KEYS } from '../src/services/storageKeys';

describe('prepareCloudValue', () => {
  it('passes small documents through unchanged', () => {
    const raw = JSON.stringify([{ id: 'n1', title: 'Catatan' }]);
    expect(prepareCloudValue(STORAGE_KEYS.NOTES, raw)).toBe(raw);
  });

  it('strips oversized library attachments from the cloud copy', () => {
    const books = [
      { id: 'b1', title: 'Buku Besar', fileData: `data:application/pdf;base64,${'A'.repeat(200_000)}` },
      { id: 'b2', title: 'Buku Kecil', fileData: 'data:application/pdf;base64,AAAA' }
    ];

    const prepared = prepareCloudValue(STORAGE_KEYS.LIBRARY_BOOKS, JSON.stringify(books));
    expect(prepared).not.toBeNull();

    const parsed = JSON.parse(prepared as string);
    expect(parsed[0].title).toBe('Buku Besar');
    expect(parsed[0].fileData).toBeUndefined();
    expect(parsed[0].fileDataOmitted).toBe(true);
    expect(parsed[1].fileData).toBe('data:application/pdf;base64,AAAA');
  });

  it('rejects documents that are still too large for Firestore', () => {
    expect(prepareCloudValue(STORAGE_KEYS.NOTES, 'x'.repeat(1_000_000))).toBeNull();
  });
});
