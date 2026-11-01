import React, { useState, useEffect } from 'react';
import { Meal } from '../types';
import { StorageService } from '../services/storage';
import { Utensils, RefreshCw, Plus, Trash2, Tag, DollarSign, ChefHat } from 'lucide-react';

const DEFAULT_MEALS: Meal[] = [
  { id: 'm1', name: 'Nasi Telur Dadar + Kecap', priceEstimate: 10000, tags: ['HEMAT', 'CEPAT'] },
  { id: 'm2', name: 'Mie Instan + Sawi', priceEstimate: 6000, tags: ['HEMAT', 'CEPAT'] },
  { id: 'm3', name: 'Ayam Geprek', priceEstimate: 15000, tags: ['CEPAT'] },
  { id: 'm4', name: 'Gado-gado / Lotek', priceEstimate: 13000, tags: ['SEHAT', 'HEMAT'] },
  { id: 'm5', name: 'Nasi Padang (Rendang)', priceEstimate: 25000, tags: ['MEWAH'] },
  { id: 'm6', name: 'Soto Ayam', priceEstimate: 12000, tags: ['SEHAT'] },
  { id: 'm7', name: 'Bubur Ayam', priceEstimate: 10000, tags: ['HEMAT'] },
  { id: 'm8', name: 'Pecel Lele', priceEstimate: 15000, tags: ['CEPAT'] },
];

