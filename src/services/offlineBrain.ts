// Offline AI Engine: Memproses pencarian ilmu pengetahuan, kalkulator rumus multi-disiplin, dan alat mahasiswa
import { OFFLINE_KNOWLEDGE_BASE, KnowledgeItem, BUILT_IN_OFFLINE_QUIZZES, OfflineQuizQuestion } from '../data/offlineKnowledge';

export interface OfflineMatchResult {
  found: boolean;
  type: 'KNOWLEDGE' | 'CALCULATOR' | 'TEMPLATE' | 'QUIZ' | 'GENERAL';
  title?: string;
  response: string;
  copyableText?: string;
  data?: any;
}

export class OfflineBrainService {
  /**
   * Cari jawaban dari basis pengetahuan offline berdasarkan kata kunci & semantik sederhana
   */
  static searchKnowledge(query: string): OfflineMatchResult | null {
    const cleanQuery = query.toLowerCase().trim();

    // 1. Coba pencocokan tepat pada keywords
    for (const item of OFFLINE_KNOWLEDGE_BASE) {
      const match = item.keywords.some(kw => cleanQuery.includes(kw.toLowerCase()));
      if (match) {
        return {
          found: true,
          type: item.category === 'TEMPLATE_DOSEN' || item.category === 'KARIR' && item.copyableText ? 'TEMPLATE' : 'KNOWLEDGE',
          title: item.title,
          response: item.response,
          copyableText: item.copyableText
        };
      }
    }

    // 2. Pencocokan kata kunci fleksibel (fuzzy match kata penting)
    const words = cleanQuery.split(/\s+/).filter(w => w.length > 3);
    for (const item of OFFLINE_KNOWLEDGE_BASE) {
      const titleLower = item.title.toLowerCase();
      let matchedCount = 0;
      for (const w of words) {
        if (titleLower.includes(w) || item.keywords.some(k => k.includes(w))) {
          matchedCount++;
        }
      }
      if (matchedCount >= 2 || (words.length === 1 && matchedCount === 1)) {
        return {
          found: true,
          type: item.category === 'TEMPLATE_DOSEN' || item.category === 'KARIR' && item.copyableText ? 'TEMPLATE' : 'KNOWLEDGE',
          title: item.title,
          response: item.response,
          copyableText: item.copyableText
        };
      }
    }

    return null;
  }

  /**
   * Kalkulator Rumus Slovin Otomatis
   * Contoh input: "hitung slovin populasi 1500 margin 5%" atau "rumus slovin populasi 2000"
   */
  static parseAndCalculateSlovin(query: string): OfflineMatchResult | null {
    const lower = query.toLowerCase();
    if (!lower.includes('slovin')) return null;

    // Cari angka populasi (N)
    const popMatch = lower.match(/(?:populasi|n\s*=)\s*(\d+[\d.,]*)/i) || lower.match(/(\d+[\d.,]*)\s*(?:orang|responden|populasi)/i);
    // Cari margin of error (e)
    const marginMatch = lower.match(/(?:margin|error|e\s*=|toleransi)\s*(\d+(?:[.,]\d+)?)\s*%?/i);

    if (popMatch) {
      const N = parseFloat(popMatch[1].replace(/\./g, '').replace(',', '.'));
      let e = 0.05; // default 5%
      if (marginMatch) {
        const parsedMargin = parseFloat(marginMatch[1].replace(',', '.'));
        e = parsedMargin > 1 ? parsedMargin / 100 : parsedMargin;
      }

      if (N > 0 && e > 0 && e < 1) {
        const eSq = e * e;
        const denominator = 1 + (N * eSq);
        const sampleSize = Math.ceil(N / denominator);

        return {
          found: true,
          type: 'CALCULATOR',
          title: 'Kalkulator Rumus Slovin',
          response: `📐 **Hasil Perhitungan Sampel Slovin:**\n\n- **Ukuran Populasi ($N$):** ${N.toLocaleString('id-ID')} orang\n- **Margin of Error ($e$):** ${(e * 100).toFixed(1)}%\n- **Rumus:** $n = \\frac{N}{1 + N(e^2)}$\n\n🎯 **Ukuran Sampel Minimal ($n$):** **${sampleSize.toLocaleString('id-ID')} responden**.\n\n*(Catatan: Bulatkan selalu ke atas agar memenuhi keterwakilan statistik minimal).*`
        };
      }
    }

    return null;
  }

