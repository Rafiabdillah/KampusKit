
import React, { useState, useEffect, useRef, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Note } from '../types';
import { StorageService } from '../services/storage';
import { getAiHeaders } from '../services/apiClient';
import { 
  Plus, Search, Trash2, Edit2, Save, X, Columns, Maximize2, Minimize2, 
  Folder, FolderPlus, Clock, ChevronRight, FileText, Download, Copy, Sparkles, 
  Pin, Image as ImageIcon, Smile, LayoutTemplate, ArrowLeft, Bold, Italic, 
  List, ListOrdered, CheckSquare, Heading1, Heading2, Quote, Mic, MicOff, 
  MoreVertical, Check, Type, Eye, Code, Zap, BookOpen, HelpCircle, Wand2, RotateCcw, AlertCircle,
  Table as TableIcon, Tag, Printer, Share2, ArrowUpDown, FileDown, Layers, Palette, CopyCheck, SlidersHorizontal
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PartialBlock } from "@blocknote/core";
import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";

// Error Boundary for visual BlockNote editor to prevent any blank screen crash
class BlockNoteErrorBoundary extends React.Component<
  { children: React.ReactNode; onSwitchToFastMode?: () => void },
  { hasError: boolean; errorMessage: string }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, errorMessage: error?.message || 'Error rendering block editor' };
  }

  componentDidCatch(error: any, info: any) {
    console.error("BlockNote visual editor error caught safely:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 rounded-2xl bg-zinc-900 border border-amber-500/30 text-zinc-200 flex flex-col items-center justify-center gap-3 text-center my-4">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-400">
            <AlertCircle size={24} />
          </div>
          <h4 className="text-sm font-bold text-white">Tampilan Editor Visual Dipulihkan</h4>
          <p className="text-xs text-zinc-400 max-w-sm leading-relaxed">
            Catatan Anda tetap tersimpan dengan aman. Anda dapat melanjutkan menulis melalui Mode Cepat atau memuat ulang editor.
          </p>
          <div className="flex gap-2 mt-1">
            {this.props.onSwitchToFastMode && (
              <button
                type="button"
                onClick={() => {
                  this.setState({ hasError: false });
                  this.props.onSwitchToFastMode?.();
                }}
                className="px-3.5 py-1.5 bg-primary hover:bg-primary/80 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95"
              >
                Gunakan Mode Cepat
              </button>
            )}
            <button
              type="button"
              onClick={() => this.setState({ hasError: false })}
              className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium rounded-xl transition-all"
            >
              Muat Ulang Visual
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

interface NoteEditorProps {
  note: Partial<Note>;
  folders: string[];
  courses?: any[];
  isActive: boolean;
  onUpdate: (data: Partial<Note>) => void;
  onSave: () => void;
  onDelete: () => void;
  onDuplicate?: () => void;
  onFocus: () => void;
  onClose?: () => void;
  onBackToList?: () => void;
  isSplitView: boolean;
  isMobileDevice: boolean;
}

const EMOJIS = ['📝', '💡', '🔥', '🚀', '⭐', '🎯', '📚', '🎨', '💼', '💻', '🧠', '🌿', '🗓️', '✅', '✨'];
const COVERS = [
  'bg-gradient-to-r from-rose-400 to-red-500',
  'bg-gradient-to-r from-blue-400 to-indigo-500',
  'bg-gradient-to-r from-emerald-400 to-teal-500',
  'bg-gradient-to-r from-amber-400 to-orange-500',
  'bg-gradient-to-r from-fuchsia-400 to-purple-500',
  'bg-gradient-to-r from-cyan-400 to-blue-500',
  'bg-gradient-to-r from-zinc-700 to-zinc-900'
];

const NOTE_ACCENTS: Record<string, { name: string; bg: string; border: string; badge: string; text: string; dot: string; glow: string }> = {
  default: { name: 'Netral', bg: 'bg-zinc-900/40', border: 'border-white/10', badge: 'bg-white/5 text-zinc-300', text: 'text-zinc-200', dot: 'bg-zinc-400', glow: 'shadow-white/5' },
  emerald: { name: 'Hijau (Akademik)', bg: 'bg-emerald-950/30', border: 'border-emerald-500/40', badge: 'bg-emerald-500/20 text-emerald-300', text: 'text-emerald-300', dot: 'bg-emerald-400', glow: 'shadow-emerald-500/10' },
  indigo: { name: 'Biru (Riset & Kuliah)', bg: 'bg-indigo-950/30', border: 'border-indigo-500/40', badge: 'bg-indigo-500/20 text-indigo-300', text: 'text-indigo-300', dot: 'bg-indigo-400', glow: 'shadow-indigo-500/10' },
  purple: { name: 'Ungu (Ide & Esai)', bg: 'bg-purple-950/30', border: 'border-purple-500/40', badge: 'bg-purple-500/20 text-purple-300', text: 'text-purple-300', dot: 'bg-purple-400', glow: 'shadow-purple-500/10' },
  amber: { name: 'Kuning (Prioritas & Ujian)', bg: 'bg-amber-950/30', border: 'border-amber-500/40', badge: 'bg-amber-500/20 text-amber-300', text: 'text-amber-300', dot: 'bg-amber-400', glow: 'shadow-amber-500/10' },
  rose: { name: 'Merah (Penting & Deadline)', bg: 'bg-rose-950/30', border: 'border-rose-500/40', badge: 'bg-rose-500/20 text-rose-300', text: 'text-rose-300', dot: 'bg-rose-400', glow: 'shadow-rose-500/10' },
  cyan: { name: 'Cyan (Praktikum & Lab)', bg: 'bg-cyan-950/30', border: 'border-cyan-500/40', badge: 'bg-cyan-500/20 text-cyan-300', text: 'text-cyan-300', dot: 'bg-cyan-400', glow: 'shadow-cyan-500/10' },
};

const POPULAR_TAGS = ['kuliah', 'tugas', 'ujian', 'skripsi', 'praktikum', 'rumus', 'ide', 'dosen'];

// Helper: Safely extract text from any BlockNote block (including table, inline array, plain string, etc.)
function extractTextFromBlock(b: any): string {
  if (!b) return '';
  
  // 1. Standard inline content array: [{ type: "text", text: "...", ... }]
  if (Array.isArray(b.content)) {
    return b.content.map((c: any) => (typeof c === 'string' ? c : c?.text || '')).join('');
  }
  
  // 2. Plain string content
  if (typeof b.content === 'string') {
    return b.content;
  }
  
  // 3. Table block: content is an object with { type: "tableContent", rows: [ { cells: [...] } ] }
  if (b.type === 'table' || (b.content && typeof b.content === 'object' && Array.isArray(b.content.rows))) {
    const rows = b.content?.rows;
    if (Array.isArray(rows) && rows.length > 0) {
      return rows.map((row: any) => {
        const cells = Array.isArray(row?.cells) ? row.cells : [];
        const cellTexts = cells.map((cell: any) => {
          if (Array.isArray(cell)) {
            return cell.map((c: any) => (typeof c === 'string' ? c : c?.text || '')).join('');
          }
          if (cell && Array.isArray(cell.content)) {
            return cell.content.map((c: any) => (typeof c === 'string' ? c : c?.text || '')).join('');
          }
          if (typeof cell === 'string') return cell;
          return '';
        });
        return `| ${cellTexts.join(' | ')} |`;
      }).join('\n');
    }
  }

  // 4. Code block
  if (b.type === 'codeBlock') {
    if (typeof b.content === 'string') return b.content;
    if (Array.isArray(b.content)) {
      return b.content.map((c: any) => (typeof c === 'string' ? c : c?.text || '')).join('');
    }
  }

  return '';
}

// Helper: Convert BlockNote JSON / HTML to readable plain markdown text
function parseBlocksToPlainText(content?: string): string {
  if (!content) return '';
  if (!content.startsWith('[')) {
    // Already plain text or markdown or legacy HTML
    return content.replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n').replace(/<[^>]+>/g, '').trim();
  }
  try {
    const blocks = JSON.parse(content);
    if (!Array.isArray(blocks)) return content;
    
    return blocks.map((b: any) => {
      const text = extractTextFromBlock(b);
      
      switch (b.type) {
        case 'heading': {
          const level = b.props?.level === 1 ? '# ' : (b.props?.level === 2 ? '## ' : '### ');
          return `${level}${text}`;
        }
        case 'bulletListItem':
          return `• ${text}`;
        case 'numberedListItem':
          return `1. ${text}`;
        case 'checkListItem':
          return `[${b.props?.checked ? 'x' : ' '}] ${text}`;
        case 'quote':
          return `> ${text}`;
        case 'codeBlock':
          return `\`\`\`\n${text}\n\`\`\``;
        case 'table':
          return text;
        default:
          return text;
      }
    }).filter(Boolean).join('\n');
  } catch {
    return content;
  }
}

// Helper: Convert plain markdown text to BlockNote PartialBlocks
function parsePlainMarkdownToBlocks(text: string): PartialBlock[] {
  if (!text.trim()) {
    return [{ type: 'paragraph', content: '' }];
  }

  const lines = text.split('\n');
  const blocks: PartialBlock[] = [];
  let i = 0;

  while (i < lines.length) {
    const rawLine = lines[i];
    const line = rawLine.trimEnd();

    // Check if this line is part of a markdown table (e.g. | Kolom 1 | Kolom 2 |)
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
        tableLines.push(lines[i].trim());
        i++;
      }

      // Filter out divider lines like | --- | --- |
      const contentRows = tableLines.filter(tl => !/^\|(\s*:?-+:?\s*\|)+$/.test(tl));
      if (contentRows.length > 0) {
        const rows = contentRows.map(rowLine => {
          const parts = rowLine.split('|').slice(1, -1).map(p => p.trim());
          const cells = parts.map(part => [{ type: 'text' as const, text: part, styles: {} }]);
          return { cells };
        });
        blocks.push({
          type: 'table' as any,
          content: {
            type: 'tableContent',
            rows
          } as any
        });
        continue;
      }
    }

    i++;
    if (!line.trim()) {
      blocks.push({ type: 'paragraph', content: '' });
      continue;
    }

    if (line.startsWith('### ')) {
      blocks.push({ type: 'heading', props: { level: 3 }, content: line.slice(4) });
    } else if (line.startsWith('## ')) {
      blocks.push({ type: 'heading', props: { level: 2 }, content: line.slice(3) });
    } else if (line.startsWith('# ')) {
      blocks.push({ type: 'heading', props: { level: 1 }, content: line.slice(2) });
    } else if (line.startsWith('- [ ] ') || line.startsWith('[ ] ')) {
      const prefixLen = line.startsWith('- [ ] ') ? 6 : 4;
      blocks.push({ type: 'checkListItem', props: { checked: false }, content: line.slice(prefixLen) });
    } else if (line.startsWith('- [x] ') || line.startsWith('[x] ') || line.startsWith('- [X] ') || line.startsWith('[X] ')) {
      const prefixLen = line.startsWith('- [') ? 6 : 4;
      blocks.push({ type: 'checkListItem', props: { checked: true }, content: line.slice(prefixLen) });
    } else if (line.startsWith('• ') || line.startsWith('- ') || line.startsWith('* ')) {
      blocks.push({ type: 'bulletListItem', content: line.slice(2) });
    } else if (/^\d+\.\s/.test(line)) {
      const match = line.match(/^\d+\.\s/);
      const prefixLen = match ? match[0].length : 3;
      blocks.push({ type: 'numberedListItem', content: line.slice(prefixLen) });
    } else if (line.startsWith('> ')) {
      blocks.push({ type: 'paragraph', content: [{ type: 'text', text: line.slice(2), styles: { italic: true } }] });
    } else {
      blocks.push({ type: 'paragraph', content: line });
    }
  }

  return blocks;
}

