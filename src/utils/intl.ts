import { SupportedCurrency, AcademicGradingScale } from '../types';

export interface CurrencyConfig {
  code: SupportedCurrency;
  symbol: string;
  name: string;
  locale: string;
  decimals: number;
  presets: number[];
}

export const CURRENCY_MAP: Record<SupportedCurrency, CurrencyConfig> = {
  IDR: {
    code: 'IDR',
    symbol: 'Rp',
    name: 'Indonesian Rupiah',
    locale: 'id-ID',
    decimals: 0,
    presets: [20000, 50000, 100000, 250000, 500000]
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    locale: 'en-US',
    decimals: 2,
    presets: [5, 10, 25, 50, 100]
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    locale: 'de-DE',
    decimals: 2,
    presets: [5, 10, 25, 50, 100]
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    locale: 'en-GB',
    decimals: 2,
    presets: [5, 10, 20, 50, 100]
  },
  SGD: {
    code: 'SGD',
    symbol: 'S$',
    name: 'Singapore Dollar',
    locale: 'en-SG',
    decimals: 2,
    presets: [5, 10, 20, 50, 100]
  },
  AUD: {
    code: 'AUD',
    symbol: 'A$',
    name: 'Australian Dollar',
    locale: 'en-AU',
    decimals: 2,
    presets: [5, 10, 25, 50, 100]
  },
  CAD: {
    code: 'CAD',
    symbol: 'C$',
    name: 'Canadian Dollar',
    locale: 'en-CA',
    decimals: 2,
    presets: [5, 10, 25, 50, 100]
  },
  JPY: {
    code: 'JPY',
    symbol: '¥',
    name: 'Japanese Yen',
    locale: 'ja-JP',
    decimals: 0,
    presets: [500, 1000, 3000, 5000, 10000]
  }
};

export const formatCurrency = (amount: number, currencyCode: SupportedCurrency = 'IDR'): string => {
  const config = CURRENCY_MAP[currencyCode] || CURRENCY_MAP.IDR;
  try {
    return new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: config.code,
      minimumFractionDigits: config.decimals,
      maximumFractionDigits: config.decimals
    }).format(amount);
  } catch {
    return `${config.symbol} ${amount.toLocaleString()}`;
  }
};

export interface GradeOption {
  label: string;
  value: number;
  description: string;
  color: string;
}

export const GRADING_SYSTEMS: Record<AcademicGradingScale, {
  name: string;
  subtitle: string;
  maxGpa: number;
  options: GradeOption[];
}> = {
  US_4_0: {
    name: 'US Standard 4.0 (Letter Grades)',
    subtitle: 'Standard for North American & International Universities',
    maxGpa: 4.0,
    options: [
      { label: 'A', value: 4.00, description: 'Superior / 93-100%', color: '#10b981' },
      { label: 'A-', value: 3.70, description: 'Excellent / 90-92%', color: '#059669' },
      { label: 'B+', value: 3.30, description: 'Very Good / 87-89%', color: '#3b82f6' },
      { label: 'B', value: 3.00, description: 'Good / 83-86%', color: '#60a5fa' },
      { label: 'B-', value: 2.70, description: 'Above Average / 80-82%', color: '#818cf8' },
      { label: 'C+', value: 2.30, description: 'Average / 77-79%', color: '#eab308' },
      { label: 'C', value: 2.00, description: 'Satisfactory / 73-76%', color: '#f59e0b' },
      { label: 'C-', value: 1.70, description: 'Passing / 70-72%', color: '#fb923c' },
      { label: 'D', value: 1.00, description: 'Minimum Pass / 60-69%', color: '#f97316' },
      { label: 'F', value: 0.00, description: 'Fail / <60%', color: '#ef4444' }
    ]
  },
  ID_4_0: {
    name: 'Indonesian 4.0 System',
    subtitle: 'Standar Perguruan Tinggi Nasional (Kemendikbud)',
    maxGpa: 4.0,
    options: [
      { label: 'A', value: 4.00, description: 'Istimewa / 85-100', color: '#10b981' },
      { label: 'A-', value: 3.75, description: 'Sangat Baik / 80-84', color: '#059669' },
      { label: 'B+', value: 3.50, description: 'Baik Sekali / 75-79', color: '#3b82f6' },
      { label: 'B', value: 3.00, description: 'Baik / 70-74', color: '#60a5fa' },
      { label: 'B-', value: 2.75, description: 'Cukup Baik / 65-69', color: '#818cf8' },
      { label: 'C+', value: 2.50, description: 'Lebih Dari Cukup / 60-64', color: '#eab308' },
      { label: 'C', value: 2.00, description: 'Cukup / 55-59', color: '#f59e0b' },
      { label: 'D', value: 1.00, description: 'Kurang / 40-54', color: '#f97316' },
      { label: 'E', value: 0.00, description: 'Gagal / <40', color: '#ef4444' }
    ]
  },
  UK_HONOURS: {
    name: 'UK Honours Degree Scale',
    subtitle: 'British Commonwealth & UK Higher Education Classification',
    maxGpa: 4.0,
    options: [
      { label: '1st', value: 4.00, description: 'First-Class Honours (70%+)', color: '#10b981' },
      { label: '2:1', value: 3.33, description: 'Upper Second-Class Honours (60-69%)', color: '#3b82f6' },
      { label: '2:2', value: 2.67, description: 'Lower Second-Class Honours (50-59%)', color: '#eab308' },
      { label: '3rd', value: 2.00, description: 'Third-Class Honours (40-49%)', color: '#f97316' },
      { label: 'Fail', value: 0.00, description: 'Fail / Unclassified (<40%)', color: '#ef4444' }
    ]
  },
  ECTS: {
    name: 'European ECTS Grade',
    subtitle: 'European Credit Transfer and Accumulation System',
    maxGpa: 4.0,
    options: [
      { label: 'A', value: 4.00, description: 'Excellent (Top 10% cohort)', color: '#10b981' },
      { label: 'B', value: 3.50, description: 'Very Good (Next 25%)', color: '#059669' },
      { label: 'C', value: 3.00, description: 'Good (Next 30%)', color: '#3b82f6' },
      { label: 'D', value: 2.50, description: 'Satisfactory (Next 25%)', color: '#eab308' },
      { label: 'E', value: 2.00, description: 'Sufficient (Next 10%)', color: '#f97316' },
      { label: 'F', value: 0.00, description: 'Fail (Credits required)', color: '#ef4444' }
    ]
  }
};

