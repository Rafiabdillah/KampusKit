import { auth } from './firebase';

export const GEMINI_STORAGE_KEY = 'gemini_custom_api_key';

/**
 * Optional absolute origin of the KampusKit API server.
 * Empty for web/desktop builds (same-origin). Set VITE_API_BASE_URL when the
 * static app is packaged natively (Android/iOS) and talks to a hosted server.
 */
export const API_BASE = ((import.meta.env.VITE_API_BASE_URL as string | undefined) || '').replace(/\/+$/, '');

export function apiUrl(path: string): string {
  return `${API_BASE}${path}`;
}

export function isNativeShell(): boolean {
  return typeof window !== 'undefined' && !!(window as any).Capacitor?.isNativePlatform?.();
}

let cachedAuthToken: string | null = null;

// Track auth state to cache token for sync API calls
if (typeof window !== 'undefined') {
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      try {
        cachedAuthToken = await user.getIdToken();
      } catch {
        cachedAuthToken = null;
      }
    } else {
      cachedAuthToken = null;
    }
  });

  // Token refresh interval
  setInterval(async () => {
    if (auth.currentUser) {
      try {
        cachedAuthToken = await auth.currentUser.getIdToken(true);
      } catch {
        // ignore
      }
    }
  }, 40 * 60 * 1000);

  // Auto-migration: Strip geminiApiKey from user_profile in localStorage if present
  try {
    const rawProfile = localStorage.getItem('user_profile');
    if (rawProfile) {
      const parsed = JSON.parse(rawProfile);
      if (parsed && parsed.geminiApiKey) {
        if (!localStorage.getItem(GEMINI_STORAGE_KEY) && parsed.geminiApiKey.trim()) {
          localStorage.setItem(GEMINI_STORAGE_KEY, parsed.geminiApiKey.trim());
        }
        delete parsed.geminiApiKey;
        localStorage.setItem('user_profile', JSON.stringify(parsed));
      }
    }
  } catch {
    // ignore
  }
}

/**
 * Retrieves the custom Gemini API Key saved locally by the user.
 * STRICT SECURITY: Never loaded from or synced to cloud/user_profile.
 */
export function getCustomGeminiKey(): string {
  try {
    const directKey = localStorage.getItem(GEMINI_STORAGE_KEY);
    if (directKey && directKey.trim()) {
      return directKey.trim();
    }
  } catch (err) {
    console.warn("Error reading custom Gemini key:", err);
  }
  return '';
}

/**
 * Saves or clears the custom Gemini API Key strictly in device localStorage.
 */
export function setCustomGeminiKey(key: string): void {
  const trimmed = key.trim();
  if (!trimmed) {
    localStorage.removeItem(GEMINI_STORAGE_KEY);
  } else {
    localStorage.setItem(GEMINI_STORAGE_KEY, trimmed);
  }

  // Ensure user_profile does NOT contain API key
  try {
    const rawProfile = localStorage.getItem('user_profile');
    if (rawProfile) {
      const parsed = JSON.parse(rawProfile);
      if (parsed && 'geminiApiKey' in parsed) {
        delete parsed.geminiApiKey;
        localStorage.setItem('user_profile', JSON.stringify(parsed));
      }
    }
  } catch {
    // ignore
  }
}

/**
 * Generates fetch headers including x-gemini-api-key (if configured)
 * and Authorization: Bearer <idToken> (if authenticated).
 */
export function getAiHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...extraHeaders
  };
  const key = getCustomGeminiKey();
  if (key) {
    headers['x-gemini-api-key'] = key;
  }
  if (cachedAuthToken) {
    headers['Authorization'] = `Bearer ${cachedAuthToken}`;
  }
  return headers;
}

/**
 * Asynchronous header generator ensuring freshest Firebase token.
 */
export async function getAiHeadersAsync(extraHeaders: Record<string, string> = {}): Promise<Record<string, string>> {
  const headers = getAiHeaders(extraHeaders);
  if (auth.currentUser) {
    try {
      const token = await auth.currentUser.getIdToken();
      cachedAuthToken = token;
      headers['Authorization'] = `Bearer ${token}`;
    } catch {
      // fallback to cached
    }
  }
  return headers;
}
