import React, { useState, useEffect } from 'react';
import { CitationStyle } from '../types';
import { 
  Quote, Copy, Check, RotateCcw, BookOpen, Plus, Trash2, 
  Download, FileText, Sparkles, BookmarkPlus, ArrowRight, ExternalLink
} from 'lucide-react';
import { StorageService } from '../services/storage';

export type ExtendedSourceType = 'BOOK' | 'JOURNAL' | 'WEBSITE' | 'CONFERENCE' | 'THESIS';
export type ExtendedCitationStyle = CitationStyle | 'CHICAGO' | 'HARVARD';

export interface SavedCitation {
  id: string;
  citationText: string;
  rawPlain: string;
  style: ExtendedCitationStyle;
  sourceType: ExtendedSourceType;
  title: string;
  authors: string;
  year: string;
  createdAt: number;
}

const PRESETS: Record<string, {
  name: string;
  sourceType: ExtendedSourceType;
  authors: string;
  year: string;
  title: string;
  publisher?: string;
  journalName?: string;
  volumeIssue?: string;
  pages?: string;
  url?: string;
  institution?: string;
  conferenceName?: string;
}> = {
  book: {
    name: 'Buku Metodologi (Sugiyono)',
    sourceType: 'BOOK',
    authors: 'Sugiyono',
    year: '2019',
    title: 'Metode Penelitian Kuantitatif, Kualitatif, dan R&D',
    publisher: 'Alfabeta'
  },
  journal: {
    name: 'Jurnal Ilmiah (IEEE)',
    sourceType: 'JOURNAL',
    authors: 'Pratama, A., & Wijaya, K.',
    year: '2023',
    title: 'Implementasi Machine Learning untuk Prediksi Kelulusan Mahasiswa',
    journalName: 'Jurnal Rekayasa Sistem dan Teknologi Informasi',
    volumeIssue: '7(2)',
    pages: '312-320'
  },
  website: {
    name: 'Website Resmi (Kemdikbud)',
    sourceType: 'WEBSITE',
    authors: 'Kemdikbudristek',
    year: '2024',
    title: 'Buku Panduan Merdeka Belajar Kampus Merdeka',
    url: 'https://kampusmerdeka.kemdikbud.go.id'
  },
  thesis: {
    name: 'Skripsi / Tesis Universitas',
    sourceType: 'THESIS',
    authors: 'Santoso, Budi',
    year: '2023',
    title: 'Rancang Bangun Sistem Informasi Akademik Berbasis Cloud',
    institution: 'Universitas Indonesia',
    publisher: 'Skripsi Sarjana Komputer'
  }
};