  /**
   * Kalkulator Indeks Massa Tubuh (BMI / IMT)
   * Contoh input: "hitung bmi tb 170 bb 65", "bmi 165 cm 55 kg", "bmi bb 70 tb 175"
   */
  static calculateBMI(query: string): OfflineMatchResult | null {
    const lower = query.toLowerCase();
    if (!lower.includes('bmi') && !lower.includes('imt') && !lower.includes('berat ideal')) return null;

    // Ekstrak TB (Tinggi Badan)
    const tbMatch = lower.match(/(?:tb|tinggi|t)\s*[:=]?\s*(\d{2,3}(?:[.,]\d+)?)\s*(?:cm|m)?/i) || lower.match(/(\d{2,3})\s*(?:cm)\b/i);
    // Ekstrak BB (Berat Badan)
    const bbMatch = lower.match(/(?:bb|berat|b)\s*[:=]?\s*(\d{2,3}(?:[.,]\d+)?)\s*(?:kg)?/i) || lower.match(/(\d{2,3})\s*(?:kg)\b/i);

    if (tbMatch && bbMatch) {
      let height = parseFloat(tbMatch[1].replace(',', '.'));
      const weight = parseFloat(bbMatch[1].replace(',', '.'));

      // Konversi cm ke meter jika angka > 3
      if (height > 3) {
        height = height / 100;
      }

      if (height > 0.5 && height < 2.5 && weight > 20 && weight < 300) {
        const bmi = weight / (height * height);
        const bmiFormatted = bmi.toFixed(1);

        let category: string;
        let colorBadge: string;
        let advice: string;

        if (bmi < 18.5) {
          category = 'Berat Badan Kurang (Underweight)';
          colorBadge = '🟡';
          advice = 'Tingkatkan asupan kalori bergizi seimbang dan latihan beban untuk membentuk massa otot.';
        } else if (bmi <= 22.9) {
          category = 'Normal / Ideal (Asia-Pasifik)';
          colorBadge = '🟢';
          advice = 'Kondisi tubuh Anda sangat prima! Pertahankan pola hidrasi dan aktivitas fisik.';
        } else if (bmi <= 24.9) {
          category = 'Kelebihan Berat Badan (Overweight / At Risk)';
          colorBadge = '🟠';
          advice = 'Batasi konsumsi gula, gorengan, dan lakukan kardio minimal 30 menit 3x seminggu.';
        } else {
          category = 'Obesitas (Tingkat I / II)';
          colorBadge = '🔴';
          advice = 'Disarankan berkonsultasi dengan ahli gizi atau dokter dan mulai defisit kalori teratur.';
        }

        const minIdealWeight = (18.5 * height * height).toFixed(1);
        const maxIdealWeight = (22.9 * height * height).toFixed(1);

        return {
          found: true,
          type: 'CALCULATOR',
          title: 'Kalkulator Indeks Massa Tubuh (BMI)',
          response: `🩺 **Hasil Analisis BMI / IMT:**\n\n- **Tinggi Badan:** ${(height * 100).toFixed(0)} cm\n- **Berat Badan:** ${weight.toFixed(1)} kg\n- **Skor BMI:** **${bmiFormatted}**\n- **Status:** ${colorBadge} **${category}**\n- **Rentang Berat Ideal Anda:** **${minIdealWeight} kg – ${maxIdealWeight} kg**\n\n💡 **Rekomendasi:**\n${advice}\n\n*(Standar klasifikasi WHO Region Asia-Pasifik)*`
        };
      }
    }

    return null;
  }

