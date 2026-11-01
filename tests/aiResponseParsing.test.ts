import { describe, it, expect } from 'vitest';
import { safeJsonParse } from '../src/utils/jsonParser';

describe('AI JSON Response Parser (safeJsonParse)', () => {
  it('berhasil mengurai JSON mentah berupa array', () => {
    const raw = '[{"name": "Basis Data", "credits": 3}, {"name": "Kalkulus", "credits": 4}]';
    const res = safeJsonParse<any[]>(raw);

    expect(res.success).toBe(true);
    expect(res.data).toHaveLength(2);
    expect(res.data?.[0].name).toBe('Basis Data');
  });

  it('berhasil membersihkan markdown code block ```json ... ```', () => {
    const raw = "```json\n[\n  {\"id\": \"1\", \"title\": \"Flashcard 1\"}\n]\n```";
    const res = safeJsonParse<any[]>(raw);

    expect(res.success).toBe(true);
    expect(res.data).toEqual([{ id: '1', title: 'Flashcard 1' }]);
  });

  it('mengabaikan teks pengantar atau penutup dari model (preamble & postamble)', () => {
    const raw = `Tentu, berikut adalah daftar jadwal kuliah hasil ekstraksi:
[
  { "day": "Senin", "name": "Algoritma" }
]
Semoga jadwal ini membantu belajarmu!`;

    const res = safeJsonParse<any[]>(raw);
    expect(res.success).toBe(true);
    expect(res.data).toEqual([{ day: 'Senin', name: 'Algoritma' }]);
  });

  it('menggunakan custom validator untuk memastikan format data sesuai schema', () => {
    const raw = '{"course": "Fisika Dasar", "score": 90}';
    
    // Validator yang lolos
    const res1 = safeJsonParse<{ course: string }>(raw, (val) => typeof val.course === 'string');
    expect(res1.success).toBe(true);
    expect(res1.data?.course).toBe('Fisika Dasar');

    // Validator yang gagal karena mensyaratkan tipe array
    const res2 = safeJsonParse<any[]>(raw, (val) => Array.isArray(val));
    expect(res2.success).toBe(false);
    expect(res2.error).toContain('tidak sesuai format');
  });

  it('menangani string JSON yang cacat secara aman tanpa melempar uncaught exception', () => {
    const broken = 'Teks biasa tanpa kurung kurawal atau JSON';
    const res = safeJsonParse(broken);

    expect(res.success).toBe(false);
    expect(res.error).toBeDefined();
  });
});
