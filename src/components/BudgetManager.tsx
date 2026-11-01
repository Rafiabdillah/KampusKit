import React, { useState, useEffect } from 'react';
import { Transaction, SupportedCurrency } from '../types';
import { StorageService } from '../services/storage';
import { audioService } from '../services/audio';
import { useStore } from '../store/useStore';
import { TRANSLATIONS } from '../utils/translations';
import { formatCurrency, CURRENCY_MAP } from '../utils/intl';
import { 
  Wallet, TrendingUp, TrendingDown, Plus, Trash2, DollarSign, 
  History, CreditCard, PieChart, ShoppingBag, Utensils, Car, 
  Wifi, Printer, Gamepad2, MoreHorizontal, ArrowDownCircle, 
  ArrowUpCircle, Globe, Download, Check
} from 'lucide-react';

export const BudgetManager: React.FC = () => {
  const language = useStore(state => state.language);
  const userProfile = useStore(state => state.userProfile);
  const setUserProfile = useStore(state => state.setUserProfile);
  const t = TRANSLATIONS[language] || TRANSLATIONS.id;

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Makan');
  const [type, setType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');

  const [currentCurrency, setCurrentCurrency] = useState<SupportedCurrency>(() => {
    return userProfile.preferredCurrency || StorageService.getItem<SupportedCurrency>('preferred_currency', 'IDR');
  });
  const [isCurrencyMenuOpen, setIsCurrencyMenuOpen] = useState(false);
  const [isExported, setIsExported] = useState(false);

  useEffect(() => {
    setTransactions(StorageService.getItem<Transaction[]>('transactions', []));
  }, []);

  const saveTransactions = (updated: Transaction[]) => {
    setTransactions(updated);
    StorageService.setItem('transactions', updated);
  };

  const handleCurrencyChange = (newCurr: SupportedCurrency) => {
    setCurrentCurrency(newCurr);
    StorageService.setItem('preferred_currency', newCurr);
    setUserProfile({ ...userProfile, preferredCurrency: newCurr });
    setIsCurrencyMenuOpen(false);
    audioService.playAmbientClick();
  };

  const addTransaction = () => {
    if (!amount || !title) return;
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    const newTrans: Transaction = {
      id: StorageService.generateId(),
      title: title.trim(),
      amount: parsedAmount,
      type,
      category: type === 'INCOME' ? (language === 'en' ? 'Income' : 'Pemasukan') : category,
      date: new Date().toISOString()
    };
    saveTransactions([newTrans, ...transactions]);
    setAmount('');
    setTitle('');
    audioService.playAmbientSuccess();
  };

  const deleteTransaction = (id: string) => {
    saveTransactions(transactions.filter(t => t.id !== id));
    audioService.playAmbientClick();
  };
  
  const handleTypeChange = (newType: 'INCOME' | 'EXPENSE') => {
    setType(newType);
    audioService.playAmbientClick();
  };
  
  const handleQuickAmount = (val: number) => {
    setAmount(val.toString());
    audioService.playAmbientClick();
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) return language === 'en' ? 'Today' : 'Hari ini';
    if (date.toDateString() === yesterday.toDateString()) return language === 'en' ? 'Yesterday' : 'Kemarin';
    
    return date.toLocaleDateString(language === 'en' ? 'en-US' : 'id-ID', { day: 'numeric', month: 'short' });
  };

  const handleExportCSV = () => {
    if (transactions.length === 0) return;
    const headers = ['Date', 'Title', 'Type', 'Category', `Amount (${currentCurrency})`];
    const rows = transactions.map(t => [
      new Date(t.date).toISOString().split('T')[0],
      `"${t.title.replace(/"/g, '""')}"`,
      t.type,
      `"${t.category}"`,
      t.amount
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `KampusKit_Financial_Report_${currentCurrency}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setIsExported(true);
    setTimeout(() => setIsExported(false), 2500);
  };

  const income = transactions.filter(t => t.type === 'INCOME').reduce((acc, curr) => acc + curr.amount, 0);
  const expense = transactions.filter(t => t.type === 'EXPENSE').reduce((acc, curr) => acc + curr.amount, 0);
  const balance = income - expense;
  
  const categoryConfig = [
    { name: language === 'en' ? 'Food & Dining' : 'Makan', icon: Utensils, color: 'text-orange-400', bg: 'bg-orange-500/10', fill: 'bg-orange-500' },
    { name: language === 'en' ? 'Transport' : 'Transport', icon: Car, color: 'text-blue-400', bg: 'bg-blue-500/10', fill: 'bg-blue-500' },
    { name: language === 'en' ? 'Internet & Tech' : 'Kuota', icon: Wifi, color: 'text-cyan-400', bg: 'bg-cyan-500/10', fill: 'bg-cyan-500' },
    { name: language === 'en' ? 'Print & Supplies' : 'Print', icon: Printer, color: 'text-zinc-400', bg: 'bg-zinc-500/10', fill: 'bg-zinc-400' },
    { name: language === 'en' ? 'Leisure & Fun' : 'Hiburan', icon: Gamepad2, color: 'text-purple-400', bg: 'bg-purple-500/10', fill: 'bg-purple-500' },
    { name: language === 'en' ? 'Shopping' : 'Belanja', icon: ShoppingBag, color: 'text-pink-400', bg: 'bg-pink-500/10', fill: 'bg-pink-500' },
    { name: language === 'en' ? 'Other' : 'Lainnya', icon: MoreHorizontal, color: 'text-zinc-400', bg: 'bg-zinc-500/10', fill: 'bg-zinc-500' }
  ];

  const expenseByCategory = transactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);
  
  const sortedExpenses = Object.entries(expenseByCategory).sort((a,b) => Number(b[1]) - Number(a[1]));
  const currencyInfo = CURRENCY_MAP[currentCurrency] || CURRENCY_MAP.IDR;

  return (
    <div className="min-h-full w-full flex flex-col animate-fade-in max-w-5xl mx-auto pb-12">
      {/* Top Header with Multi-Currency Selector & CSV Export */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2.5">
            <Wallet className="text-emerald-400" size={28} />
            <span>{t.walletTitle}</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            {language === 'en'
              ? 'Multi-currency budget tracker, inflow/outflow balance, and scholarship allowance accounting.'
              : 'Pencatatan keuangan multi-mata uang, pemantauan arus kas, dan kontrol anggaran mahasiswa.'}
          </p>
        </div>

        {/* Currency Selector & Export Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Currency Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsCurrencyMenuOpen(!isCurrencyMenuOpen)}
              className="px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-white text-xs font-mono font-bold flex items-center gap-2 hover:bg-zinc-800 transition-all shadow-sm"
              title="Change Currency"
            >
              <Globe size={14} className="text-emerald-400" />
              <span>{currencyInfo.code} ({currencyInfo.symbol})</span>
            </button>

            {isCurrencyMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-zinc-900 border border-white/10 rounded-2xl p-2 shadow-2xl z-30 flex flex-col gap-1 backdrop-blur-xl">
                <div className="px-2.5 py-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  {t.currencyLabel}
                </div>
                {(Object.keys(CURRENCY_MAP) as SupportedCurrency[]).map(currKey => {
                  const cfg = CURRENCY_MAP[currKey];
                  const isSelected = currentCurrency === currKey;
                  return (
                    <button
                      key={currKey}
                      onClick={() => handleCurrencyChange(currKey)}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all text-left ${
                        isSelected 
                          ? 'bg-emerald-500/15 text-emerald-300 font-bold border border-emerald-500/30' 
                          : 'text-zinc-300 hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-zinc-400 text-[11px] w-6">{cfg.symbol}</span>
                        <span>{cfg.name}</span>
                      </div>
                      {isSelected && <Check size={14} className="text-emerald-400" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Export CSV button */}
          <button
            onClick={handleExportCSV}
            disabled={transactions.length === 0}
            className="px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-all disabled:opacity-40"
            title={t.exportFinanceReport}
          >
            <Download size={14} className="text-zinc-400" />
            <span className="hidden sm:inline">{isExported ? (language === 'en' ? 'Downloaded!' : 'Tersimpan!') : 'CSV'}</span>
          </button>
        </div>
      </div>

      {/* Premium Balance Card */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-zinc-900 via-zinc-800 to-black border border-white/10 p-6 sm:p-8 shadow-2xl mb-8 group">
        <div className="absolute top-0 right-0 p-12 opacity-5 transform rotate-12 transition-transform group-hover:rotate-6 duration-700 pointer-events-none">
          <DollarSign size={240} className="text-white"/>
        </div>
        <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-emerald-500/20 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="absolute top-10 right-1/4 w-32 h-32 bg-purple-500/20 rounded-full blur-[60px] pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 sm:gap-8">
          <div className="flex-1">
            <p className="text-zinc-400 text-xs sm:text-sm font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
              <CreditCard size={16}/> {t.currentBalance}
            </p>
            <h1 className={`text-4xl sm:text-5xl md:text-6xl font-black tracking-tight drop-shadow-lg ${balance < 0 ? 'text-red-400' : 'text-white'}`}>
              {formatCurrency(balance, currentCurrency)}
            </h1>
            <div className="mt-5 flex items-center gap-3 text-xs font-mono text-zinc-400 flex-wrap">
              <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 uppercase tracking-widest text-[10px] text-zinc-300">
                {userProfile.university || 'SCHOLAR ACCOUNT'}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-700"></span>
              <span>{new Date().toLocaleDateString(language === 'en' ? 'en-US' : 'id-ID', { month: 'long', year: 'numeric' })}</span>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row md:flex-col gap-3 w-full sm:w-auto min-w-[220px]">
            <div className="glass-card bg-emerald-500/5 border-emerald-500/20 p-4 rounded-2xl flex items-center justify-between group-hover:bg-emerald-500/10 transition-colors">
              <div>
                <p className="text-[10px] text-emerald-400/80 font-bold uppercase mb-1">{t.totalIncome}</p>
                <p className="text-white font-bold text-base sm:text-lg">{formatCurrency(income, currentCurrency)}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                <TrendingUp size={18}/>
              </div>
            </div>
            <div className="glass-card bg-rose-500/5 border-rose-500/20 p-4 rounded-2xl flex items-center justify-between group-hover:bg-rose-500/10 transition-colors">
              <div>
                <p className="text-[10px] text-rose-400/80 font-bold uppercase mb-1">{t.totalExpense}</p>
                <p className="text-white font-bold text-base sm:text-lg">{formatCurrency(expense, currentCurrency)}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-400">
                <TrendingDown size={18}/>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 grid md:grid-cols-12 gap-6 min-h-0">
        {/* Input Form */}
        <div className="md:col-span-5 lg:col-span-5 glass-card p-6 rounded-3xl h-fit border border-white/5">
          <h3 className="font-bold text-white mb-5 text-base sm:text-lg">{t.addTransaction}</h3>
          
          <div className="flex bg-black/40 p-1 rounded-2xl mb-5 border border-white/5">
            <button 
              onClick={() => handleTypeChange('EXPENSE')} 
              className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                type === 'EXPENSE' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <ArrowDownCircle size={15} className={type === 'EXPENSE' ? 'text-rose-400' : ''} /> 
              {t.expenseType}
            </button>
            <button 
              onClick={() => handleTypeChange('INCOME')} 
              className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                type === 'INCOME' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <ArrowUpCircle size={15} className={type === 'INCOME' ? 'text-emerald-400' : ''} /> 
              {t.incomeType}
            </button>
          </div>
          
          <form onSubmit={(e) => { e.preventDefault(); addTransaction(); }} className="space-y-4">
            <div>
              <label className="text-xs text-zinc-400 font-bold uppercase ml-1 mb-1.5 block">
                {language === 'en' ? 'Description / Title' : 'Judul / Keterangan'}
              </label>
              <input 
                className="input-field" 
                placeholder={t.transactionTitlePlaceholder} 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
              />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs text-zinc-400 font-bold uppercase ml-1 block">
                  {language === 'en' ? 'Amount' : 'Nominal'} ({currencyInfo.code})
                </label>
                {/* Dynamic Quick Presets based on currency */}
                <div className="flex gap-1 flex-wrap">
                  {currencyInfo.presets.slice(0, 4).map(val => (
                    <button 
                      type="button" 
                      key={val} 
                      onClick={() => handleQuickAmount(val)} 
                      className="text-[9px] font-mono bg-white/5 hover:bg-white/10 px-1.5 py-0.5 rounded text-zinc-300 transition-colors"
                    >
                      +{val >= 1000 ? `${val / 1000}k` : val}
                    </button>
                  ))}
                </div>
              </div>
              <div className="relative">
                <span className="absolute left-4 top-3.5 text-zinc-400 font-bold font-mono text-sm">
                  {currencyInfo.symbol}
                </span>
                <input 
                  type="number" 
                  step={currencyInfo.decimals > 0 ? "0.01" : "1"}
                  className="input-field pl-12 font-mono text-base" 
                  placeholder="0" 
                  value={amount} 
                  onChange={e => setAmount(e.target.value)} 
                />
              </div>
            </div>

            {type === 'EXPENSE' && (
              <div>
                <label className="text-xs text-zinc-400 font-bold uppercase ml-1 mb-2 block">
                  {language === 'en' ? 'Category' : 'Kategori'}
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {categoryConfig.map(cat => (
                    <button 
                      type="button" 
                      key={cat.name} 
                      onClick={() => { setCategory(cat.name); audioService.playAmbientClick(); }} 
                      className={`px-2.5 py-1.5 text-xs font-medium rounded-xl border flex items-center gap-1.5 transition-all ${
                        category === cat.name 
                          ? 'bg-zinc-800 text-white border-zinc-600 shadow-md' 
                          : 'bg-black/20 text-zinc-400 border-white/5 hover:border-white/20 hover:bg-black/40'
                      }`}
                    >
                      <cat.icon size={13} className={category === cat.name ? cat.color : 'opacity-70'}/>
                      <span>{cat.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <button 
              type="submit" 
              disabled={!title || !amount} 
              className={`w-full py-3 rounded-xl font-bold text-white shadow-lg transition-all active:scale-95 mt-3 flex items-center justify-center gap-2 ${
                type === 'EXPENSE' 
                  ? 'bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 border border-white/10' 
                  : 'bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40'
              }`}
            >
              <Plus size={16} />
              <span>{t.addTransaction}</span>
            </button>
          </form>
        </div>

        {/* History List */}
        <div className="md:col-span-7 lg:col-span-7 glass-card p-6 rounded-3xl flex flex-col overflow-hidden border border-white/5">
          {expense > 0 && (
            <div className="mb-5 bg-black/30 p-4 rounded-2xl border border-white/5">
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">
                {language === 'en' ? 'Expense Distribution' : 'Analisis Pengeluaran'}
              </h4>
              <div className="space-y-2.5">
                {sortedExpenses.slice(0, 4).map(([catName, amt]) => {
                  const catConfig = categoryConfig.find(c => c.name === catName);
                  const numAmount = Number(amt);
                  const percentage = Math.round((numAmount / expense) * 100);
                  return (
                    <div key={catName}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-zinc-300 flex items-center gap-1.5">
                          {catConfig && <catConfig.icon size={11} className={catConfig.color} />}
                          <span>{catName}</span>
                        </span>
                        <span className="font-mono text-zinc-400 text-[11px]">
                          {formatCurrency(numAmount, currentCurrency)} ({percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-black/50 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className={`h-full ${catConfig?.fill || 'bg-zinc-500'} rounded-full`} 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-white flex items-center gap-2 text-base">
              <History size={18} className="text-emerald-400" />
              <span>{language === 'en' ? 'Transaction Ledger' : 'Riwayat Transaksi'}</span>
            </h3>
            <span className="text-xs text-zinc-400 bg-zinc-900 px-2.5 py-1 rounded-full border border-white/5 font-mono">
              {transactions.length} {language === 'en' ? 'records' : 'transaksi'}
            </span>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-2.5 custom-scrollbar pr-1 max-h-[460px]">
            {transactions.length === 0 ? (
              <div className="min-h-full w-full flex flex-col items-center justify-center text-zinc-500 py-12">
                <div className="w-16 h-16 rounded-full bg-zinc-900/80 flex items-center justify-center mb-3 border border-white/5">
                  <PieChart size={28} className="text-zinc-600"/>
                </div>
                <p className="text-sm font-bold text-zinc-300">
                  {language === 'en' ? 'No transactions yet' : 'Belum ada transaksi'}
                </p>
                <p className="text-xs mt-1 max-w-[260px] text-center text-zinc-400">
                  {language === 'en'
                    ? 'Log your first income or campus expense to start tracking.'
                    : 'Catat pengeluaran harian atau pemasukan beasiswa pertamamu.'}
                </p>
              </div>
            ) : transactions.map(tItem => {
              const catConfig = categoryConfig.find(c => c.name === tItem.category);
              return (
                <div 
                  key={tItem.id} 
                  className="flex justify-between items-center p-3.5 bg-zinc-900/60 rounded-2xl border border-white/5 hover:border-white/10 hover:bg-zinc-800/80 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-inner ${
                      tItem.type === 'INCOME' 
                        ? 'bg-emerald-500/10 text-emerald-400' 
                        : catConfig ? `${catConfig.bg} ${catConfig.color}` : 'bg-rose-500/10 text-rose-400'
                    }`}>
                      {tItem.type === 'INCOME' 
                        ? <TrendingUp size={18} /> 
                        : (catConfig ? <catConfig.icon size={18}/> : <TrendingDown size={18} />)}
                    </div>
                    <div>
                      <p className="font-bold text-white text-xs sm:text-sm mb-0.5">{tItem.title}</p>
                      <p className="text-[10px] text-zinc-400 font-medium bg-black/40 px-2 py-0.5 rounded-md w-fit border border-white/5">
                        {tItem.category}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <p className={`font-bold font-mono text-sm mb-0.5 ${tItem.type === 'INCOME' ? 'text-emerald-400' : 'text-white'}`}>
                      {tItem.type === 'INCOME' ? '+' : '-'} {formatCurrency(tItem.amount, currentCurrency)}
                    </p>
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-[11px] text-zinc-400 font-medium">{formatDate(tItem.date)}</span>
                      <button 
                        onClick={() => deleteTransaction(tItem.id)} 
                        className="text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 p-1 rounded-lg hover:bg-red-500/10 border border-transparent hover:border-red-500/20"
                        title="Delete"
                      >
                        <Trash2 size={13}/>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <style>{`
        .input-field { width: 100%; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.08); color: white; padding: 0.75rem 0.875rem; border-radius: 0.75rem; font-size: 0.875rem; outline: none; transition: all 0.2s; }
        .input-field:focus { border-color: rgb(52, 211, 153, 0.5); background: rgba(0,0,0,0.5); }
      `}</style>
    </div>
  );
};
