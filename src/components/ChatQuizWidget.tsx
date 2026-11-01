import React, { useState } from 'react';
import { CheckCircle2, XCircle, HelpCircle, ArrowRight } from 'lucide-react';
import { OfflineQuizQuestion } from '../data/offlineKnowledge';
import { audioService } from '../services/audio';

interface ChatQuizWidgetProps {
  question: OfflineQuizQuestion;
  onNextQuestion?: () => void;
}

export const ChatQuizWidget: React.FC<ChatQuizWidgetProps> = ({ question, onNextQuestion }) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const handleSelect = (idx: number) => {
    if (selectedIndex !== null) return; // Prevent double clicking
    setSelectedIndex(idx);
    if (idx === question.correctIndex) {
      audioService.playAmbientSuccess();
    } else {
      audioService.playAmbientClick();
    }
  };

  const isAnswered = selectedIndex !== null;
  const isCorrect = selectedIndex === question.correctIndex;

  return (
    <div className="mt-3 bg-zinc-900/90 border border-blue-500/30 rounded-2xl p-4 text-white shadow-xl max-w-lg animate-slide-up">
      <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
        <div className="flex items-center gap-2">
          <HelpCircle size={16} className="text-blue-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-blue-300">
            Kuis Offline: {question.category}
          </span>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
          Uji Pemahaman
        </span>
      </div>

      <p className="text-sm font-semibold text-white mb-3 leading-relaxed">
        {question.question}
      </p>

      <div className="space-y-2 mb-3">
        {question.options.map((option, idx) => {
          const letter = String.fromCharCode(65 + idx); // A, B, C, D
          let btnStyle = 'bg-zinc-800/80 hover:bg-zinc-700/80 border-white/10 text-zinc-200';

          if (isAnswered) {
            if (idx === question.correctIndex) {
              btnStyle = 'bg-emerald-950/60 border-emerald-500 text-emerald-200 font-semibold';
            } else if (idx === selectedIndex) {
              btnStyle = 'bg-rose-950/60 border-rose-500 text-rose-200';
            } else {
              btnStyle = 'bg-zinc-900/50 border-white/5 text-zinc-500 opacity-60';
            }
          }

          return (
            <button
              key={idx}
              type="button"
              disabled={isAnswered}
              onClick={() => handleSelect(idx)}
              className={`w-full text-left p-2.5 rounded-xl border text-xs flex items-center gap-3 transition-all ${btnStyle}`}
            >
              <span className="w-6 h-6 rounded-lg bg-black/40 flex items-center justify-center font-mono font-bold text-[11px] shrink-0">
                {letter}
              </span>
              <span className="flex-1 leading-snug">{option}</span>
              {isAnswered && idx === question.correctIndex && (
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
              )}
              {isAnswered && idx === selectedIndex && idx !== question.correctIndex && (
                <XCircle size={16} className="text-rose-400 shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {isAnswered && (
        <div className="pt-2 border-t border-white/10">
          <div className={`p-2.5 rounded-xl text-xs mb-2.5 leading-relaxed ${
            isCorrect ? 'bg-emerald-900/30 text-emerald-200 border border-emerald-500/30' : 'bg-rose-900/30 text-rose-200 border border-rose-500/30'
          }`}>
            <span className="font-bold block mb-1">
              {isCorrect ? '🎉 Jawaban Benar!' : '❌ Jawaban Kurang Tepat'}
            </span>
            {question.explanation}
          </div>

          {onNextQuestion && (
            <button
              type="button"
              onClick={onNextQuestion}
              className="w-full py-2 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-primary/20"
            >
              <span>Soal Berikutnya</span>
              <ArrowRight size={14} />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