export const getAcademicHonors = (
  gpa: number,
  scale: AcademicGradingScale = 'ID_4_0',
  lang: 'id' | 'en' = 'id'
): { title: string; subtitle: string; badgeColor: string } => {
  if (scale === 'UK_HONOURS') {
    if (gpa >= 3.67) return { title: 'First-Class Honours (1st)', subtitle: 'Exceptional academic distinction', badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
    if (gpa >= 3.00) return { title: 'Upper Second-Class (2:1)', subtitle: 'High standard of academic performance', badgeColor: 'text-blue-400 bg-blue-500/10 border-blue-500/30' };
    if (gpa >= 2.33) return { title: 'Lower Second-Class (2:2)', subtitle: 'Satisfactory standard across modules', badgeColor: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30' };
    if (gpa >= 2.00) return { title: 'Third-Class (3rd)', subtitle: 'Basic degree threshold achieved', badgeColor: 'text-orange-400 bg-orange-500/10 border-orange-500/30' };
    return { title: 'Academic Probation / Remedial', subtitle: 'Requires additional credits to qualify', badgeColor: 'text-rose-400 bg-rose-500/10 border-rose-500/30' };
  }

  if (scale === 'ECTS') {
    if (gpa >= 3.80) return { title: 'ECTS Grade A (Excellent)', subtitle: 'Outstanding performance with minor errors', badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
    if (gpa >= 3.30) return { title: 'ECTS Grade B (Very Good)', subtitle: 'Above the average standard', badgeColor: 'text-blue-400 bg-blue-500/10 border-blue-500/30' };
    if (gpa >= 2.80) return { title: 'ECTS Grade C (Good)', subtitle: 'Sound work with noticeable errors', badgeColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30' };
    if (gpa >= 2.20) return { title: 'ECTS Grade D (Satisfactory)', subtitle: 'Fair but with significant shortcomings', badgeColor: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30' };
    return { title: 'ECTS Grade E/F', subtitle: 'Minimum criteria or failure', badgeColor: 'text-rose-400 bg-rose-500/10 border-rose-500/30' };
  }

  // US & ID Scales
  if (lang === 'en') {
    if (gpa >= 3.80) return { title: 'Summa Cum Laude (Highest Distinction)', subtitle: 'Top tier academic excellence and dean recognition', badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
    if (gpa >= 3.60) return { title: 'Magna Cum Laude (High Honors)', subtitle: 'Dean’s Honor Roll qualification threshold', badgeColor: 'text-blue-400 bg-blue-500/10 border-blue-500/30' };
    if (gpa >= 3.40) return { title: 'Cum Laude (With Honors)', subtitle: 'Commended academic standing', badgeColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30' };
    if (gpa >= 3.00) return { title: 'Good Standing', subtitle: 'Satisfactory university progression', badgeColor: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30' };
    return { title: 'Academic Attention Needed', subtitle: 'Schedule tutoring or study hours', badgeColor: 'text-rose-400 bg-rose-500/10 border-rose-500/30' };
  }

  // Indonesian Scale
  if (gpa >= 3.80) return { title: 'Dengan Pujian Tertinggi (Summa Cum Laude)', subtitle: 'Prestasi puncak akademik dan kandidat wisudawan terbaik', badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
  if (gpa >= 3.51) return { title: 'Dengan Pujian (Cum Laude)', subtitle: 'Memenuhi syarat predikat kelulusan kehormatan', badgeColor: 'text-blue-400 bg-blue-500/10 border-blue-500/30' };
  if (gpa >= 3.00) return { title: 'Sangat Memuaskan', subtitle: 'Performa akademik di atas rata-rata universitas', badgeColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30' };
  if (gpa >= 2.76) return { title: 'Memuaskan', subtitle: 'Progres akademik standar', badgeColor: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30' };
  return { title: 'Perlu Peningkatan', subtitle: 'Tingkatkan target belajar dan presensi', badgeColor: 'text-rose-400 bg-rose-500/10 border-rose-500/30' };
};
