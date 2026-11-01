import React, { useState } from 'react';
import { 
  Brain, Lightbulb, Zap, CheckCircle2, ChevronRight, ChevronLeft, BookOpen, 
  AlertCircle, Sparkles, HelpCircle, Trophy, RotateCcw, Award, ArrowRight,
  PlusCircle, Check, X, Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AIService } from '../services/ai';

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

interface MicroLesson {
  title: string;
  coreConcept: string;
  analogy: string;
  keyPoints: string[];
  quiz: QuizQuestion;
  suggestedActivity: string;
}

interface UserQuizAnswer {
  selectedOption: number;
  isCorrect: boolean;
}

export const MicroLearning: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [lesson, setLesson] = useState<MicroLesson | null>(null);

  // Unified quiz state
  const [allQuizzes, setAllQuizzes] = useState<QuizQuestion[]>([]);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, UserQuizAnswer>>({});
  
  // Extra question offer state
  const [isGeneratingExtra, setIsGeneratingExtra] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<'menengah' | 'menantang'>('menengah');
  const [showOfferCard, setShowOfferCard] = useState(false);
  const [dismissedOffer, setDismissedOffer] = useState(false);
  const [extraBatchesLoaded, setExtraBatchesLoaded] = useState(0);

  const downloadLesson = () => {
    if (!lesson) return;
    
    let md = `# ${lesson.title}\n\n`;
    md += `## Ringkasan 2 Menit\n`;
    md += `${lesson.coreConcept}\n\n`;
    md += `## Analogi Sederhana\n`;
    md += `${lesson.analogy}\n\n`;
    md += `## Poin Kunci\n`;
    lesson.keyPoints.forEach(point => {
      md += `- ${point}\n`;
    });
    md += `\n## Saran Kegiatan Praktik\n`;
    md += `${lesson.suggestedActivity}\n\n`;
    
    if (allQuizzes.length > 0) {
      md += `## Kuis Latihan\n\n`;
      allQuizzes.forEach((quiz, idx) => {
        md += `**Soal ${idx + 1}:** ${quiz.question}\n\n`;
        quiz.options.forEach((opt, i) => {
          md += `${String.fromCharCode(65 + i)}. ${opt}\n`;
        });
        md += `\n*Jawaban Benar: ${String.fromCharCode(65 + quiz.correctAnswerIndex)} - ${quiz.explanation}*\n\n`;
      });
    }

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${lesson.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-micro-lesson.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setIsGenerating(true);
    setLesson(null);
    setAllQuizzes([]);
    setCurrentQuizIndex(0);
    setUserAnswers({});
    setShowOfferCard(false);
    setDismissedOffer(false);
    setExtraBatchesLoaded(0);
    
    try {
      const data = await AIService.generateMicroLesson(topic);
      setLesson(data);
      if (data?.quiz) {
        setAllQuizzes([data.quiz]);
      }
    } catch (error) {
      alert("Gagal memuat Micro-Lesson. Silakan periksa koneksi atau coba topik lain.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleQuizAnswer = (optionIndex: number) => {
    // Prevent changing answer once submitted
    if (userAnswers[currentQuizIndex] !== undefined) return;

    const activeQuiz = allQuizzes[currentQuizIndex];
    if (!activeQuiz) return;

    const isCorrect = optionIndex === activeQuiz.correctAnswerIndex;
    setUserAnswers(prev => ({
      ...prev,
      [currentQuizIndex]: { selectedOption: optionIndex, isCorrect }
    }));

    // If answering the first question or completing questions and haven't fetched extra batches yet,
    // proactively offer more questions to deepen understanding
    if (!dismissedOffer && extraBatchesLoaded === 0) {
      setShowOfferCard(true);
    }
  };

  const handleGetMoreQuestions = async () => {
    if (!topic.trim() && !lesson?.title) return;
    const targetTopic = lesson?.title || topic;
    setIsGeneratingExtra(true);

    try {
      const previousQuestions = allQuizzes.map(q => q.question);
      const data = await AIService.generateExtraQuizzes(targetTopic, {
        count: 3,
        level: selectedDifficulty,
        previousQuestions
      });

      if (data && data.length > 0) {
        const nextIndex = allQuizzes.length;
        setAllQuizzes(prev => [...prev, ...data]);
        setCurrentQuizIndex(nextIndex);
        setExtraBatchesLoaded(prev => prev + 1);
        setShowOfferCard(false);
        setDismissedOffer(false);
      } else {
        alert("Tidak ada soal tambahan baru yang dihasilkan. Coba beberapa saat lagi.");
      }
    } catch (error) {
      alert("Terjadi kesalahan saat memuat soal tambahan. Periksa koneksi atau coba lagi.");
    } finally {
      setIsGeneratingExtra(false);
    }
  };

  const handleResetQuiz = () => {
    setUserAnswers({});
    setCurrentQuizIndex(0);
  };

  // Score calculations
  const totalQuestions = allQuizzes.length;
  const answeredCount = Object.keys(userAnswers).length;
  const correctCount = Object.values(userAnswers).filter(a => a.isCorrect).length;
  const isAllAnswered = totalQuestions > 0 && answeredCount === totalQuestions;
  const activeQuiz = allQuizzes[currentQuizIndex];
  const currentAnswer = userAnswers[currentQuizIndex];

  return (
    <div className="min-h-full w-full max-w-4xl mx-auto p-4 animate-fade-in pb-16">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-indigo-400 rounded-2xl border border-indigo-500/30 shadow-sm">
            <Zap size={24} />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
              AI Micro-Learning
              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-mono">
                Bite-Sized
              </span>
            </h2>
            <p className="text-sm text-slate-400">Pahami konsep sulit dalam 2 menit, lalu uji pemahaman dengan kuis interaktif.</p>
          </div>
        </div>
      </div>

      {/* Input Search Box */}
      <div className="glass-panel p-2 sm:p-3 rounded-2xl border border-white/10 mb-8 flex flex-col sm:flex-row gap-3 relative z-10 shadow-lg">
        <input 
          type="text" 
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
          placeholder="Contoh: 'Fisika Kuantum', 'Inflasi Ekonomi', 'Sistem Saraf', 'Algoritma Dijkstra'..."
          className="flex-1 bg-transparent border-none text-white px-4 py-3 outline-none placeholder:text-slate-500 text-base sm:text-lg"
          disabled={isGenerating}
        />
        <button 
          onClick={handleGenerate}
          disabled={isGenerating || !topic.trim()}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-7 py-3 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md active:scale-95 text-sm sm:text-base shrink-0"
        >
          {isGenerating ? (
            <><Brain size={18} className="animate-pulse" /> Meracik Materi...</>
          ) : (
            <><Sparkles size={18} /> Buat Lesson</>
          )}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {lesson && !isGenerating && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Header / Title */}
            <div className="glass-card p-6 md:p-8 rounded-[2rem] border border-indigo-500/20 bg-gradient-to-br from-indigo-950/60 to-zinc-900/90 relative overflow-hidden shadow-xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
              <div className="flex items-center justify-between mb-3 relative z-10">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-indigo-300 uppercase tracking-wider bg-indigo-500/20 px-2.5 py-0.5 rounded-full border border-indigo-500/30">
                    Ringkasan 2 Menit
                  </span>
                </div>
                <button
                  onClick={downloadLesson}
                  className="flex items-center gap-2 text-xs font-bold bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-xl transition-colors border border-white/10"
                >
                  <Download size={14} />
                  Simpan Materi
                </button>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white mb-4 relative z-10 leading-tight">
                {lesson.title}
              </h1>
              <p className="text-base sm:text-lg text-indigo-100/90 leading-relaxed relative z-10 border-l-4 border-indigo-500 pl-4 py-0.5">
                {lesson.coreConcept}
              </p>
            </div>

            {/* Analogy & Key Points */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Analogy & Activity */}
              <div className="space-y-6">
                <div className="glass-panel p-6 rounded-3xl border border-white/10 bg-zinc-900/50">
                  <div className="flex items-center gap-2 mb-3 text-amber-400">
                    <Lightbulb size={20} />
                    <h3 className="text-base font-bold text-white">Analogi Sederhana</h3>
                  </div>
                  <p className="text-slate-300 leading-relaxed text-sm sm:text-base">{lesson.analogy}</p>
                </div>
                
                <div className="glass-panel p-6 rounded-3xl border border-emerald-500/20 bg-emerald-500/5">
                  <div className="flex items-center gap-2 mb-3 text-emerald-400">
                    <CheckCircle2 size={20} />
                    <h3 className="text-base font-bold text-white">Saran Kegiatan Praktik (5 Menit)</h3>
                  </div>
                  <p className="text-slate-300 leading-relaxed font-medium text-sm sm:text-base">{lesson.suggestedActivity}</p>
                </div>
              </div>

              {/* Key Points */}
              <div className="glass-panel p-6 rounded-3xl border border-white/10 bg-zinc-900/50 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-4 text-blue-400">
                    <BookOpen size={20} />
                    <h3 className="text-base font-bold text-white">Poin Kunci</h3>
                  </div>
                  <ul className="space-y-3.5">
                    {lesson.keyPoints.map((point, i) => (
                      <li key={i} className="flex gap-3 text-slate-300 text-sm sm:text-base">
                        <span className="text-blue-400 mt-1 shrink-0"><ChevronRight size={16} /></span>
                        <span className="leading-relaxed">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-zinc-400">
                  <span>💡 Selesai membaca materi?</span>
                  <span className="text-purple-300 font-medium">Uji diri di Quick Quiz ↓</span>
                </div>
              </div>
            </div>

            {/* 🎯 Interactive Quick Quiz Section */}
            {activeQuiz && (
              <div className="glass-panel p-6 md:p-8 rounded-[2rem] border border-purple-500/30 bg-zinc-900/70 mt-8 shadow-2xl relative">
                {/* Quiz Header & Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 mb-6 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-inner">
                      <Brain size={22} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        Quick Quiz
                        <span className="text-xs bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2.5 py-0.5 rounded-full font-mono">
                          Soal {currentQuizIndex + 1} dari {totalQuestions}
                        </span>
                      </h3>
                      <p className="text-xs text-zinc-400">Uji pemahaman langsung untuk mengunci konsep di ingatan.</p>
                    </div>
                  </div>

                  {/* Score & Badge Pill */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800/80 border border-white/10 rounded-xl text-xs">
                      <Trophy size={14} className="text-amber-400" />
                      <span className="text-zinc-300 font-medium">Skor:</span>
                      <span className="font-bold text-white font-mono">{correctCount} / {totalQuestions}</span>
                    </div>

                    {!showOfferCard && (
                      <button
                        onClick={() => setShowOfferCard(true)}
                        disabled={isGeneratingExtra}
                        className="flex items-center gap-1 px-3 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-semibold transition-all"
                        title="Tawaran Soal Tambahan"
                      >
                        <PlusCircle size={13} />
                        <span>Minta Soal Lagi</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Question Step Indicators / Dots */}
                {totalQuestions > 1 && (
                  <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1 custom-scrollbar">
                    {allQuizzes.map((_, idx) => {
                      const isAnswered = userAnswers[idx] !== undefined;
                      const isCorrect = userAnswers[idx]?.isCorrect;
                      const isCurrent = idx === currentQuizIndex;

                      return (
                        <button
                          key={idx}
                          onClick={() => setCurrentQuizIndex(idx)}
                          className={`w-8 h-8 rounded-xl text-xs font-bold transition-all flex items-center justify-center shrink-0 ${
                            isCurrent
                              ? 'ring-2 ring-purple-400 bg-purple-600 text-white shadow-lg'
                              : isAnswered
                              ? isCorrect
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : 'bg-red-500/20 text-red-300 border border-red-500/40'
                              : 'bg-zinc-800 text-zinc-400 border border-white/5 hover:bg-zinc-700'
                          }`}
                        >
                          {isAnswered ? (isCorrect ? <Check size={12} /> : <X size={12} />) : idx + 1}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Question Prompt */}
                <div className="mb-6">
                  <p className="text-lg md:text-xl text-slate-100 font-semibold leading-relaxed">
                    {activeQuiz.question}
                  </p>
                </div>
                
                {/* Options Grid */}
                <div className="grid sm:grid-cols-2 gap-3 mb-6">
                  {activeQuiz.options.map((opt, i) => {
                    const isAnswered = currentAnswer !== undefined;
                    const isSelected = currentAnswer?.selectedOption === i;
                    const isCorrect = i === activeQuiz.correctAnswerIndex;

                    let btnStyle = "bg-zinc-800/60 hover:bg-zinc-700/80 border-white/10 text-slate-200 hover:border-purple-500/40";
                    
                    if (isAnswered) {
                      if (isCorrect) {
                        btnStyle = "bg-emerald-500/25 border-emerald-500/60 text-emerald-200 shadow-md font-semibold";
                      } else if (isSelected) {
                        btnStyle = "bg-red-500/25 border-red-500/60 text-red-200 shadow-md font-semibold";
                      } else {
                        btnStyle = "bg-zinc-800/30 border-white/5 text-slate-500 opacity-50 cursor-not-allowed";
                      }
                    }

                    return (
                      <button 
                        key={i}
                        onClick={() => handleQuizAnswer(i)}
                        disabled={isAnswered}
                        className={`p-4 rounded-2xl border text-left transition-all text-sm sm:text-base flex items-start gap-3 active:scale-[0.99] ${btnStyle}`}
                      >
                        <span className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                          {String.fromCharCode(65 + i)}
                        </span>
                        <span className="flex-1 leading-relaxed">{opt}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Explanation Box */}
                <AnimatePresence>
                  {currentAnswer && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden mb-6"
                    >
                      <div className={`p-5 rounded-2xl border ${currentAnswer.isCorrect ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-100' : 'bg-red-500/10 border-red-500/30 text-red-100'}`}>
                        <div className="flex items-start gap-3">
                          {currentAnswer.isCorrect ? (
                            <CheckCircle2 className="text-emerald-400 shrink-0 mt-1" size={20} />
                          ) : (
                            <AlertCircle className="text-red-400 shrink-0 mt-1" size={20} />
                          )}
                          
                          <div className="flex-1">
                            <p className="font-bold text-sm sm:text-base mb-1">
                              {currentAnswer.isCorrect ? 'Tepat Sekali! 🎉' : 'Kurang Tepat! 💡'}
                            </p>
                            <p className="text-sm opacity-90 leading-relaxed">{activeQuiz.explanation}</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Quiz Navigation Bottom Bar */}
                <div className="flex items-center justify-between gap-3 pt-4 border-t border-white/10 flex-wrap">
                  <button
                    onClick={() => setCurrentQuizIndex(prev => Math.max(0, prev - 1))}
                    disabled={currentQuizIndex === 0}
                    className="flex items-center gap-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 disabled:hover:bg-zinc-800 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors"
                  >
                    <ChevronLeft size={16} /> Soal Sebelumnya
                  </button>

                  <div className="flex items-center gap-2">
                    {currentQuizIndex < totalQuestions - 1 ? (
                      <button
                        onClick={() => setCurrentQuizIndex(prev => prev + 1)}
                        className="flex items-center gap-1.5 px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md active:scale-95"
                      >
                        Soal Selanjutnya <ChevronRight size={16} />
                      </button>
                    ) : (
                      isAllAnswered && (
                        <button
                          onClick={handleResetQuiz}
                          className="flex items-center gap-1.5 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs sm:text-sm font-semibold transition-colors"
                        >
                          <RotateCcw size={14} /> Ulangi Kuis
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* 🌟 Dedicated Offer for More Questions Card (Tawaran Soal Tambahan) */}
                <AnimatePresence>
                  {showOfferCard && (
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="mt-6 p-5 sm:p-6 bg-gradient-to-br from-indigo-950/80 via-purple-950/70 to-zinc-900 border border-indigo-500/40 rounded-3xl shadow-xl relative overflow-hidden"
                    >
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex items-start gap-3.5">
                          <div className="w-10 h-10 rounded-2xl bg-indigo-500/25 border border-indigo-500/40 flex items-center justify-center text-indigo-300 shrink-0 shadow-inner mt-0.5">
                            <Sparkles size={20} />
                          </div>
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded-full border border-indigo-500/30">
                              Tawaran Pendalaman Materi
                            </span>
                            <h4 className="text-base sm:text-lg font-bold text-white mt-1">
                              Mau Soal Lebih Banyak untuk Memperdalam Pelajaran?
                            </h4>
                            <p className="text-xs sm:text-sm text-zinc-300 mt-1 leading-relaxed">
                              Uji pemahaman konsep <span className="font-semibold text-white">"{lesson.title}"</span> secara lebih komprehensif. AI kami siap membuatkan 3 soal latihan studi kasus baru untuk mengasah daya ingatmu.
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setShowOfferCard(false);
                            setDismissedOffer(true);
                          }}
                          className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                          title="Tutup Tawaran"
                        >
                          <X size={16} />
                        </button>
                      </div>

                      {/* Difficulty Selector */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-black/30 rounded-2xl border border-white/5 mb-4 text-xs">
                        <span className="text-zinc-300 font-medium">Tingkat Kesulitan Soal Tambahan:</span>
                        <div className="flex bg-zinc-900 p-1 rounded-xl border border-white/10">
                          <button
                            type="button"
                            onClick={() => setSelectedDifficulty('menengah')}
                            className={`px-3 py-1 rounded-lg transition-all font-medium ${
                              selectedDifficulty === 'menengah'
                                ? 'bg-indigo-600 text-white shadow'
                                : 'text-zinc-400 hover:text-white'
                            }`}
                          >
                            Standar Ujian
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedDifficulty('menantang')}
                            className={`px-3 py-1 rounded-lg transition-all font-medium ${
                              selectedDifficulty === 'menantang'
                                ? 'bg-purple-600 text-white shadow'
                                : 'text-zinc-400 hover:text-white'
                            }`}
                          >
                            Tantangan HOTS 🔥
                          </button>
                        </div>
                      </div>

                      {/* Offer Action Buttons */}
                      <div className="flex items-center gap-3 flex-wrap">
                        <button
                          onClick={handleGetMoreQuestions}
                          disabled={isGeneratingExtra}
                          className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg transition-all active:scale-95 disabled:opacity-50"
                        >
                          {isGeneratingExtra ? (
                            <>
                              <Brain size={16} className="animate-spin text-white" />
                              <span>AI Sedang Meracik 3 Soal Baru...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles size={16} />
                              <span>Ya, Buat 3 Soal Tambahan!</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => {
                            setShowOfferCard(false);
                            setDismissedOffer(true);
                          }}
                          className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white rounded-xl text-xs sm:text-sm font-medium transition-colors"
                        >
                          Cukup, Saya Sudah Paham
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* 🏆 Quiz Completion Mastery Card */}
                {isAllAnswered && !showOfferCard && (
                  <div className="mt-6 p-5 sm:p-6 bg-gradient-to-r from-emerald-950/40 via-zinc-900 to-indigo-950/40 border border-emerald-500/30 rounded-3xl shadow-lg">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300 shrink-0">
                          <Trophy size={24} />
                        </div>
                        <div>
                          <h4 className="text-base sm:text-lg font-bold text-white">
                            Kuis Selesai! Skor: {correctCount} dari {totalQuestions} ({Math.round((correctCount / totalQuestions) * 100)}%)
                          </h4>
                          <p className="text-xs sm:text-sm text-zinc-300 mt-0.5">
                            {correctCount === totalQuestions
                              ? '🏆 Sempurna! Kamu telah menguasai seluruh konsep inti materi ini.'
                              : correctCount >= Math.ceil(totalQuestions / 2)
                              ? '🌟 Kerja bagus! Pemahamanmu sudah sangat kokoh.'
                              : '📚 Tetap semangat! Baca kembali poin kunci di atas dan coba ulangi kuis.'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleGetMoreQuestions}
                          disabled={isGeneratingExtra}
                          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow active:scale-95 disabled:opacity-50"
                        >
                          <PlusCircle size={15} />
                          <span>{isGeneratingExtra ? 'Memuat...' : 'Minta 3 Soal Baru Lagi'}</span>
                        </button>
                        <button
                          onClick={handleResetQuiz}
                          className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs sm:text-sm font-medium transition-colors"
                        >
                          <RotateCcw size={14} />
                          <span>Coba Lagi</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