  /**
   * Kalkulator Bunga Majemuk (Compound Interest) & Simulasi Tabungan Investasi
   * Contoh: "bunga majemuk modal 1000000 bunga 6% 3 tahun", "investasi modal 5jt bunga 8% 5 tahun"
   */
  static calculateCompoundInterest(query: string): OfflineMatchResult | null {
    const lower = query.toLowerCase();
    if (!lower.includes('majemuk') && !lower.includes('investasi') && !lower.includes('bunga modal')) return null;

    // Cari Modal Awal (P)
    const modalMatch = lower.match(/(?:modal|pokok|tabungan|p\s*=)\s*(\d+(?:[.,]\d+)?\s*(?:jt|juta|rb|k|ribu)?|\d{5,10})/i);
    // Cari Bunga/Return Tahunan (r)
    const bungaMatch = lower.match(/(?:bunga|return|b\s*=|r\s*=)\s*(\d+(?:[.,]\d+)?)\s*%/i);
    // Cari Periode Waktu (t)
    const tahunMatch = lower.match(/(\d+)\s*(?:tahun|thn|th)/i);

    if (modalMatch && bungaMatch && tahunMatch) {
      const rawP = modalMatch[1].trim();
      const moneyParsed = this.parseIndonesianMoney(rawP);
      const principal = moneyParsed ? moneyParsed.amount : parseFloat(rawP.replace(/\./g, '').replace(',', '.'));

      const rate = parseFloat(bungaMatch[1].replace(',', '.')) / 100;
      const years = parseInt(tahunMatch[1], 10);

      if (principal > 0 && rate >= 0 && years > 0 && years <= 50) {
        const futureValue = principal * Math.pow(1 + rate, years);
        const totalGain = futureValue - principal;

        return {
          found: true,
          type: 'CALCULATOR',
          title: 'Simulasi Bunga Majemuk & Investasi',
          response: `📈 **Simulasi Pertumbuhan Bunga Majemuk:**\n\n- **Modal Pokok Awal ($P$):** Rp ${Math.round(principal).toLocaleString('id-ID')}\n- **Tingkat Bunga/Return ($r$):** ${(rate * 100).toFixed(1)}% per tahun\n- **Jangka Waktu ($t$):** ${years} tahun\n- **Rumus:** $A = P(1 + r)^t$\n\n💰 **Total Nilai Akhir ($A$):** **Rp ${Math.round(futureValue).toLocaleString('id-ID')}**\n✨ **Total Pertumbuhan (Keuntungan):** **+Rp ${Math.round(totalGain).toLocaleString('id-ID')}** (${((totalGain / principal) * 100).toFixed(1)}%)\n\n*(Catatan: Mengasumsikan bunga digulung tahunan tanpa penarikan modal).*`
        };
      }
    }

    return null;
  }

  /**
   * Kalkulator Konversi Satuan Instan (Suhu, Jarak, Berat, Data)
   * Contoh: "30 c ke f", "100 celcius ke fahrenheit", "5 km ke meter", "5 gb ke mb", "10 mil ke km"
   */
  static convertUnits(query: string): OfflineMatchResult | null {
    const lower = query.toLowerCase();
    const match = lower.match(/(\d+(?:[.,]\d+)?)\s*([a-zA-Z°]+)\s*(?:ke|to|=|menjadi)\s*([a-zA-Z°]+)/i);
    if (!match) return null;

    const val = parseFloat(match[1].replace(',', '.'));
    const fromUnit = match[2].trim().toLowerCase();
    const toUnit = match[3].trim().toLowerCase();

    // 1. Suhu (Celcius, Fahrenheit, Kelvin, Reamur)
    if (['c', 'celcius', 'f', 'fahrenheit', 'k', 'kelvin', 'r', 'reamur'].includes(fromUnit) &&
        ['c', 'celcius', 'f', 'fahrenheit', 'k', 'kelvin', 'r', 'reamur'].includes(toUnit)) {
      let inC = val;
      if (fromUnit.startsWith('f')) inC = (val - 32) * (5 / 9);
      else if (fromUnit.startsWith('k')) inC = val - 273.15;
      else if (fromUnit.startsWith('r')) inC = val * (5 / 4);

      let targetVal = inC;
      let targetName = '°C (Celcius)';
      if (toUnit.startsWith('f')) { targetVal = (inC * 9 / 5) + 32; targetName = '°F (Fahrenheit)'; }
      else if (toUnit.startsWith('k')) { targetVal = inC + 273.15; targetName = 'K (Kelvin)'; }
      else if (toUnit.startsWith('r')) { targetVal = inC * 4 / 5; targetName = '°R (Reamur)'; }

      return {
        found: true,
        type: 'CALCULATOR',
        title: 'Konversi Suhu',
        response: `🌡️ **Konversi Suhu:**\n\n**${val} ${fromUnit.toUpperCase()}** = **${targetVal.toFixed(2)} ${targetName}**`
      };
    }

    // 2. Panjang / Jarak (km, m, cm, mm, mil)
    const lengthFactors: Record<string, number> = {
      'km': 1000, 'kilometer': 1000,
      'm': 1, 'meter': 1,
      'cm': 0.01, 'centimeter': 0.01,
      'mm': 0.001, 'millimeter': 0.001,
      'mil': 1609.34, 'mile': 1609.34,
      'kaki': 0.3048, 'ft': 0.3048, 'feet': 0.3048,
      'inci': 0.0254, 'inch': 0.0254
    };

    if (lengthFactors[fromUnit] && lengthFactors[toUnit]) {
      const meters = val * lengthFactors[fromUnit];
      const result = meters / lengthFactors[toUnit];
      return {
        found: true,
        type: 'CALCULATOR',
        title: 'Konversi Panjang & Jarak',
        response: `📏 **Konversi Panjang:**\n\n**${val} ${fromUnit}** = **${result.toLocaleString('id-ID', { maximumFractionDigits: 4 })} ${toUnit}**`
      };
    }

    // 3. Berat / Massa (kg, gram, mg, lbs, pound)
    const massFactors: Record<string, number> = {
      'kg': 1000, 'kilogram': 1000,
      'g': 1, 'gram': 1, 'gr': 1,
      'mg': 0.001, 'miligram': 0.001,
      'lbs': 453.592, 'pound': 453.592, 'pon': 500,
      'ton': 1000000
    };

    if (massFactors[fromUnit] && massFactors[toUnit]) {
      const grams = val * massFactors[fromUnit];
      const result = grams / massFactors[toUnit];
      return {
        found: true,
        type: 'CALCULATOR',
        title: 'Konversi Massa / Berat',
        response: `⚖️ **Konversi Berat:**\n\n**${val} ${fromUnit}** = **${result.toLocaleString('id-ID', { maximumFractionDigits: 4 })} ${toUnit}**`
      };
    }

    // 4. Data Komputer (B, KB, MB, GB, TB)
    const dataFactors: Record<string, number> = {
      'b': 1, 'byte': 1,
      'kb': 1024,
      'mb': 1024 * 1024,
      'gb': 1024 * 1024 * 1024,
      'tb': 1024 * 1024 * 1024 * 1024
    };

    if (dataFactors[fromUnit] && dataFactors[toUnit]) {
      const bytes = val * dataFactors[fromUnit];
      const result = bytes / dataFactors[toUnit];
      return {
        found: true,
        type: 'CALCULATOR',
        title: 'Konversi Ukuran File / Data',
        response: `💾 **Konversi Data:**\n\n**${val} ${fromUnit.toUpperCase()}** = **${result.toLocaleString('id-ID', { maximumFractionDigits: 4 })} ${toUnit.toUpperCase()}**`
      };
    }

    return null;
  }

