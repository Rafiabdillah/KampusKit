import React, { useState } from 'react';
import { Check, Copy, ExternalLink } from 'lucide-react';
import { CLOUD_LOGIN_NATIVE_MESSAGE, CLOUD_WEB_URL } from '../services/authSupport';

export const CloudLoginNotice: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(CLOUD_WEB_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 space-y-3">
      <p className="text-xs leading-relaxed text-amber-100/90">{CLOUD_LOGIN_NATIVE_MESSAGE}</p>
      <div className="flex flex-wrap gap-2">
        <a
          href={CLOUD_WEB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/20 px-3 py-2 text-xs font-bold text-amber-200 hover:bg-amber-500/30 transition-colors"
        >
          <ExternalLink size={14} />
          Buka versi web
        </a>
        <button
          type="button"
          onClick={copyLink}
          className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-800 px-3 py-2 text-xs font-bold text-zinc-200 hover:bg-zinc-700 transition-colors"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? 'Tersalin' : 'Salin tautan'}
        </button>
      </div>
      <p className="select-all break-all font-mono text-[10px] text-amber-200/60">{CLOUD_WEB_URL}</p>
    </div>
  );
};
