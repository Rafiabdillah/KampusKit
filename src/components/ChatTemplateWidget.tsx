import React, { useState } from 'react';
import { Copy, Check, MessageSquareText } from 'lucide-react';
import { audioService } from '../services/audio';

interface ChatTemplateWidgetProps {
  title?: string;
  templateText: string;
}

export const ChatTemplateWidget: React.FC<ChatTemplateWidgetProps> = ({ title, templateText }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(templateText);
      setCopied(true);
      audioService.playAmbientSuccess();
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  return (
    <div className="mt-3 bg-zinc-900/90 border border-emerald-500/30 rounded-2xl p-4 text-white shadow-xl max-w-lg">
      <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <MessageSquareText size={16} className="text-emerald-400" />
          <span className="text-xs font-bold text-emerald-300">
            {title || 'Template Siap Salin'}
          </span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
            copied
              ? 'bg-emerald-500 text-black font-bold'
              : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-white/10'
          }`}
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? 'Tersalin!' : 'Salin Pesan'}
        </button>
      </div>

      <div className="bg-black/40 border border-white/5 rounded-xl p-3 text-xs text-zinc-200 leading-relaxed font-sans whitespace-pre-wrap select-all">
        {templateText}
      </div>

      <p className="text-[10px] text-zinc-400 mt-2 italic">
        💡 Ganti teks dalam tanda kurung siku [ ... ] sesuai data diri Anda sebelum dikirimkan.
      </p>
    </div>
  );
};
