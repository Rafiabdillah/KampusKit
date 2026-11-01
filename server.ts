import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  const PRIMARY_MODEL = process.env.PRIMARY_MODEL || "gemini-3.8-flash";
  const FALLBACK_MODEL = process.env.FALLBACK_MODEL || "gemini-3.5-flash-lite";

  let FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || "favorable-ally-phh41";
  try {
    const configPath = path.resolve(process.cwd(), "firebase-applet-config.json");
    if (fs.existsSync(configPath)) {
      const cfg = JSON.parse(fs.readFileSync(configPath, "utf8"));
      if (cfg.projectId) FIREBASE_PROJECT_ID = cfg.projectId;
    }
  } catch {
    // ignore
  }

  function getHumanErrorMessage(error: any): string {
    const raw = typeof error === 'string' ? error : (error?.message || JSON.stringify(error || ''));
    if (
      raw.includes("401") ||
      raw.includes("UNAUTHENTICATED") ||
      raw.includes("ACCESS_TOKEN_TYPE_UNSUPPORTED") ||
      raw.includes("API_KEY_SERVICE_BLOCKED") ||
      raw.includes("Request had invalid authentication credentials")
    ) {
      return "Kunci API Gemini tidak valid atau belum diizinkan untuk 'Generative Language API'. Pastikan API Key diatur di Settings (ambil kunci dari Google AI Studio: aistudio.google.com).";
    }
    if (raw.includes("403") || raw.includes("PERMISSION_DENIED") || raw.includes("SERVICE_DISABLED")) {
      return "Generative Language API belum diaktifkan pada Google Cloud Project Anda. Aktifkan di console.developers.google.com atau gunakan API Key dari Google AI Studio.";
    }
    if (raw.includes("429") || raw.includes("RESOURCE_EXHAUSTED") || raw.toLowerCase().includes("quota")) {
      return "Batas kuota Gemini API tercapai sementara. Silakan coba kembali sesaat lagi.";
    }
    return raw.length > 200 ? raw.substring(0, 200) + "..." : raw;
  }

  function basicOfflineFormat(content: string, noteTitle?: string): string {
    const title = noteTitle && noteTitle.trim() ? noteTitle.trim() : 'Catatan Perkuliahan';
    const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
    const body = lines.map(line => {
      if (line.startsWith('#') || line.startsWith('-') || line.startsWith('*') || line.startsWith('>')) {
        return line;
      }
      return `- ${line}`;
    }).join('\n');

    return `<!-- Format dasar offline, bukan hasil AI -->\n# ${title}\n\n${body}`;
  }

  function safeJsonParse<T>(rawText: string, validator?: (val: any) => boolean): { success: boolean; data?: T; error?: string } {
    try {
      let text = rawText.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
      const firstBracket = text.indexOf('[');
      const firstBrace = text.indexOf('{');
      if (firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)) {
        const lastBracket = text.lastIndexOf(']');
        if (lastBracket !== -1) text = text.substring(firstBracket, lastBracket + 1);
      } else if (firstBrace !== -1) {
        const lastBrace = text.lastIndexOf('}');
        if (lastBrace !== -1) text = text.substring(firstBrace, lastBrace + 1);
      }

      const parsed = JSON.parse(text);
      if (validator && !validator(parsed)) {
        return { success: false, error: "Struktur data respons model tidak sesuai format" };
      }
      return { success: true, data: parsed };
    } catch (err: any) {
      return { success: false, error: err?.message || "Gagal mengurai respons JSON model" };
    }
  }

  function getApiKeyFromReq(req?: express.Request): string {
    if (!req) return process.env.GEMINI_API_KEY || "";
    const headerKey = req.headers['x-gemini-api-key'];
    if (typeof headerKey === 'string' && headerKey.trim()) {
      return headerKey.trim();
    }
    if (req.body && typeof req.body.customApiKey === 'string' && req.body.customApiKey.trim()) {
      return req.body.customApiKey.trim();
    }
    return process.env.GEMINI_API_KEY || "";
  }

  function getAIClient(req?: express.Request): GoogleGenAI {
    const apiKey = getApiKeyFromReq(req);
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured");
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: { 'User-Agent': 'aistudio-build' }
      }
    });
  }

  interface GoogleCertsCache {
    certs: Record<string, string>;
    expiresAt: number;
  }
  let certsCache: GoogleCertsCache | null = null;

  async function getGooglePublicCerts(): Promise<Record<string, string>> {
    const now = Date.now();
    if (certsCache && certsCache.expiresAt > now) {
      return certsCache.certs;
    }
    try {
      const res = await fetch("https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com");
      if (!res.ok) throw new Error("Failed to fetch Google certs");
      const certs = (await res.json()) as Record<string, string>;
      let maxAge = 6 * 3600 * 1000;
      const cc = res.headers.get("cache-control");
      if (cc) {
        const match = cc.match(/max-age=(\d+)/);
        if (match) maxAge = parseInt(match[1], 10) * 1000;
      }
      certsCache = { certs, expiresAt: now + maxAge };
      return certs;
    } catch (err) {
      if (certsCache) return certsCache.certs;
      throw err;
    }
  }

  async function verifyFirebaseIdToken(token: string, expectedProjectId: string): Promise<{ uid: string; email?: string } | null> {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const [headerB64, payloadB64, signatureB64] = parts;

      const header = JSON.parse(Buffer.from(headerB64, 'base64url').toString('utf8'));
      const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));

      if (header.alg !== 'RS256' || !header.kid) return null;

      const nowSec = Math.floor(Date.now() / 1000);
      if (payload.exp < nowSec - 300) return null;
      if (payload.auth_time > nowSec + 300) return null;
      if (payload.aud !== expectedProjectId) return null;
      if (payload.iss !== `https://securetoken.google.com/${expectedProjectId}`) return null;
      if (!payload.sub || typeof payload.sub !== 'string') return null;

      const certs = await getGooglePublicCerts();
      const cert = certs[header.kid];
      if (!cert) return null;

      const verifier = crypto.createVerify('RSA-SHA256');
      verifier.update(`${headerB64}.${payloadB64}`);
      const isValid = verifier.verify(cert, signatureB64, 'base64url');
      if (!isValid) return null;

      return { uid: payload.sub, email: payload.email };
    } catch {
      return null;
    }
  }

  // Rate limiter factory
  interface RateLimitRecord {
    count: number;
    resetAt: number;
  }

  function createRateLimiter(options: { max: number; windowMs: number; name: string }) {
    const store = new Map<string, RateLimitRecord>();

    setInterval(() => {
      const now = Date.now();
      for (const [key, record] of store.entries()) {
        if (record.resetAt <= now) {
          store.delete(key);
        }
      }
    }, options.windowMs);

    return (req: express.Request, res: express.Response, next: express.NextFunction) => {
      const id = (req as any).user?.uid || req.ip || req.headers['x-forwarded-for'] || 'anonymous';
      const key = String(id);
      const now = Date.now();
      let record = store.get(key);

      if (!record || record.resetAt <= now) {
        record = { count: 1, resetAt: now + options.windowMs };
        store.set(key, record);
        return next();
      }

      if (record.count >= options.max) {
        const waitSec = Math.ceil((record.resetAt - now) / 1000);
        return res.status(429).json({
          error: `Batas frekuensi permintaan AI tercapai (${options.max} req/menit). Harap tunggu ${waitSec} detik sebelum mencoba kembali.`
        });
      }

      record.count++;
      next();
    };
  }

  const standardAiLimiter = createRateLimiter({ max: 30, windowMs: 60 * 1000, name: 'standard_ai' });
  const heavyAiLimiter = createRateLimiter({ max: 10, windowMs: 60 * 1000, name: 'heavy_ai' });
  const logErrorLimiter = createRateLimiter({ max: 60, windowMs: 60 * 1000, name: 'log_error' });

  async function authenticateApiRequest(req: express.Request, res: express.Response, next: express.NextFunction) {
    // 1. Allow bypass if request carries user's custom Gemini API Key (BYOK mode)
    const customKey = req.headers['x-gemini-api-key'];
    if (typeof customKey === 'string' && customKey.trim().length >= 10) {
      (req as any).user = { uid: `byok_${customKey.trim().slice(0, 8)}`, isByok: true };
      return next();
    }

    // 2. Otherwise verify Firebase ID token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Akses ditolak (401). Harap login dengan akun Google atau masukkan API Key Gemini pribadi di Settings."
      });
    }

    const token = authHeader.substring(7).trim();
    if (!token) {
      return res.status(401).json({ error: "Token otentikasi kosong." });
    }

    const decoded = await verifyFirebaseIdToken(token, FIREBASE_PROJECT_ID);
    if (!decoded) {
      return res.status(401).json({
        error: "Sesi login tidak valid atau telah berakhir. Harap login kembali."
      });
    }

    (req as any).user = { uid: decoded.uid, email: decoded.email, isByok: false };
    next();
  }

  // Body limits: 12MB only for vision and flashcards upload, 2MB for default
  const defaultJsonParser = express.json({ limit: "2mb" });
  const uploadJsonParser = express.json({ limit: "12mb" });

  app.use("/api/vision", uploadJsonParser);
  app.use("/api/generate-flashcards", uploadJsonParser);
  app.use(defaultJsonParser);
  app.use(express.urlencoded({ extended: true, limit: "2mb" }));

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: Date.now() });
  });

  app.post("/api/log-error", logErrorLimiter, (req, res) => {
    try {
      const { message, stack, url } = req.body || {};
      const rawMsg = typeof message === 'string' ? message : '';
      const rawStack = typeof stack === 'string' ? stack : '';
      const rawUrl = typeof url === 'string' ? url : '';

      const stripControlChars = (str: string, maxLen: number) => {
        let result = '';
        for (let i = 0; i < str.length && result.length < maxLen; i++) {
          const code = str.charCodeAt(i);
          if (code >= 32 || code === 10 || code === 9) { // allow printable, newline, tab
            result += str[i];
          }
        }
        return result;
      };

      const cleanMsg = stripControlChars(rawMsg, 500);
      const cleanStack = stripControlChars(rawStack, 2000);
      const cleanUrl = stripControlChars(rawUrl, 200);

      if (cleanMsg) {
        console.warn(`[Client Error Log] ${cleanMsg} (URL: ${cleanUrl})`);
        if (cleanStack && process.env.NODE_ENV !== 'production') {
          console.warn(`[Client Stack] ${cleanStack}`);
        }
      }
      res.json({ ok: true });
    } catch {
      res.json({ ok: false });
    }
  });

  // Test Connectivity Endpoint for User-Configured or Default Gemini API Key
  app.post("/api/test-gemini", authenticateApiRequest, standardAiLimiter, async (req, res) => {
    try {
      const apiKey = getApiKeyFromReq(req);
      if (!apiKey) {
        return res.status(400).json({
          ok: false,
          error: "Kunci API Gemini belum diisi. Masukkan API Key dari Google AI Studio (aistudio.google.com)."
        });
      }

      const ai = getAIClient(req);
      const response = await ai.models.generateContent({
        model: PRIMARY_MODEL,
        contents: [{ role: "user", parts: [{ text: "Jawablah dengan 1 kalimat singkat bahwa sistem KampusBot siap membantu perkuliahan." }] }]
      });

      res.json({
        ok: true,
        message: "Koneksi ke Google Gemini AI berhasil! Model cloud aktif dan siap digunakan.",
        model: PRIMARY_MODEL,
        sample: response?.text || "Sistem KampusBot siap membantu."
      });
    } catch (error: any) {
      console.warn("Test Gemini Error:", error?.message || error);
      const friendly = getHumanErrorMessage(error);
      res.status(400).json({
        ok: false,
        error: friendly
      });
    }
  });

  // API routes FIRST
  app.post("/api/chat", authenticateApiRequest, standardAiLimiter, async (req, res) => {
    try {
      const { message, history, isDeepThinking } = req.body;
      const ai = getAIClient(req);
      
      const contents = (history || []).map((msg: any) => ({
        role: msg.isBot ? "model" : "user",
        parts: [{ text: msg.text }]
      }));
      contents.push({
        role: "user",
        parts: [{ text: message }]
      });

      let response;
      const systemInstruction = "You are KampusBot, a helpful, enthusiastic AI study assistant for Indonesian university students. You help students manage tasks, understand study materials, stay motivated, and keep track of their schedules. Reply in Indonesian, using a friendly and supportive tone. Be concise and practical.";

      try {
        if (isDeepThinking) {
          try {
            response = await ai.models.generateContent({
              model: PRIMARY_MODEL,
              contents,
              config: {
                systemInstruction,
                thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH }
              }
            });
          } catch (deepErr) {
            console.warn("Deep thinking failed, falling back to standard model", deepErr);
            response = await ai.models.generateContent({
              model: PRIMARY_MODEL,
              contents,
              config: { systemInstruction }
            });
          }
        } else {
          response = await ai.models.generateContent({
            model: PRIMARY_MODEL,
            contents,
            config: { systemInstruction }
          });
        }
      } catch (err: any) {
        console.warn("Standard Gemini call failed, retrying with fallback model...", err?.message);
        response = await ai.models.generateContent({
          model: FALLBACK_MODEL,
          contents,
          config: { systemInstruction }
        });
      }

      res.json({ text: response?.text || "", source: 'gemini_cloud' });
    } catch (error: any) {
      console.warn("Gemini Chat Error:", error?.message || error);
      const friendlyMsg = getHumanErrorMessage(error);
      const isQuota = (error?.status === 429) || (error?.message && error.message.includes('429')) || (error?.message && error.message.includes('Quota'));
      const status = isQuota ? 429 : (error?.status || 502);
      res.status(status).json({
        error: friendlyMsg,
        code: isQuota ? 'QUOTA_EXCEEDED' : 'AI_GATEWAY_ERROR'
      });
    }
  });

  // Dedicated AI Endpoint for Academic Notes Structuring & Polish
  app.post("/api/notes/ai", authenticateApiRequest, standardAiLimiter, async (req, res) => {
    const { content, action = 'improve', customPrompt = '', noteTitle = '' } = req.body;
    if (!content || typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({ error: "Catatan masih kosong. Tuliskan beberapa catatan terlebih dahulu." });
    }

    try {
      const ai = getAIClient(req);

      let taskInstruction = "";
      switch (action) {
        case 'cornell':
          taskInstruction = `Tugas: Susun ulang catatan berikut secara presisi menggunakan Metode Catatan Cornell (Cornell Note-Taking System) standar perkuliahan tinggi:
Format yang WAJIB digunakan:
## 📌 Pertanyaan Kunci & Kata Isyarat (Cue Column)
- (Daftar pertanyaan penuntun dan istilah kunci untuk menguji pemahaman diri / self-testing)

## 📝 Catatan Perkuliahan & Penjelasan Rinci (Notes Column)
- (Penjelasan terstruktur, detail rumus/teori/konsep, poin-poin bertingkat dengan **istilah penting** yang dipertegas)

## 💡 Ringkasan Inti (Summary)
> (Ringkasan padat 2-4 kalimat yang merangkum esensi utama materi untuk persiapan ujian)`;
          break;

        case 'summary':
          taskInstruction = `Tugas: Buat ringkasan eksekutif berbobot tinggi dari catatan berikut. Ekstrak 20% esensi materi yang mencakup 80% pemahaman (Prinsip Pareto).
Format yang WAJIB digunakan:
## ⚡ Inti Pokok Bahasan
(1 paragraf padat, jelas, dan to-the-point)

## 🔑 Konsep & Teori Kunci
- (Poin-poin konsep esensial dengan **istilah penting** dicetak tebal dan penjelasan ringkas)

## 🎯 Kesimpulan & Takeaways
> (Poin takeaway penting yang wajib diingat untuk praktikum atau ujian)`;
          break;

        case 'action_items':
          taskInstruction = `Tugas: Pindai catatan berikut dan ekstrak seluruh tugas kuliah, PR, jadwal kelompok, bahan bacaan/kajian yang harus dipelajari, serta deadline menjadi daftar ceklis aksi yang terorganisir:
Format yang WAJIB digunakan:
## ✅ Action Items & Rencana Tugas
- [ ] **[Prioritas Tinggi]** (Tugas/PR atau hal mendesak)
- [ ] **[Kajian & Bacaan]** (Materi/bab yang perlu dipelajari kembali)
- [ ] **[Follow-up]** (Hal yang perlu dikonfirmasi ke dosen/rekan kelompok)

(Catatan: Jika di catatan tidak ada tugas tertulis secara eksplisit, susunlah action plan langkah belajar mandiri yang logis berdasarkan topik catatan)`;
          break;

        case 'exam_quiz':
          taskInstruction = `Tugas: Berdasarkan catatan berikut, susunlah materi kuis latihan mandiri untuk melatih Active Recall mahasiswa menjelang ujian:
Format yang WAJIB digunakan:
## 🧠 Kuis Latihan Pemahaman & Active Recall
### Pilihan Ganda
1. (Pertanyaan pilihan ganda konseptual)
   A. ...  B. ...  C. ...  D. ...
2. (Pertanyaan pilihan ganda analitis)
   A. ...  B. ...  C. ...  D. ...

### Esai Singkat / Studi Kasus
3. (Pertanyaan pemahaman konsep)
4. (Pertanyaan aplikasi atau studi kasus)

---
<details>
<summary><b>🔍 Kunci Jawaban & Pembahasan (Klik untuk Buka)</b></summary>

1. **Jawaban: [Opsi]** - Penjelasan singkat mengapa opsi ini benar
2. **Jawaban: [Opsi]** - Penjelasan singkat mengapa opsi ini benar
3. **Pembahasan**: Penjelasan esensial
4. **Pembahasan**: Solusi langkah atau penalaran konsep
</details>`;
          break;

        case 'expand':
          taskInstruction = `Tugas: Kembangkan catatan singkat berikut menjadi penjelasan yang lebih mendalam, kaya, dan komprehensif tanpa menghilangkan poin aslinya.
- Berikan analogi sederhana untuk menjelaskan konsep yang rumit.
- Jelaskan istilah-istilah teknis yang masih samar dengan bahasa akademis yang mudah dipahami.
- Sertakan 1-2 contoh kasus konkret di dunia nyata/industri.
- Susun dengan heading rapi (##, ###) dan bullet points bertingkat.`;
          break;

        case 'custom':
          taskInstruction = `Tugas: ${customPrompt ? customPrompt.trim() : 'Rapikan catatan berikut dengan format terstruktur rapi, elegan, dan profesional.'}`;
          break;

        case 'improve':
        default:
          taskInstruction = `Tugas: Rapikan catatan berikut menjadi dokumen akademik yang terstruktur rapi, elegan, efisien, dan mudah dipelajari.
- Perbaiki kesalahan ejaan (sesuai kaidah PUEBI/EYD) dan tata bahasa yang membingungkan.
- Pisahkan sub-topik materi dengan heading hierarki yang jelas (##, ###).
- Gunakan bullet points terstruktur untuk penjelasan bertingkat.
- Cetak tebal (**bold**) istilah kunci dan definisi utama agar mudah dipindai mata secara visual.
- Buatkan tabel Markdown sederhana (| Kolom 1 | Kolom 2 |) jika terdapat data komparasi atau kategori.
- Sertakan callout quote (> 💡 **Konsep Kunci**: ...) untuk intisari materi.`;
          break;
      }

      const systemInstruction = `You are an Elite Academic Note Structurer & Knowledge Synthesizer (Editor Catatan Akademik Unggul) specialized in Indonesian university learning environments.

CRITICAL INSTRUCTIONS:
1. OUTPUT FORMAT: Output ONLY clean, pristine, beautifully structured Markdown ready for immediate insertion into student notes.
2. ABSOLUTE PROHIBITION: NEVER output conversational preambles (such as "Tentu, ini catatan yang sudah dirapikan:", "Halo!", "Berikut hasil perbaikannya:"). NEVER output conversational conclusions or pleasantries (such as "Semoga membantu!", "Semangat belajarnya!"). Output strictly the Markdown content.
3. ACCURACY & FIDELITY: Retain all real facts, equations, formulas, names, dates, and definitions from the original notes. Do not hallucinate unsupported claims.
4. TYPOGRAPHY & READABILITY:
   - Use clean Markdown headers (##, ###).
   - Use bold typography (**istilah penting**) for quick visual scanning.
   - Use clean lists, checklists (- [ ]), and Markdown tables where appropriate.
   - Keep spacing balanced, uncluttered, and readable.
5. LANGUAGE: Respond in fluent Indonesian (or English if the input note is in English), adhering to proper spelling and grammar.`;

      const userPrompt = `${taskInstruction}\n\n${noteTitle ? `Judul Catatan: "${noteTitle}"\n\n` : ''}Konten Catatan:\n"""\n${content}\n"""`;

      let response;
      try {
        response = await ai.models.generateContent({
          model: PRIMARY_MODEL,
          contents: [{ role: "user", parts: [{ text: userPrompt }] }],
          config: {
            systemInstruction,
            temperature: 0.25,
          }
        });
      } catch (primaryErr: any) {
        console.warn("Primary note model failed, falling back to fallback model...", primaryErr?.message);
        response = await ai.models.generateContent({
          model: FALLBACK_MODEL,
          contents: [{ role: "user", parts: [{ text: userPrompt }] }],
          config: {
            systemInstruction,
            temperature: 0.25,
          }
        });
      }

      let text = response?.text || "";
      // Strip markdown code fence wrapper if model wraps response in ```markdown ... ```
      text = text.replace(/^```(?:markdown|md)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();

      res.json({ text, isFallback: false, source: 'gemini_cloud' });
    } catch (error: any) {
      console.warn("Notes AI API failed:", error?.message || error);
      const friendlyMsg = getHumanErrorMessage(error);

      // Only allow basic offline formatting for non-generative 'improve' action
      if (action === 'improve') {
        const fallbackFormatted = basicOfflineFormat(content || '', noteTitle);
        return res.json({
          text: fallbackFormatted,
          isFallback: true,
          source: 'offline',
          notice: "Format dasar offline diterapkan (bukan hasil AI). Hubungkan internet atau periksa API Key untuk Gemini Cloud."
        });
      }

      // For generative tasks: Never write fake hallucinated content, return HTTP error
      const isQuota = (error?.status === 429) || (error?.message && error.message.includes('429')) || (error?.message && error.message.includes('Quota'));
      const status = isQuota ? 429 : (error?.status || 502);
      res.status(status).json({
        error: friendlyMsg,
        code: isQuota ? 'QUOTA_EXCEEDED' : 'AI_GATEWAY_ERROR'
      });
    }
  });


  app.post("/api/vision", authenticateApiRequest, heavyAiLimiter, async (req, res) => {
    try {
      const { image, mimeType } = req.body || {};
      if (!image || typeof image !== 'string') {
        return res.status(400).json({ error: "Data gambar atau dokumen jadwal tidak ditemukan." });
      }

      const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
      const effectiveMime = (mimeType && typeof mimeType === 'string') ? mimeType : 'image/jpeg';
      if (!allowedMimes.includes(effectiveMime)) {
        return res.status(400).json({ error: `Tipe file tidak didukung (${effectiveMime}). Gunakan JPG, PNG, WebP, atau PDF.` });
      }

      const base64Clean = image.includes(',') ? image.split(',')[1] : image;
      if (base64Clean.length * 0.75 > 10 * 1024 * 1024) {
        return res.status(400).json({ error: "Ukuran dokumen/gambar melebihi batas 10 MB." });
      }

      const ai = getAIClient(req);
      const prompt = `You are an AI data extraction assistant. Analyze this file (which could be an image or a PDF) containing a university class schedule/timetable.
      Extract ALL the classes/courses found in the document. Be extremely thorough and accurate.
      Translate the days to Indonesian: Senin, Selasa, Rabu, Kamis, Jumat, Sabtu, Minggu.
      Ensure times are in HH:MM (24-hour format).
      Return ONLY a raw JSON ARRAY (no markdown, no backticks, no markdown blocks) containing objects with these exact keys:
      [
        {
          "name": "Course Name (e.g. Algoritma dan Pemrograman)",
          "room": "Room or Building Name",
          "day": "Hari (Senin, Selasa, Rabu, Kamis, Jumat, Sabtu)",
          "startTime": "HH:MM",
          "endTime": "HH:MM",
          "lecturer": "Lecturer Name if visible, else leave empty",
          "credits": 2
        }
      ]`;

      let response;
      try {
        response = await ai.models.generateContent({
          model: PRIMARY_MODEL,
          contents: [
            {
              role: "user",
              parts: [
                { text: prompt },
                { inlineData: { data: base64Clean, mimeType: mimeType || "image/jpeg" } }
              ]
            }
          ],
          config: { responseMimeType: "application/json" }
        });
      } catch (vErr: any) {
        console.warn("Primary vision model failed, trying fallback:", vErr?.message);
        response = await ai.models.generateContent({
          model: FALLBACK_MODEL,
          contents: [
            {
              role: "user",
              parts: [
                { text: prompt },
                { inlineData: { data: base64Clean, mimeType: mimeType || "image/jpeg" } }
              ]
            }
          ],
          config: { responseMimeType: "application/json" }
        });
      }

      const parseRes = safeJsonParse<any[]>(response.text || "[]", (val) => Array.isArray(val));
      if (!parseRes.success || !parseRes.data) {
        throw new Error(parseRes.error || "Gagal memproses struktur jadwal dari dokumen");
      }
      res.json(parseRes.data);
    } catch (error: any) {
      console.error("Vision Error:", error);
      const friendly = getHumanErrorMessage(error);
      res.status(500).json({ error: friendly || "Gagal menganalisis dokumen atau gambar jadwal" });
    }
  });

  app.post("/api/generate-flashcards", authenticateApiRequest, heavyAiLimiter, async (req, res) => {
    try {
      const { text, fileData, mimeType, fileName, customInstructions } = req.body || {};
      if (!text && !fileData) {
        return res.status(400).json({ error: "Harap masukkan teks materi atau lampirkan dokumen pendukung." });
      }

      if (fileData) {
        if (typeof fileData !== 'string') {
          return res.status(400).json({ error: "Format file materi tidak valid." });
        }
        const base64Data = fileData.includes(',') ? fileData.split(',')[1] : fileData;
        if (base64Data.length * 0.75 > 10 * 1024 * 1024) {
          return res.status(400).json({ error: "Ukuran file materi melebihi batas 10 MB." });
        }
      }

      const ai = getAIClient(req);
      const parts: any[] = [];

      // If fileData is provided, attach inlineData
      if (fileData) {
        const base64Data = typeof fileData === 'string' && fileData.includes(',')
          ? fileData.split(',')[1]
          : fileData;
        
        let resolvedMime = mimeType || 'application/pdf';
        if (fileName) {
          const lowerName = fileName.toLowerCase();
          if (lowerName.endsWith('.pdf')) resolvedMime = 'application/pdf';
          else if (lowerName.endsWith('.png')) resolvedMime = 'image/png';
          else if (lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg')) resolvedMime = 'image/jpeg';
          else if (lowerName.endsWith('.webp')) resolvedMime = 'image/webp';
          else if (lowerName.endsWith('.txt') || lowerName.endsWith('.md')) resolvedMime = 'text/plain';
        }

        parts.push({
          inlineData: {
            data: base64Data,
            mimeType: resolvedMime
          }
        });
      }

      const prompt = `Anda adalah seorang asisten studi universitas dan pakar Active Recall (Spaced Repetition).
Tugas Anda adalah menganalisis ${fileData ? `dokumen/materi kuliah yang dilampirkan (${fileName || 'file materi'})` : 'teks materi atau topik yang diberikan'} ${text ? `dengan catatan tambahan: "${text}"` : ''} ${customInstructions ? `serta instruksi khusus: "${customInstructions}"` : ''}.

Instruksi pembuatan Flashcard:
1. Ekstrak konsep-konsep kunci, definisi penting, rumus, teori, tanggal/fakta historis, perbandingan, dan terminologi perkuliahan yang sering keluar di ujian.
2. Buatlah antara 10 hingga 20 kartu flashcard berkualitas tinggi (atau 8-15 jika materi ringkas).
3. Setiap kartu memiliki:
   - 'front': Pertanyaan atau istilah pemancing ingatan (Active Recall) yang jelas dan spesifik. Jangan berikan bocoran jawaban di sisi depan.
   - 'back': Jawaban, definisi, atau penjelasan esensial yang tepat, padat, dan mudah dipahami.
4. Gunakan Bahasa Indonesia yang baik dan terstruktur (atau sesuaikan dengan bahasa dokumen jika materi berbahasa Inggris/spesifik).
5. Kembalikan HANYA JSON array murni tanpa markdown code block, tanpa teks pembuka atau penutup.

Format persis:
[
  { "front": "Pertanyaan atau konsep...", "back": "Penjelasan atau jawaban..." }
]`;

      parts.push({ text: prompt });

      let response;
      try {
        response = await ai.models.generateContent({
          model: PRIMARY_MODEL,
          contents: [{ role: "user", parts }],
          config: { responseMimeType: "application/json" }
        });
      } catch (err: any) {
        console.warn("Primary flashcard model failed, trying fallback:", err?.message);
        response = await ai.models.generateContent({
          model: FALLBACK_MODEL,
          contents: [{ role: "user", parts }],
          config: { responseMimeType: "application/json" }
        });
      }

      const parseRes = safeJsonParse<any[]>(response.text || "[]", (val) => Array.isArray(val));
      if (!parseRes.success || !parseRes.data) {
        throw new Error(parseRes.error || "Hasil AI bukan berupa array flashcard");
      }
      res.json(parseRes.data);
    } catch (error: any) {
      console.warn("Flashcard AI Error:", error?.message || error);
      const friendly = getHumanErrorMessage(error);
      const raw = String(error?.message || '');
      const status = /429|RESOURCE_EXHAUSTED|quota/i.test(raw)
        ? 429
        : /401|UNAUTHENTICATED|403|PERMISSION_DENIED/.test(raw) ? 401 : 502;
      res.status(status).json({ error: friendly || "Gagal membuat flashcards dari dokumen/materi" });
    }
  });


  
  app.post("/api/micro-learning-quiz", authenticateApiRequest, standardAiLimiter, async (req, res) => {
    try {
      const { topic, count = 3, level = 'menengah', previousQuestions = [] } = req.body;
      const ai = getAIClient(req);

      const previousExclusions = Array.isArray(previousQuestions) && previousQuestions.length > 0
        ? `Jangan ulangi pertanyaan yang mirip dengan: ${JSON.stringify(previousQuestions.slice(-5))}.`
        : '';

      const prompt = `Anda adalah tutor micro-learning interaktif profesional. Buatlah ${count} soal pilihan ganda baru dengan tingkat kesulitan '${level}' untuk menguji dan memperdalam pemahaman pengguna tentang topik: "${topic}".
      ${previousExclusions}
      Karakteristik soal:
      - 1 soal konseptual/teori inti
      - 1-2 soal aplikasi nyata/studi kasus praktis
      - Opsi jawaban masuk akal dan mendidik (4 pilihan: A, B, C, D)
      - Penjelasan (explanation) yang jelas, ringkas, dan memotivasi
      
      Bahasa: Bahasa Indonesia yang baku, ramah, dan mendidik.
      Kembalikan HANYA JSON array murni tanpa markdown, tanpa teks pembuka/penutup, persis format berikut:
      [
        {
          "question": "Pertanyaan soal...",
          "options": ["Pilihan A", "Pilihan B", "Pilihan C", "Pilihan D"],
          "correctAnswerIndex": 0,
          "explanation": "Penjelasan mengapa jawaban ini tepat..."
        }
      ]`;

      let responseText = "";
      try {
        const response = await ai.models.generateContent({
          model: PRIMARY_MODEL,
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          config: { responseMimeType: "application/json" }
        });
        responseText = response.text || "";
      } catch (err: any) {
        console.warn("Primary micro-quiz failed, trying fallback:", err?.message);
        const fallback = await ai.models.generateContent({
          model: FALLBACK_MODEL,
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          config: { responseMimeType: "application/json" }
        });
        responseText = fallback.text || "";
      }

      const parseRes = safeJsonParse<any[]>(responseText, (val) => Array.isArray(val) && val.length > 0);
      if (!parseRes.success || !parseRes.data) {
        throw new Error(parseRes.error || "Gagal memproses soal kuis");
      }
      res.json(parseRes.data);
    } catch (error: any) {
      console.warn("Micro-learning quiz fallback triggered:", error?.message || error);
      const topic = req.body?.topic || "Materi Perkuliahan";
      res.json([
        {
          question: `Apa sasaran pemahaman utama dalam mempelajari "${topic}"?`,
          options: [
            `Menguasai konsep dasar dan implementasinya secara sistematis`,
            `Menghafal istilah tanpa memahami korelasi antar komponen`,
            `Mengabaikan prinsip analisis empiris`,
            `Menghindari evaluasi pemahaman berkala`
          ],
          correctAnswerIndex: 0,
          explanation: `Pondasi pemahaman materi menuntut penguasaan konsep terstruktur yang dapat diaplikasikan.`
        },
        {
          question: `Metode belajar mana yang paling efektif untuk retensi jangka panjang topik "${topic}"?`,
          options: [
            `Active Recall dan Spaced Repetition secara teratur`,
            `Membaca pasif satu malam sebelum ujian (SKS)`,
            `Menyalin ulang tanpa merangkum intisari`,
            `Hanya membaca ringkasan tanpa latihan soal`
          ],
          correctAnswerIndex: 0,
          explanation: `Active Recall melatih otak mengambil kembali informasi yang dipelajari sehingga menguatkan koneksi saraf memori.`
        },
        {
          question: `Langkah awal terbaik untuk memecahkan studi kasus pada materi "${topic}" adalah:`,
          options: [
            `Mengidentifikasi masalah inti dan variabel yang relevan terlebih dahulu`,
            `Langsung menarik kesimpulan tanpa memeriksa premis`,
            `Menghindari verifikasi teori pendukung`,
            `Mengabaikan konteks dan batasan permasalahan`
          ],
          correctAnswerIndex: 0,
          explanation: `Identifikasi masalah dan variabel kunci adalah langkah terpenting dalam pemecahan masalah ilmiah.`
        }
      ]);
    }
  });

  app.post("/api/micro-learning", authenticateApiRequest, standardAiLimiter, async (req, res) => {
    try {
      const { topic } = req.body;
      const ai = getAIClient(req);

      const prompt = `You are an expert micro-learning tutor. Create a bite-sized, 2-minute lesson on the following topic: "${topic}".
      Reply in Indonesian. Ensure it's highly engaging and easy to understand.
      Return ONLY a raw JSON OBJECT (no markdown, no backticks, no markdown blocks) with exactly these keys:
      {
        "title": "Catchy Title",
        "coreConcept": "Core concept in 1-2 sentences",
        "analogy": "A relatable analogy to explain it",
        "keyPoints": ["Point 1", "Point 2", "Point 3"],
        "quiz": {
          "question": "A quick multiple choice question to test understanding",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctAnswerIndex": 0,
          "explanation": "Why this is correct"
        },
        "suggestedActivity": "One highly actionable, 5-minute activity to practice this concept right now"
      }`;

      let responseText = "{}";
      try {
        const response = await ai.models.generateContent({
          model: PRIMARY_MODEL,
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          config: { responseMimeType: "application/json" }
        });
        responseText = response.text || "{}";
      } catch (err: any) {
        console.warn("Primary micro-learning failed, trying fallback:", err?.message);
        const fallback = await ai.models.generateContent({
          model: FALLBACK_MODEL,
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          config: { responseMimeType: "application/json" }
        });
        responseText = fallback.text || "{}";
      }
      
      const parseRes = safeJsonParse<any>(responseText, (val) => val && typeof val === 'object' && val.title);
      if (!parseRes.success || !parseRes.data) {
        throw new Error(parseRes.error || "Gagal memproses struktur micro-lesson");
      }
      res.json(parseRes.data);
    } catch (error: any) {
      console.warn("Micro-learning fallback triggered:", error?.message || error);
      const topic = req.body?.topic || "Topik Pembelajaran";
      res.json({
        title: topic,
        coreConcept: `Pemahaman ringkas dan esensial mengenai ${topic} untuk mendukung kesiapan perkuliahan dan ujian.`,
        analogy: `Mempelajari ${topic} ibarat merakit pondasi bangunan; setiap bagian terhubung kuat untuk menopang pemahaman tingkat lanjut.`,
        keyPoints: [
          `Fondasi Teori: Memahami prinsip mendasar dan terminologi kunci ${topic}.`,
          `Metodologi: Menerapkan langkah-langkah praktis dan analitis secara terstruktur.`,
          `Studi Kasus: Memecahkan persoalan nyata dengan mengintegrasikan konsep yang telah dipelajari.`
        ],
        quiz: {
          question: `Apa sasaran terpenting dalam mempelajari "${topic}"?`,
          options: [
            "Pemahaman konseptual yang kokoh dan latihan teratur",
            "Membaca sekilas tanpa evaluasi diri",
            "Menghindari latihan studi kasus",
            "Mengabaikan relasi antar variabel materi"
          ],
          correctAnswerIndex: 0,
          explanation: "Pemahaman konseptual yang kokoh dan latihan berkala merupakan kunci retensi memori jangka panjang."
        },
        suggestedActivity: `Tuliskan 3 poin intisari dari topik "${topic}" dengan bahasa Anda sendiri (Metode Feynman).`
      });
    }
  });

  app.post("/api/learning-path", authenticateApiRequest, standardAiLimiter, async (req, res) => {
    try {
      const { topic, background } = req.body;
      const ai = getAIClient(req);

      const prompt = `Anda adalah seorang ahli pendidikan dan konselor karir. 
      Tugas Anda adalah membuat peta jalan (roadmap) belajar yang terstruktur, praktis, dan mudah diikuti dari nol untuk seorang mahasiswa.
      
      Topik/Tujuan yang ingin dicapai: "${topic}"
      Latar belakang/konteks mahasiswa: "${background || 'Pemula'}"

      Buatlah kurikulum terstruktur ke dalam beberapa modul logis.
      Kembalikan HANYA format JSON murni tanpa markdown, tanpa teks pembuka/penutup, persis seperti skema ini:
      {
        "title": "Judul Peta Jalan",
        "description": "Deskripsi singkat dan memotivasi tentang peta jalan ini",
        "estimatedWeeks": 12,
        "modules": [
          {
            "title": "Nama Modul (cth: Modul 1: Fondasi Dasar)",
            "description": "Deskripsi singkat modul ini",
            "duration": "Berapa lama (cth: 2 Minggu)",
            "topics": ["Topik spesifik 1", "Topik spesifik 2"],
            "actionItems": ["Tugas/Praktik 1 yang bisa dieksekusi", "Tugas 2"]
          }
        ]
      }`;

      let responseText = "";
      try {
        const response = await ai.models.generateContent({
          model: PRIMARY_MODEL,
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          config: { responseMimeType: "application/json" }
        });
        responseText = response.text || "{}";
      } catch (err: any) {
        console.warn("Primary learning path failed, trying fallback:", err?.message);
        const fallback = await ai.models.generateContent({
          model: FALLBACK_MODEL,
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          config: { responseMimeType: "application/json" }
        });
        responseText = fallback.text || "{}";
      }
      
      const parseRes = safeJsonParse<any>(responseText, (val) => val && typeof val === 'object' && val.title);
      if (!parseRes.success || !parseRes.data) {
        throw new Error(parseRes.error || "Gagal memproses struktur peta jalan");
      }
      res.json(parseRes.data);
    } catch (error: any) {
      console.warn("Learning Path fallback triggered:", error?.message || error);
      const topic = req.body?.topic || "Mata Kuliah";
      res.json({
        title: `Peta Jalan Terstruktur: ${topic}`,
        description: `Kurikulum bertahap 4 fase untuk menguasai ${topic} dari tingkat dasar hingga penerapan nyata.`,
        estimatedWeeks: 8,
        modules: [
          {
            title: "Fase 1: Fondasi & Istilah Kunci",
            description: "Memahami konsep mendasar, definisi istilah, dan ruang lingkup materi.",
            duration: "2 Minggu",
            topics: ["Pengenalan Konsep Dasar", "Glosarium & Teori Fundamental", "Kerangka Berpikir"],
            actionItems: ["Buat resume bab 1-3", "Susun kartu flashcard istilah kunci"]
          },
          {
            title: "Fase 2: Pendalaman & Analisis Metodologi",
            description: "Mempelajari rumus, algoritma, atau metodologi analisis yang berlaku.",
            duration: "2 Minggu",
            topics: ["Kaidah Operasional", "Analisis Kasus Sederhana", "Komparasi Pendekatan"],
            actionItems: ["Kerjakan 5 soal latihan mandiri", "Diskusikan poin ambigu bersama kelompok studi"]
          },
          {
            title: "Fase 3: Studi Kasus Praktis & Proyek",
            description: "Mengaplikasikan materi pada skenario dunia nyata dan tugas besar.",
            duration: "2 Minggu",
            topics: ["Studi Kasus Nyata", "Analisis Data/Masalah", "Penyusunan Solusi"],
            actionItems: ["Selesaikan mini project atau resume studi kasus", "Evaluasi hasil dengan standar acuan"]
          },
          {
            title: "Fase 4: Review Ujian & Retensi Jangka Panjang",
            description: "Pemantapan materi melalui active recall dan simulasi ujian.",
            duration: "2 Minggu",
            topics: ["Simulasi Ujian Mandiri", "Koreksi Kelemahan Pemahaman", "Sintesis Menyeluruh"],
            actionItems: ["Ikuti kuis latihan tanpa melihat catatan", "Review berkala materi yang sering keliru"]
          }
        ]
      });
    }
  });

  app.post("/api/curriculum/generate", authenticateApiRequest, standardAiLimiter, async (req, res) => {
    try {
      const topic = req.body?.topic || "Manajemen Studi & Riset";
      const domain = req.body?.domain || "AKADEMIK";
      const difficulty = req.body?.difficulty || "MENENGAH";
      const targetWeeks = Number(req.body?.targetWeeks) || 3;
      const focusGoal = req.body?.focusGoal || "";

      const prompt = `Anda adalah Senior Academic Curriculum Designer & Master Coach Pengembangan Diri Mahasiswa.
Buatkan kurikulum pembelajaran terstruktur dan mode belajar interaktif komprehensif untuk topik: "${topic}"
Domain Fokus: ${domain} (${domain === 'AKADEMIK' ? 'Fokus pada penguasaan materi kuliah, teori ilmiah, sains/teknik, analisis metodologis, dan keberhasilan akademik' : domain === 'PRIBADI' ? 'Fokus pada karakter, kepemimpinan, regulasi emosi, kebiasaan produktif, kesehatan mental, dan kemandirian mahasiswa' : 'Integrasi pemahaman akademis yang kokoh dan pengembangan karakter pribadi'})
Tingkat Kesulitan: ${difficulty}
Estimasi Durasi: ${targetWeeks} Minggu
Tujuan Khusus Pengguna: ${focusGoal || 'Penguasaan komprehensif dan implementasi nyata di kehidupan perkuliahan'}

Hasilkan silabus kurikulum lengkap dengan 3 hingga 4 bab (chapters) berurutan dari pengenalan dasar hingga penguasaan mandiri.
Format respons HARUS JSON murni dengan skema persis seperti berikut:
{
  "title": "Judul Kurikulum yang Kuat & Edukatif",
  "domain": "${domain}",
  "category": "Kategori Bidang",
  "difficulty": "${difficulty}",
  "targetDuration": "${targetWeeks} Minggu",
  "description": "Deskripsi inspiratif 2-3 kalimat tentang esensi dan manfaat nyata kurikulum ini bagi mahasiswa.",
  "learningOutcomes": [
    "Hasil belajar terukur 1",
    "Hasil belajar terukur 2",
    "Hasil belajar terukur 3"
  ],
  "prerequisites": ["Pengetahuan atau kesiapan dasar pendukung"],
  "chapters": [
    {
      "chapterNumber": 1,
      "title": "Judul Bab 1",
      "summary": "Ringkasan 1-2 kalimat tentang apa yang dipelajari pada bab ini.",
      "estimatedMinutes": 25,
      "mentalModel": "Nama Kerangka: Penjelasan analogi atau mental model pembantu pemahaman",
      "studyMethod": "Metode belajar (misal: Feynman Technique / Active Recall / First Principles)",
      "studyContent": "Penjelasan materi pembelajaran mendalam, terstruktur rapi dengan poin-poin penjelasan penting, konsep inti, dan contoh nyata (minimal 3 paragraf komprehensif).",
      "actionTask": {
        "text": "1 tantangan tindakan konkret yang dapat dieksekusi mahasiswa hari ini",
        "completed": false
      },
      "reflectionPrompt": "Pertanyaan reflektif untuk menguji relevansi pemahaman materi pada diri sendiri",
      "quiz": [
        {
          "question": "Pertanyaan pemahaman konsep inti?",
          "options": ["Opsi A", "Opsi B", "Opsi C", "Opsi D"],
          "correctAnswerIndex": 0,
          "explanation": "Penjelasan ilmiah mengapa jawaban tersebut tepat"
        },
        {
          "question": "Pertanyaan studi kasus atau aplikasi nyata?",
          "options": ["Opsi A", "Opsi B", "Opsi C", "Opsi D"],
          "correctAnswerIndex": 1,
          "explanation": "Penjelasan pembahasan soal"
        }
      ]
    }
  ]
}
HANYA kembalikan valid JSON murni tanpa markdown triple backticks.`;

      let responseText = "";
      try {
        const response = await ai.models.generateContent({
          model: PRIMARY_MODEL,
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          config: { responseMimeType: "application/json" }
        });
        responseText = response.text || "{}";
      } catch (err: any) {
        console.warn("Primary curriculum model failed, trying fallback:", err?.message);
        const fallback = await ai.models.generateContent({
          model: FALLBACK_MODEL,
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          config: { responseMimeType: "application/json" }
        });
        responseText = fallback.text || "{}";
      }

      const parseRes = safeJsonParse<any>(responseText, (val) => val && typeof val === 'object' && val.title);
      if (!parseRes.success || !parseRes.data) {
        throw new Error(parseRes.error || "Gagal memproses struktur kurikulum");
      }

      const result = parseRes.data;
      const curriculumId = `curr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      
      const structuredChapters = (result.chapters || []).map((ch: any, idx: number) => ({
        id: `chap-${curriculumId}-${idx + 1}`,
        chapterNumber: idx + 1,
        title: ch.title || `Bab ${idx + 1}: Pendalaman Materi`,
        summary: ch.summary || "Ringkasan konsep inti materi.",
        estimatedMinutes: Number(ch.estimatedMinutes) || 25,
        mentalModel: ch.mentalModel || "First-Principles: Membedah masalah hingga ke kebenaran paling mendasar.",
        studyMethod: ch.studyMethod || "Active Recall & Feynman Technique",
        studyContent: ch.studyContent || "Materi pemahaman mendalam untuk topik ini.",
        actionTask: {
          text: (ch.actionTask && ch.actionTask.text) || "Praktikkan konsep utama hari ini.",
          completed: false
        },
        reflectionPrompt: ch.reflectionPrompt || "Bagaimana Anda dapat menerapkan konsep ini dalam rutinitas Anda?",
        userNote: "",
        quiz: (ch.quiz || []).map((q: any, qIdx: number) => ({
          id: `q-${curriculumId}-${idx + 1}-${qIdx + 1}`,
          question: q.question || "Pertanyaan pemahaman materi?",
          options: Array.isArray(q.options) && q.options.length >= 2 ? q.options : ["Opsi 1", "Opsi 2", "Opsi 3", "Opsi 4"],
          correctAnswerIndex: typeof q.correctAnswerIndex === 'number' ? q.correctAnswerIndex : 0,
          explanation: q.explanation || "Jawaban ini merupakan kesimpulan dari konsep yang dipelajari."
        })),
        isCompleted: false
      }));

      const finalCurriculum = {
        id: curriculumId,
        title: result.title || `Kurikulum Mandiri: ${topic}`,
        domain: result.domain || domain,
        category: result.category || (domain === 'AKADEMIK' ? 'Akademik Kuliah' : 'Pengembangan Pribadi'),
        difficulty: result.difficulty || difficulty,
        targetDuration: result.targetDuration || `${targetWeeks} Minggu`,
        description: result.description || `Kurikulum pembelajaran terarah untuk menguasai ${topic} secara mendalam dan terukur.`,
        learningOutcomes: Array.isArray(result.learningOutcomes) ? result.learningOutcomes : [
          `Menguasai konsep fundamental dan istilah kunci ${topic}`,
          `Mampu menganalisis dan memecahkan persoalan praktis terkait ${topic}`,
          `Menerapkan pemahaman untuk meningkatkan performa studi dan karakter diri`
        ],
        prerequisites: Array.isArray(result.prerequisites) ? result.prerequisites : ["Komitmen belajar konsisten 20-30 menit per hari"],
        chapters: structuredChapters,
        progress: 0,
        isCompleted: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        lastStudiedChapterIndex: 0,
        totalStudyMinutes: 0,
        source: 'CUSTOM_AI'
      };

      res.json(finalCurriculum);
    } catch (error: any) {
      console.warn("Curriculum generation fallback triggered:", error?.message || error);
      const topic = req.body?.topic || "Topik Pilihan";
      const domain = req.body?.domain || "AKADEMIK";
      const difficulty = req.body?.difficulty || "MENENGAH";
      const targetWeeks = Number(req.body?.targetWeeks) || 3;
      const curriculumId = `curr-fb-${Date.now()}`;

      res.json({
        id: curriculumId,
        title: `Kurikulum Terstruktur: ${topic}`,
        domain: domain,
        category: domain === 'AKADEMIK' ? 'Akademik & Sains' : 'Pengembangan Pribadi',
        difficulty: difficulty,
        targetDuration: `${targetWeeks} Minggu`,
        description: `Kurikulum 3 modul berjenjang yang dirancang untuk menguasai esensi ${topic} dari dasar hingga penerapan nyata.`,
        learningOutcomes: [
          `Memahami kerangka dasar dan peta konsep ${topic}`,
          `Mampu menganalisis studi kasus dan memecahkan persoalan riil`,
          `Membangun kebiasaan evaluasi pemahaman berkelanjutan`
        ],
        prerequisites: ["Kemauan untuk membaca materi secara kritis dan mengerjakan refleksi"],
        chapters: [
          {
            id: `chap-${curriculumId}-1`,
            chapterNumber: 1,
            title: `Fondasi & Prinsip Dasar: ${topic}`,
            summary: `Membedah terminologi kunci, kerangka berpikir awal, dan tujuan mendasar dari ${topic}.`,
            estimatedMinutes: 20,
            mentalModel: "The Foundations Pillar: Bangunan yang megah membutuhkan fondasi yang kokoh, bukan sekadar hiasan atap.",
            studyMethod: "Feynman Technique (Jelaskan dengan bahasa sederhana seolah mengajarkan anak usia 10 tahun)",
            studyContent: `### Memahami Esensi ${topic}\nLangkah pertama dalam menguasai topik baru adalah mengisolasi konsep-konsep inti yang menjadi pilar penopangnya.\n\nFokuslah pada definisi operasional, mengapa topik ini diciptakan oleh para pakar, dan masalah apa di dunia nyata yang diselesaikan oleh ${topic}.\n\nJangan tergesa-gesa menghafal rumus atau teori rumit sebelum Anda dapat mengartikulasikan konsep dasar ini dengan kata-kata Anda sendiri.`,
            actionTask: {
              text: `Tuliskan resume 1 halaman dengan bahasa Anda sendiri mengenai hakikat utama ${topic}.`,
              completed: false
            },
            reflectionPrompt: `Mengapa Anda tertarik mempelajari ${topic} dan bagaimana penguasaan materi ini akan mengubah cara Anda berpikir?`,
            userNote: "",
            quiz: [
              {
                id: `q-${curriculumId}-1-1`,
                question: `Apa tujuan utama mempelajari fondasi dasar dari ${topic}?`,
                options: [
                  "Menghafal istilah tanpa memahami makna",
                  "Membangun kerangka pemahaman yang kokoh agar materi lanjutan lebih mudah dipahami",
                  "Menghabiskan waktu membaca buku tebal",
                  "Menghindari latihan praktik nyata"
                ],
                correctAnswerIndex: 1,
                explanation: "Fondasi konsep yang kuat menjadi jangkar bagi seluruh pemahaman teknis di bab-bab berikutnya."
              }
            ],
            isCompleted: false
          },
          {
            id: `chap-${curriculumId}-2`,
            chapterNumber: 2,
            title: `Mekanisme, Analisis & Penerapan: ${topic}`,
            summary: `Menerapkan prinsip ${topic} pada skenario pemecahan masalah dan analisis kasus.`,
            estimatedMinutes: 25,
            mentalModel: "The System Feedback Loop: Setiap input atau keputusan menghasilkan respons sistem yang terukur.",
            studyMethod: "Active Recall (Uji ingatan tanpa melihat contekan materi)",
            studyContent: `### Menghubungkan Teori dengan Praktik\nSetelah memahami fondasi, tahap berikutnya adalah menguji mekanisme operasional ${topic}.\n\nPelajari bagaimana para profesional atau akademisi menerapkan kaidah ini dalam studi kasus nyata. Perhatikan anomali, batasan teori, dan bagaimana menyesuaikan metode ketika menghadapi kondisi tidak ideal.`,
            actionTask: {
              text: `Pilih satu studi kasus nyata dan analisis menggunakan prinsip-prinsip ${topic}.`,
              completed: false
            },
            reflectionPrompt: `Tantangan apa yang paling sering muncul ketika menerapkan teori ${topic} dalam realitas sehari-hari?`,
            userNote: "",
            quiz: [
              {
                id: `q-${curriculumId}-2-1`,
                question: `Kunci keberhasilan dalam mengaplikasikan teori ke praktik adalah:`,
                options: [
                  "Mengabaikan kondisi lingkungan yang berubah",
                  "Memahami batasan asumsi teori dan menyesuaikannya dengan data empiris di lapangan",
                  "Hanya mengulang apa yang tertulis di buku teks tanpa analisis kritis",
                  "Menunggu instruksi orang lain"
                ],
                correctAnswerIndex: 1,
                explanation: "Penerapan teori yang matang selalu mempertimbangkan konteks lapangan dan batasan asumsi yang berlaku."
              }
            ],
            isCompleted: false
          },
          {
            id: `chap-${curriculumId}-3`,
            chapterNumber: 3,
            title: `Penguasaan Lanjutan, Refleksi & Integrasi Diri`,
            summary: `Mengintegrasikan ${topic} ke dalam portofolio akademik dan pertumbuhan kepribadian jangka panjang.`,
            estimatedMinutes: 20,
            mentalModel: "The Compounding Effect: Peningkatan kecil 1% setiap hari dalam pemahaman menghasilkan lompatan eksponensial di masa depan.",
            studyMethod: "Deliberate Practice & Meta-Learning Journaling",
            studyContent: `### Mencapai Tingkat Penguasaan (Mastery)\nPenguasaan sejati tidak diukur dari berapa banyak buku yang dibaca, melainkan dari bagaimana pemahaman tersebut terinternalisasi menjadi cara pandang baru.\n\nJadikan ${topic} sebagai bagian dari perangkat berpikir kritis (mental toolkit) Anda baik dalam tugas perkuliahan maupun pengambilan keputusan hidup.`,
            actionTask: {
              text: `Buat ringkasan takeaways atau panduan singkat (cheat sheet) yang bisa bermanfaat bagi teman atau diri Anda di masa depan.`,
              completed: false
            },
            reflectionPrompt: `Setelah mempelajari topik ini, apa 1 perubahan konkret dalam kebiasaan atau cara belajar yang akan Anda terapkan?`,
            userNote: "",
            quiz: [
              {
                id: `q-${curriculumId}-3-1`,
                question: `Indikator bahwa Anda telah menguasai suatu topik dengan baik adalah:`,
                options: [
                  "Mampu menjelaskannya secara jernih dan sederhana kepada orang awam tanpa istilah membingungkan",
                  "Mampu berbicara menggunakan istilah asing yang tidak dimengerti siapa pun",
                  "Tidak mau lagi belajar atau menerima masukan baru",
                  "Merasa diri paling pintar di kelas"
                ],
                correctAnswerIndex: 0,
                explanation: "Menurut teknik Feynman, kemampuan menjelaskan konsep rumit secara sederhana adalah bukti tertinggi dari pemahaman sejati."
              }
            ],
            isCompleted: false
          }
        ],
        progress: 0,
        isCompleted: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        lastStudiedChapterIndex: 0,
        totalStudyMinutes: 0,
        source: 'DEFAULT'
      });
    }
  });

  // Vite middleware for development

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: false,
      },
      appType: "spa",
    });

    app.use((req, res, next) => {
      if (req.url && req.url.startsWith('/@vite/client')) {
        const _write = res.write;
        const _end = res.end;
        const chunks: Buffer[] = [];
        res.write = function (chunk: any, ...args: any[]) {
          if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
          return true;
        } as any;
        res.end = function (chunk: any, ...args: any[]) {
          if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
          let body = Buffer.concat(chunks).toString('utf-8');
          body = body.replace('console.debug("[vite] connecting...");', '/* [vite] connection silenced */');
          body = body.replace(/console\.error\(\s*`\[vite\] failed to connect to websocket[\s\S]*?`\s*\);/g, '/* [vite] error silenced */');
          body = body.replace(/console\.error\(\s*`\[vite\] failed to connect to websocket.*?\s*\);/g, '/* [vite] error silenced */');
          body = body.replace(/error:\s*\(err\)\s*=>\s*console\.error\("\[vite\]",\s*err\)/g, 'error: () => {}');
          body = body.replace(/debug:\s*\(\.\.\.msg\)\s*=>\s*console\.debug\("\[vite\]",\s*\.\.\.msg\)/g, 'debug: () => {}');
          body = body.replace(/console\.(debug|log|warn|info|error)\([`"'].*?\[vite\].*?[`"']\);?/g, '/* [vite] silenced */');
          res.setHeader('Content-Length', Buffer.byteLength(body));
          return _end.call(res, body, ...args);
        } as any;
      }
      next();
    });

    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