export const CitationGenerator: React.FC = () => {
  const [style, setStyle] = useState<ExtendedCitationStyle>('APA');
  const [sourceType, setSourceType] = useState<ExtendedSourceType>('BOOK');
  
  // Fields
  const [authors, setAuthors] = useState('');
  const [year, setYear] = useState('');
  const [title, setTitle] = useState('');
  const [publisher, setPublisher] = useState('');
  const [journalName, setJournalName] = useState('');
  const [volumeIssue, setVolumeIssue] = useState('');
  const [pages, setPages] = useState('');
  const [url, setUrl] = useState('');
  const [institution, setInstitution] = useState('');
  const [conferenceName, setConferenceName] = useState('');
  
  const [result, setResult] = useState('');
  const [copied, setCopied] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [savedCitations, setSavedCitations] = useState<SavedCitation[]>([]);
  const [copiedAll, setCopiedAll] = useState(false);

  useEffect(() => {
    const saved = StorageService.getItem<SavedCitation[]>('saved_citations', []);
    setSavedCitations(saved || []);
  }, []);

  const saveCitationsList = (list: SavedCitation[]) => {
    setSavedCitations(list);
    StorageService.setItem('saved_citations', list);
  };

  const generateCitation = () => {
    let res = '';
    const authorText = authors.trim() ? authors.trim() : 'Anonim';
    const titleText = title.trim() || 'Tanpa Judul';
    const yearText = year.trim() || 'n.d.';

    if (style === 'APA') {
      if (sourceType === 'BOOK') {
        res = `${authorText}. (${yearText}). *${titleText}*. ${publisher.trim() || 'Penerbit tidak diketahui'}.`;
      } else if (sourceType === 'JOURNAL') {
        res = `${authorText}. (${yearText}). ${titleText}. *${journalName.trim() || 'Nama Jurnal'}*, *${volumeIssue.trim() || '1(1)'}*, ${pages.trim() || '1-10'}.`;
      } else if (sourceType === 'WEBSITE') {
        res = `${authorText}. (${yearText}). *${titleText}*. Diakses dari ${url.trim() || '-'}`;
      } else if (sourceType === 'CONFERENCE') {
        res = `${authorText}. (${yearText}). ${titleText}. *Prosiding ${conferenceName.trim() || 'Konferensi Ilmiah'}*, ${pages.trim() || '1-5'}.`;
      } else if (sourceType === 'THESIS') {
        res = `${authorText}. (${yearText}). *${titleText}* [${publisher.trim() || 'Skripsi Sarjana'}]. ${institution.trim() || 'Perpustakaan Universitas'}.`;
      }
    } 
    else if (style === 'MLA') {
      if (sourceType === 'BOOK') {
        res = `${authorText}. *${titleText}*. ${publisher.trim() || 'Publisher'}, ${yearText}.`;
      } else if (sourceType === 'JOURNAL') {
        const volParts = volumeIssue.split('(');
        const vol = volParts[0] || '1';
        const no = volParts[1]?.replace(')', '') || '1';
        res = `${authorText}. "${titleText}." *${journalName.trim() || 'Journal'}*, vol. ${vol}, no. ${no}, ${yearText}, pp. ${pages.trim() || '1-10'}.`;
      } else if (sourceType === 'WEBSITE') {
        res = `${authorText}. "${titleText}." *Web*, ${yearText}, ${url.trim() || '-'}.`;
      } else if (sourceType === 'CONFERENCE') {
        res = `${authorText}. "${titleText}." *${conferenceName.trim() || 'Proceedings'}*, ${yearText}, pp. ${pages.trim() || '1-5'}.`;
      } else if (sourceType === 'THESIS') {
        res = `${authorText}. *${titleText}*. Disertasi / Skripsi, ${institution.trim() || 'Universitas'}, ${yearText}.`;
      }
    }
    else if (style === 'IEEE') {
      if (sourceType === 'BOOK') {
        res = `${authorText}, *${titleText}*. Kota: ${publisher.trim() || 'Publisher'}, ${yearText}.`;
      } else if (sourceType === 'JOURNAL') {
        res = `${authorText}, "${titleText}," *${journalName.trim() || 'Journal'}*, vol. ${volumeIssue.split('(')[0] || '1'}, pp. ${pages.trim() || '1-10'}, ${yearText}.`;
      } else if (sourceType === 'WEBSITE') {
        res = `${authorText}, "${titleText}." [Daring]. Tersedia: ${url.trim() || '-'}. [Diakses: ${new Date().toLocaleDateString('id-ID')}].`;
      } else if (sourceType === 'CONFERENCE') {
        res = `${authorText}, "${titleText}," dalam *${conferenceName.trim() || 'Konferensi'}*, ${yearText}, pp. ${pages.trim() || '1-5'}.`;
      } else if (sourceType === 'THESIS') {
        res = `${authorText}, "${titleText}," ${publisher.trim() || 'Skripsi Sarjana'}, ${institution.trim() || 'Universitas'}, ${yearText}.`;
      }
    }
    else if (style === 'HARVARD') {
      if (sourceType === 'BOOK') {
        res = `${authorText} ${yearText}, *${titleText}*, ${publisher.trim() || 'Publisher'}.`;
      } else if (sourceType === 'JOURNAL') {
        res = `${authorText} ${yearText}, '${titleText}', *${journalName.trim() || 'Journal'}*, vol. ${volumeIssue.trim() || '1'}, hal. ${pages.trim() || '1-10'}.`;
      } else {
        res = `${authorText} ${yearText}, *${titleText}*, dilihat ${new Date().toLocaleDateString('id-ID')}, <${url.trim() || '-'}>.`;
      }
    }
    else if (style === 'CHICAGO') {
      if (sourceType === 'BOOK') {
        res = `${authorText}. ${yearText}. *${titleText}*. Kota: ${publisher.trim() || 'Publisher'}.`;
      } else if (sourceType === 'JOURNAL') {
        res = `${authorText}. ${yearText}. "${titleText}." *${journalName.trim()}* ${volumeIssue.trim()}: ${pages.trim() || '1-10'}.`;
      } else {
        res = `${authorText}. ${yearText}. "${titleText}." Diakses ${new Date().toLocaleDateString('id-ID')}. ${url.trim() || '-'}.`;
      }
    }

    setResult(res);
    setCopied(false);
  };

  const handleCopy = () => {
    const plainText = result.replace(/\*/g, '');
    navigator.clipboard.writeText(plainText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveToBibliography = () => {
    if (!result) return;
    const plainText = result.replace(/\*/g, '');
    const newEntry: SavedCitation = {
      id: `cite-${Date.now()}`,
      citationText: result,
      rawPlain: plainText,
      style,
      sourceType,
      title: title.trim() || 'Tanpa Judul',
      authors: authors.trim() || 'Anonim',
      year: year.trim() || 'n.d.',
      createdAt: Date.now()
    };

    const updated = [newEntry, ...savedCitations];
    saveCitationsList(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleDeleteSaved = (id: string) => {
    const updated = savedCitations.filter(c => c.id !== id);
    saveCitationsList(updated);
  };

  const handleClearAllSaved = () => {
    if (!confirm('Hapus semua daftar pustaka yang tersimpan?')) return;
    saveCitationsList([]);
  };

  const handleCopyAllBibliography = () => {
    if (savedCitations.length === 0) return;
    // Sort alphabetically by authors according to academic standards
    const sorted = [...savedCitations].sort((a, b) => a.authors.localeCompare(b.authors));
    const fullText = sorted.map(c => c.rawPlain).join('\n\n');
    
    navigator.clipboard.writeText(fullText);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleDownloadBibliography = () => {
    if (savedCitations.length === 0) return;
    const sorted = [...savedCitations].sort((a, b) => a.authors.localeCompare(b.authors));
    let content = `# DAFTAR PUSTAKA\n\n`;
    sorted.forEach((c, i) => {
      content += `${c.rawPlain}\n\n`;
    });

    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const u = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = u;
    a.download = `daftar-pustaka-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(u);
  };

  const applyPreset = (key: string) => {
    const p = PRESETS[key];
    if (!p) return;
    setSourceType(p.sourceType);
    setAuthors(p.authors);
    setYear(p.year);
    setTitle(p.title);
    setPublisher(p.publisher || '');
    setJournalName(p.journalName || '');
    setVolumeIssue(p.volumeIssue || '');
    setPages(p.pages || '');
    setUrl(p.url || '');
    setInstitution(p.institution || '');
    setConferenceName(p.conferenceName || '');
  };

  const resetForm = () => {
    setAuthors('');
    setYear('');
    setTitle('');
    setPublisher('');
    setJournalName('');
    setVolumeIssue('');
    setPages('');
    setUrl('');
    setInstitution('');
    setConferenceName('');
    setResult('');
  };

  const renderResultHTML = () => {
    if (!result) return null;
    const parts = result.split('*');
    return (
      <span>
        {parts.map((part, i) => i % 2 === 1 ? <i key={i} className="text-primary font-medium">{part}</i> : part)}
      </span>
    );
  };

  return (
    <div className="min-h-full w-full flex flex-col animate-fade-in max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono tracking-widest text-primary bg-primary/10 px-2.5 py-1 rounded-full uppercase border border-primary/20">
              Karya Tulis Ilmiah
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
            <Quote className="text-primary" size={30} /> Generator Sitasi & Daftar Pustaka
          </h2>
          <p className="text-zinc-400 mt-1 text-xs sm:text-sm max-w-2xl">
            Buat rujukan terstandar format APA, IEEE, MLA, Harvard, dan Chicago untuk skripsi, makalah, atau jurnal dengan urutan alfabetis otomatis.
          </p>
        </div>

        {/* Preset Quick Chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-zinc-500 font-semibold mr-1 flex items-center gap-1">
            <Sparkles size={13} className="text-amber-400" /> Contoh:
          </span>
          {Object.entries(PRESETS).map(([k, p]) => (
            <button
              key={k}
              onClick={() => applyPreset(k)}
              className="px-2.5 py-1 text-[11px] font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors border border-white/5"
            >
              {p.name.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-zinc-900/80 border border-white/10 rounded-3xl p-6 shadow-xl">
            {/* Source Type Selector */}
            <div className="mb-5">
              <label className="text-xs text-zinc-400 block mb-2 font-bold uppercase tracking-wider">
                Jenis Sumber Literatur
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 bg-zinc-950 p-1.5 rounded-2xl border border-white/5">
                {[
                  { id: 'BOOK', label: 'Buku' },
                  { id: 'JOURNAL', label: 'Jurnal' },
                  { id: 'WEBSITE', label: 'Website' },
                  { id: 'CONFERENCE', label: 'Prosiding' },
                  { id: 'THESIS', label: 'Skripsi' },
                ].map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSourceType(t.id as ExtendedSourceType)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all ${
                      sourceType === t.id 
                        ? 'bg-primary text-white shadow-md shadow-primary/20' 
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Citation Style Selector */}
            <div className="mb-6">
              <label className="text-xs text-zinc-400 block mb-2 font-bold uppercase tracking-wider">
                Format Sitasi
              </label>
              <div className="grid grid-cols-5 gap-1.5 bg-zinc-950 p-1.5 rounded-2xl border border-white/5">
                {[
                  { id: 'APA', label: 'APA 7th' },
                  { id: 'IEEE', label: 'IEEE' },
                  { id: 'MLA', label: 'MLA 9th' },
                  { id: 'HARVARD', label: 'Harvard' },
                  { id: 'CHICAGO', label: 'Chicago' },
                ].map(s => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setStyle(s.id as ExtendedCitationStyle)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all ${
                      style === s.id 
                        ? 'bg-white text-black shadow-md' 
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="sm:col-span-2">
                <label className="text-xs text-zinc-400 block mb-1 font-medium">
                  Penulis / Pengarang (Nama Belakang, Inisial atau Nama Lengkap)
                </label>
                <input 
                  className="input-field" 
                  placeholder="Contoh: Santoso, B. atau Smith, John" 
                  value={authors} 
                  onChange={e => setAuthors(e.target.value)} 
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs text-zinc-400 block mb-1 font-medium">
                  Judul {sourceType === 'JOURNAL' ? 'Artikel Jurnal' : (sourceType === 'WEBSITE' ? 'Halaman / Artikel Web' : (sourceType === 'THESIS' ? 'Skripsi / Tesis' : 'Buku'))}
                </label>
                <input 
                  className="input-field" 
                  placeholder="Judul lengkap karya ilmiah..." 
                  value={title} 
                  onChange={e => setTitle(e.target.value)} 
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1 font-medium">Tahun Terbit</label>
                <input 
                  className="input-field" 
                  placeholder="Contoh: 2024" 
                  value={year} 
                  onChange={e => setYear(e.target.value)} 
                />
              </div>

              {sourceType === 'BOOK' && (
                <div>
                  <label className="text-xs text-zinc-400 block mb-1 font-medium">Penerbit</label>
                  <input 
                    className="input-field" 
                    placeholder="Gramedia, Alfabeta, dll" 
                    value={publisher} 
                    onChange={e => setPublisher(e.target.value)} 
                  />
                </div>
              )}

              {sourceType === 'JOURNAL' && (
                <>
                  <div>
                    <label className="text-xs text-zinc-400 block mb-1 font-medium">Nama Jurnal</label>
                    <input 
                      className="input-field" 
                      placeholder="Jurnal Rekayasa Perangkat Lunak..." 
                      value={journalName} 
                      onChange={e => setJournalName(e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-400 block mb-1 font-medium">Volume & Nomor</label>
                    <input 
                      className="input-field" 
                      placeholder="Contoh: 12(3)" 
                      value={volumeIssue} 
                      onChange={e => setVolumeIssue(e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-400 block mb-1 font-medium">Rentang Halaman</label>
                    <input 
                      className="input-field" 
                      placeholder="Contoh: 120-135" 
                      value={pages} 
                      onChange={e => setPages(e.target.value)} 
                    />
                  </div>
                </>
              )}

              {sourceType === 'WEBSITE' && (
                <div className="sm:col-span-2">
                  <label className="text-xs text-zinc-400 block mb-1 font-medium">URL Tautan</label>
                  <input 
                    className="input-field" 
                    placeholder="https://..." 
                    value={url} 
                    onChange={e => setUrl(e.target.value)} 
                  />
                </div>
              )}

              {sourceType === 'CONFERENCE' && (
                <>
                  <div>
                    <label className="text-xs text-zinc-400 block mb-1 font-medium">Nama Konferensi / Seminar</label>
                    <input 
                      className="input-field" 
                      placeholder="Seminar Nasional Ilmu Komputer..." 
                      value={conferenceName} 
                      onChange={e => setConferenceName(e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-400 block mb-1 font-medium">Halaman Prosiding</label>
                    <input 
                      className="input-field" 
                      placeholder="Contoh: 45-50" 
                      value={pages} 
                      onChange={e => setPages(e.target.value)} 
                    />
                  </div>
                </>
              )}

              {sourceType === 'THESIS' && (
                <>
                  <div>
                    <label className="text-xs text-zinc-400 block mb-1 font-medium">Universitas / Institusi</label>
                    <input 
                      className="input-field" 
                      placeholder="Universitas Gadjah Mada" 
                      value={institution} 
                      onChange={e => setInstitution(e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-400 block mb-1 font-medium">Jenjang</label>
                    <input 
                      className="input-field" 
                      placeholder="Skripsi Sarjana / Tesis Magister" 
                      value={publisher} 
                      onChange={e => setPublisher(e.target.value)} 
                    />
                  </div>
                </>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button 
                type="button"
                onClick={resetForm} 
                className="px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-xl transition-colors"
                title="Reset formulir"
              >
                <RotateCcw size={18} />
              </button>
              <button 
                type="button"
                onClick={generateCitation} 
                className="flex-1 bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-all active:scale-95 text-sm"
              >
                <BookOpen size={18} /> Generate Sitasi Sekarang
              </button>
            </div>
          </div>

          {/* Generated Result Card */}
          {result && (
            <div className="bg-zinc-900/90 border border-primary/40 rounded-3xl p-6 relative animate-slide-up shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-primary uppercase tracking-wider">
                  Hasil Sitasi ({style})
                </span>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleCopy}
                    className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs font-semibold text-zinc-300 hover:text-white transition-colors flex items-center gap-1.5"
                    title="Salin ke papan klip"
                  >
                    {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    <span>{copied ? 'Tersalin' : 'Salin'}</span>
                  </button>

                  <button 
                    onClick={handleSaveToBibliography}
                    className="px-3 py-1.5 bg-primary/20 hover:bg-primary/30 border border-primary/30 rounded-lg text-xs font-bold text-primary transition-colors flex items-center gap-1.5"
                    title="Simpan ke daftar pustaka"
                  >
                    {savedSuccess ? <Check size={14} className="text-emerald-400" /> : <BookmarkPlus size={14} />}
                    <span>{savedSuccess ? 'Tersimpan!' : 'Simpan ke Dapus'}</span>
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-black/40 border border-white/5 font-serif text-base leading-relaxed text-zinc-200 select-all">
                {renderResultHTML()}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Saved Bibliography Collection (5 cols) */}
        <div className="lg:col-span-5 bg-zinc-900/80 border border-white/10 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FileText size={18} className="text-primary" /> Daftar Pustaka Saya
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Tersimpan {savedCitations.length} referensi ilmiah
                </p>
              </div>

              {savedCitations.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleCopyAllBibliography}
                    className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl text-xs font-semibold transition-colors"
                    title="Salin seluruh daftar pustaka (Alfabetis A-Z)"
                  >
                    {copiedAll ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} />}
                  </button>
                  <button
                    onClick={handleDownloadBibliography}
                    className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl text-xs font-semibold transition-colors"
                    title="Unduh file Markdown (.md)"
                  >
                    <Download size={15} />
                  </button>
                  <button
                    onClick={handleClearAllSaved}
                    className="p-2 bg-zinc-800 hover:bg-red-500/20 text-zinc-500 hover:text-red-400 rounded-xl text-xs font-semibold transition-colors"
                    title="Kosongkan daftar pustaka"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              )}
            </div>

            {savedCitations.length === 0 ? (
              <div className="text-center py-16 text-zinc-500 border border-dashed border-white/5 rounded-2xl p-6">
                <Quote size={40} className="mx-auto mb-3 opacity-30 text-zinc-400" />
                <p className="text-sm font-semibold text-zinc-300">Belum ada sitasi yang disimpan</p>
                <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto">
                  Generate sitasi di sebelah kiri, lalu klik &quot;Simpan ke Dapus&quot; untuk mengumpulkan referensi skripsimu.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                {[...savedCitations]
                  .sort((a, b) => a.authors.localeCompare(b.authors))
                  .map(cite => (
                    <div 
                      key={cite.id} 
                      className="bg-black/30 border border-white/5 hover:border-white/10 p-3.5 rounded-2xl transition-all group relative"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                          {cite.style} • {cite.sourceType}
                        </span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(cite.rawPlain);
                            }}
                            className="p-1 text-zinc-400 hover:text-white rounded hover:bg-white/5"
                            title="Salin sitasi ini"
                          >
                            <Copy size={13} />
                          </button>
                          <button
                            onClick={() => handleDeleteSaved(cite.id)}
                            className="p-1 text-zinc-500 hover:text-red-400 rounded hover:bg-white/5"
                            title="Hapus referensi ini"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs font-serif text-zinc-300 leading-relaxed">
                        {cite.rawPlain}
                      </p>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {savedCitations.length > 0 && (
            <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-xs">
              <span className="text-zinc-500">Urutan Otomatis: Alfabetis (A-Z)</span>
              <button
                onClick={handleCopyAllBibliography}
                className="text-primary font-bold hover:underline flex items-center gap-1"
              >
                <span>{copiedAll ? 'Semua Tersalin!' : 'Salin Semua Daftar'}</span>
                <ArrowRight size={13} />
              </button>
            </div>
          )}
        </div>
      </div>
      
      <style>{`
        .input-field {
          width: 100%;
          background-color: rgb(24 24 27 / 0.8);
          border: 1px solid rgb(255 255 255 / 0.1);
          color: white;
          padding: 0.65rem 0.85rem;
          border-radius: 0.75rem;
          outline: none;
          font-size: 0.875rem;
          transition: all 0.2s;
        }
        .input-field:focus {
          border-color: rgb(99 102 241);
          background-color: rgb(24 24 27);
        }
      `}</style>
    </div>
  );
};
