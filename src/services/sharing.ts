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

export const SharingService = {
  createShareLink: async (type: SharedDataType, data: any): Promise<string> => {
    const auth = getAuth();
    if (!auth.currentUser) {
      throw new Error("Harus login untuk membagikan data.");
    }

    const linkId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const docRef = doc(db, 'shared_links', linkId);

    const payload: SharedDataPayload = {
      type,
      data: JSON.stringify(data),
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
    const docRef = doc(db, 'shared_links', linkId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const payload = docSnap.data() as SharedDataPayload;
      return {
        type: payload.type,
        data: JSON.parse(payload.data)
      };
    } else {
      return null;
    }
  }
};
