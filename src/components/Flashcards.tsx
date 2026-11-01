import { useStore } from '../store/useStore';

import React, { useState, useEffect, useRef } from 'react';
import { FlashcardDeck, Flashcard, Course } from '../types';
import { StorageService } from '../services/storage';
import { STORAGE_KEYS } from '../services/storageKeys';
import { SharingService } from '../services/sharing';
import { AIService } from '../services/ai';
import { Plus, Trash2, RotateCcw, Check, X, Layers, Play, Trophy, Brain, Share2, Bell, AlertTriangle, Info, Lightbulb, Sparkles, Upload, FileUp, FileText, CheckCircle2, Loader2, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface UploadedFileState {
  file: File;
  name: string;
  size: number;
  type: string;
  base64: string;
  previewUrl?: string;
}

export const Flashcards: React.FC = () => {
  const onGainXp = useStore(state => state.gainXp);

  const [courses] = useState<Course[]>(() => {
    return StorageService.getItem<Course[]>(STORAGE_KEYS.COURSES, []);
  });

  const [decks, setDecks] = useState<FlashcardDeck[]>([]);
  const [activeDeck, setActiveDeck] = useState<FlashcardDeck | null>(null);
  const [isStudyMode, setIsStudyMode] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showAIForm, setShowAIForm] = useState(false);
  const [showTips, setShowTips] = useState(false);

  // Form states
  const [newDeckTitle, setNewDeckTitle] = useState('');
  const [newDeckSubject, setNewDeckSubject] = useState('');
  const [newDeckCourseId, setNewDeckCourseId] = useState('');
  
  // AI Form states & File Upload
  const [aiMode, setAiMode] = useState<'file' | 'text'>('file');
  const [targetDeck, setTargetDeck] = useState<FlashcardDeck | null>(null);
  const [uploadedFile, setUploadedFile] = useState<UploadedFileState | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [aiInstructions, setAiInstructions] = useState('');
  const [aiDeckTitle, setAiDeckTitle] = useState('');
  const [aiDeckSubject, setAiDeckSubject] = useState('');
  const [aiDeckCourseId, setAiDeckCourseId] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStage, setGenerationStage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDecks(StorageService.getItem<FlashcardDeck[]>('flashcards', []));
  }, []);

  const saveDecks = (updatedDecks: FlashcardDeck[]) => {
    setDecks(updatedDecks);
    StorageService.setItem('flashcards', updatedDecks);
  };

  const createDeck = () => {
    if (!newDeckTitle) return;
    const newDeck: FlashcardDeck = {
      id: StorageService.generateId(),
      title: newDeckTitle,
      subject: newDeckSubject || 'General',
      courseId: newDeckCourseId || undefined,
      cards: [],
      updatedAt: Date.now()
    };
    saveDecks([...decks, newDeck]);
    setNewDeckTitle('');
    setNewDeckSubject('');
    setNewDeckCourseId('');
    setShowForm(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleFileSelect = (file: File) => {
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) {
      alert("Ukuran file maksimal adalah 25MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const isImg = file.type.startsWith('image/');
      const previewUrl = isImg ? URL.createObjectURL(file) : undefined;

      if (uploadedFile?.previewUrl) {
        URL.revokeObjectURL(uploadedFile.previewUrl);
      }

      setUploadedFile({
        file,
        name: file.name,
        size: file.size,
        type: file.type || 'application/pdf',
        base64: dataUrl,
        previewUrl
      });

      // Auto-suggest deck title if empty
      const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      if (!aiDeckTitle.trim()) {
        setAiDeckTitle(baseName);
      }
    };
    reader.readAsDataURL(file);
  };

  const clearUploadedFile = () => {
    if (uploadedFile?.previewUrl) {
      URL.revokeObjectURL(uploadedFile.previewUrl);
    }
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const generateWithAI = async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      alert("Mode Offline: Pembuatan kartu flashcard dengan AI memerlukan koneksi internet. Anda tetap dapat membuat kartu secara manual, mengedit, dan menghafal seluruh kartu flashcards saat offline.");
      return;
    }

    if (aiMode === 'file' && !uploadedFile) {
      alert("Silakan pilih atau upload file materi (PDF, foto catatan, dokumen) terlebih dahulu.");
      return;
    }
    if (aiMode === 'text' && !aiTopic.trim()) {
      alert("Silakan masukkan materi kuliah atau topik yang ingin dipelajari.");
      return;
    }

    setIsGenerating(true);
    setGenerationStage(uploadedFile ? "Membaca berkas & menganalisis konten materi..." : "AI sedang menganalisis materi perkuliahan...");

    let timer1: any = null;
    let timer2: any = null;

    try {
      timer1 = setTimeout(() => {
        setGenerationStage("Mengekstrak konsep kunci & terminologi Active Recall...");
      }, 2500);
      timer2 = setTimeout(() => {
        setGenerationStage("Menyusun kartu tanya-jawab (Flashcards)...");
      }, 5500);

      const generatedCards = await AIService.generateFlashcards({
        fileData: uploadedFile?.base64,
        mimeType: uploadedFile?.type,
        fileName: uploadedFile?.name,
        text: aiTopic.trim(),
        customInstructions: aiInstructions.trim()
      });

      if (timer1) clearTimeout(timer1);
      if (timer2) clearTimeout(timer2);

      if (generatedCards && generatedCards.length > 0) {
        const formattedCards: Flashcard[] = generatedCards.map(c => ({
          id: StorageService.generateId(),
          front: c.front,
          back: c.back,
          interval: 0,
          repetition: 0,
          easeFactor: 2.5,
          nextReview: Date.now(),
          createdAt: Date.now()
        }));

        if (targetDeck) {
          const updatedDeck: FlashcardDeck = {
            ...targetDeck,
            cards: [...(targetDeck.cards || []), ...formattedCards]
          };
          updateDeck(updatedDeck);
          alert(`Berhasil menambahkan ${formattedCards.length} kartu baru dari AI ke deck "${targetDeck.title}"!`);
        } else {
          const fallbackTitle = uploadedFile 
            ? uploadedFile.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ') 
            : (aiTopic.substring(0, 30) + (aiTopic.length > 30 ? '...' : ''));
          const newDeck: FlashcardDeck = {
            id: StorageService.generateId(),
            title: aiDeckTitle.trim() || fallbackTitle || 'Deck Flashcard AI',
            subject: aiDeckSubject.trim() || 'Materi Kuliah',
            courseId: aiDeckCourseId || undefined,
            cards: formattedCards,
            updatedAt: Date.now()
          };
          saveDecks([...decks, newDeck]);
          setActiveDeck(newDeck);
          alert(`Berhasil membuat deck "${newDeck.title}" dengan ${formattedCards.length} kartu flashcard!`);
        }

        if (onGainXp) onGainXp(30);

        // Reset
        clearUploadedFile();
        setAiTopic('');
        setAiInstructions('');
        setAiDeckCourseId('');
        setAiDeckTitle('');
        setAiDeckSubject('');
        setTargetDeck(null);
        setShowAIForm(false);
      } else {
        alert("Gagal membuat flashcards. Pastikan isi materi memiliki konten yang cukup.");
      }
    } catch (error: any) {
      console.error("AI Generation error:", error);
      alert(error?.message || "Terjadi kesalahan saat memproses dokumen dengan AI. Coba lagi.");
    } finally {
      if (timer1) clearTimeout(timer1);
      if (timer2) clearTimeout(timer2);
      setIsGenerating(false);
      setGenerationStage('');
    }
  };

  const deleteDeck = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Hapus deck ini beserta semua kartunya?')) {
      saveDecks(decks.filter(d => d.id !== id));
    }
  };

  const updateDeck = (updatedDeck: FlashcardDeck) => {
    const newDecks = decks.map(d => d.id === updatedDeck.id ? updatedDeck : d);
    saveDecks(newDecks);
    setActiveDeck(updatedDeck);
  };

  if (isStudyMode && activeDeck) {
    return <StudySession deck={activeDeck} onExit={() => setIsStudyMode(false)} onUpdateDeck={updateDeck} />;
  }

  const renderAIModal = () => {
    if (!showAIForm) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="glass-panel w-full max-w-2xl bg-zinc-950/95 border border-purple-500/30 rounded-3xl p-6 md:p-8 shadow-2xl my-8 relative overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-500/20 text-purple-400 rounded-2xl border border-purple-500/30">
                <Sparkles size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-white">
                    {targetDeck ? `Tambah Kartu ke "${targetDeck.title}"` : 'Generate Flashcard dengan AI'}
                  </h3>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                    <Sparkles size={10} />
                    Gemini Cloud
                  </span>
                </div>
                <p className="text-xs md:text-sm text-slate-400 mt-1">
                  Upload file materi (PDF, foto catatan/slide, teks) atau ketik topik untuk membuat flashcards Active Recall otomatis.
                </p>
              </div>
            </div>
            <button 
              type="button"
              onClick={() => {
                if (!isGenerating) {
                  setShowAIForm(false);
                  setTargetDeck(null);
                }
              }}
              disabled={isGenerating}
              className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Hidden File Input */}
          <input 
            ref={fileInputRef}
            type="file" 
            accept=".pdf,image/png,image/jpeg,image/jpg,image/webp,.txt,.md" 
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileSelect(e.target.files[0]);
              }
            }}
          />

          {/* Mode Switch Tabs */}
          <div className="flex items-center bg-zinc-900/90 p-1 rounded-xl border border-white/10 mb-6">
            <button
              type="button"
              onClick={() => setAiMode('file')}
              disabled={isGenerating}
              className={`flex-1 py-2.5 px-4 rounded-lg text-xs md:text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                aiMode === 'file' 
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileUp size={16} /> Upload File Materi (PDF / Foto / Dokumen)
            </button>
            <button
              type="button"
              onClick={() => setAiMode('text')}
              disabled={isGenerating}
              className={`flex-1 py-2.5 px-4 rounded-lg text-xs md:text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                aiMode === 'text' 
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles size={16} /> Ketik / Tempel Teks
            </button>
          </div>

          {/* Mode 1: File Upload */}
          {aiMode === 'file' && (
            <div className="space-y-4 mb-6">
              {!uploadedFile ? (
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleFileSelect(e.dataTransfer.files[0]);
                    }
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all text-center ${
                    isDragging 
                      ? 'border-purple-500 bg-purple-500/20 scale-[1.01]' 
                      : 'border-white/15 bg-zinc-900/40 hover:border-purple-500/50 hover:bg-purple-500/5'
                  }`}
                >
                  <div className="p-4 bg-purple-500/10 text-purple-400 rounded-2xl mb-4 border border-purple-500/20">
                    <Upload size={32} />
                  </div>
                  <h4 className="text-base font-bold text-white mb-1">
                    Tarik & lepas file materi di sini, atau <span className="text-purple-400 underline">pilih file</span>
                  </h4>
                  <p className="text-xs text-slate-400 max-w-sm mb-4 leading-relaxed">
                    Mendukung modul/buku perkuliahan (PDF), foto papan tulis atau slide (PNG, JPG, WEBP), serta catatan teks (TXT, MD).
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <span className="text-[10px] font-semibold uppercase px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-slate-300">
                      PDF Perkuliahan
                    </span>
                    <span className="text-[10px] font-semibold uppercase px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-slate-300">
                      Foto Slide / Catatan
                    </span>
                    <span className="text-[10px] font-semibold uppercase px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-slate-300">
                      TXT / MD
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono ml-1">Maks. 25MB</span>
                  </div>
                </div>
              ) : (
                <div className="bg-zinc-900/80 border border-purple-500/30 rounded-2xl p-4 flex items-center gap-4 relative">
                  {uploadedFile.previewUrl ? (
                    <img 
                      src={uploadedFile.previewUrl} 
                      alt="Pratinjau Materi" 
                      className="w-16 h-16 object-cover rounded-xl border border-white/10 shrink-0" 
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/30">
                      <FileText size={28} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0 pr-8">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 uppercase tracking-wider">
                        {uploadedFile.name.split('.').pop()}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        {formatFileSize(uploadedFile.size)}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-white truncate" title={uploadedFile.name}>
                      {uploadedFile.name}
                    </p>
                    <p className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1">
                      <CheckCircle2 size={13} /> Dokumen siap diekstrak menjadi flashcard
                    </p>
                  </div>
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      clearUploadedFile();
                    }}
                    disabled={isGenerating}
                    className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                    title="Hapus file"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              {/* Optional focus instruction */}
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">
                  Instruksi Khusus / Fokus Materi (Opsional)
                </label>
                <input 
                  className="w-full bg-zinc-900/50 border border-white/10 text-white p-3 rounded-xl focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all text-sm placeholder:text-zinc-600"
                  placeholder="misal: Fokuskan pada definisi bab 2 dan rumus penting untuk ujian..."
                  value={aiInstructions}
                  onChange={e => setAiInstructions(e.target.value)}
                  disabled={isGenerating}
                />
              </div>
            </div>
          )}

          {/* Mode 2: Text / Topic */}
          {aiMode === 'text' && (
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">
                  Tempel Materi atau Topik Kuliah
                </label>
                <textarea 
                  className="w-full h-36 bg-zinc-900/50 border border-white/10 text-white p-4 rounded-xl focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all resize-none custom-scrollbar text-sm placeholder:text-zinc-600"
                  placeholder="Paste materi perkuliahan, rangkuman, atau ketik: 'Buatkan flashcard lengkap tentang Metabolisme Karbohidrat dan Enzim'..."
                  value={aiTopic}
                  onChange={e => setAiTopic(e.target.value)}
                  disabled={isGenerating}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">
                  Instruksi Khusus (Opsional)
                </label>
                <input 
                  className="w-full bg-zinc-900/50 border border-white/10 text-white p-3 rounded-xl focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all text-sm placeholder:text-zinc-600"
                  placeholder="misal: Buat kartu untuk persiapan kuis active recall..."
                  value={aiInstructions}
                  onChange={e => setAiInstructions(e.target.value)}
                  disabled={isGenerating}
                />
              </div>
            </div>
          )}

          {/* Deck Title & Subject (Only when creating a new deck) */}
          {!targetDeck && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 pt-4 border-t border-white/10">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Judul Deck</span>
                  <span className="text-[10px] text-slate-500 lowercase">(otomatis jika kosong)</span>
                </label>
                <input 
                  className="w-full bg-zinc-900/50 border border-white/10 text-white p-3 rounded-xl focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all text-sm placeholder:text-zinc-600"
                  placeholder={uploadedFile ? uploadedFile.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ') : "misal: Termodinamika & Fluida"}
                  value={aiDeckTitle}
                  onChange={e => setAiDeckTitle(e.target.value)}
                  disabled={isGenerating}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Mata Kuliah</span>
                  <span className="text-[10px] text-slate-500 lowercase">(opsional)</span>
                </label>
                <input 
                  className="w-full bg-zinc-900/50 border border-white/10 text-white p-3 rounded-xl focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all text-sm placeholder:text-zinc-600"
                  placeholder="misal: Fisika Dasar"
                  value={aiDeckSubject}
                  onChange={e => setAiDeckSubject(e.target.value)}
                  disabled={isGenerating}
                />
              </div>
              {courses.length > 0 && (
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Pilih Dari Jadwal Kuliah (Opsional)
                  </label>
                  <select
                    value={aiDeckCourseId}
                    onChange={e => {
                      const cid = e.target.value;
                      setAiDeckCourseId(cid);
                      if (cid) {
                        const c = courses.find(item => item.id === cid);
                        if (c && !aiDeckSubject) setAiDeckSubject(c.name);
                      }
                    }}
                    disabled={isGenerating}
                    className="w-full bg-zinc-900/50 border border-white/10 text-white p-3 rounded-xl focus:border-purple-500 outline-none text-sm"
                  >
                    <option value="">Tanpa Mata Kuliah Spesifik</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Generating Progress State */}
          {isGenerating && (
            <div className="mb-6 p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center gap-3 animate-pulse">
              <Brain size={20} className="text-purple-400 animate-spin" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-purple-200">
                  {generationStage || "AI sedang memproses berkas..."}
                </p>
                <p className="text-[11px] text-purple-400/80">
                  Menghasilkan kartu Active Recall berstandar SM-2...
                </p>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button 
              type="button"
              onClick={() => {
                setShowAIForm(false);
                setTargetDeck(null);
              }}
              disabled={isGenerating}
              className="px-5 py-2.5 rounded-xl hover:bg-white/5 text-slate-300 font-semibold transition-colors text-sm"
            >
              Batal
            </button>
            <button 
              type="button"
              onClick={generateWithAI}
              disabled={isGenerating || (aiMode === 'file' ? !uploadedFile : !aiTopic.trim())}
              className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2.5 rounded-xl font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 text-sm shadow-lg shadow-purple-600/30 active:scale-95"
            >
              {isGenerating ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Memproses Dokumen...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>{targetDeck ? 'Tambahkan ke Deck' : 'Generate Flashcard AI'}</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    );
  };

  if (activeDeck) {
    return (
      <>
        <DeckEditor 
          deck={activeDeck} 
          onBack={() => setActiveDeck(null)} 
          onUpdateDeck={updateDeck} 
          onStartStudy={() => setIsStudyMode(true)}
          onOpenAIModal={() => {
            setTargetDeck(activeDeck);
            setAiMode('file');
            setShowAIForm(true);
          }}
        />
        {renderAIModal()}
      </>
    );
  }

  const totalCardsToReview = decks.reduce((total, deck) => {
    return total + (deck.cards || []).filter(c => c.nextReview <= Date.now()).length;
  }, 0);

  return (
    <div className="min-h-full w-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-extrabold text-white flex items-center gap-3 tracking-tight">
             <div className="p-2.5 bg-primary/20 text-primary rounded-xl">
               <Brain size={28} />
             </div>
             Active Recall
          </h2>
          <p className="text-slate-400 mt-2 text-sm max-w-md">Latih ingatan jangka panjangmu dengan metode Spaced Repetition (SM-2).</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowTips(!showTips)}
            className={`px-4 py-2.5 rounded-xl flex items-center gap-2 font-semibold transition-all border ${showTips ? 'bg-white/10 text-white border-white/20' : 'bg-transparent text-slate-400 border-white/5 hover:bg-white/5 hover:text-white'}`}
          >
            <Lightbulb size={20} className={showTips ? 'text-yellow-400' : ''} /> <span className="hidden md:inline">Cara Pakai</span>
          </button>
          <button 
            onClick={() => {
              setTargetDeck(null);
              setAiMode('file');
              setShowAIForm(true);
            }}
            className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 px-5 py-2.5 rounded-xl flex items-center gap-2 font-semibold transition-all shadow-lg shadow-purple-500/10"
          >
            <FileUp size={20} /> <span className="hidden sm:inline">Upload File &</span> Generate AI
          </button>
          <button 
            onClick={() => setShowForm(true)}
            className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-semibold shadow-lg shadow-primary/25 transition-all"
          >
            <Plus size={20} /> Buat Manual
          </button>
        </div>
      </div>

      {renderAIModal()}

      <AnimatePresence>
        {showTips && !activeDeck && (
          <motion.div 
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            className="overflow-hidden"
          >
            <div className="glass-panel p-6 md:p-8 rounded-3xl border border-white/10 relative">
              <div className="absolute top-0 right-0 p-4">
                <button onClick={() => setShowTips(false)} className="p-2 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="flex items-center gap-3 mb-6">
                 <div className="p-2.5 bg-yellow-500/20 text-yellow-400 rounded-xl">
                   <Sparkles size={24} />
                 </div>
                 <h3 className="text-xl font-bold text-white">Panduan Active Recall Efektif</h3>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                 <div className="space-y-2">
                    <div className="flex items-center gap-2 text-white font-bold">
                       <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs">1</span>
                       Satu Kartu, Satu Fakta
                    </div>
                    <p className="text-sm text-slate-400 leading-relaxed">Jangan masukkan paragraf panjang. Pecah materi menjadi potongan-potongan kecil. Semakin spesifik, semakin mudah diingat.</p>
                 </div>
                 <div className="space-y-2">
                    <div className="flex items-center gap-2 text-white font-bold">
                       <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs">2</span>
                       Ingat Sebelum Membalik
                    </div>
                    <p className="text-sm text-slate-400 leading-relaxed">Paksa otakmu memanggil memori <i>sebelum</i> menekan tombol "Buka Jawaban". Proses 'memaksa' inilah yang memperkuat ingatan.</p>
                 </div>
                 <div className="space-y-2">
                    <div className="flex items-center gap-2 text-white font-bold">
                       <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs">3</span>
                       Jujur Saat Menilai
                    </div>
                    <p className="text-sm text-slate-400 leading-relaxed">Pilih tombol rating (Sulit/Bagus/Mudah) sesuai kondisi aslinya. Algoritma SM-2 akan menjadwalkan ulang secara otomatis agar kamu tidak lupa.</p>
                 </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {totalCardsToReview > 0 && !activeDeck && !showForm && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="mb-8 relative overflow-hidden rounded-2xl p-6 bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-transparent border border-orange-500/20 shadow-xl"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-orange-500"></div>
            <div className="flex items-start md:items-center gap-4 relative z-10">
              <div className="p-3 bg-orange-500/20 text-orange-400 rounded-full shrink-0">
                <Bell size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white mb-1">Waktunya Recall!</h3>
                <p className="text-sm text-slate-300">
                  Kamu memiliki <span className="text-orange-400 font-bold">{totalCardsToReview} kartu</span> yang perlu di-review hari ini. Jangan biarkan memorimu memudar!
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showForm && (
          <motion.div 
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            className="overflow-hidden"
          >
            <div className="glass-panel p-6 rounded-2xl border border-white/10">
              <h3 className="text-lg font-bold text-white mb-4">Buat Deck Baru</h3>
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Judul Deck</label>
                  <input 
                    className="w-full bg-zinc-900/50 border border-white/10 text-white p-3 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    placeholder="misal: Hukum Newton"
                    value={newDeckTitle}
                    onChange={e => setNewDeckTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Mata Kuliah</label>
                  <input 
                    className="w-full bg-zinc-900/50 border border-white/10 text-white p-3 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    placeholder="misal: Fisika Dasar"
                    value={newDeckSubject}
                    onChange={e => setNewDeckSubject(e.target.value)}
                  />
                </div>
                {courses.length > 0 && (
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Hubungkan ke Mata Kuliah (Opsional)
                    </label>
                    <select
                      className="w-full bg-zinc-900/50 border border-white/10 text-white p-3 rounded-xl focus:border-primary outline-none text-sm"
                      value={newDeckCourseId}
                      onChange={e => {
                        const cid = e.target.value;
                        setNewDeckCourseId(cid);
                        if (cid) {
                          const c = courses.find(item => item.id === cid);
                          if (c) setNewDeckSubject(c.name);
                        }
                      }}
                    >
                      <option value="">Pilih dari Jadwal Kuliah...</option>
                      {courses.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setShowForm(false)} className="hover:bg-white/5 px-5 py-2.5 rounded-xl text-slate-300 font-medium transition-colors">Batal</button>
                <button onClick={createDeck} className="bg-white text-black px-6 py-2.5 rounded-xl font-bold hover:bg-zinc-200 transition-colors">Simpan Deck</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {decks.map(deck => {
          const cardsToReview = (deck.cards || []).filter(c => c.nextReview <= Date.now()).length;
          const totalCards = (deck.cards || []).length;
          
          return (
            <motion.div 
              layout
              key={deck.id} 
              onClick={() => setActiveDeck(deck)}
              className="glass-panel p-6 rounded-2xl hover:border-primary/40 cursor-pointer group transition-all relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <button 
                  onClick={(e) => deleteDeck(deck.id, e)} 
                  className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 rounded-lg transition-colors backdrop-blur-md"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              
              <div className="flex items-start mb-4 gap-4">
                <div className="p-3 bg-zinc-800/50 rounded-xl text-primary border border-white/5 shadow-inner">
                  <Layers size={24} />
                </div>
                <div className="flex-1 pr-8">
                  <h3 className="text-lg font-bold text-white mb-1 line-clamp-1">{deck.title}</h3>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{deck.subject}</p>
                    {deck.courseId && (
                      <span className="text-[10px] bg-primary/15 text-primary border border-primary/25 px-1.5 py-0.5 rounded font-mono font-medium">
                        {courses.find(c => c.id === deck.courseId)?.name || 'Terhubung'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between items-end mt-6">
                 <div className="space-y-1">
                    <p className="text-xs text-slate-500">{totalCards} Kartu Total</p>
                    <div className="flex items-center gap-1.5">
                      {cardsToReview > 0 ? (
                        <>
                          <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse"></div>
                          <span className="text-xs text-orange-400 font-semibold">{cardsToReview} Perlu direview</span>
                        </>
                      ) : (
                        <>
                          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                          <span className="text-xs text-emerald-500 font-semibold">Tuntas Hari ini</span>
                        </>
                      )}
                    </div>
                 </div>
                 <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all">
                    <Play size={14} className="ml-0.5" />
                 </div>
              </div>
            </motion.div>
          );
        })}
        
        {decks.length === 0 && !showForm && (
          <div className="col-span-full py-16 px-6 flex flex-col items-center justify-center text-center text-slate-400 border-2 border-dashed border-white/10 rounded-3xl bg-white/5 max-w-xl mx-auto w-full">
            <div className="p-4 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-2xl mb-4">
               <FileUp size={32} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Belum ada deck flashcard</h3>
            <p className="text-sm text-slate-400 mb-6 max-w-md">
              Mulai dengan mengupload modul/buku perkuliahan (PDF), foto catatan/slide materi, atau buat deck secara manual.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  setTargetDeck(null);
                  setAiMode('file');
                  setShowAIForm(true);
                }}
                className="w-full sm:w-auto bg-purple-600 hover:bg-purple-500 text-white px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 text-sm shadow-lg shadow-purple-600/30 transition-all"
              >
                <Upload size={18} /> Upload File Materi (AI)
              </button>
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="w-full sm:w-auto bg-white/10 hover:bg-white/15 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 text-sm transition-all border border-white/10"
              >
                <Plus size={18} /> Buat Manual
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Sub-component: Deck Editor ---
const DeckEditor: React.FC<{ 
  deck: FlashcardDeck, 
  onBack: () => void, 
  onUpdateDeck: (d: FlashcardDeck) => void, 
  onStartStudy: () => void,
  onOpenAIModal?: () => void 
}> = ({ deck, onBack, onUpdateDeck, onStartStudy, onOpenAIModal }) => {
  const [newFront, setNewFront] = useState('');
  const [newBack, setNewBack] = useState('');
  const [isSharing, setIsSharing] = useState(false);

  const addCard = () => {
    if (!newFront || !newBack) return;
    const newCard: Flashcard = {
      id: StorageService.generateId(),
      front: newFront,
      back: newBack,
      nextReview: Date.now(),
      // SM-2 Init
      interval: 0,
      repetition: 0,
      easeFactor: 2.5
    };
    onUpdateDeck({ ...deck, cards: [...(deck.cards || []), newCard] });
    setNewFront('');
    setNewBack('');
  };

  const handleShare = async () => {
    try {
      setIsSharing(true);
      const url = await SharingService.createShareLink('flashcards', deck);
      await navigator.clipboard.writeText(url);
      alert('Link Deck Flashcard berhasil disalin ke clipboard! Bagikan ke temanmu.');
    } catch (err: any) {
      alert(err.message || 'Gagal membuat link. Pastikan kamu sudah login.');
    } finally {
      setIsSharing(false);
    }
  };

  const deleteCard = (cardId: string) => {
    onUpdateDeck({ ...deck, cards: (deck.cards || []).filter(c => c.id !== cardId) });
  };

  const dueCards = (deck.cards || []).filter(c => c.nextReview <= Date.now()).length;

  return (
    <div className="min-h-full w-full flex flex-col">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-8">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center bg-white/5 border border-white/10 hover:bg-white/10 rounded-full text-slate-300 hover:text-white transition-colors shrink-0">
          ←
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-2xl font-extrabold text-white tracking-tight">{deck.title}</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider">{deck.subject}</span>
          </div>
          <p className="text-slate-400 text-sm">{(deck.cards || []).length} Kartu Total</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {onOpenAIModal && (
            <button 
              type="button"
              onClick={onOpenAIModal}
              className="flex-1 md:flex-none flex justify-center items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-purple-300 bg-purple-500/10 border border-purple-500/25 hover:bg-purple-500/20 transition-all shadow-lg shadow-purple-500/10"
              title="Upload file materi untuk mengekstrak kartu baru"
            >
              <FileUp size={18} /> <span className="hidden sm:inline">Tambah via</span> AI / File
            </button>
          )}
          <button 
            onClick={handleShare}
            disabled={isSharing || (deck.cards || []).length === 0}
            className="flex-1 md:flex-none flex justify-center items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all disabled:opacity-50"
          >
            <Share2 size={18} /> {isSharing ? 'Loading...' : 'Bagikan'}
          </button>
          <button 
            onClick={onStartStudy}
            disabled={dueCards === 0}
            className={`flex-1 md:flex-none flex justify-center items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg ${dueCards > 0 ? 'bg-primary text-white shadow-primary/25 hover:bg-primary/90' : 'bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-50 shadow-none'}`}
          >
            <Play size={18} /> Mulai Belajar {dueCards > 0 && <span className="bg-white/20 px-2 py-0.5 rounded-md text-xs">{dueCards}</span>}
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6 h-full overflow-hidden">
        {/* Card Input */}
        <div className="w-full md:w-1/3 shrink-0">
           <div className="glass-panel p-5 rounded-2xl border border-white/10 sticky top-6">
             <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/10 rounded-lg text-white">
                     <Plus size={18} />
                  </div>
                  <h3 className="font-bold text-white">Tambah Kartu</h3>
                </div>
                {onOpenAIModal && (
                  <button
                    type="button"
                    onClick={onOpenAIModal}
                    className="text-xs text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1 p-1"
                  >
                    <Sparkles size={13} /> Auto AI
                  </button>
                )}
             </div>
             <div className="space-y-4">
               <div>
                 <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">Sisi Depan (Pertanyaan)</label>
                 <textarea 
                   className="w-full bg-zinc-900/50 border border-white/10 text-white p-4 rounded-xl h-24 resize-none focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-zinc-600"
                   placeholder="Masukkan istilah atau pertanyaan..."
                   value={newFront}
                   onChange={e => setNewFront(e.target.value)}
                 />
               </div>
               <div>
                 <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">Sisi Belakang (Jawaban)</label>
                 <textarea 
                   className="w-full bg-zinc-900/50 border border-white/10 text-white p-4 rounded-xl h-24 resize-none focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-zinc-600"
                   placeholder="Masukkan definisi atau jawaban..."
                   value={newBack}
                   onChange={e => setNewBack(e.target.value)}
                 />
               </div>
               <button onClick={addCard} className="w-full bg-white text-black hover:bg-zinc-200 py-3 rounded-xl font-bold transition-all mt-2">
                 Tambahkan ke Deck
               </button>
               {onOpenAIModal && (
                 <button 
                   type="button"
                   onClick={onOpenAIModal}
                   className="w-full bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/25 py-2.5 rounded-xl font-semibold transition-all mt-2 flex items-center justify-center gap-2 text-xs"
                 >
                   <FileUp size={15} /> Upload File & Ekstrak Kartu (AI)
                 </button>
               )}
             </div>
           </div>
        </div>

        {/* Card List */}
        <div className="flex-1 overflow-y-auto space-y-3 pb-20 custom-scrollbar pr-2">
          <h3 className="font-bold text-white mb-4 px-1">Daftar Kartu</h3>
          <AnimatePresence>
            {(deck.cards || []).map((card, idx) => (
              <motion.div 
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={card.id} 
                className="glass-panel p-5 rounded-2xl border border-white/5 flex flex-col md:flex-row md:items-center gap-4 group hover:border-white/10 transition-colors"
              >
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block md:hidden">Depan</span>
                    <div className="text-sm font-semibold text-white leading-relaxed">{card.front}</div>
                  </div>
                  <div className="hidden md:block w-px h-full bg-white/5 mx-auto"></div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block md:hidden">Belakang</span>
                    <div className="text-sm text-slate-400 leading-relaxed">{card.back}</div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between md:justify-end gap-4 mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-white/5">
                   <div className="flex items-center gap-2">
                     <div className="flex flex-col items-end">
                       <span className="text-[10px] text-slate-500 uppercase tracking-wider">Ease Factor</span>
                       <span className="text-xs font-mono text-emerald-400 font-bold">{card.easeFactor?.toFixed(1) || 2.5}</span>
                     </div>
                   </div>
                   <button 
                     onClick={() => deleteCard(card.id)} 
                     className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 rounded-lg transition-colors"
                   >
                     <Trash2 size={16} />
                   </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {(deck.cards || []).length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-white/10 rounded-3xl bg-white/5 text-slate-400">
               <Layers size={32} className="opacity-50 mb-3" />
               <p className="font-medium">Belum ada kartu di deck ini</p>
               <p className="text-sm text-slate-500">Gunakan form di sebelah kiri untuk menambah kartu.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Sub-component: Study Session (SM-2 Implemented) ---
const StudySession: React.FC<{ deck: FlashcardDeck, onExit: () => void, onUpdateDeck: (d: FlashcardDeck) => void }> = ({ deck, onExit, onUpdateDeck }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionOver, setSessionOver] = useState(false);
  const studyQueue = deck.cards;

  const currentCard = studyQueue[currentIndex];
  const onGainXp = useStore(state => state.gainXp);

  const handleRating = (rating: 0 | 3 | 4 | 5) => {
    // SuperMemo-2 Algorithm Implementation
    const card = { ...currentCard };
    
    // Default values for migration
    const oldRep = card.repetition || 0;
    const oldEF = card.easeFactor || 2.5;
    const oldInterval = card.interval || 0;

    let newInterval: number;
    let newRep: number;
    let newEF: number;

    if (rating >= 3) {
      // Correct response
      if (oldRep === 0) {
        newInterval = 1;
      } else if (oldRep === 1) {
        newInterval = 6;
      } else {
        newInterval = Math.round(oldInterval * oldEF);
      }
      newRep = oldRep + 1;
    } else {
      // Incorrect response (Rating 0/Again)
      newRep = 0;
      newInterval = 1; 
    }

    // Update Ease Factor
    // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    newEF = oldEF + (0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02));
    if (newEF < 1.3) newEF = 1.3;

    // Apply updates
    card.interval = newInterval;
    card.repetition = newRep;
    card.easeFactor = newEF;
    
    // Set next review date (Interval is in days)
    // If rating is 0 (Again), we might want to review it again in this session or in 10 mins. 
    // For simplicity in this app, we set it to 'now' + 10 mins if failed, or days if passed.
    if (rating < 3) {
        card.nextReview = Date.now() + (10 * 60 * 1000); // 10 minutes
    } else {
        card.nextReview = Date.now() + (newInterval * 24 * 60 * 60 * 1000);
        if (onGainXp) onGainXp(10 + (rating * 2)); // XP Reward based on rating
    }

    // Update card in original deck
    const updatedCards = (deck.cards || []).map(c => c.id === card.id ? card : c);
    onUpdateDeck({ ...deck, cards: updatedCards });

    // Move to next
    if (currentIndex < studyQueue.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsFlipped(false);
    } else {
      setSessionOver(true);
      if (onGainXp) onGainXp(50); // Bonus for finishing session
    }
  };

  if (studyQueue.length === 0) {
    return (
      <div className="min-h-full w-full flex flex-col items-center justify-center">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="glass-panel p-10 rounded-3xl flex flex-col items-center max-w-md text-center shadow-2xl border border-white/10"
        >
          <div className="w-24 h-24 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mb-6 shadow-inner shadow-emerald-500/30">
            <Check size={48} strokeWidth={3} />
          </div>
          <h2 className="text-3xl font-extrabold text-white mb-3">Tuntas!</h2>
          <p className="text-slate-400 mb-8 leading-relaxed">Hebat, tidak ada kartu yang perlu direview saat ini. Kembali lagi nanti untuk menjaga memori jangka panjangmu.</p>
          <button onClick={onExit} className="bg-white hover:bg-zinc-200 text-black px-8 py-3.5 rounded-xl font-bold transition-all w-full shadow-lg">
            Kembali ke Menu Utama
          </button>
        </motion.div>
      </div>
    );
  }

  if (sessionOver) {
     return (
      <div className="min-h-full w-full flex flex-col items-center justify-center">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="glass-panel p-10 rounded-3xl flex flex-col items-center max-w-md text-center shadow-2xl border border-white/10"
        >
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-primary/30 blur-2xl rounded-full"></div>
            <div className="w-24 h-24 bg-primary/20 text-primary rounded-full flex items-center justify-center relative shadow-inner shadow-primary/30">
              <Trophy size={48} strokeWidth={2.5} />
            </div>
          </div>
          <h2 className="text-3xl font-extrabold text-white mb-2">Sesi Selesai!</h2>
          <p className="text-slate-400 mb-8 leading-relaxed">
            Kamu telah berhasil mereview <span className="font-bold text-white">{studyQueue.length} kartu</span>. Otakmu semakin tangguh!
          </p>
          <button onClick={onExit} className="bg-primary hover:bg-primary/90 text-white px-8 py-3.5 rounded-xl font-bold transition-all w-full shadow-lg shadow-primary/30">
            Selesai
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-full w-full flex flex-col items-center justify-center max-w-2xl mx-auto p-4 animate-fade-in">
      <div className="w-full flex justify-between items-center text-sm mb-6">
        <button onClick={onExit} className="text-slate-400 hover:text-white transition-colors">← Akhiri Sesi</button>
        <div className="flex items-center gap-2">
           <span className="text-slate-400 font-medium">{deck.title}</span>
           <span className="text-xs bg-white/10 px-2 py-1 rounded-md text-white">{currentIndex + 1} / {studyQueue.length}</span>
        </div>
      </div>

      <div className="relative w-full aspect-[4/3] md:aspect-video perspective-[2000px] group">
        <motion.div 
          className="w-full h-full relative cursor-pointer"
          animate={{ rotateX: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
          style={{ transformStyle: 'preserve-3d' }}
          onClick={() => setIsFlipped(!isFlipped)}
        >
          {/* Front */}
          <div 
            className="absolute inset-0 w-full h-full bg-zinc-900 border border-white/10 rounded-[2rem] p-8 flex flex-col items-center justify-center shadow-2xl"
            style={{ backfaceVisibility: 'hidden' }}
          >
             <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-6">Pertanyaan</span>
             <h2 className="text-2xl md:text-4xl font-bold text-white text-center select-none leading-relaxed">{currentCard.front}</h2>
             <p className="absolute bottom-6 text-xs text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
               Tap kartu untuk melihat jawaban
             </p>
          </div>
          
          {/* Back */}
          <div 
            className="absolute inset-0 w-full h-full bg-gradient-to-br from-emerald-900/40 to-zinc-900 border border-emerald-500/20 rounded-[2rem] p-8 flex flex-col items-center justify-center shadow-2xl"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateX(180deg)' }}
          >
             <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-6">Jawaban</span>
             <h2 className="text-2xl md:text-4xl font-bold text-emerald-50 text-center select-none leading-relaxed">{currentCard.back}</h2>
          </div>
        </motion.div>
      </div>

      {isFlipped ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full mt-8"
        >
          <button onClick={() => handleRating(0)} className="flex flex-col items-center justify-center gap-1.5 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/40 py-4 rounded-2xl text-red-400 transition-all active:scale-95">
            <span className="font-bold">Ulangi</span>
            <span className="text-[10px] opacity-70">&lt; 10 menit</span>
          </button>
          <button onClick={() => handleRating(3)} className="flex flex-col items-center justify-center gap-1.5 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 py-4 rounded-2xl text-slate-300 transition-all active:scale-95">
            <span className="font-bold">Sulit</span>
            <span className="text-[10px] opacity-70">Besok</span>
          </button>
          <button onClick={() => handleRating(4)} className="flex flex-col items-center justify-center gap-1.5 bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 hover:border-blue-500/40 py-4 rounded-2xl text-blue-400 transition-all active:scale-95">
            <span className="font-bold">Bagus</span>
            <span className="text-[10px] opacity-70">~3 hari</span>
          </button>
          <button onClick={() => handleRating(5)} className="flex flex-col items-center justify-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 hover:border-emerald-500/40 py-4 rounded-2xl text-emerald-400 transition-all active:scale-95">
            <span className="font-bold">Mudah</span>
            <span className="text-[10px] opacity-70">~7 hari</span>
          </button>
        </motion.div>
      ) : (
        <div className="h-[88px] flex items-center justify-center mt-8 w-full">
           <button 
             onClick={() => setIsFlipped(true)}
             className="bg-white text-black hover:bg-zinc-200 px-8 py-3.5 rounded-xl font-bold transition-all shadow-xl active:scale-95 w-full md:w-auto"
           >
             Buka Jawaban
           </button>
        </div>
      )}
    </div>
  );
};
