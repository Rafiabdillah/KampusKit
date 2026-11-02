import { db } from './firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

export type SharedDataType = 'schedule' | 'flashcards';

export interface SharedDataPayload {
  type: SharedDataType;
  data: string; // JSON stringified data
  createdBy: string;
  createdAt: any;
}

const SHARE_ID_PATTERN = /^[A-Za-z0-9_-]{20,128}$/;
const MAX_SHARE_PAYLOAD_BYTES = 900_000;

function createShareId(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

export const SharingService = {
  createShareLink: async (type: SharedDataType, data: any): Promise<string> => {
    const auth = getAuth();
    if (!auth.currentUser) {
      throw new Error("Harus login untuk membagikan data.");
    }

    const serialized = JSON.stringify(data);
    if (new Blob([serialized]).size > MAX_SHARE_PAYLOAD_BYTES) {
      throw new Error("Data terlalu besar untuk dibagikan (maksimal ±900 KB).");
    }

    const linkId = createShareId();
    const docRef = doc(db, 'shared_links', linkId);

    const payload: SharedDataPayload = {
      type,
      data: serialized,
      createdBy: auth.currentUser.uid,
      createdAt: serverTimestamp(),
    };

    await setDoc(docRef, payload);
    
    // Return the full URL
    const url = new URL(window.location.href);
    url.searchParams.set('shareId', linkId);
    return url.toString();
  },

  getSharedData: async (linkId: string): Promise<{ type: SharedDataType, data: any } | null> => {
    if (!SHARE_ID_PATTERN.test(linkId)) return null;

    const docRef = doc(db, 'shared_links', linkId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;

    const payload = docSnap.data() as SharedDataPayload;
    if (payload.type !== 'schedule' && payload.type !== 'flashcards') return null;
    if (typeof payload.data !== 'string' || payload.data.length > MAX_SHARE_PAYLOAD_BYTES) return null;

    try {
      return { type: payload.type, data: JSON.parse(payload.data) };
    } catch {
      return null;
    }
  }
};