  /**
   * Kalkulator Persentase & Diskon Cepat
   * Contoh: "berapa 15% dari 250000", "diskon 20% dari 150rb"
   */
  static calculatePercentage(query: string): OfflineMatchResult | null {
    const lower = query.toLowerCase();
    if (!lower.includes('%') && !lower.includes('diskon') && !lower.includes('persen')) return null;

    const percentMatch = lower.match(/(\d+(?:[.,]\d+)?)\s*%/i) || lower.match(/diskon\s*(\d+(?:[.,]\d+)?)/i);
    const targetMatch = lower.match(/(?:dari|harga|nilai)\s*(\d+(?:[.,]\d+)?\s*(?:jt|juta|rb|k|ribu)?|\d{4,10})/i);

    if (percentMatch && targetMatch) {
      const percent = parseFloat(percentMatch[1].replace(',', '.'));
      const money = this.parseIndonesianMoney(targetMatch[1]);
      const baseValue = money ? money.amount : parseFloat(targetMatch[1].replace(/\./g, '').replace(',', '.'));

      if (percent >= 0 && baseValue > 0) {
        const portion = (percent / 100) * baseValue;
        const discounted = baseValue - portion;

        return {
          found: true,
          type: 'CALCULATOR',
          title: 'Kalkulator Persentase & Diskon',
          response: `🏷️ **Hasil Hitungan Persentase:**\n\n- **Nilai Pokok:** Rp ${Math.round(baseValue).toLocaleString('id-ID')}\n- **Persentase:** ${percent}%\n- **Besaran (${percent}%):** **Rp ${Math.round(portion).toLocaleString('id-ID')}**\n- **Jika Diskon (Sisa Bayar):** **Rp ${Math.round(discounted).toLocaleString('id-ID')}**`
        };
      }
    }

    return null;
  }