const AI_PRESETS = [
  {
    id: 'improve',
    title: 'Rapikan & Sempurnakan',
    badge: 'Rekomendasi',
    badgeStyle: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
    desc: 'Format bersih, perbaiki ejaan PUEBI, headings hierarki (##, ###), bullet points rapi, dan tebalkan istilah kunci.',
    icon: <Sparkles size={18} />
  },
  {
    id: 'cornell',
    title: 'Metode Catatan Cornell',
    badge: 'Akademik',
    badgeStyle: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30',
    desc: 'Bagi catatan menjadi 3 zona: Pertanyaan Kunci (Cue), Catatan Kuliah Rinci, dan Ringkasan Inti untuk persiapan ujian.',
    icon: <BookOpen size={18} />
  },
  {
    id: 'summary',
    title: 'Ringkasan Kilat (Summary)',
    badge: 'Prinsip 80/20',
    badgeStyle: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    desc: 'Ekstrak 20% esensi yang memuat 80% pemahaman materi. Cepat dibaca 1 menit sebelum kelas atau kuis.',
    icon: <Zap size={18} />
  },
  {
    id: 'action_items',
    title: 'Ekstrak Tugas & Deadline',
    badge: 'Checklist',
    badgeStyle: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30',
    desc: 'Pindai catatan otomatis untuk menghasilkan daftar ceklis PR, tugas kelompok, dan materi yang perlu dikaji ulang.',
    icon: <CheckSquare size={18} />
  },
  {
    id: 'exam_quiz',
    title: 'Kuis Active Recall & Ujian',
    badge: 'Latihan Soal',
    badgeStyle: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
    desc: 'Susun 4-5 soal latihan (Pilihan Ganda & Esai Aplikasi) lengkap dengan kunci jawaban & pembahasan tersembunyi.',
    icon: <HelpCircle size={18} />
  },
  {
    id: 'expand',
    title: 'Perluas & Tambah Contoh',
    badge: 'Elaborasi',
    badgeStyle: 'bg-rose-500/20 text-rose-300 border border-rose-500/30',
    desc: 'Kembangkan konsep yang masih singkat dengan analogi intuitif dan 1-2 contoh kasus nyata di industri/kehidupan.',
    icon: <FileText size={18} />
  },
  {
    id: 'custom',
    title: 'Instruksi Kustom Pengguna',
    badge: 'Bebas',
    badgeStyle: 'bg-zinc-700 text-zinc-300 border border-zinc-600',
    desc: 'Tuliskan perintah bebas apa pun (misal: "Buatkan tabel komparasi...", "Fokus pada rumus-rumus penting...").',
    icon: <Wand2 size={18} />
  }
];

