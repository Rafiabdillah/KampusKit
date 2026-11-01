import { Course } from '../types';
import { getAiHeaders } from './apiClient';

export interface GenerateFlashcardsOptions {
  text?: string;
  fileData?: string;
  mimeType?: string;
  fileName?: string;
  customInstructions?: string;
  signal?: AbortSignal;
}

export interface AiRequestOptions {
  signal?: AbortSignal;
  timeoutMs?: number;
}

/**
 * Robust fetch wrapper with automatic timeout (45s default) and cancellation support
 */
async function fetchAiWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = 45000,
  userSignal?: AbortSignal
): Promise<Response> {
  const controller = new AbortController();
  let timedOut = false;

  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  if (userSignal) {
    userSignal.addEventListener('abort', () => controller.abort());
  }

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    return response;
  } catch (error: any) {
    if (timedOut) {
      throw new Error(`Permintaan AI melebihi batas waktu (${Math.round(timeoutMs / 1000)} detik). Server atau model sedang sibuk, silakan coba lagi sebentar lagi.`, { cause: error });
    }
    if (userSignal?.aborted) {
      throw new Error('Permintaan AI dibatalkan oleh pengguna.', { cause: error });
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export class AIService {
  private static ensureOnline() {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      throw new Error('Perangkat Anda sedang offline (tanpa koneksi internet). Fitur AI ini memerlukan internet, namun seluruh data lokal Anda tetap aman dan dapat digunakan normal.');
    }
  }

  static async analyzeScheduleImage(
    base64Image: string, 
    mimeType: string,
    options?: AiRequestOptions
  ): Promise<Partial<Course>[] | null> {
    AIService.ensureOnline();
    try {
      const response = await fetchAiWithTimeout(
        '/api/vision',
        {
          method: 'POST',
          headers: getAiHeaders(),
          body: JSON.stringify({ image: base64Image, mimeType })
        },
        options?.timeoutMs || 50000,
        options?.signal
      );
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Gagal menganalisis jadwal (Status ${response.status})`);
      }
      const data = await response.json();
      
      if (Array.isArray(data)) {
        return data;
      } else if (data && typeof data === 'object') {
        return [data];
      }
      return null;
    } catch (error: any) {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        throw new Error('Perangkat Anda sedang offline. Pindai jadwal OCR memerlukan koneksi internet.', { cause: error });
      }
      console.error('Error analyzing schedule image:', error);
      throw error;
    }
  }

  static async generateFlashcards(
    input: string | GenerateFlashcardsOptions,
    options?: AiRequestOptions
  ): Promise<{ front: string; back: string }[]> {
    AIService.ensureOnline();
    try {
      const payload = typeof input === 'string' ? { text: input } : input;
      const effectiveSignal = (typeof input === 'object' && input.signal) || options?.signal;

      const response = await fetchAiWithTimeout(
        '/api/generate-flashcards',
        {
          method: 'POST',
          headers: getAiHeaders(),
          body: JSON.stringify(payload)
        },
        options?.timeoutMs || 50000,
        effectiveSignal
      );
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Gagal membuat flashcards (Status ${response.status})`);
      }
      const data = await response.json();
      
      if (Array.isArray(data)) return data;
      return [];
    } catch (error: any) {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        throw new Error('Perangkat Anda sedang offline. Pembuatan kartu flashcards dengan AI memerlukan internet.', { cause: error });
      }
      console.error('Error generating flashcards:', error);
      throw error;
    }
  }

  static async generateExtraQuizzes(
    topic: string, 
    options: { count?: number; level?: string; previousQuestions?: string[]; signal?: AbortSignal } = {}
  ): Promise<any[]> {
    AIService.ensureOnline();
    try {
      const response = await fetchAiWithTimeout(
        '/api/micro-learning-quiz',
        {
          method: 'POST',
          headers: getAiHeaders(),
          body: JSON.stringify({ 
            topic,
            count: options.count || 3,
            level: options.level || 'menengah',
            previousQuestions: options.previousQuestions || []
          })
        },
        45000,
        options.signal
      );
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Gagal memuat soal kuis (Status ${response.status})`);
      }
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error: any) {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        throw new Error('Perangkat Anda sedang offline. Kuis tambahan memerlukan koneksi internet.', { cause: error });
      }
      console.error('Error generating extra quizzes:', error);
      throw error;
    }
  }

  static async generateMicroLesson(topic: string, options?: AiRequestOptions): Promise<any> {
    AIService.ensureOnline();
    try {
      const response = await fetchAiWithTimeout(
        '/api/micro-learning',
        {
          method: 'POST',
          headers: getAiHeaders(),
          body: JSON.stringify({ topic })
        },
        45000,
        options?.signal
      );
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Gagal menghasilkan materi micro-learning (Status ${response.status})`);
      }
      return await response.json();
    } catch (error: any) {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        throw new Error('Perangkat Anda sedang offline. Micro Lesson baru memerlukan koneksi internet.', { cause: error });
      }
      console.error('Error generating micro lesson:', error);
      throw error;
    }
  }

  static async generateLearningPath(
    topic: string, 
    background?: string,
    options?: AiRequestOptions
  ): Promise<any> {
    AIService.ensureOnline();
    try {
      const response = await fetchAiWithTimeout(
        '/api/learning-path',
        {
          method: 'POST',
          headers: getAiHeaders(),
          body: JSON.stringify({ topic, background })
        },
        45000,
        options?.signal
      );
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Gagal membuat learning path (Status ${response.status})`);
      }
      return await response.json();
    } catch (error: any) {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        throw new Error('Perangkat Anda sedang offline. Learning path baru memerlukan koneksi internet.', { cause: error });
      }
      console.error('Error generating learning path:', error);
      throw error;
    }
  }

  static async generateCurriculum(
    params: {
      topic: string;
      domain?: 'AKADEMIK' | 'PRIBADI' | 'HYBRID';
      difficulty?: 'PEMULA' | 'MENENGAH' | 'MAHIR';
      targetWeeks?: number;
      focusGoal?: string;
    },
    options?: AiRequestOptions
  ): Promise<any> {
    AIService.ensureOnline();
    try {
      const response = await fetchAiWithTimeout(
        '/api/curriculum/generate',
        {
          method: 'POST',
          headers: getAiHeaders(),
          body: JSON.stringify(params)
        },
        50000,
        options?.signal
      );
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Gagal merancang kurikulum belajar (Status ${response.status})`);
      }
      return await response.json();
    } catch (error: any) {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        throw new Error('Perangkat Anda sedang offline. Pembuatan kurikulum baru memerlukan koneksi internet, namun Anda tetap dapat membuka kurikulum bawaan.', { cause: error });
      }
      console.error('Error generating curriculum:', error);
      throw error;
    }
  }
}