  /**
   * Kalkulator Matematika Instan
   * Contoh: "hitung 150000 / 3", "25000 * 4", "berapa 120 + 85"
   */
  static evaluateMathExpression(query: string): OfflineMatchResult | null {
    const clean = query.toLowerCase().replace(/hitung|berapa|hasil dari|=|kalkulator/gi, '').trim();
    // Hanya proses jika mengandung operator matematika dan angka
    if (!/^[\d\s+\-*/().,%^]+$/.test(clean) || !/[\d]/.test(clean) || !/[+\-*/^]/.test(clean)) {
      return null;
    }

    try {
      // Ganti simbol aman
      const sanitized = clean.replace(/,/g, '.').replace(/\^/g, '**');
      // Evaluasi terbatas matematika saja
      const result = Function(`'use strict'; return (${sanitized})`)();
      if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
        return {
          found: true,
          type: 'CALCULATOR',
          title: 'Kalkulator Cepat',
          response: `🔢 **Hasil Perhitungan:**\n\n\`${clean}\` = **${Number(result.toFixed(4)).toLocaleString('id-ID')}**`
        };
      }
    } catch {
      // Abaikan jika bukan ekspresi valid
    }

    return null;
  }

  /**
   * Parser Konversi Nilai Angka ke Huruf & Bobot Indeks Prestasi
   * Contoh: "nilai 86", "konversi nilai 78", "grade 82"
   */
  static evaluateGrade(query: string): OfflineMatchResult | null {
    const lower = query.toLowerCase();
    if (!lower.includes('nilai') && !lower.includes('grade') && !lower.includes('skala')) return null;

    const match = lower.match(/(?:nilai|grade)\s*(\d+(?:[.,]\d+)?)/i);
    if (!match) return null;

    const score = parseFloat(match[1].replace(',', '.'));
    if (score < 0 || score > 100) return null;

    let grade = 'E';
    let gpa = 0.0;
    let description = 'Gagal';

    if (score >= 85) {
      grade = 'A'; gpa = 4.0; description = 'Istimewa / Sangat Memuaskan';
    } else if (score >= 80) {
      grade = 'A-'; gpa = 3.7; description = 'Hampir Istimewa';
    } else if (score >= 75) {
      grade = 'B+'; gpa = 3.3; description = 'Lebih Baik Dari Rata-rata';
    } else if (score >= 70) {
      grade = 'B'; gpa = 3.0; description = 'Memuaskan / Baik';
    } else if (score >= 65) {
      grade = 'B-'; gpa = 2.7; description = 'Cukup Baik';
    } else if (score >= 60) {
      grade = 'C+'; gpa = 2.3; description = 'Cukup';
    } else if (score >= 55) {
      grade = 'C'; gpa = 2.0; description = 'Sedang / Batas Lulus Minimal';
    } else if (score >= 40) {
      grade = 'D'; gpa = 1.0; description = 'Kurang (Perlu Mengulang)';
    }

    return {
      found: true,
      type: 'CALCULATOR',
      title: 'Konversi Nilai Standar Perguruan Tinggi',
      response: `📊 **Hasil Konversi Nilai ${score}:**\n\n- **Nilai Huruf:** **${grade}**\n- **Bobot Indeks (GPA):** **${gpa.toFixed(1)}** / 4.0\n- **Predikat:** ${description}\n\n*(Standar skala 4.0 Dikti Kemendikbudristek)*`
    };
  }

  /**
   * Parser Cerdas Nominal Uang Mahasiswa
   * Mendukung: "15rb", "50k", "2.5jt", "100ribu", "25000"
   */
  static parseIndonesianMoney(text: string): { amount: number; cleanText: string } | null {
    // 1. Format Juta: 1.5jt, 2jt, 10 juta
    const jtMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(?:jt|juta)/i);
    if (jtMatch) {
      const num = parseFloat(jtMatch[1].replace(',', '.'));
      const amount = Math.round(num * 1000000);
      const cleanText = text.replace(jtMatch[0], '').trim();
      return { amount, cleanText };
    }

    // 2. Format Ribu: 15rb, 50k, 25ribu
    const rbMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(?:rb|k|ribu)/i);
    if (rbMatch) {
      const num = parseFloat(rbMatch[1].replace(',', '.'));
      const amount = Math.round(num * 1000);
      const cleanText = text.replace(rbMatch[0], '').trim();
      return { amount, cleanText };
    }

    // 3. Format Angka Langsung: 25000, 100000
    const rawMatch = text.match(/\b(\d{4,9})\b/);
    if (rawMatch) {
      const amount = parseInt(rawMatch[1], 10);
      const cleanText = text.replace(rawMatch[0], '').trim();
      return { amount, cleanText };
    }

    return null;
  }

  /**
   * Bank Soal Kuis Bawaan
   */
  static getRandomQuiz(): OfflineQuizQuestion {
    const list = BUILT_IN_OFFLINE_QUIZZES;
    return list[Math.floor(Math.random() * list.length)];
  }
}