const NoteEditor: React.FC<NoteEditorProps> = ({ 
  note, 
  folders, 
  courses = [],
  isActive, 
  onUpdate, 
  onSave, 
  onDelete, 
  onDuplicate,
  onFocus, 
  onClose,
  onBackToList,
  isSplitView,
  isMobileDevice
}) => {
  const currentAccent = NOTE_ACCENTS[note.color || 'default'] || NOTE_ACCENTS.default;
  const [wordCount, setWordCount] = useState(0);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiPlacementMode, setAiPlacementMode] = useState<'replace' | 'append'>('replace');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customPromptText, setCustomPromptText] = useState('');
  const [lastNoteBackup, setLastNoteBackup] = useState<string | null>(null);
  const [aiSuccessToast, setAiSuccessToast] = useState<string | null>(null);
  const [aiErrorToast, setAiErrorToast] = useState<string | null>(null);
  const [aiCurrentTask, setAiCurrentTask] = useState<string>('Memproses catatan...');
  const [isReady, setIsReady] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showCoverPicker, setShowCoverPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [isReadingMode, setIsReadingMode] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  
  // Mobile writing mode: 'fast' (Mobile Native Textarea + Touch Toolbar) vs 'block' (BlockNote visual blocks)
  const [editorMode, setEditorMode] = useState<'fast' | 'block'>(() => {
    return isMobileDevice ? 'fast' : 'block';
  });

  // Local plain text representation for the Fast Mobile editor
  const [plainText, setPlainText] = useState<string>(() => parseBlocksToPlainText(note.content));
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Sync plainText when note.content changes externally (e.g. switching notes)
  useEffect(() => {
    setPlainText(parseBlocksToPlainText(note.content));
  }, [note.id]);

  // Check speech recognition capability
  useEffect(() => {
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRec) {
      setSpeechSupported(true);
    }
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        onUpdate({ ...note, coverImage: dataUrl });
        setShowCoverPicker(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Initialize BlockNote editor
  const editor = useCreateBlockNote({
    initialContent: useMemo(() => {
      if (!note.content) return undefined;
      try {
        const parsed = JSON.parse(note.content);
        if (Array.isArray(parsed)) return parsed as PartialBlock[];
      } catch {
        // Fallback
      }
      return undefined;
    }, [note.id])
  });

  // Handle legacy HTML or text content on mount for BlockNote
  useEffect(() => {
    if (!editor) return;
    if (note.content && !note.content.startsWith('[')) {
      try {
        JSON.parse(note.content);
        setIsReady(true);
      } catch {
        const getBlocks = async () => {
          try {
            const blocks = editor.tryParseHTMLToBlocks(note.content as string);
            if (blocks && blocks.length) {
              editor.replaceBlocks(editor.document, blocks);
            }
          } catch {
            const fallbackBlocks = editor.tryParseMarkdownToBlocks(note.content as string);
            editor.replaceBlocks(editor.document, fallbackBlocks);
          }
          setIsReady(true);
        };
        getBlocks();
      }
    } else {
      setIsReady(true);
    }
  }, [editor, note.id]);

  // Update word count
  useEffect(() => {
    const raw = editorMode === 'fast' 
      ? plainText 
      : (editor?.document ? editor.document.map(b => extractTextFromBlock(b)).join(" ") : '');
    const clean = raw.trim();
    const count = clean === '' ? 0 : clean.split(/\s+/).length;
    setWordCount(prev => (prev === count ? prev : count));
  }, [plainText, editor?.document, editorMode]);

  // Handler for Fast Mobile Textarea change
  const handlePlainChange = (val: string) => {
    setPlainText(val);
    setSaveStatus('saving');
    
    // Convert to blocks in JSON format for compatibility
    const blocks = parsePlainMarkdownToBlocks(val);
    const json = JSON.stringify(blocks);
    onUpdate({ ...note, content: json });

    setTimeout(() => {
      setSaveStatus('saved');
    }, 600);
  };

  // Handler for BlockNote editor change
  const handleBlockChange = () => {
    if (!editor) return;
    setSaveStatus('saving');
    try {
      const json = JSON.stringify(editor.document);
      onUpdate({ ...note, content: json });
      
      // Also keep plain text sync safely without crashing on tables or complex blocks
      const text = editor.document.map(b => extractTextFromBlock(b)).join("\n");
      setPlainText(text);
    } catch (err) {
      console.error("Error updating note from block change:", err);
    }

    setTimeout(() => {
      setSaveStatus('saved');
    }, 600);
  };

  // Switch between Fast Mobile Mode and BlockNote Visual Mode
  const toggleEditorMode = async () => {
    if (editorMode === 'fast') {
      // Moving from Fast -> Block
      if (editor) {
        try {
          const blocks = parsePlainMarkdownToBlocks(plainText);
          editor.replaceBlocks(editor.document, blocks);
        } catch (err) {
          console.error("Error converting markdown to visual blocks:", err);
        }
      }
      setEditorMode('block');
    } else {
      // Moving from Block -> Fast
      if (editor) {
        try {
          const md = editor.blocksToMarkdownLossy(editor.document);
          setPlainText(md || editor.document.map(b => extractTextFromBlock(b)).join("\n"));
        } catch {
          setPlainText(editor.document.map(b => extractTextFromBlock(b)).join("\n"));
        }
      }
      setEditorMode('fast');
    }
  };

  // Quick formatting insert helpers for Fast Mobile Textarea
  const insertFormatting = (prefix: string, suffix: string = '', defaultText: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const current = plainText;
    const selected = current.substring(start, end) || defaultText;

    const replacement = `${prefix}${selected}${suffix}`;
    const newText = current.substring(0, start) + replacement + current.substring(end);
    
    handlePlainChange(newText);

    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + prefix.length + selected.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 20);
  };

  const insertLinePrefix = (prefix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const current = plainText;
    
    // Find start of current line
    const lastNewline = current.lastIndexOf('\n', start - 1);
    const lineStart = lastNewline === -1 ? 0 : lastNewline + 1;

    const newText = current.substring(0, lineStart) + prefix + current.substring(lineStart);
    handlePlainChange(newText);

    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + prefix.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 20);
  };

  // Voice Dictation (Speech to Text)
  const toggleVoiceRecording = () => {
    if (isVoiceRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsVoiceRecording(false);
      return;
    }

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      alert("Browser Anda belum mendukung input suara langsung. Gunakan keyboard mikrofon di HP Anda.");
      return;
    }

    try {
      const rec = new SpeechRec();
      rec.lang = 'id-ID';
      rec.continuous = true;
      rec.interimResults = false;

      rec.onstart = () => {
        setIsVoiceRecording(true);
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[event.results.length - 1][0].transcript;
        if (transcript) {
          const space = plainText.length > 0 && !plainText.endsWith(' ') && !plainText.endsWith('\n') ? ' ' : '';
          handlePlainChange(plainText + space + transcript);
        }
      };

      rec.onerror = (err: any) => {
        console.error("Speech error", err);
        setIsVoiceRecording(false);
      };

      rec.onend = () => {
        setIsVoiceRecording(false);
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (e: any) {
      console.error(e);
      setIsVoiceRecording(false);
      alert("Tidak dapat memulai mikrofon: " + e.message);
    }
  };

  // AI Polish & Structured Notes System
  const handleAiAction = async (
    action: 'improve' | 'cornell' | 'summary' | 'action_items' | 'exam_quiz' | 'expand' | 'custom',
    customPrompt: string = '',
    placementMode: 'replace' | 'append' = aiPlacementMode
  ) => {
    let currentContent = '';
    if (editorMode === 'fast') {
      currentContent = plainText;
    } else if (editor) {
      try {
        currentContent = editor.blocksToMarkdownLossy(editor.document);
      } catch {
        currentContent = editor.document.map(b => extractTextFromBlock(b)).join('\n');
      }
    }

    setAiErrorToast(null);

    if (!currentContent || !currentContent.trim()) {
      setAiErrorToast("Catatan masih kosong. Tuliskan materi atau poin perkuliahan terlebih dahulu.");
      return;
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setAiSuccessToast("Mode Offline: Memproses dengan Format Cerdas Lokal...");
    }
    
    const taskMessages: Record<string, string> = {
      improve: 'Merapikan tata bahasa, ejaan & format catatan...',
      cornell: 'Menyusun format Metode Catatan Cornell...',
      summary: 'Membuat ringkasan eksekutif 80/20 & konsep kunci...',
      action_items: 'Mengekstrak tugas & membuat daftar aksi...',
      exam_quiz: 'Membuat kuis latihan active recall ujian...',
      expand: 'Memperluas konsep dengan analogi & contoh...',
      custom: 'Memproses instruksi catatan...'
    };

    setAiCurrentTask(taskMessages[action] || 'Memproses catatan...');
    setIsAiLoading(true);
    setShowAiModal(false);
    setLastNoteBackup(currentContent);

    const controller = new AbortController();
    const timeoutTimer = setTimeout(() => controller.abort(), 45000);

    try {
      const res = await fetch("/api/notes/ai", {
        method: "POST",
        headers: getAiHeaders(),
        body: JSON.stringify({ 
          content: currentContent,
          action,
          customPrompt: customPrompt || customPromptText,
          noteTitle: note.title || ''
        }),
        signal: controller.signal
      });
      
      if (res.ok) {
        const data = await res.json();
        const aiText = (data.text || '').replace(/^```(?:markdown|md)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
        
        let finalContent = aiText;
        if (placementMode === 'append' && currentContent.trim()) {
          finalContent = `${currentContent.trim()}\n\n---\n\n${aiText}`;
        }

        if (editorMode === 'fast') {
          handlePlainChange(finalContent);
        } else if (editor) {
          try {
            const blocks = parsePlainMarkdownToBlocks(finalContent);
            editor.replaceBlocks(editor.document, blocks);
            handleBlockChange();
          } catch (err) {
            console.error("Error setting AI blocks:", err);
          }
        }

        if (data.isFallback || data.source === 'offline') {
          setAiSuccessToast(data.notice || 'Catatan diformat secara offline (bukan hasil generatif AI)');
        } else {
          const labels: Record<string, string> = {
            improve: '✨ [Gemini Cloud] Catatan berhasil dirapikan & diformat bersih',
            cornell: '✨ [Gemini Cloud] Catatan berhasil disusun dengan Metode Cornell',
            summary: '✨ [Gemini Cloud] Ringkasan esensi materi & konsep kunci selesai',
            action_items: '✨ [Gemini Cloud] Action items & daftar tugas berhasil diekstrak',
            exam_quiz: '✨ [Gemini Cloud] Kuis latihan ujian active recall siap dipelajari',
            expand: '✨ [Gemini Cloud] Materi berhasil diperkaya dengan contoh konkret',
            custom: '✨ [Gemini Cloud] Instruksi AI berhasil dijalankan'
          };

          setAiSuccessToast(labels[action] || '✨ [Gemini Cloud] Catatan berhasil dioptimasi');
        }
      } else {
        const errorData = await res.json().catch(() => ({}));
        if (res.status === 429 || errorData.code === 'QUOTA_EXCEEDED') {
          setAiErrorToast("Batas kuota AI tercapai (429). Tunggu 30 detik lalu klik coba lagi, atau periksa API Key Anda.");
        } else {
          setAiErrorToast(errorData.error || `Gagal memproses catatan (${res.statusText || res.status})`);
        }
      }
    } catch (e: any) {
      if (e.name === 'AbortError') {
        setAiErrorToast('Permintaan AI melebihi batas waktu 45 detik. Silakan coba lagi.');
      } else {
        setAiErrorToast(`Terjadi kesalahan saat memproses: ${e?.message || 'Koneksi gagal'}`);
      }
    } finally {
      clearTimeout(timeoutTimer);
      setIsAiLoading(false);
    }
  };

  const handleQuickImprove = () => {
    handleAiAction('improve', '', 'replace');
  };

  const handleUndoAi = async () => {
    if (!lastNoteBackup) return;
    if (editorMode === 'fast') {
      handlePlainChange(lastNoteBackup);
    } else if (editor) {
      try {
        const blocks = parsePlainMarkdownToBlocks(lastNoteBackup);
        editor.replaceBlocks(editor.document, blocks);
        handleBlockChange();
      } catch (err) {
        console.error("Error restoring backup blocks:", err);
      }
    }
    setLastNoteBackup(null);
    setAiSuccessToast("Perubahan AI dibatalkan. Catatan dikembalikan ke versi sebelumnya.");
  };

  const handleAddTag = (rawTag: string) => {
    const clean = rawTag.replace(/^#/, '').trim().toLowerCase();
    if (!clean) return;
    const currentTags = note.tags || [];
    if (!currentTags.includes(clean)) {
      const updated = [...currentTags, clean];
      onUpdate({ ...note, tags: updated });
    }
    setNewTagInput('');
    setIsAddingTag(false);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const currentTags = note.tags || [];
    const updated = currentTags.filter(t => t !== tagToRemove);
    onUpdate({ ...note, tags: updated });
  };

  const handlePrintNote = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      return;
    }
    
    const title = note.title || 'Catatan KampusKit';
    const tagsHtml = (note.tags || []).map(t => `<span class="tag">#${t}</span>`).join(' ');
    const dateStr = note.date || new Date().toLocaleString('id-ID');
    const folderStr = note.folder ? `<span class="folder">📁 ${note.folder}</span>` : '';
    
    let bodyHtml: string;
    if (editor && editorMode === 'block') {
      try {
        bodyHtml = editor.blocksToHTMLLossy(editor.document);
      } catch {
        bodyHtml = `<pre style="white-space: pre-wrap;">${plainText}</pre>`;
      }
    } else {
      bodyHtml = plainText
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        .replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>')
        .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/gim, '<em>$1</em>')
        .replace(/^- \[(?:x|X)\] (.*$)/gim, '<div class="check done">☑ $1</div>')
        .replace(/^- \[ \] (.*$)/gim, '<div class="check">☐ $1</div>')
        .replace(/^[•-] (.*$)/gim, '<li>$1</li>')
        .replace(/\n/gim, '<br/>');
    }

    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>${title} - KampusKit</title>
  <meta charset="utf-8">
  <style>
    @page { margin: 20mm; size: A4; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; color: #111; line-height: 1.6; padding: 24px; max-width: 800px; margin: 0 auto; }
    h1 { font-size: 26px; margin-bottom: 8px; color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }
    h2 { font-size: 20px; margin-top: 24px; margin-bottom: 8px; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
    h3 { font-size: 16px; margin-top: 18px; margin-bottom: 6px; color: #334155; }
    .meta { font-size: 12px; color: #64748b; margin-bottom: 24px; display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
    .tag { background: #f1f5f9; color: #475569; padding: 2px 8px; border-radius: 6px; font-weight: 600; font-size: 11px; }
    .folder { font-weight: 600; color: #6366f1; background: #eef2ff; padding: 2px 8px; border-radius: 6px; }
    blockquote { border-left: 4px solid #6366f1; padding-left: 14px; color: #475569; margin: 16px 0; font-style: italic; background: #f8fafc; padding-top: 6px; padding-bottom: 6px; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px; }
    th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; }
    th { background-color: #f8fafc; font-weight: 600; }
    .check { margin: 6px 0; font-size: 14px; }
    .check.done { text-decoration: line-through; color: #94a3b8; }
    li { margin-bottom: 4px; }
    pre, code { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-size: 12px; }
    pre { padding: 12px; overflow-x: auto; background: #0f172a; color: #f8fafc; }
    @media print {
      body { padding: 0; }
    }
  </style>
</head>
<body>
  <h1>${note.icon || '📝'} ${title}</h1>
  <div class="meta">
    <span>📅 ${dateStr}</span>
    ${folderStr}
    ${tagsHtml ? `<div>${tagsHtml}</div>` : ''}
  </div>
  <div class="content">
    ${bodyHtml}
  </div>
</body>
</html>`);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 300);
  };

  const downloadAs = (format: 'md' | 'txt' | 'html') => {
    const title = note.title || 'Catatan';
    const cleanTitle = title.replace(/[/\\?%*:|"<>]/g, '-');
    
    if (format === 'md') {
      const md = `# ${title}\n\n` +
        `> **Folder:** ${note.folder || 'Tanpa Folder'} | **Tanggal:** ${note.date || ''} | **Tags:** ${(note.tags || []).map(t => `#${t}`).join(' ')}\n\n` +
        plainText;
      const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${cleanTitle}.md`;
      a.click();
      URL.revokeObjectURL(url);
      setAiSuccessToast(`File ${cleanTitle}.md berhasil diunduh!`);
    } else if (format === 'txt') {
      const txt = `${title}\n` +
        `Folder: ${note.folder || '-'}\nTanggal: ${note.date || '-'}\nTags: ${(note.tags || []).join(', ')}\n\n` +
        plainText;
      const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${cleanTitle}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      setAiSuccessToast(`File ${cleanTitle}.txt berhasil diunduh!`);
    } else if (format === 'html') {
      let bodyContent: string;
      if (editor && editorMode === 'block') {
        try {
          bodyContent = editor.blocksToHTMLLossy(editor.document);
        } catch {
          bodyContent = `<pre style="white-space: pre-wrap;">${plainText}</pre>`;
        }
      } else {
        bodyContent = plainText
          .replace(/^### (.*$)/gim, '<h3>$1</h3>')
          .replace(/^## (.*$)/gim, '<h2>$1</h2>')
          .replace(/^# (.*$)/gim, '<h1>$1</h1>')
          .replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>')
          .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
          .replace(/\*(.*?)\*/gim, '<em>$1</em>')
          .replace(/^- \[(?:x|X)\] (.*$)/gim, '<div class="check done">☑ $1</div>')
          .replace(/^- \[ \] (.*$)/gim, '<div class="check">☐ $1</div>')
          .replace(/^[•-] (.*$)/gim, '<li>$1</li>')
          .replace(/\n/gim, '<br/>');
      }

      const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - KampusKit</title>
  <style>
    body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #09090b; color: #f4f4f5; max-width: 840px; margin: 0 auto; padding: 32px 20px; line-height: 1.7; }
    h1 { font-size: 2.2rem; font-weight: 800; color: #ffffff; border-bottom: 1px solid #27272a; padding-bottom: 16px; margin-bottom: 12px; }
    h2 { font-size: 1.5rem; font-weight: 700; color: #f4f4f5; border-bottom: 1px solid #27272a; padding-bottom: 8px; margin-top: 32px; }
    h3 { font-size: 1.2rem; font-weight: 600; color: #e4e4e7; margin-top: 24px; }
    .meta-bar { display: flex; gap: 12px; align-items: center; color: #a1a1aa; font-size: 0.85rem; margin-bottom: 28px; flex-wrap: wrap; }
    .badge { background: rgba(255,255,255,0.08); padding: 4px 10px; border-radius: 8px; font-weight: 500; }
    .tag { background: rgba(99,102,241,0.15); color: #818cf8; border: 1px solid rgba(99,102,241,0.3); padding: 2px 8px; border-radius: 6px; font-size: 0.8rem; }
    blockquote { border-left: 4px solid #6366f1; background: rgba(99,102,241,0.05); padding: 12px 18px; margin: 20px 0; border-radius: 0 12px 12px 0; color: #cbd5e1; font-style: italic; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; border: 1px solid #27272a; border-radius: 8px; overflow: hidden; }
    th, td { padding: 10px 14px; border: 1px solid #27272a; text-align: left; font-size: 0.9rem; }
    th { background: #18181b; color: #ffffff; font-weight: 600; }
    pre { background: #18181b; border: 1px solid #27272a; border-radius: 10px; padding: 16px; overflow-x: auto; font-family: monospace; font-size: 0.9rem; }
    code { background: #27272a; padding: 2px 6px; border-radius: 4px; font-family: monospace; color: #818cf8; font-size: 0.85rem; }
    .check { margin: 6px 0; font-size: 0.95rem; }
    .check.done { text-decoration: line-through; opacity: 0.5; }
  </style>
</head>
<body>
  <h1>${note.icon || '📝'} ${title}</h1>
  <div class="meta-bar">
    <span class="badge">📅 ${note.date || 'KampusKit'}</span>
    ${note.folder ? `<span class="badge">📁 ${note.folder}</span>` : ''}
    ${(note.tags || []).map(t => `<span class="tag">#${t}</span>`).join(' ')}
  </div>
  <article>
    ${bodyContent}
  </article>
</body>
</html>`;
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${cleanTitle}.html`;
      a.click();
      URL.revokeObjectURL(url);
      setAiSuccessToast(`File ${cleanTitle}.html berhasil diunduh!`);
    }
  };

  const applyTemplate = (type: 'todo' | 'meeting' | 'journal' | 'study' | 'lab' | 'resume' | 'thesis' | 'cornell') => {
    let tplText = '';
    const dateStr = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    if (type === 'todo') {
      tplText = `## 📋 Daftar Tugas & Rencana\n- [ ] [Prioritas 1] Tugas mendesak\n- [ ] [Prioritas 2] Tugas kelompok\n- [ ] [Review] Bahan kuliah mingguan\n\n### ⏳ Catatan Deadline & Pengumpulan:\n- `;
    } else if (type === 'meeting') {
      tplText = `## 👥 Notula Rapat & Diskusi\n**Tanggal:** ${dateStr}\n**Agenda:** Diskusi Proyek / Kelompok / Organisasi\n**Peserta:** \n\n### 📌 Poin Utama Pembahasan:\n• Poin diskusi 1\n• Poin diskusi 2\n\n### ✅ Pembagian Tugas (Action Items):\n- [ ] Anggota 1: Tugas & target deadline\n- [ ] Anggota 2: Tugas & target deadline`;
    } else if (type === 'journal') {
      tplText = `## 📖 Jurnal Harian (${dateStr})\n### ✨ Apa yang saya pelajari & syukuri hari ini?\n• \n\n### 🎯 Progres Target & Hal yang Perlu Diperbaiki:\n• \n\n### 💭 Refleksi Singkat:\n> `;
    } else if (type === 'study') {
      tplText = `## 🎓 Catatan Kuliah\n**Mata Kuliah:** \n**Dosen:** \n**Tanggal:** ${dateStr}\n\n### 💡 Konsep Utama & Teori:\n• Poin konsep 1: Definisi & perumusan\n• Poin konsep 2: Contoh aplikasi praktis\n\n### 📝 Ringkasan Penjelasan Dosen:\n\n### ❓ Pertanyaan & Hal yang Perlu Dipelajari Lagi:\n- [ ] `;
    } else if (type === 'lab') {
      tplText = `## 🔬 Laporan Praktikum\n**Praktikum:** \n**Laboratorium / Lokasi:** \n**Tanggal:** ${dateStr}\n\n### 🎯 Tujuan Percobaan:\n1. Memahami prinsip kerja...\n2. Mengamati pengaruh variabel...\n\n### 🧰 Alat & Bahan:\n• \n\n### 📊 Data Pengamatan & Pengukuran:\n| No | Percobaan / Sampel | Parameter A | Parameter B | Hasil / Nilai |\n| :--- | :--- | :--- | :--- | :--- |\n| 1 | Sampel Kontrol | - | - | - |\n| 2 | Sampel Variasi 1 | - | - | - |\n\n### 🔍 Analisis & Pembahasan Singkat:\n\n### 📌 Kesimpulan Praktikum:\n- `;
    } else if (type === 'resume') {
      tplText = `## 📚 Resume Jurnal & Kajian Literatur\n**Judul Paper:** \n**Penulis & Tahun:** \n**Jurnal / Konferensi:** \n\n### 🎯 Masalah & Tujuan Penelitian:\n• Masalah utama: \n• Tujuan riset: \n\n### 🔬 Metodologi Riset:\n• Pendekatan (Kuantitatif / Kualitatif / Eksperimen): \n• Populasi / Sampel Data: \n\n### 🏆 Temuan Utama (Key Findings):\n1. \n2. \n\n### 💡 Relevansi & Inspirasi untuk Skripsi / Tugas:\n> `;
    } else if (type === 'thesis') {
      tplText = `## 🎯 Kerangka Usulan Proposal / Skripsi\n**Topik Rencana:** \n**Bidang Minat:** \n**Calon Pembimbing:** \n\n### 1. Latar Belakang Masalah:\n• Fenomena empiris di lapangan: \n• Research gap (apa yang belum terselesaikan): \n\n### 2. Rumusan Masalah:\n1. Bagaimana pengaruh...\n2. Sejauh mana efektivitas...\n\n### 3. Batasan Penelitian:\n• Lingkup data: \n• Asumsi metodologi: \n\n### 4. Target Jadwal Pengerjaan:\n- [ ] Bab 1 Pendahuluan\n- [ ] Bab 2 Tinjauan Pustaka\n- [ ] Bab 3 Metode Penelitian`;
    } else if (type === 'cornell') {
      tplText = `## 📌 Pertanyaan Kunci & Isyarat (Cue Column)\n• Apa definisi utama topik ini?\n• Bagaimana alur mekanisme/rumusnya?\n• Kapan metode ini tepat diterapkan?\n\n## 📝 Catatan Perkuliahan Rinci (Notes Column)\n• Poin 1: Penjelasan konsep secara mendalam.\n• Poin 2: Rumus matematis atau algoritma alur kerja.\n• Poin 3: Contoh studi kasus nyata.\n\n## 💡 Ringkasan Inti (Summary)\n> Tuliskan 2-3 kalimat esensial yang merangkum keseluruhan kuliah untuk persiapan cepat sebelum ujian.`;
    }

    if (editorMode === 'fast') {
      const merged = plainText.trim() ? `${plainText}\n\n${tplText}` : tplText;
      handlePlainChange(merged);
    } else if (editor) {
      const blocks = editor.tryParseMarkdownToBlocks(tplText);
      editor.replaceBlocks(editor.document, blocks);
      handleBlockChange();
    }
  };

  if (!note.id && !note.title) {
    return (
      <div onClick={onFocus} className={`flex-1 flex flex-col items-center justify-center text-zinc-500 h-full border-2 border-dashed rounded-3xl transition-all ${isActive ? 'border-primary/30 bg-primary/5' : 'border-zinc-800/50'}`}>
        <div className="w-16 h-16 bg-zinc-800/50 rounded-full flex items-center justify-center mb-4">
          <Edit2 size={24} className="opacity-50 text-zinc-400" />
        </div>
        <p className="text-sm font-medium text-zinc-400">Pilih atau buat catatan baru</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onFocus} 
      className={`flex flex-col h-full glass-panel rounded-[1.75rem] md:rounded-[2rem] overflow-hidden transition-all duration-300 relative shadow-2xl ${isActive ? 'ring-1 ring-primary/50 shadow-primary/10' : 'opacity-95 hover:opacity-100'}`}
    >
      <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
      
      {/* 🌟 Top Navigation Bar for Mobile & Desktop */}
      <div className="relative z-20 flex flex-col border-b border-white/10 bg-zinc-950/70 backdrop-blur-xl">
        {/* Cover Background if available */}
        {note.coverImage && (
          <div className={`relative h-24 sm:h-32 w-full overflow-hidden ${note.coverImage.startsWith('data:image') ? 'bg-zinc-900' : note.coverImage}`}>
            {note.coverImage.startsWith('data:image') && (
              <img src={note.coverImage} alt="Cover" className="w-full h-full object-cover object-center opacity-80" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/50 to-transparent"></div>
            <button 
              onClick={() => onUpdate({ ...note, coverImage: undefined })}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white/80 hover:text-white hover:bg-black/90 text-xs backdrop-blur-md"
              title="Hapus Cover"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Top Control Bar */}
        <div className="px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2">
          {/* Left: Mobile Back Button & Folder Selector */}
          <div className="flex items-center gap-2 min-w-0">
            {onBackToList && (
              <button 
                onClick={onBackToList}
                className="md:hidden flex items-center gap-1 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 px-2.5 py-1.5 rounded-xl transition-all active:scale-95 shrink-0"
              >
                <ArrowLeft size={15} />
                <span>Daftar</span>
              </button>
            )}

            {/* Folder Selector Badge */}
            <div className="flex items-center gap-1.5 bg-white/[0.06] hover:bg-white/[0.1] px-2.5 py-1.2 rounded-xl border border-white/10 text-xs text-zinc-300 transition-colors">
              <Folder size={12} className="text-primary shrink-0" />
              <select 
                className="bg-transparent border-none focus:ring-0 font-medium cursor-pointer text-white outline-none appearance-none pr-1 text-xs max-w-[120px] truncate"
                value={note.folder || ''} 
                onChange={(e) => onUpdate({ ...note, folder: e.target.value })}
              >
                <option value="" className="bg-zinc-900 text-white">Tanpa Folder</option>
                {folders.map(f => (
                  <option key={f} value={f} className="bg-zinc-900 text-white">{f}</option>
                ))}
              </select>
            </div>

            {/* Auto-save Status Indicator */}
            <div className="hidden sm:flex items-center gap-1 text-[11px] text-zinc-400 font-mono">
              {saveStatus === 'saving' ? (
                <span className="text-amber-400 animate-pulse flex items-center gap-1">
                  <Clock size={11} /> Menyimpan...
                </span>
              ) : (
                <span className="text-emerald-400/90 flex items-center gap-1">
                  <Check size={11} /> Tersimpan
                </span>
              )}
            </div>
          </div>

          {/* Right: Actions & Tools */}
          <div className="flex items-center gap-1.5">
            {/* Reading Mode Button */}
            <button
              onClick={() => setIsReadingMode(!isReadingMode)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                isReadingMode 
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm' 
                  : 'bg-white/5 text-zinc-300 hover:text-white hover:bg-white/10 border-white/5'
              }`}
              title={isReadingMode ? "Beralih ke Mode Edit" : "Buka Mode Baca Bersih (Untuk Belajar & Review)"}
            >
              <BookOpen size={13} className={isReadingMode ? "text-amber-400" : "text-zinc-400"} />
              <span className="text-[11px]">{isReadingMode ? 'Mode Edit' : 'Mode Baca'}</span>
            </button>

            {/* Editor Mode Switcher (Fast Mode vs Block Mode) */}
            {!isReadingMode && (
              <button
                onClick={toggleEditorMode}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  editorMode === 'fast' 
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' 
                    : 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                }`}
                title={editorMode === 'fast' ? "Mode Cepat (Sentuh HP)" : "Mode Blok Visual"}
              >
                {editorMode === 'fast' ? <Zap size={13} className="text-emerald-400" /> : <LayoutTemplate size={13} className="text-indigo-400" />}
                <span className="text-[11px]">{editorMode === 'fast' ? 'Mode Cepat' : 'Mode Blok'}</span>
              </button>
            )}

            {/* AI Assistant Menu Button */}
            <div className="flex items-center rounded-xl bg-purple-500/15 border border-purple-500/30 p-0.5">
              <button 
                onClick={() => setShowAiModal(true)} 
                disabled={isAiLoading} 
                className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 text-purple-300 hover:text-white hover:bg-purple-500/25 rounded-lg transition-all active:scale-95 disabled:opacity-50 font-medium" 
                title="Buka Menu Asisten Catatan AI (Cornell, Ringkasan, Kuis Active Recall, dll.)"
              >
                <Sparkles size={13} className={isAiLoading ? 'animate-spin text-purple-400' : 'text-purple-400'} />
                <span className="text-[11px] sm:text-xs font-semibold">AI Catatan</span>
              </button>
              <button
                onClick={handleQuickImprove}
                disabled={isAiLoading}
                className="hidden sm:flex items-center px-1.5 py-1 text-purple-300/80 hover:text-white hover:bg-purple-500/25 rounded-lg transition-colors text-[11px]"
                title="1-Klik Rapikan Kilat (Ejaan PUEBI, Heading & Istilah Kunci)"
              >
                ⚡ Rapikan
              </button>
            </div>

            {/* Pin Button */}
            <button 
              onClick={() => onUpdate({ ...note, isPinned: !note.isPinned })} 
              className={`p-1.5 sm:p-2 rounded-xl transition-colors ${note.isPinned ? 'text-amber-400 bg-amber-400/20' : 'text-zinc-400 hover:text-white hover:bg-white/10'}`} 
              title={note.isPinned ? "Lepas Pin" : "Sematkan Catatan"}
            >
              <Pin size={15} className={note.isPinned ? "fill-current" : ""} />
            </button>

            {/* Save Manual */}
            <button 
              onClick={onSave} 
              className="p-1.5 sm:p-2 bg-primary/20 text-primary hover:bg-primary/30 rounded-xl border border-primary/30 transition-colors" 
              title="Simpan Catatan"
            >
              <Save size={15} />
            </button>

            {/* More Menu for Mobile/Desktop */}
            <div className="relative">
              <button 
                onClick={() => setShowMoreMenu(!showMoreMenu)} 
                className="p-1.5 sm:p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                title="Opsi Tambahan"
              >
                <MoreVertical size={15} />
              </button>

              {showMoreMenu && (
                <div className="absolute top-10 right-0 w-52 bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl p-1.5 z-50 flex flex-col gap-1 text-xs animate-scale-up">
                  <button 
                    onClick={() => { setShowEmojiPicker(true); setShowMoreMenu(false); }}
                    className="flex items-center gap-2 px-3 py-2 text-zinc-300 hover:text-white hover:bg-white/5 rounded-xl text-left"
                  >
                    <Smile size={14} className="text-amber-400" />
                    <span>Pilih Ikon Emoji</span>
                  </button>
                  <button 
                    onClick={() => { setShowColorPicker(true); setShowMoreMenu(false); }}
                    className="flex items-center gap-2 px-3 py-2 text-zinc-300 hover:text-white hover:bg-white/5 rounded-xl text-left"
                  >
                    <Palette size={14} className="text-emerald-400" />
                    <span>Warna Aksen Catatan</span>
                  </button>
                  <button 
                    onClick={() => { setShowCoverPicker(true); setShowMoreMenu(false); }}
                    className="flex items-center gap-2 px-3 py-2 text-zinc-300 hover:text-white hover:bg-white/5 rounded-xl text-left"
                  >
                    <ImageIcon size={14} className="text-blue-400" />
                    <span>Ubah Banner / Cover</span>
                  </button>
                  {onDuplicate && (
                    <button 
                      onClick={() => { onDuplicate(); setShowMoreMenu(false); }}
                      className="flex items-center gap-2 px-3 py-2 text-zinc-300 hover:text-white hover:bg-white/5 rounded-xl text-left"
                    >
                      <Layers size={14} className="text-indigo-400" />
                      <span>Duplikasi Catatan</span>
                    </button>
                  )}
                  <button 
                    onClick={() => { handlePrintNote(); setShowMoreMenu(false); }}
                    className="flex items-center gap-2 px-3 py-2 text-zinc-300 hover:text-white hover:bg-white/5 rounded-xl text-left"
                  >
                    <Printer size={14} className="text-rose-400" />
                    <span>Cetak / Simpan PDF</span>
                  </button>
                  <button 
                    onClick={() => { setShowExportModal(true); setShowMoreMenu(false); }}
                    className="flex items-center gap-2 px-3 py-2 text-zinc-300 hover:text-white hover:bg-white/5 rounded-xl text-left"
                  >
                    <FileDown size={14} className="text-cyan-400" />
                    <span>Ekspor (.md, .html, .txt)</span>
                  </button>
                  <button 
                    onClick={async () => {
                      const text = editorMode === 'fast' 
                        ? plainText 
                        : (editor?.document ? editor.document.map(b => extractTextFromBlock(b)).join("\n") : '');
                      await navigator.clipboard.writeText(text);
                      setAiSuccessToast('Isi catatan berhasil disalin ke clipboard!');
                      setShowMoreMenu(false);
                    }}
                    className="flex items-center gap-2 px-3 py-2 text-zinc-300 hover:text-white hover:bg-white/5 rounded-xl text-left"
                  >
                    <Copy size={14} className="text-emerald-400" />
                    <span>Salin Semua Teks</span>
                  </button>
                  <div className="h-px bg-white/10 my-1"></div>
                  <button 
                    onClick={() => { onDelete(); setShowMoreMenu(false); }}
                    className="flex items-center gap-2 px-3 py-2 text-red-400 hover:bg-red-500/10 rounded-xl text-left"
                  >
                    <Trash2 size={14} />
                    <span>Hapus Catatan</span>
                  </button>
                </div>
              )}
            </div>

            {isSplitView && onClose && (
              <button onClick={onClose} className="p-1.5 text-zinc-400 hover:text-white rounded-xl transition-colors" title="Tutup Split">
                <X size={15} />
              </button>
            )}
          </div>
        </div>

        {/* Emoji & Cover Pickers Popup */}
        {showEmojiPicker && (
          <div className="absolute top-12 left-4 bg-zinc-900 border border-white/15 p-3 rounded-2xl shadow-2xl z-50 grid grid-cols-5 gap-2 w-56 animate-scale-up">
            {EMOJIS.map(e => (
              <button 
                key={e} 
                onClick={() => { onUpdate({ ...note, icon: e }); setShowEmojiPicker(false); }} 
                className="text-2xl hover:bg-zinc-800 rounded-xl p-1.5 transition-colors flex items-center justify-center"
              >
                {e}
              </button>
            ))}
            <button 
              onClick={() => { onUpdate({ ...note, icon: undefined }); setShowEmojiPicker(false); }} 
              className="col-span-5 text-center text-xs text-red-400 hover:bg-red-500/10 py-1.5 rounded-lg mt-1"
            >
              Hapus Ikon
            </button>
          </div>
        )}

        {/* Color Accent Picker Popup */}
        {showColorPicker && (
          <div className="absolute top-12 right-12 bg-zinc-900 border border-white/15 p-3 rounded-2xl shadow-2xl z-50 flex flex-col gap-2 w-60 animate-scale-up">
            <span className="text-[11px] font-bold text-zinc-400">Pilih Tema & Warna Aksen:</span>
            <div className="grid grid-cols-1 gap-1.5 max-h-56 overflow-y-auto custom-scrollbar">
              {Object.entries(NOTE_ACCENTS).map(([key, accent]) => (
                <button
                  key={key}
                  onClick={() => { onUpdate({ ...note, color: key }); setShowColorPicker(false); }}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all border ${
                    (note.color || 'default') === key 
                      ? `${accent.badge} border-white/30 font-bold` 
                      : 'bg-zinc-800/60 border-white/5 text-zinc-300 hover:bg-zinc-700/80'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${accent.dot}`} />
                    <span>{accent.name}</span>
                  </div>
                  {(note.color || 'default') === key && <Check size={12} className="text-white" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {showCoverPicker && (
          <div className="absolute top-12 right-4 bg-zinc-900 border border-white/15 p-3 rounded-2xl shadow-2xl z-50 flex flex-col gap-2 w-56 animate-scale-up">
            <span className="text-[11px] font-bold text-zinc-400">Pilih Warna Banner:</span>
            <div className="flex flex-wrap gap-2">
              {COVERS.map(c => (
                <button 
                  key={c} 
                  onClick={() => { onUpdate({ ...note, coverImage: c }); setShowCoverPicker(false); }} 
                  className={`w-7 h-7 rounded-xl ${c} ring-2 ring-transparent hover:ring-white transition-all`} 
                />
              ))}
            </div>
            <div className="w-full h-px bg-white/10 my-1"></div>
            <button 
              onClick={() => fileInputRef.current?.click()} 
              className="flex items-center justify-center gap-2 text-xs text-white bg-zinc-800 hover:bg-zinc-700 rounded-xl p-2 transition-colors w-full"
            >
              <ImageIcon size={13} /> Upload Foto Banner
            </button>
          </div>
        )}

        {/* Note Title & Icon Input Area */}
        <div className="px-4 sm:px-6 pt-2 pb-3 flex items-start gap-3">
          {/* Note Icon Trigger */}
          <button 
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-zinc-800/80 hover:bg-zinc-700/80 border border-white/10 flex items-center justify-center text-xl sm:text-2xl shrink-0 shadow-md transition-transform active:scale-95"
            title="Ubah Ikon"
          >
            {note.icon || '📝'}
          </button>

          <div className="flex-1 min-w-0">
            <input 
              className="bg-transparent text-xl sm:text-2xl md:text-3xl font-bold text-white focus:outline-none w-full placeholder:text-zinc-600 leading-tight" 
              value={note.title || ''} 
              onChange={e => onUpdate({ ...note, title: e.target.value })} 
              placeholder="Judul Catatan..." 
            />
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-mono text-zinc-500">{note.date || new Date().toLocaleString()}</span>
              {note.isPinned && (
                <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-medium border border-amber-500/30">
                  Disematkan
                </span>
              )}
            </div>

            {/* Tags & Accent Ribbon */}
            <div className="flex items-center gap-1.5 flex-wrap mt-2.5">
              {/* Course Selector Dropdown */}
              {courses && courses.length > 0 && (
                <div className="flex items-center gap-1 bg-white/[0.04] hover:bg-white/[0.08] px-2 py-0.5 rounded-md border border-white/10 text-[10px]">
                  <BookOpen size={10} className="text-primary shrink-0" />
                  <select
                    value={note.courseId || ''}
                    onChange={(e) => onUpdate({ ...note, courseId: e.target.value || undefined, updatedAt: Date.now() })}
                    className="bg-transparent text-zinc-300 focus:outline-none cursor-pointer max-w-[130px] truncate"
                    title="Hubungkan catatan ke Mata Kuliah"
                    aria-label="Mata Kuliah Catatan"
                  >
                    <option value="" className="bg-zinc-900 text-zinc-400">Pilih Matkul...</option>
                    {courses.map((c: any) => (
                      <option key={c.id} value={c.id} className="bg-zinc-900 text-white">{c.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Note Accent Badge */}
              <button
                type="button"
                onClick={() => setShowColorPicker(!showColorPicker)}
                className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md border font-medium transition-colors ${currentAccent.badge}`}
                title="Ganti warna tema catatan"
              >
                <span className={`w-2 h-2 rounded-full ${currentAccent.dot}`}></span>
                <span>{currentAccent.name}</span>
              </button>

              {/* Tag Pills */}
              {(note.tags || []).map(t => (
                <span 
                  key={t}
                  className="group flex items-center gap-1 text-[11px] bg-white/[0.07] hover:bg-white/[0.12] text-zinc-300 px-2 py-0.5 rounded-md border border-white/10 transition-colors"
                >
                  <Tag size={10} className="text-primary" />
                  <span>#{t}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(t)}
                    className="opacity-60 hover:opacity-100 hover:text-red-400 ml-0.5"
                    title={`Hapus tag #${t}`}
                  >
                    <X size={10} />
                  </button>
                </span>
              ))}

              {/* Add Tag Input or Button */}
              {isAddingTag ? (
                <div className="flex items-center gap-1 bg-zinc-900 border border-primary/50 rounded-md px-1.5 py-0.5">
                  <span className="text-[11px] text-primary font-bold">#</span>
                  <input
                    type="text"
                    autoFocus
                    placeholder="nama tag..."
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag(newTagInput);
                      } else if (e.key === 'Escape') {
                        setIsAddingTag(false);
                      }
                    }}
                    onBlur={() => {
                      if (newTagInput.trim()) {
                        handleAddTag(newTagInput);
                      } else {
                        setIsAddingTag(false);
                      }
                    }}
                    className="bg-transparent text-[11px] text-white focus:outline-none w-20 placeholder:text-zinc-500"
                  />
                  <button 
                    type="button"
                    onClick={() => handleAddTag(newTagInput)}
                    className="text-primary hover:text-white text-[10px]"
                  >
                    <Check size={11} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAddingTag(true)}
                  className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-zinc-200 bg-white/[0.04] hover:bg-white/[0.08] px-2 py-0.5 rounded-md border border-dashed border-white/15 transition-colors"
                  title="Tambah Tag baru"
                >
                  <Plus size={10} />
                  <span>Tag</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ✨ AI Toast & Undo Banner */}
        {aiSuccessToast && (
          <div className="mx-4 sm:mx-6 my-2 p-3 bg-gradient-to-r from-purple-950/70 to-indigo-950/70 border border-purple-500/30 rounded-2xl flex items-center justify-between gap-3 text-xs shadow-lg animate-fade-in">
            <div className="flex items-center gap-2 text-purple-200">
              <Sparkles size={15} className="text-purple-400 shrink-0" />
              <span className="font-medium">{aiSuccessToast}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {lastNoteBackup && (
                <button
                  onClick={handleUndoAi}
                  className="flex items-center gap-1 px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors font-medium text-[11px]"
                  title="Batalkan perubahan dan kembalikan isi catatan sebelumnya"
                >
                  <RotateCcw size={12} />
                  <span>Batalkan (Undo)</span>
                </button>
              )}
              <button
                onClick={() => setAiSuccessToast(null)}
                className="p-1 text-zinc-400 hover:text-white rounded-md transition-colors"
                title="Tutup Notifikasi"
              >
                <X size={13} />
              </button>
            </div>
          </div>
        )}

        {/* ⚠️ AI Error / Notice Toast */}
        {aiErrorToast && (
          <div className="mx-4 sm:mx-6 my-2 p-3 bg-red-950/80 border border-red-500/40 rounded-2xl flex items-center justify-between gap-3 text-xs shadow-lg animate-fade-in text-red-200">
            <div className="flex items-center gap-2">
              <AlertCircle size={15} className="text-red-400 shrink-0" />
              <span className="font-medium">{aiErrorToast}</span>
            </div>
            <button
              onClick={() => setAiErrorToast(null)}
              className="p-1 text-red-300 hover:text-white rounded-md transition-colors shrink-0"
              title="Tutup Pesan"
            >
              <X size={13} />
            </button>
          </div>
        )}
      </div>

      {/* 📝 Quick Templates Ribbon (Shown when note is empty or on demand) */}
      {((editorMode === 'fast' && !plainText.trim()) || (editorMode === 'block' && isReady)) && (
        <div className="px-4 sm:px-6 py-2 bg-white/[0.02] border-b border-white/5 flex items-center gap-1.5 overflow-x-auto custom-scrollbar shrink-0 text-xs">
          <span className="text-zinc-400 text-[11px] font-medium shrink-0 flex items-center gap-1 mr-1">
            <LayoutTemplate size={12} className="text-primary" /> Template:
          </span>
          <button onClick={() => applyTemplate('study')} className="px-2.5 py-1 bg-zinc-800/70 hover:bg-zinc-700 text-zinc-200 rounded-lg shrink-0 transition-colors border border-white/5 text-[11px] flex items-center gap-1">
            🎓 Kuliah
          </button>
          <button onClick={() => applyTemplate('cornell')} className="px-2.5 py-1 bg-indigo-900/40 hover:bg-indigo-800/60 text-indigo-200 rounded-lg shrink-0 transition-colors border border-indigo-500/30 text-[11px] flex items-center gap-1 font-medium">
            📌 Cornell
          </button>
          <button onClick={() => applyTemplate('lab')} className="px-2.5 py-1 bg-cyan-900/40 hover:bg-cyan-800/60 text-cyan-200 rounded-lg shrink-0 transition-colors border border-cyan-500/30 text-[11px] flex items-center gap-1">
            🔬 Praktikum
          </button>
          <button onClick={() => applyTemplate('resume')} className="px-2.5 py-1 bg-amber-900/40 hover:bg-amber-800/60 text-amber-200 rounded-lg shrink-0 transition-colors border border-amber-500/30 text-[11px] flex items-center gap-1">
            📚 Resume Paper
          </button>
          <button onClick={() => applyTemplate('thesis')} className="px-2.5 py-1 bg-purple-900/40 hover:bg-purple-800/60 text-purple-200 rounded-lg shrink-0 transition-colors border border-purple-500/30 text-[11px] flex items-center gap-1">
            🎯 Skripsi
          </button>
          <button onClick={() => applyTemplate('todo')} className="px-2.5 py-1 bg-zinc-800/70 hover:bg-zinc-700 text-zinc-300 rounded-lg shrink-0 transition-colors border border-white/5 text-[11px] flex items-center gap-1">
            ✅ To-Do
          </button>
          <button onClick={() => applyTemplate('meeting')} className="px-2.5 py-1 bg-zinc-800/70 hover:bg-zinc-700 text-zinc-300 rounded-lg shrink-0 transition-colors border border-white/5 text-[11px] flex items-center gap-1">
            👥 Notula
          </button>
          <button onClick={() => applyTemplate('journal')} className="px-2.5 py-1 bg-zinc-800/70 hover:bg-zinc-700 text-zinc-300 rounded-lg shrink-0 transition-colors border border-white/5 text-[11px] flex items-center gap-1">
            📖 Jurnal
          </button>
        </div>
      )}

      {/* 📱 MOBILE QUICK TOUCH TOOLBAR (Pinned above writing area in Fast Mode) */}
      {editorMode === 'fast' && (
        <div className="sticky top-0 z-30 px-3 py-1.5 bg-zinc-900/95 backdrop-blur-md border-b border-white/10 flex items-center gap-1.5 overflow-x-auto custom-scrollbar shrink-0 shadow-md">
          <button 
            type="button"
            onClick={() => insertLinePrefix('- [ ] ')}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold shrink-0 border border-white/5 active:scale-95"
            title="Tambah Checklist"
          >
            <CheckSquare size={13} className="text-emerald-400" />
            <span>To-Do</span>
          </button>

          <button 
            type="button"
            onClick={() => insertLinePrefix('• ')}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold shrink-0 border border-white/5 active:scale-95"
            title="Poin Bullet"
          >
            <List size={13} className="text-blue-400" />
            <span>Bullet</span>
          </button>

          <button 
            type="button"
            onClick={() => insertLinePrefix('1. ')}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold shrink-0 border border-white/5 active:scale-95"
            title="Daftar Nomor"
          >
            <ListOrdered size={13} className="text-orange-400" />
            <span>Nomor</span>
          </button>

          <div className="w-px h-4 bg-white/15 shrink-0 mx-0.5"></div>

          <button 
            type="button"
            onClick={() => insertLinePrefix('## ')}
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold shrink-0 border border-white/5 active:scale-95"
            title="Heading 2"
          >
            H2
          </button>

          <button 
            type="button"
            onClick={() => insertFormatting('**', '**', 'teks tebal')}
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold shrink-0 border border-white/5 active:scale-95"
            title="Tebal (Bold)"
          >
            <Bold size={13} />
          </button>

          <button 
            type="button"
            onClick={() => insertFormatting('*', '*', 'teks miring')}
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold shrink-0 border border-white/5 active:scale-95"
            title="Miring (Italic)"
          >
            <Italic size={13} />
          </button>

          <button 
            type="button"
            onClick={() => insertLinePrefix('> ')}
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold shrink-0 border border-white/5 active:scale-95"
            title="Kutipan / Quote"
          >
            <Quote size={13} />
          </button>

          <button 
            type="button"
            onClick={() => {
              const tableMarkdown = '\n\n| Kolom 1 | Kolom 2 |\n| :--- | :--- |\n| Data 1 | Data 2 |\n| Data 3 | Data 4 |\n\n';
              const textarea = textareaRef.current;
              if (!textarea) {
                handlePlainChange(plainText + tableMarkdown);
                return;
              }
              const start = textarea.selectionStart;
              const end = textarea.selectionEnd;
              const newText = plainText.substring(0, start) + tableMarkdown + plainText.substring(end);
              handlePlainChange(newText);
              setTimeout(() => {
                textarea.focus();
                const newPos = start + tableMarkdown.length;
                textarea.setSelectionRange(newPos, newPos);
              }, 30);
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold shrink-0 border border-white/5 active:scale-95"
            title="Sisipkan Tabel"
          >
            <TableIcon size={13} className="text-cyan-400" />
            <span>Tabel</span>
          </button>

          {/* Voice to Text Button */}
          {speechSupported && (
            <>
              <div className="w-px h-4 bg-white/15 shrink-0 mx-0.5"></div>
              <button 
                type="button"
                onClick={toggleVoiceRecording}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 border transition-all active:scale-95 ${
                  isVoiceRecording 
                    ? 'bg-red-500 text-white border-red-400 animate-pulse shadow-lg shadow-red-500/40' 
                    : 'bg-primary/20 text-primary border-primary/30 hover:bg-primary/30'
                }`}
                title={isVoiceRecording ? "Hentikan Dikte Suara" : "Dikte Suara (Bicara untuk Menulis)"}
              >
                {isVoiceRecording ? <MicOff size={13} /> : <Mic size={13} />}
                <span>{isVoiceRecording ? 'Mendengarkan...' : 'Dikte Suara'}</span>
              </button>
            </>
          )}
        </div>
      )}

      {/* ✍️ Main Editor Body */}
      <div className="flex-1 bg-transparent overflow-y-auto relative editor-scroll p-4 sm:p-6 md:p-8">
        {isReadingMode ? (
          <div className="max-w-3xl mx-auto py-2">
            <div className="flex items-center justify-between pb-3 mb-6 border-b border-white/10 text-xs text-zinc-400">
              <span className="flex items-center gap-1.5 text-amber-400 font-medium">
                <BookOpen size={14} /> Mode Baca Bersih (Read-Only)
              </span>
              <button
                type="button"
                onClick={() => setIsReadingMode(false)}
                className="text-primary hover:underline font-semibold flex items-center gap-1"
              >
                Kembali ke Mode Edit
              </button>
            </div>
            <article className="prose prose-invert prose-zinc max-w-none prose-headings:text-white prose-p:text-zinc-200 prose-li:text-zinc-200 prose-blockquote:border-l-primary prose-blockquote:bg-white/[0.03] prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-xl prose-table:border-white/10 prose-th:bg-zinc-900 prose-th:text-white prose-td:border-white/10 prose-code:text-primary prose-code:bg-white/5 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md leading-relaxed text-base sm:text-lg">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {plainText || '*(Catatan masih kosong)*'}
              </ReactMarkdown>
            </article>
          </div>
        ) : editorMode === 'fast' ? (
          <div className="min-h-full flex flex-col">
            <textarea
              ref={textareaRef}
              value={plainText}
              onChange={(e) => handlePlainChange(e.target.value)}
              placeholder="Tulis catatan kuliah, tugas, atau ide di sini... (Dukung format Markdown, tabel | Kolom 1 | Kolom 2 |, checklist [ ], dan bullet •)"
              className="w-full flex-1 min-h-[350px] bg-transparent text-zinc-100 placeholder:text-zinc-600 focus:outline-none resize-none font-sans text-base sm:text-lg leading-relaxed selection:bg-primary/30"
              autoCapitalize="sentences"
              autoComplete="on"
              autoCorrect="on"
              spellCheck="true"
            />
          </div>
        ) : (
          <div>
            {isReady && (
              <BlockNoteErrorBoundary onSwitchToFastMode={() => setEditorMode('fast')}>
                <BlockNoteView 
                  editor={editor} 
                  onChange={handleBlockChange} 
                  theme="dark" 
                  className="min-h-full" 
                />
              </BlockNoteErrorBoundary>
            )}
          </div>
        )}
      </div>
      
      {/* 📊 Footer Stats & Shortcut Reminder */}
      <div className="px-4 sm:px-6 py-2.5 border-t border-white/5 text-[11px] text-zinc-500 bg-zinc-950/60 backdrop-blur-md flex justify-between items-center select-none shrink-0">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5"><FileText size={11}/> {wordCount} Kata</span>
          <span className="flex items-center gap-1.5"><Clock size={11}/> ~{Math.max(1, Math.ceil(wordCount / 200))} mnt baca</span>
        </div>
        <div className="text-[10px] text-zinc-400">
          {editorMode === 'fast' ? '⚡ Mode Cepat Aktif' : '🧱 Mode Blok Notion'}
        </div>
      </div>

      {/* 🚀 AI Modal Dialog */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in">
          <div className="bg-zinc-900 border border-white/15 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-zinc-850/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500/30 to-indigo-500/30 border border-purple-500/30 flex items-center justify-center text-purple-300 shadow-inner">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base flex items-center gap-2">
                    Asisten Catatan AI
                    <span className="text-[10px] bg-purple-500/25 text-purple-200 border border-purple-500/30 px-2 py-0.5 rounded-full font-mono">
                      Gemini 3.8 Flash
                    </span>
                  </h3>
                  <p className="text-xs text-zinc-400">Pilih format pengolahan cerdas untuk menyempurnakan catatan Anda</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAiModal(false)}
                className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
                title="Tutup"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 custom-scrollbar">
              {/* Placement Selector */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-zinc-800/40 rounded-2xl border border-white/5">
                <span className="text-xs text-zinc-300 font-medium">Penempatan Hasil:</span>
                <div className="flex bg-zinc-900/90 p-1 rounded-xl border border-white/10 text-xs">
                  <button
                    type="button"
                    onClick={() => setAiPlacementMode('replace')}
                    className={`px-3 py-1.5 rounded-lg transition-all font-medium ${
                      aiPlacementMode === 'replace'
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Ganti Isi Catatan
                  </button>
                  <button
                    type="button"
                    onClick={() => setAiPlacementMode('append')}
                    className={`px-3 py-1.5 rounded-lg transition-all font-medium ${
                      aiPlacementMode === 'append'
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Sisipkan di Bagian Bawah
                  </button>
                </div>
              </div>

              {/* Action Preset Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {AI_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      if (preset.id === 'custom') {
                        setShowCustomInput(true);
                      } else {
                        handleAiAction(preset.id as any);
                      }
                    }}
                    className="p-3.5 rounded-2xl bg-zinc-800/40 hover:bg-zinc-800/80 border border-white/5 hover:border-purple-500/40 text-left transition-all hover:scale-[1.01] active:scale-[0.99] group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-8 h-8 rounded-xl bg-zinc-700/50 border border-white/5 flex items-center justify-center text-purple-400 group-hover:bg-purple-500/20 group-hover:text-purple-300 transition-colors">
                          {preset.icon}
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${preset.badgeStyle}`}>
                          {preset.badge}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white mb-1 group-hover:text-purple-300 transition-colors">
                        {preset.title}
                      </h4>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        {preset.desc}
                      </p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Custom Prompt Textarea */}
              {showCustomInput && (
                <div className="p-4 bg-zinc-800/60 border border-purple-500/30 rounded-2xl space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Wand2 size={13} />
                      Instruksi Khusus
                    </label>
                    <button 
                      type="button"
                      onClick={() => setShowCustomInput(false)}
                      className="text-xs text-zinc-400 hover:text-white"
                    >
                      Batal
                    </button>
                  </div>
                  <textarea
                    value={customPromptText}
                    onChange={(e) => setCustomPromptText(e.target.value)}
                    placeholder="Contoh: Susun dalam bentuk tabel perbandingan kelebihan dan kekurangan, lalu buat 3 kesimpulan utama..."
                    className="w-full h-24 bg-zinc-900 border border-white/10 rounded-xl p-3 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-purple-500 transition-colors resize-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (customPromptText.trim()) {
                        handleAiAction('custom', customPromptText);
                      }
                    }}
                    disabled={!customPromptText.trim()}
                    className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
                  >
                    Jalankan Instruksi Khusus
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 📥 Note Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in">
          <div className="bg-zinc-900 border border-white/15 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col p-6 animate-scale-up">
            <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-white/10">
              <div className="flex items-center gap-2 text-white">
                <FileDown size={20} className="text-cyan-400" />
                <h3 className="font-bold text-base">Ekspor & Simpan Catatan</h3>
              </div>
              <button 
                type="button"
                onClick={() => setShowExportModal(false)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            
            <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
              Pilih format berkas untuk mengekspor atau mencetak catatan <strong>"{note.title || 'Catatan'}"</strong>:
            </p>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => { downloadAs('md'); setShowExportModal(false); }}
                className="w-full flex items-center justify-between p-3 bg-zinc-800/60 hover:bg-zinc-700/80 border border-white/10 rounded-2xl text-left transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
                    .MD
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white group-hover:text-primary transition-colors">Markdown (.md)</h4>
                    <p className="text-[10px] text-zinc-400">Kompatibel dengan Obsidian, Notion, GitHub</p>
                  </div>
                </div>
                <Download size={14} className="text-zinc-500 group-hover:text-white transition-colors" />
              </button>

              <button
                type="button"
                onClick={() => { downloadAs('html'); setShowExportModal(false); }}
                className="w-full flex items-center justify-between p-3 bg-zinc-800/60 hover:bg-zinc-700/80 border border-white/10 rounded-2xl text-left transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs">
                    .HTML
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white group-hover:text-primary transition-colors">Halaman Web (.html)</h4>
                    <p className="text-[10px] text-zinc-400">Format bersih yang bisa dibuka di browser apa saja</p>
                  </div>
                </div>
                <Download size={14} className="text-zinc-500 group-hover:text-white transition-colors" />
              </button>

              <button
                type="button"
                onClick={() => { downloadAs('txt'); setShowExportModal(false); }}
                className="w-full flex items-center justify-between p-3 bg-zinc-800/60 hover:bg-zinc-700/80 border border-white/10 rounded-2xl text-left transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                    .TXT
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white group-hover:text-primary transition-colors">Teks Polos (.txt)</h4>
                    <p className="text-[10px] text-zinc-400">Teks polos ringan tanpa formatting</p>
                  </div>
                </div>
                <Download size={14} className="text-zinc-500 group-hover:text-white transition-colors" />
              </button>

              <button
                type="button"
                onClick={() => { handlePrintNote(); setShowExportModal(false); }}
                className="w-full flex items-center justify-between p-3 bg-zinc-800/60 hover:bg-zinc-700/80 border border-white/10 rounded-2xl text-left transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-xs">
                    <Printer size={15} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white group-hover:text-primary transition-colors">Cetak atau Simpan PDF</h4>
                    <p className="text-[10px] text-zinc-400">Format siap cetak rapi dengan layout A4</p>
                  </div>
                </div>
                <Printer size={14} className="text-zinc-500 group-hover:text-white transition-colors" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating AI Loading Spinner */}
      {isAiLoading && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-zinc-900/95 border border-purple-500/40 rounded-2xl shadow-2xl backdrop-blur-md animate-fade-in text-xs text-white">
          <Sparkles className="animate-spin text-purple-400 shrink-0" size={20} />
          <div>
            <p className="font-semibold text-purple-200">AI Sedang Bekerja...</p>
            <p className="text-[11px] text-zinc-400">{aiCurrentTask}</p>
          </div>
        </div>
      )}
    </motion.div>
  );
};

interface NotesProps {
  notes: Note[];
  setNotes: React.Dispatch<React.SetStateAction<Note[]>> | ((notes: Note[] | ((prev: Note[]) => Note[])) => void);
  courses?: any[];
}

export const Notes: React.FC<NotesProps> = ({ notes, setNotes, courses = [] }) => {
  const [folders, setFolders] = useState<string[]>([]);
  const allFolders = Array.from(new Set([...folders, ...courses.map(c => c.name)]));
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [showFolderInput, setShowFolderInput] = useState(false);
  const [isSplitMode, setIsSplitMode] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [activePane, setActivePane] = useState<'left' | 'right'>('left');
  const [leftNoteId, setLeftNoteId] = useState<string | null>(null);
  const [leftEditData, setLeftEditData] = useState<Partial<Note>>({});
  const [rightNoteId, setRightNoteId] = useState<string | null>(null);
  const [rightEditData, setRightEditData] = useState<Partial<Note>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  const allTags = Array.from(new Set(notes.flatMap(n => n.tags || []))).sort();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const savedFolders = StorageService.getItem<string[]>('note_folders', ['Kuliah', 'Pribadi', 'Tugas', 'Ide']);
    setFolders(savedFolders);
  }, []);

  // Auto-save logic
  useEffect(() => {
    const timeoutLeft = setTimeout(() => {
      if (leftNoteId && leftEditData.title !== undefined) saveNote('left');
    }, 1500);
    return () => clearTimeout(timeoutLeft);
  }, [leftEditData.title, leftEditData.content, leftEditData.folder, leftEditData.isPinned, leftEditData.icon, leftEditData.coverImage, leftEditData.color, leftEditData.tags]);

  useEffect(() => {
    const timeoutRight = setTimeout(() => {
      if (rightNoteId && rightEditData.title !== undefined) saveNote('right');
    }, 1500);
    return () => clearTimeout(timeoutRight);
  }, [rightEditData.title, rightEditData.content, rightEditData.folder, rightEditData.isPinned, rightEditData.icon, rightEditData.coverImage, rightEditData.color, rightEditData.tags]);

  const addFolder = () => {
    if (newFolderName && !folders.includes(newFolderName)) {
      const updated = [...folders, newFolderName];
      setFolders(updated);
      StorageService.setItem('note_folders', updated);
      setNewFolderName('');
      setShowFolderInput(false);
    }
  };

  const selectNote = (note: Note) => {
    if (activePane === 'left') {
      if (leftNoteId && leftNoteId !== note.id && leftEditData.title !== undefined) {
        saveNote('left');
      }
      setLeftNoteId(note.id);
      setLeftEditData({ ...note });
    } else {
      if (rightNoteId && rightNoteId !== note.id && rightEditData.title !== undefined) {
        saveNote('right');
      }
      setRightNoteId(note.id);
      setRightEditData({ ...note });
    }
  };

  const createNote = () => {
    const dateStr = new Date().toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const newNote: Note = { 
      id: StorageService.generateId(), 
      title: '', 
      content: '', 
      date: dateStr, 
      tags: selectedTag ? [selectedTag] : [], 
      folder: currentFolder || undefined,
      icon: '📝',
      color: 'default'
    };
    
    setNotes(prev => {
      const updated = [newNote, ...prev];
      StorageService.setItem('notes', updated);
      return updated;
    });
    selectNote(newNote);
  };

  const duplicateNote = (pane: 'left' | 'right') => {
    const id = pane === 'left' ? leftNoteId : rightNoteId;
    const currentNote = notes.find(n => n.id === id);
    if (!currentNote) return;
    
    const dateStr = new Date().toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const duplicated: Note = {
      ...currentNote,
      id: StorageService.generateId(),
      title: `${currentNote.title || 'Catatan'} (Salinan)`,
      date: dateStr,
      isPinned: false
    };
    
    setNotes(prev => {
      const updated = [duplicated, ...prev];
      StorageService.setItem('notes', updated);
      return updated;
    });
    selectNote(duplicated);
  };

  const saveNote = (pane: 'left' | 'right') => {
    const id = pane === 'left' ? leftNoteId : rightNoteId;
    const data = pane === 'left' ? leftEditData : rightEditData;
    if (!id || data.title === undefined) return;
    const dateStr = new Date().toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    
    setNotes(prevNotes => {
      const updated = prevNotes.map(n => n.id === id ? { ...n, ...data, date: dateStr } : n);
      StorageService.setItem('notes', updated);
      return updated;
    });
    
    if (pane === 'left') setLeftEditData(prev => ({ ...prev, date: dateStr }));
    else setRightEditData(prev => ({ ...prev, date: dateStr }));
  };

  const deleteNote = (pane: 'left' | 'right') => {
    if (!confirm("Apakah Anda yakin ingin menghapus catatan ini?")) return;
    const id = pane === 'left' ? leftNoteId : rightNoteId;
    setNotes(prev => {
      const updated = prev.filter(n => n.id !== id);
      StorageService.setItem('notes', updated);
      return updated;
    });
    if (pane === 'left') { setLeftNoteId(null); setLeftEditData({}); }
    else { setRightNoteId(null); setRightEditData({}); }
  };

  const filteredNotes = notes
    .filter(n => {
      const matchesSearch = (n.title || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
        (n.content || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (n.tags || []).some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesFolder = currentFolder ? n.folder === currentFolder : true;
      const matchesTag = selectedTag ? (n.tags || []).includes(selectedTag) : true;
      return matchesSearch && matchesFolder && matchesTag;
    })
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

  return (
    <div className="min-h-full w-full flex flex-col md:flex-row gap-6 animate-fade-in pb-4">
      {/* 📚 Sidebar / Library List */}
      {!isFullScreen && (
        <div className={`w-full md:w-80 lg:w-96 flex-shrink-0 flex flex-col glass-panel rounded-[1.75rem] md:rounded-[2rem] overflow-hidden ${
          isSplitMode ? 'hidden lg:flex' : (leftNoteId ? 'hidden md:flex' : 'flex')
        }`}>
          {/* Library Header & Folders */}
          <div className="p-4 sm:p-5 border-b border-white/5 bg-black/10">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                <Folder size={14} className="text-primary"/> Folder Catatan
              </h3>
              <button 
                onClick={() => setShowFolderInput(!showFolderInput)} 
                className="text-primary hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
                title="Tambah Folder Baru"
              >
                <FolderPlus size={16} />
              </button>
            </div>
             
            {showFolderInput && (
              <div className="flex gap-2 mb-3 animate-slide-up">
                <input 
                  className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-primary" 
                  placeholder="Nama Folder..." 
                  value={newFolderName} 
                  onChange={e => setNewFolderName(e.target.value)} 
                  onKeyDown={e => e.key === 'Enter' && addFolder()} 
                  autoFocus 
                />
                <button onClick={addFolder} className="bg-primary px-3 rounded-xl text-white text-xs font-bold hover:bg-primary/90">
                  OK
                </button>
              </div>
            )}
             
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto custom-scrollbar">
              <button 
                onClick={() => setCurrentFolder(null)} 
                className={`text-[11px] px-3 py-1 rounded-full border transition-all ${
                  currentFolder === null 
                    ? 'bg-primary text-white border-primary font-bold shadow-md shadow-primary/20' 
                    : 'bg-transparent text-zinc-400 border-zinc-800 hover:border-zinc-600'
                }`}
              >
                Semua ({notes.length})
              </button>
              {allFolders.map(f => {
                const count = notes.filter(n => n.folder === f).length;
                const isCourseFolder = courses?.some(c => c.name === f);
                return (
                  <div key={f} className={`group flex items-center gap-1 rounded-full border transition-all ${
                    currentFolder === f 
                      ? 'bg-white text-black border-white font-bold' 
                      : 'bg-transparent text-zinc-400 border-zinc-800 hover:border-zinc-600'
                  }`}>
                    <button onClick={() => setCurrentFolder(f)} className="text-[11px] px-2.5 py-1">
                      {f} <span className="text-[9px] opacity-70">({count})</span>
                    </button>
                    {!isCourseFolder && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Hapus folder "${f}"? (Catatan di dalamnya tidak akan terhapus)`)) {
                            const updated = folders.filter(folder => folder !== f);
                            setFolders(updated);
                            StorageService.setItem('note_folders', updated);
                            if (currentFolder === f) setCurrentFolder(null);
                          }
                        }}
                        className={`pr-2 opacity-0 group-hover:opacity-100 transition-opacity ${currentFolder === f ? 'text-red-600 hover:text-red-800' : 'text-zinc-500 hover:text-red-400'}`}
                      >
                        <X size={10} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Tag Filter Chips */}
            {allTags.length > 0 && (
              <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
                <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider shrink-0 flex items-center gap-1">
                  <Tag size={10} className="text-primary" /> Tag:
                </span>
                {selectedTag && (
                  <button
                    onClick={() => setSelectedTag(null)}
                    className="text-[10px] bg-red-500/20 text-red-300 border border-red-500/30 px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1 hover:bg-red-500/30"
                  >
                    <span>Reset</span>
                    <X size={9} />
                  </button>
                )}
                {allTags.map(tag => {
                  const isTagActive = selectedTag === tag;
                  return (
                    <button
                      key={tag}
                      onClick={() => setSelectedTag(isTagActive ? null : tag)}
                      className={`text-[10px] px-2 py-0.5 rounded-full border shrink-0 transition-all ${
                        isTagActive
                          ? 'bg-primary text-white border-primary font-bold'
                          : 'bg-white/[0.04] text-zinc-400 border-white/10 hover:border-white/20 hover:text-zinc-200'
                      }`}
                    >
                      #{tag}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Search & Add New Note Bar */}
          <div className="flex flex-col flex-1 min-h-0 bg-zinc-900/20">
            <div className="flex items-center gap-2 p-3 sm:p-4 pb-2">
              <div className="relative flex-1 group">
                <Search className="absolute left-3 top-2.5 text-zinc-500 group-focus-within:text-primary transition-colors" size={14} />
                <input 
                  className="w-full bg-black/30 border border-white/5 text-white pl-9 pr-3 py-2 rounded-xl focus:outline-none focus:border-primary/50 text-xs sm:text-sm transition-all placeholder:text-zinc-600" 
                  placeholder="Cari catatan kuliah atau #tag..." 
                  value={searchTerm} 
                  onChange={e => setSearchTerm(e.target.value)} 
                />
              </div>
              <button 
                onClick={createNote} 
                className="bg-primary hover:bg-primary/90 text-white p-2 sm:p-2.5 rounded-xl shadow-lg shadow-primary/20 transition-transform active:scale-95 flex items-center justify-center shrink-0"
                title="Catatan Baru"
              >
                <Plus size={18} />
              </button>
            </div>
            
            {/* Note Cards List */}
            <div className="flex-1 overflow-y-auto space-y-2 p-3 sm:p-4 custom-scrollbar">
              <AnimatePresence>
                {filteredNotes.map(note => {
                  const plainSnippet = parseBlocksToPlainText(note.content);
                  const isSelected = note.id === leftNoteId || note.id === rightNoteId;
                  const accent = NOTE_ACCENTS[note.color || 'default'] || NOTE_ACCENTS.default;
                  return (
                    <motion.div 
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      key={note.id} 
                      onClick={() => selectNote(note)} 
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all group relative overflow-hidden ${
                        isSelected 
                          ? 'bg-white/10 border-primary/40 shadow-lg shadow-primary/5' 
                          : 'bg-black/20 border-white/5 hover:bg-white/5 hover:border-white/10'
                      }`}
                    >
                      {/* Left color bar indicator */}
                      {note.color && note.color !== 'default' && (
                        <div className={`absolute top-0 left-0 bottom-0 w-1 ${accent.dot}`} />
                      )}

                      <div className="flex justify-between items-start mb-1.5 gap-2">
                        <h4 className={`font-bold truncate text-sm flex-1 flex items-center gap-1.5 ${isSelected ? 'text-white' : 'text-zinc-200 group-hover:text-white'}`}>
                          <span>{note.icon || '📝'}</span>
                          <span className="truncate">{note.title || 'Tanpa Judul'}</span>
                        </h4>
                        <div className="flex items-center gap-1 shrink-0">
                          {note.isPinned && <Pin size={11} className="text-amber-400 fill-amber-400" />}
                          {note.courseId && (
                            <span className="text-[9px] bg-primary/15 text-primary px-1.5 py-0.5 rounded-md max-w-[90px] truncate border border-primary/20 font-medium">
                              {courses.find((c: any) => c.id === note.courseId)?.name || 'Matkul'}
                            </span>
                          )}
                          {note.folder && (
                            <span className="text-[9px] bg-white/5 text-zinc-400 px-2 py-0.5 rounded-md max-w-[90px] truncate border border-white/5">
                              {note.folder}
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-zinc-400 truncate mb-2 leading-relaxed opacity-80">
                        {plainSnippet || 'Catatan kosong...'}
                      </p>

                      {/* Tags in Card */}
                      {note.tags && note.tags.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap mb-2">
                          {note.tags.slice(0, 3).map(t => (
                            <span key={t} className="text-[9px] bg-white/5 text-zinc-400 px-1.5 py-0.5 rounded border border-white/5">
                              #{t}
                            </span>
                          ))}
                          {note.tags.length > 3 && (
                            <span className="text-[9px] text-zinc-500">+{note.tags.length - 3}</span>
                          )}
                        </div>
                      )}

                      <div className="flex justify-between items-center text-[10px] text-zinc-500">
                        <span>{note.date || 'Baru saja'}</span>
                        <div className="flex items-center gap-1.5">
                          {note.coverImage && <span className="text-[9px] text-zinc-400">🖼️ Cover</span>}
                          {note.color && note.color !== 'default' && (
                            <span className={`w-2 h-2 rounded-full ${accent.dot}`} title={accent.name} />
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              {filteredNotes.length === 0 && (
                <div className="text-center py-12 text-zinc-500 text-xs flex flex-col items-center gap-2">
                  <FileText size={28} className="opacity-40" />
                  <span>Belum ada catatan ditemukan.</span>
                  <button 
                    onClick={createNote}
                    className="mt-2 text-primary hover:underline font-bold text-xs"
                  >
                    + Buat Catatan Pertama
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 💻 Main Editor View Area */}
      <div className={
        isFullScreen 
          ? 'fixed inset-0 z-[100] bg-zinc-950 flex flex-col p-3 sm:p-6 md:p-8 animate-fade-in' 
          : `flex-1 flex flex-col overflow-hidden ${(!leftNoteId && !isSplitMode) ? 'hidden md:flex' : 'flex'}`
      }>
        {/* Top Control Breadcrumb Bar */}
        <div className="flex justify-between items-center mb-3 px-1">
          <div className="flex items-center gap-2">
            {leftNoteId && (
              <button 
                onClick={() => { setLeftNoteId(null); setIsSplitMode(false); }} 
                className="md:hidden flex items-center gap-1.5 text-xs font-bold text-zinc-300 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-xl transition-all"
              >
                <ArrowLeft size={14} className="text-primary" />
                <span>Semua Catatan</span>
              </button>
            )}
            <div className="text-xs font-bold text-zinc-400 bg-white/5 px-3 py-1 rounded-full border border-white/5 hidden sm:inline-block">
              {isSplitMode ? 'Split View Mode' : (isFullScreen ? 'Zen Mode' : 'Editor Catatan')}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsFullScreen(!isFullScreen)} 
              className="p-2 rounded-xl bg-zinc-800/80 text-zinc-300 hover:text-white border border-white/10 hover:bg-zinc-700 transition-colors" 
              title={isFullScreen ? "Keluar Zen Mode" : "Layar Penuh / Zen Mode"}
            >
              {isFullScreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
            <button 
              onClick={() => { 
                if (isSplitMode) { 
                  setIsSplitMode(false); 
                  setActivePane('left'); 
                  setRightNoteId(null); 
                } else {
                  setIsSplitMode(true); 
                }
              }} 
              className={`p-2 rounded-xl border transition-all ${
                isSplitMode ? 'bg-primary/20 text-primary border-primary' : 'bg-zinc-800/80 text-zinc-300 border-white/10 hover:bg-zinc-700'
              }`} 
              title="Split View (2 Catatan Berdampingan)"
            >
              <Columns size={16} />
            </button>
          </div>
        </div>
        
        {/* Main Workspaces Layout */}
        <div className="flex-1 flex gap-4 lg:gap-6 min-h-0">
          <div className={`flex-1 min-w-0 flex flex-col transition-all duration-300 ${isSplitMode ? 'w-1/2' : 'w-full'}`}>
            <NoteEditor 
              key={`left-${leftEditData.id || 'new'}`} 
              note={leftEditData} 
              folders={allFolders} 
              courses={courses}
              isActive={activePane === 'left'} 
              isSplitView={isSplitMode} 
              isMobileDevice={isMobile}
              onUpdate={setLeftEditData} 
              onSave={() => saveNote('left')} 
              onDelete={() => deleteNote('left')} 
              onDuplicate={() => duplicateNote('left')}
              onFocus={() => setActivePane('left')}
              onBackToList={() => { setLeftNoteId(null); setIsSplitMode(false); }}
            />
          </div>
          {isSplitMode && (
            <div className="flex-1 min-w-0 flex flex-col w-1/2 animate-slide-in">
              <NoteEditor 
                key={`right-${rightEditData.id || 'new'}`} 
                note={rightEditData} 
                folders={allFolders} 
                courses={courses}
                isActive={activePane === 'right'} 
                isSplitView={isSplitMode} 
                isMobileDevice={isMobile}
                onUpdate={setRightEditData} 
                onSave={() => saveNote('right')} 
                onDelete={() => deleteNote('right')} 
                onDuplicate={() => duplicateNote('right')}
                onFocus={() => setActivePane('right')} 
                onClose={() => { 
                  saveNote('right'); 
                  setRightNoteId(null); 
                  setIsSplitMode(false); 
                  setActivePane('left'); 
                }} 
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
