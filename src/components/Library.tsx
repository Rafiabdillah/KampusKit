import React, { useState, useEffect, useRef } from 'react';
import { Book } from '../types';
import { StorageService } from '../services/storage';
import { Plus, Search, ExternalLink, Trash2, BookOpen, CheckCircle, RotateCcw, Upload, FileText, Download, AlertCircle, Library as LibraryIcon, GraduationCap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const PREDEFINED_MATERIALS = [
  { id: 'mat-1', title: 'Panduan Belajar Efektif (Feynman Technique)', author: 'RafiOS', category: 'Tips Belajar', link: 'https://fs.blog/feynman-technique/', color: '#6366f1' },
  { id: 'mat-2', title: 'Manajemen Waktu Pomodoro', author: 'RafiOS', category: 'Produktivitas', link: 'https://todoist.com/productivity-methods/pomodoro-technique', color: '#10b981' },
  { id: 'mat-3', title: 'Cara Membuat Jurnal Skripsi', author: 'RafiOS', category: 'Akademik', link: 'https://www.scribbr.com/category/research-paper/', color: '#f59e0b' },
  { id: 'mat-4', title: 'Pengenalan React & TypeScript', author: 'RafiOS', category: 'Pemrograman', link: 'https://react.dev/learn', color: '#3b82f6' },
  { id: 'mat-5', title: 'Mind Mapping untuk Mencatat', author: 'RafiOS', category: 'Tips Belajar', link: 'https://www.mindmapping.com/', color: '#ec4899' },
  { id: 'mat-6', title: 'Strategi Lulus Tepat Waktu', author: 'RafiOS', category: 'Akademik', link: 'https://www.topuniversities.com/student-info/choosing-university/how-graduate-university-time', color: '#8b5cf6' }
];

export const Library: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [hasFileAccess, setHasFileAccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'collection' | 'materials'>('collection');

  
  // Form State
  const [newBook, setNewBook] = useState<Partial<Book>>({
    totalPages: 100,
    currentPage: 0
  });

  const [tempFile, setTempFile] = useState<{name: string, data: string, type: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [updateId, setUpdateId] = useState<string | null>(null);
  const [pageUpdate, setPageUpdate] = useState<number>(0);

  const [materials, setMaterials] = useState<any[]>(PREDEFINED_MATERIALS);
  const [showMaterialForm, setShowMaterialForm] = useState(false);
  const [newMaterial, setNewMaterial] = useState<any>({});
  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(null);

  useEffect(() => {
    const savedBooks = StorageService.getItem<Book[]>('library_books', []);
    setBooks(savedBooks);
    
    const savedMaterials = StorageService.getItem<any[]>('learning_materials', PREDEFINED_MATERIALS);
    setMaterials(savedMaterials);
    
    // Check if permission was already granted
    const permission = localStorage.getItem('library_file_access');
    if (permission === 'granted') {
      setHasFileAccess(true);
    }
  }, []);

  const saveMaterials = (updated: any[]) => {
    setMaterials(updated);
    StorageService.setItem('learning_materials', updated);
  };

  const handleAddMaterial = () => {
    if (!newMaterial.title || !newMaterial.link) return;
    
    if (editingMaterialId) {
      const updated = materials.map(m => {
        if (m.id === editingMaterialId) {
          return { ...m, ...newMaterial };
        }
        return m;
      });
      saveMaterials(updated);
    } else {
      const material = {
        id: StorageService.generateId(),
        title: newMaterial.title,
        author: newMaterial.author || 'User',
        category: newMaterial.category || 'General',
        link: newMaterial.link,
        color: generateColor(),
      };
      saveMaterials([...materials, material]);
    }
    
    setShowMaterialForm(false);
    setNewMaterial({});
    setEditingMaterialId(null);
  };

  const handleEditMaterial = (material: any) => {
    setNewMaterial(material);
    setEditingMaterialId(material.id);
    setShowMaterialForm(true);
  };

  const handleDeleteMaterial = (id: string) => {
    if (confirm('Hapus materi ini?')) {
      saveMaterials(materials.filter(m => m.id !== id));
    }
  };

  const requestFileAccess = () => {
    if (confirm("Izinkan RafiOS mengakses penyimpanan lokal untuk menyimpan buku?")) {
      setHasFileAccess(true);
      localStorage.setItem('library_file_access', 'granted');
    }
  };

  const saveBooks = (updatedBooks: Book[]) => {
    setBooks(updatedBooks);
    StorageService.setItem('library_books', updatedBooks);
  };

  const generateColor = () => {
    const colors = ['#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#3b82f6', '#64748b'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (Limit to 5MB for LocalStorage safety)
    if (file.size > 5 * 1024 * 1024) {
      alert("Ukuran file terlalu besar! Maksimal 5MB agar browser tidak lemot.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setTempFile({
        name: file.name,
        type: file.type,
        data: event.target?.result as string
      });
      // Auto-fill title if empty
      if (!newBook.title) {
        setNewBook(prev => ({ ...prev, title: file.name.split('.')[0] }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddBook = () => {
    if (!newBook.title) return;
    
    const book: Book = {
      id: StorageService.generateId(),
      title: newBook.title,
      author: newBook.author || 'Unknown',
      category: newBook.category || 'General',
      link: newBook.link || '',
      totalPages: Number(newBook.totalPages) || 100,
      currentPage: Number(newBook.currentPage) || 0,
      color: generateColor(),
      fileData: tempFile?.data,
      fileName: tempFile?.name,
      fileType: tempFile?.type
    };

    saveBooks([...books, book]);
    setShowForm(false);
    setNewBook({ totalPages: 100, currentPage: 0 });
    setTempFile(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Hapus buku ini dari perpustakaan?')) {
      saveBooks(books.filter(b => b.id !== id));
    }
  };

  const handleUpdateProgress = (id: string) => {
    const updated = books.map(b => {
      if (b.id === id) {
        return { ...b, currentPage: Math.min(pageUpdate, b.totalPages) };
      }
      return b;
    });
    saveBooks(updated);
    setUpdateId(null);
  };

  const startUpdate = (book: Book) => {
    setUpdateId(book.id);
    setPageUpdate(book.currentPage);
  };

  const filteredBooks = books.filter(b => 
    b.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    b.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-full w-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Perpustakaan</h2>
          <p className="text-slate-400">Kelola buku bacaan dan pelajari materi penting.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
            <input 
              className="w-full bg-slate-800 border border-slate-700 text-white pl-9 pr-3 py-2 rounded-lg focus:outline-none focus:border-primary text-sm"
              placeholder="Cari..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          {activeTab === 'collection' ? (
            <button 
              onClick={() => setShowForm(true)}
              className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg flex items-center gap-2 whitespace-nowrap"
            >
              <Plus size={18} /> <span className="hidden md:inline">Tambah Buku</span>
            </button>
          ) : (
            <button 
              onClick={() => setShowMaterialForm(true)}
              className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg flex items-center gap-2 whitespace-nowrap"
            >
              <Plus size={18} /> <span className="hidden md:inline">Tambah Materi</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-2 mb-6 bg-slate-800/50 p-1 rounded-xl w-full md:w-fit border border-slate-700/50">
        <button
          onClick={() => setActiveTab('collection')}
          className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
            activeTab === 'collection' ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
          }`}
        >
          <LibraryIcon size={16} />
          <span>Koleksi Saya</span>
        </button>
        <button
          onClick={() => setActiveTab('materials')}
          className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
            activeTab === 'materials' ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
          }`}
        >
          <GraduationCap size={16} />
          <span>Materi Pembelajaran</span>
        </button>
      </div>

      {showForm && activeTab === 'collection' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">

          <div className="bg-card w-full max-w-lg rounded-xl border border-slate-700 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-4">Tambah Bahan Bacaan</h3>
            
            {/* File Upload Area */}
            {!hasFileAccess ? (
              <div 
                onClick={requestFileAccess}
                className="mb-6 border-2 border-dashed border-slate-600 hover:border-primary hover:bg-slate-800 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors"
              >
                 <AlertCircle size={32} className="text-yellow-500 mb-2" />
                 <p className="text-sm text-white font-medium">Izin Akses File Diperlukan</p>
                 <p className="text-xs text-slate-400 text-center mt-1">Klik untuk mengizinkan aplikasi menyimpan file buku Anda.</p>
              </div>
            ) : (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`mb-6 border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors ${tempFile ? 'border-primary bg-primary/10' : 'border-slate-600 hover:border-slate-400 hover:bg-slate-800'}`}
              >
                 <input 
                   type="file" 
                   ref={fileInputRef} 
                   className="hidden" 
                   accept=".pdf,.epub,.docx,.txt"
                   onChange={handleFileUpload}
                 />
                 {tempFile ? (
                   <>
                     <FileText size={32} className="text-primary mb-2" />
                     <p className="text-sm text-white font-medium">{tempFile.name}</p>
                     <p className="text-xs text-slate-400">Siap diunggah</p>
                   </>
                 ) : (
                   <>
                     <Upload size={32} className="text-slate-400 mb-2" />
                     <p className="text-sm text-slate-300 font-medium">Klik untuk upload E-Book / File</p>
                     <p className="text-xs text-slate-500">Maksimal 5MB (PDF, EPUB, DOCX)</p>
                   </>
                 )}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Judul Buku</label>
                <input 
                  className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg"
                  placeholder="Contoh: Pengantar Algoritma"
                  value={newBook.title || ''}
                  onChange={e => setNewBook({...newBook, title: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Penulis</label>
                  <input 
                    className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg"
                    placeholder="Nama Penulis"
                    value={newBook.author || ''}
                    onChange={e => setNewBook({...newBook, author: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Kategori/Matkul</label>
                  <input 
                    className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg"
                    placeholder="Contoh: CS101"
                    value={newBook.category || ''}
                    onChange={e => setNewBook({...newBook, category: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Total Halaman</label>
                  <input 
                    type="number"
                    className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg"
                    value={newBook.totalPages}
                    onChange={e => setNewBook({...newBook, totalPages: Number(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Halaman Saat Ini</label>
                  <input 
                    type="number"
                    className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg"
                    value={newBook.currentPage}
                    onChange={e => setNewBook({...newBook, currentPage: Number(e.target.value)})}
                  />
                </div>
              </div>
              
              <div>
                <label className="text-xs text-slate-400 block mb-1">Link Eksternal (Opsional)</label>
                <input 
                  className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg"
                  placeholder="https://..."
                  value={newBook.link || ''}
                  onChange={e => setNewBook({...newBook, link: e.target.value})}
                />
              </div>

              {tempFile && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-lg flex items-start gap-2">
                   <AlertCircle size={16} className="text-yellow-500 mt-0.5 flex-shrink-0" />
                   <p className="text-xs text-yellow-500/80">File akan disimpan di browser Anda (LocalStorage). Jangan bersihkan cache browser agar file tidak hilang.</p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => { setShowForm(false); setTempFile(null); }} 
                  className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button 
                  onClick={handleAddBook} 
                  className="flex-1 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg font-bold transition-colors"
                >
                  Simpan Buku
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showMaterialForm && activeTab === 'materials' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-card w-full max-w-lg rounded-xl border border-slate-700 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-4">{editingMaterialId ? 'Edit Materi' : 'Tambah Materi Pembelajaran'}</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Judul Materi *</label>
                <input 
                  type="text"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  placeholder="Misal: Panduan React"
                  value={newMaterial.title || ''}
                  onChange={e => setNewMaterial({...newMaterial, title: e.target.value})}
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">Sumber / Penulis</label>
                <input 
                  type="text"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  placeholder="Nama Penulis atau Website"
                  value={newMaterial.author || ''}
                  onChange={e => setNewMaterial({...newMaterial, author: e.target.value})}
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">Kategori</label>
                <select 
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  value={newMaterial.category || 'General'}
                  onChange={e => setNewMaterial({...newMaterial, category: e.target.value})}
                >
                  <option value="Pemrograman">Pemrograman</option>
                  <option value="Produktivitas">Produktivitas</option>
                  <option value="Akademik">Akademik</option>
                  <option value="Tips Belajar">Tips Belajar</option>
                  <option value="Desain">Desain</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">Link / URL Materi *</label>
                <input 
                  type="url"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  placeholder="https://..."
                  value={newMaterial.link || ''}
                  onChange={e => setNewMaterial({...newMaterial, link: e.target.value})}
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end mt-6">
              <button 
                onClick={() => {
                  setShowMaterialForm(false);
                  setNewMaterial({});
                  setEditingMaterialId(null);
                }}
                className="px-4 py-2 text-slate-300 hover:text-white"
              >
                Batal
              </button>
              <button 
                onClick={handleAddMaterial}
                className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg font-bold"
                disabled={!newMaterial.title || !newMaterial.link}
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'collection' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 overflow-y-auto pb-4">
          {filteredBooks.map(book => {
            const progress = Math.round((book.currentPage / book.totalPages) * 100);
            const isFinished = progress >= 100;

            return (
              <div key={book.id} className="group relative flex flex-col gap-3">
                {/* Book Cover Design */}
                <div 
                  className="aspect-[2/3] rounded-r-2xl rounded-l-sm shadow-2xl relative overflow-hidden transition-transform transform hover:-translate-y-2 duration-300"
                  style={{ backgroundColor: book.color }}
                >
                  {/* Spine Effect */}
                  <div className="absolute left-0 top-0 bottom-0 w-3 bg-black/20 z-10"></div>
                  
                  {/* Cover Content */}
                  <div className="absolute inset-0 p-4 flex flex-col justify-between ml-2">
                    <div>
                      <span className="text-[10px] font-bold tracking-widest text-white/70 uppercase border border-white/30 px-1 py-0.5 rounded inline-block mb-2">
                        {book.category}
                      </span>
                      <h3 className="font-bold text-white text-lg leading-tight line-clamp-3" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                        {book.title}
                      </h3>
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-1 mb-2">
                         {book.fileData && <FileText size={12} className="text-white/80" />}
                         <p className="text-white/80 text-xs font-medium truncate">{book.author}</p>
                      </div>
                      
                      {/* Visual Progress on Cover */}
                      <div className="h-1.5 w-full bg-black/30 rounded-full overflow-hidden">
                        <div className="h-full bg-white/90 transition-all duration-500" style={{ width: `${progress}%` }}></div>
                      </div>
                      <div className="flex justify-between items-center mt-1 text-[10px] text-white/90 font-medium">
                        <span>{progress}%</span>
                        {isFinished && <CheckCircle size={12} />}
                      </div>
                    </div>
                  </div>

                  {/* Hover Actions Overlay */}
                  <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 p-4 ml-1">
                    
                    {book.fileData ? (
                      <a 
                        href={book.fileData} 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-white text-black px-3 py-1.5 rounded-full text-xs font-bold hover:bg-slate-200 w-full justify-center"
                      >
                        <BookOpen size={14} /> Buka File
                      </a>
                    ) : (book.link && (
                      <a 
                        href={book.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-white text-black px-3 py-1.5 rounded-full text-xs font-bold hover:bg-slate-200 w-full justify-center"
                      >
                        <ExternalLink size={14} /> Buka Link
                      </a>
                    ))}
                    
                    <button 
                      onClick={() => startUpdate(book)}
                      className="flex items-center gap-2 bg-primary text-white px-3 py-1.5 rounded-full text-xs font-bold hover:bg-primary/80 w-full justify-center"
                    >
                      <BookOpen size={14} /> Update
                    </button>

                    <button 
                      onClick={() => handleDelete(book.id)}
                      className="flex items-center gap-2 bg-red-500/20 text-red-400 border border-red-500/50 px-3 py-1.5 rounded-full text-xs font-bold hover:bg-red-500/30 w-full justify-center mt-2"
                    >
                      <Trash2 size={14} /> Hapus
                    </button>
                  </div>
                </div>
                
                {/* Mobile/Simple Update Form underneath if active */}
                {updateId === book.id && (
                  <div className="bg-slate-800 p-3 rounded-lg border border-slate-700 absolute top-full left-0 right-0 z-20 mt-2 shadow-xl animate-fade-in">
                    <label className="text-[10px] text-slate-400 block mb-1">Halaman sekarang (Max {book.totalPages})</label>
                    <div className="flex gap-2">
                      <input 
                        type="number"
                        className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-sm text-white"
                        value={pageUpdate}
                        onChange={e => setPageUpdate(Number(e.target.value))}
                        max={book.totalPages}
                      />
                      <button 
                        onClick={() => handleUpdateProgress(book.id)}
                        className="bg-primary text-white p-1 rounded hover:bg-primary/90"
                      >
                        <CheckCircle size={16} />
                      </button>
                      <button 
                        onClick={() => setUpdateId(null)}
                        className="bg-slate-700 text-slate-300 p-1 rounded hover:bg-slate-600"
                      >
                        <RotateCcw size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          
          {/* Empty State Add Button */}
          <button 
            onClick={() => setShowForm(true)}
            className="aspect-[2/3] rounded-xl border-2 border-dashed border-slate-700 hover:border-primary hover:bg-slate-800/30 flex flex-col items-center justify-center gap-3 transition-all group"
          >
            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 group-hover:text-primary group-hover:scale-110 transition-all">
              <Plus size={24} />
            </div>
            <span className="text-sm text-slate-500 font-medium group-hover:text-primary">Tambah Buku</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 overflow-y-auto pb-4">
          {materials.filter(m => 
            m.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
            m.category?.toLowerCase().includes(searchTerm.toLowerCase())
          ).map(material => (
            <div key={material.id} className="group relative flex flex-col gap-3">
              <div 
                className="aspect-[2/3] rounded-r-2xl rounded-l-sm shadow-2xl relative overflow-hidden transition-transform transform hover:-translate-y-2 duration-300"
                style={{ backgroundColor: material.color }}
              >
                <div className="absolute left-0 top-0 bottom-0 w-3 bg-black/20 z-10"></div>
                <div className="absolute inset-0 p-4 flex flex-col justify-between ml-2">
                  <div>
                    <span className="text-[10px] font-bold tracking-widest text-white/70 uppercase border border-white/30 px-1 py-0.5 rounded inline-block mb-2">
                      {material.category}
                    </span>
                    <h3 className="font-bold text-white text-lg leading-tight line-clamp-3" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                      {material.title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1">
                     <GraduationCap size={12} className="text-white/80" />
                     <p className="text-white/80 text-xs font-medium truncate">{material.author}</p>
                  </div>
                </div>
                <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 p-4 ml-1">
                  <a 
                    href={material.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-full text-xs font-bold hover:bg-slate-200 w-full justify-center"
                  >
                    <ExternalLink size={14} /> Baca
                  </a>
                  <button 
                    onClick={() => handleEditMaterial(material)}
                    className="flex items-center gap-2 bg-blue-500/20 text-blue-400 border border-blue-500/50 px-3 py-1.5 rounded-full text-xs font-bold hover:bg-blue-500/30 w-full justify-center"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDeleteMaterial(material.id)}
                    className="flex items-center gap-2 bg-red-500/20 text-red-400 border border-red-500/50 px-3 py-1.5 rounded-full text-xs font-bold hover:bg-red-500/30 w-full justify-center"
                  >
                    <Trash2 size={14} /> Hapus
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          <button 
            onClick={() => setShowMaterialForm(true)}
            className="aspect-[2/3] rounded-xl border-2 border-dashed border-slate-700 hover:border-primary hover:bg-slate-800/30 flex flex-col items-center justify-center gap-3 transition-all group"
          >
            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 group-hover:text-primary group-hover:scale-110 transition-all">
              <Plus size={24} />
            </div>
            <span className="text-sm text-slate-500 font-medium group-hover:text-primary">Tambah Materi</span>
          </button>
        </div>
      )}
    </div>
  );
};