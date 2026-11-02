import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Key, CheckCircle2, AlertTriangle, Eye, EyeOff, 
  ExternalLink, RefreshCw, Trash2, Check, ShieldCheck, HelpCircle, ChevronDown, ChevronUp
} from 'lucide-react';
import { getCustomGeminiKey, setCustomGeminiKey, getAiHeaders, apiUrl } from '../services/apiClient';

interface GeminiSettingsCardProps {
  onKeySaved?: () => void;
}

export const GeminiSettingsCard: React.FC<GeminiSettingsCardProps> = ({ onKeySaved }) => {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    const saved = getCustomGeminiKey();
    if (saved) {
      setApiKey(saved);
    }
  }, []);

  const handleSave = () => {
    const trimmed = apiKey.trim();
    setCustomGeminiKey(trimmed);
    setIsSaved(true);
    setTestStatus('idle');
    setTestMessage(trimmed ? 'Kunci API Gemini berhasil disimpan!' : 'Kunci kustom dihapus. Menggunakan setelan default.');
    if (onKeySaved) onKeySaved();
    setTimeout(() => setIsSaved(false), 3500);
  };

  const handleClear = () => {
    setApiKey('');
    setCustomGeminiKey('');
    setTestStatus('idle');
    setTestMessage('Kunci API kustom telah dihapus.');
    if (onKeySaved) onKeySaved();
  };

  const handleTestConnection = async () => {
    const keyToTest = apiKey.trim();
    setTestStatus('testing');
    setTestMessage('Menghubungi server Google Gemini...');

    try {
      const res = await fetch(apiUrl('/api/test-gemini'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(keyToTest ? { 'x-gemini-api-key': keyToTest } : {})
        },
        body: JSON.stringify({ customApiKey: keyToTest })
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        setTestStatus('success');
        setTestMessage(data.message || 'Koneksi ke Google Gemini AI berhasil!');
      } else {
        setTestStatus('error');
        setTestMessage(data.error || 'Gagal memverifikasi kunci API Gemini.');
      }
    } catch (err: any) {
      setTestStatus('error');
      setTestMessage(err?.message || 'Tidak dapat menghubungi server lokal.');
    }
  };

  const hasKey = !!apiKey.trim();

  return (
    <div className="glass-card rounded-2xl p-6 md:p-8 border border-primary/20 relative overflow-hidden" id="gemini-ai-settings">
      {/* Decorative ambient accent */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-5 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-xl text-primary border border-primary/30">
            <Sparkles size={24} className="text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white">Koneksi Google Gemini AI</h3>
              <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase rounded-full bg-primary/10 text-primary border border-primary/30">
                Official API
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Hubungkan akun Google Gemini milik Anda untuk fitur asisten cerdas, pemformat catatan, & flashcard.
            </p>
          </div>
        </div>

        {/* Current status pill */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border bg-zinc-900/80">
          {hasKey ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400">Kunci Kustom Siap</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-amber-400">Mode Cerdas Otomatis</span>
            </>
          )}
        </div>
      </div>

      {/* Key Input Section */}
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-zinc-300 mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Key size={14} className="text-primary" />
              Gemini API Key (Google AI Studio)
            </span>
            <a 
              href="https://aistudio.google.com/app/apikey" 
              target="_blank" 
              rel="noreferrer"
              className="text-xs text-primary hover:underline flex items-center gap-1 font-normal"
            >
              Dapatkan Kunci Gratis <ExternalLink size={12} />
            </a>
          </label>

          <div className="relative flex items-center">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full bg-zinc-900/90 border border-zinc-700/80 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 font-mono transition-all pr-24"
              autoComplete="off"
              spellCheck="false"
            />
            <div className="absolute right-2 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
                title={showKey ? 'Sembunyikan Kunci' : 'Lihat Kunci'}
              >
                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
              {hasKey && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-2 text-zinc-400 hover:text-rose-400 rounded-lg hover:bg-zinc-800 transition-colors"
                  title="Hapus Kunci"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>
          <div className="mt-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-2.5">
            <ShieldCheck size={16} className="text-amber-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong className="font-semibold text-white">Privasi Terjamin:</strong> Kunci API Gemini disimpan <span className="underline decoration-amber-400">hanya di penyimpanan lokal perangkat ini</span>. Kunci <strong>tidak pernah disinkronkan ke cloud Firestore</strong>, dikecualikan dari ekspor data cadangan, dan tidak dibagikan kepada siapa pun.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {isSaved ? (
              <>
                <Check size={14} /> Tersimpan!
              </>
            ) : (
              <>
                <ShieldCheck size={14} /> Simpan Kunci
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testStatus === 'testing'}
            className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white text-xs font-semibold rounded-xl border border-zinc-700/80 flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <RefreshCw size={14} className={testStatus === 'testing' ? 'animate-spin text-primary' : ''} />
            {testStatus === 'testing' ? 'Menguji...' : 'Uji Koneksi AI'}
          </button>

          <button
            type="button"
            onClick={() => setShowGuide(!showGuide)}
            className="px-3 py-2 text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1.5 ml-auto transition-colors"
          >
            <HelpCircle size={14} />
            <span>Cara Mendapatkan Kunci</span>
            {showGuide ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        {/* Live Test / Feedback Banner */}
        {testMessage && (
          <div 
            className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 transition-all ${
              testStatus === 'success'
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                : testStatus === 'error'
                ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                : 'bg-zinc-900/90 border-zinc-700 text-zinc-300'
            }`}
          >
            {testStatus === 'success' ? (
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
            ) : testStatus === 'error' ? (
              <AlertTriangle size={16} className="text-rose-400 shrink-0 mt-0.5" />
            ) : (
              <RefreshCw size={16} className="text-primary shrink-0 mt-0.5" />
            )}
            <div className="flex-1 leading-relaxed">
              <span className="font-semibold block mb-0.5">
                {testStatus === 'success' ? 'Koneksi Berhasil' : testStatus === 'error' ? 'Peringatan Koneksi' : 'Status'}
              </span>
              {testMessage}
            </div>
          </div>
        )}

        {/* Step-by-Step Interactive Guide */}
        {showGuide && (
          <div className="p-4 bg-zinc-900/70 border border-zinc-800 rounded-xl space-y-3 animate-fade-in text-xs text-zinc-300">
            <h4 className="font-bold text-white flex items-center gap-1.5">
              <span>🚀 4 Langkah Mudah Menghubungkan Google Gemini:</span>
            </h4>
            <ol className="space-y-2 list-decimal list-inside text-zinc-300 pl-1 leading-relaxed">
              <li>
                Buka portal resmi{' '}
                <a 
                  href="https://aistudio.google.com/app/apikey" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="text-primary hover:underline font-semibold inline-flex items-center gap-0.5"
                >
                  Google AI Studio (aistudio.google.com) <ExternalLink size={10} />
                </a>{' '}
                dan masuk dengan akun Google Anda.
              </li>
              <li>
                Klik tombol biru <strong>"Create API key"</strong> di pojok kanan atas.
              </li>
              <li>
                Pilih proyek Google Cloud Anda (atau klik <em>Create API key in new project</em> jika belum ada), lalu salin kunci yang diawali dengan <code className="px-1.5 py-0.5 bg-zinc-800 rounded text-primary font-mono">AIzaSy...</code>.
              </li>
              <li>
                Tempel kode kunci tersebut pada kolom di atas, lalu klik <strong>"Simpan Kunci"</strong> dan <strong>"Uji Koneksi AI"</strong>.
              </li>
            </ol>
            <div className="p-2.5 bg-primary/10 border border-primary/20 rounded-lg text-primary text-[11px] leading-relaxed">
              💡 <strong>Tips:</strong> Penggunaan Gemini API dari Google AI Studio memiliki kuota gratis (Free Tier) yang sangat mencukupi untuk seluruh kebutuhan tugas perkuliahan harian Anda!
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
