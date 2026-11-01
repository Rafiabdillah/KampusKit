/**
 * Safe JSON parser with schema/structure validator for LLM generative responses.
 * Handles markdown code fences, leading/trailing conversational text, and array/object boundaries.
 */
export function safeJsonParse<T>(
  rawText: string,
  validator?: (val: any) => boolean
): { success: boolean; data?: T; error?: string } {
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