export const MealPlanner: React.FC = () => {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [suggestedMeal, setSuggestedMeal] = useState<Meal | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  
  // Form
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newTags, setNewTags] = useState<Meal['tags']>([]);

  useEffect(() => {
    const saved = StorageService.getItem<Meal[]>('meal_plans', []);
    if (saved.length === 0) {
      setMeals(DEFAULT_MEALS);
      StorageService.setItem('meal_plans', DEFAULT_MEALS);
    } else {
      setMeals(saved);
    }
  }, []);

  const saveMeals = (updated: Meal[]) => {
    setMeals(updated);
    StorageService.setItem('meal_plans', updated);
  };

  const addMeal = () => {
    if (!newName) return;
    const meal: Meal = {
      id: StorageService.generateId(),
      name: newName,
      priceEstimate: parseInt(newPrice) || 0,
      tags: newTags.length > 0 ? newTags : ['HEMAT']
    };
    saveMeals([meal, ...meals]);
    setNewName('');
    setNewPrice('');
    setNewTags([]);
  };

  const deleteMeal = (id: string) => {
    saveMeals(meals.filter(m => m.id !== id));
  };

  const toggleTag = (tag: 'HEMAT' | 'SEHAT' | 'CEPAT' | 'MEWAH') => {
    if (newTags.includes(tag)) {
      setNewTags(newTags.filter(t => t !== tag));
    } else {
      setNewTags([...newTags, tag]);
    }
  };

  const randomizeMeal = () => {
    setIsSpinning(true);
    let counter = 0;
    const interval = setInterval(() => {
      setSuggestedMeal(meals[Math.floor(Math.random() * meals.length)]);
      counter++;
      if (counter > 10) {
        clearInterval(interval);
        setIsSpinning(false);
      }
    }, 100);
  };

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  const getTagColor = (tag: string) => {
    switch (tag) {
      case 'HEMAT': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'SEHAT': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'MEWAH': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'CEPAT': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      default: return 'bg-slate-700 text-slate-300';
    }
  };

  return (
    <div className="min-h-full w-full flex flex-col md:flex-row gap-6 animate-fade-in">
      {/* Left Column: Randomizer & Form */}
      <div className="w-full md:w-1/3 flex flex-col gap-6">
        
        {/* Randomizer Card */}
        <div className="bg-gradient-to-br from-orange-600/20 to-slate-900 border border-orange-500/30 rounded-xl p-6 text-center relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-10">
              <ChefHat size={100} />
           </div>
           <h2 className="text-xl font-bold text-white mb-4 flex items-center justify-center gap-2">
             <Utensils /> Bingung Makan Apa?
           </h2>
           
           <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-6 mb-6 min-h-[120px] flex flex-col items-center justify-center">
              {suggestedMeal ? (
                <>
                  <h3 className={`text-2xl font-bold text-white mb-1 ${isSpinning ? 'opacity-50' : 'animate-bounce-in'}`}>
                    {suggestedMeal.name}
                  </h3>
                  <p className="text-orange-400 font-mono">{formatRupiah(suggestedMeal.priceEstimate)}</p>
                  <div className="flex gap-2 mt-2 justify-center">
                    {suggestedMeal.tags.map(t => (
                      <span key={t} className={`text-[10px] px-2 py-0.5 rounded border ${getTagColor(t)}`}>{t}</span>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-slate-500 text-sm">Klik tombol di bawah untuk acak menu!</p>
              )}
           </div>

           <button 
             onClick={randomizeMeal}
             disabled={isSpinning || meals.length === 0}
             className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
           >
             <RefreshCw size={20} className={isSpinning ? 'animate-spin' : ''} />
             {isSpinning ? 'Memilih...' : 'Pilihkan Makanan!'}
           </button>
        </div>

        {/* Add New Meal Form */}
        <div className="bg-card border border-slate-700 rounded-xl p-6">
           <h3 className="font-bold text-white mb-4">Tambah Menu Favorit</h3>
           <div className="space-y-3">
              <input 
                className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg text-sm"
                placeholder="Nama Makanan (misal: Nasi Goreng)"
                value={newName}
                onChange={e => setNewName(e.target.value)}
              />
              <div className="relative">
                 <DollarSign size={14} className="absolute left-3 top-3 text-slate-500" />
                 <input 
                   type="number"
                   className="w-full bg-slate-800 border border-slate-700 text-white pl-8 pr-3 py-2.5 rounded-lg text-sm"
                   placeholder="Estimasi Harga"
                   value={newPrice}
                   onChange={e => setNewPrice(e.target.value)}
                 />
              </div>
              
              <div>
                 <label className="text-xs text-slate-400 mb-2 block">Kategori:</label>
                 <div className="flex flex-wrap gap-2">
                    {['HEMAT', 'SEHAT', 'CEPAT', 'MEWAH'].map(tag => (
                       <button
                         key={tag}
                         onClick={() => toggleTag(tag as any)}
                         className={`text-[10px] px-3 py-1 rounded-full border transition-all ${
                           newTags.includes(tag as any) 
                           ? getTagColor(tag) 
                           : 'bg-slate-800 border-slate-600 text-slate-400 hover:border-slate-400'
                         }`}
                       >
                         {tag}
                       </button>
                    ))}
                 </div>
              </div>

              <button 
                onClick={addMeal}
                className="w-full bg-primary hover:bg-primary/90 text-white py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 mt-2"
              >
                <Plus size={16} /> Simpan Menu
              </button>
           </div>
        </div>
      </div>

      {/* Right Column: List */}
      <div className="flex-1 bg-card border border-slate-700 rounded-xl p-6 flex flex-col h-full overflow-hidden">
         <h3 className="font-bold text-white mb-4 flex items-center gap-2">
            <Utensils size={18} /> Daftar Menu ({meals.length})
         </h3>
         
         <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            {meals.length === 0 ? (
               <div className="text-center py-20 text-slate-500">
                  <p>Belum ada daftar makanan.</p>
               </div>
            ) : (
               meals.map(meal => (
                  <div key={meal.id} className="flex justify-between items-center p-3 bg-slate-800/50 rounded-xl border border-slate-700/50 hover:bg-slate-800 transition-colors group">
                     <div>
                        <div className="flex items-center gap-2">
                           <p className="font-bold text-white text-sm">{meal.name}</p>
                           <div className="flex gap-1">
                              {meal.tags.map(t => (
                                 <span key={t} className={`w-2 h-2 rounded-full ${t === 'HEMAT' ? 'bg-green-500' : t === 'SEHAT' ? 'bg-blue-500' : t === 'MEWAH' ? 'bg-purple-500' : 'bg-orange-500'}`} title={t}></span>
                              ))}
                           </div>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{formatRupiah(meal.priceEstimate)}</p>
                     </div>
                     <button 
                       onClick={() => deleteMeal(meal.id)}
                       className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-2"
                     >
                        <Trash2 size={16} />
                     </button>
                  </div>
               ))
            )}
         </div>
      </div>
    </div>
  );
};
