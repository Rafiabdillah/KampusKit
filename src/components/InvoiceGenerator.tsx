import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { StorageService } from '../services/storage';
import { FileText, Plus, Trash2, Download, Send, Printer, User, Building, DollarSign , Save } from 'lucide-react';

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  clientName: string;
  clientEmail: string;
  clientAddress: string;
  items: InvoiceItem[];
  status: 'DRAFT' | 'SENT' | 'PAID';
  notes: string;
}

export const InvoiceGenerator: React.FC = () => {
  const onGainXp = useStore(state => state.gainXp);
  const userProfile = useStore(state => state.userProfile);
  
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [activeInvoice, setActiveInvoice] = useState<Invoice | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const saved = StorageService.getItem<Invoice[]>('freelance_invoices', []);
    setInvoices(saved);
  }, []);

  const saveInvoices = (data: Invoice[]) => {
    setInvoices(data);
    StorageService.setItem('freelance_invoices', data);
  };

  const createNewInvoice = () => {
    const date = new Date();
    const newInv: Invoice = {
      id: Date.now().toString(),
      invoiceNumber: `INV-${date.getFullYear()}${(date.getMonth()+1).toString().padStart(2, '0')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
      date: date.toISOString().split('T')[0],
      dueDate: new Date(date.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      clientName: '',
      clientEmail: '',
      clientAddress: '',
      items: [{ id: Date.now().toString(), description: 'Web Development Services', quantity: 1, rate: 1500000 }],
      status: 'DRAFT',
      notes: 'Thank you for your business!'
    };
    setActiveInvoice(newInv);
    setShowModal(true);
  };

  const updateItem = (itemId: string, field: keyof InvoiceItem, value: any) => {
    if (!activeInvoice) return;
    setActiveInvoice({
      ...activeInvoice,
      items: activeInvoice.items.map(i => i.id === itemId ? { ...i, [field]: value } : i)
    });
  };

  const addItem = () => {
    if (!activeInvoice) return;
    setActiveInvoice({
      ...activeInvoice,
      items: [...activeInvoice.items, { id: Date.now().toString(), description: '', quantity: 1, rate: 0 }]
    });
  };

  const removeItem = (itemId: string) => {
    if (!activeInvoice) return;
    setActiveInvoice({
      ...activeInvoice,
      items: activeInvoice.items.filter(i => i.id !== itemId)
    });
  };

  const calculateTotal = (items: InvoiceItem[]) => {
    return items.reduce((acc, item) => acc + (item.quantity * item.rate), 0);
  };

  const saveActiveInvoice = () => {
    if (!activeInvoice) return;
    
    // Check if updating or creating
    const existing = invoices.find(i => i.id === activeInvoice.id);
    let updated: Invoice[];
    if (existing) {
      updated = invoices.map(i => i.id === activeInvoice.id ? activeInvoice : i);
    } else {
      updated = [activeInvoice, ...invoices];
    }
    
    saveInvoices(updated);
    setShowModal(false);
    
    if (!existing && onGainXp) {
        onGainXp(150); // XP for creating invoice
    }
  };

  const markAsPaid = (id: string) => {
    const updated = invoices.map(i => i.id === id ? { ...i, status: 'PAID' as const } : i);
    saveInvoices(updated);
    if (onGainXp) onGainXp(500); // Big XP for getting paid!
  };

  // Mock download functionality
  const downloadInvoice = () => {
    alert("Invoice downloaded as PDF (Mock)");
  };

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-white flex items-center gap-2">
            <FileText className="text-blue-500" />
            Mini ERP: Invoices
          </h2>
          <p className="text-zinc-400 mt-1">Manage freelance clients, send invoices, and track payments.</p>
        </div>
        <button 
          onClick={createNewInvoice}
          className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-5 rounded-2xl flex items-center gap-2 shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all active:scale-95"
        >
          <Plus size={20} />
          New Invoice
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
            <FileText className="text-blue-500" size={24} />
          </div>
          <div>
            <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-0.5">Total Invoices</p>
            <p className="text-2xl font-black text-white">{invoices.length}</p>
          </div>
        </div>
        <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
            <DollarSign className="text-green-500" size={24} />
          </div>
          <div>
            <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-0.5">Total Paid</p>
            <p className="text-2xl font-black text-white">
               Rp {invoices.filter(i => i.status === 'PAID').reduce((acc, inv) => acc + calculateTotal(inv.items), 0).toLocaleString('id-ID')}
            </p>
          </div>
        </div>
        <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
            <Building className="text-amber-500" size={24} />
          </div>
          <div>
            <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-0.5">Pending / Draft</p>
            <p className="text-2xl font-black text-white">
               Rp {invoices.filter(i => i.status !== 'PAID').reduce((acc, inv) => acc + calculateTotal(inv.items), 0).toLocaleString('id-ID')}
            </p>
          </div>
        </div>
      </div>

      {/* Invoice List */}
      <div className="flex-1 bg-zinc-900/50 border border-white/5 rounded-3xl overflow-hidden flex flex-col">
         <div className="p-4 border-b border-white/5 bg-zinc-800/20">
           <h3 className="font-bold text-white">Recent Invoices</h3>
         </div>
         <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
            {invoices.length === 0 ? (
               <div className="h-full flex flex-col items-center justify-center text-center opacity-50 p-6">
                 <FileText size={48} className="mb-4 text-zinc-600" />
                 <p className="text-lg font-bold text-white mb-2">No invoices yet.</p>
                 <p className="text-sm text-zinc-400">Create your first invoice to get paid for your skills.</p>
               </div>
            ) : (
               <table className="w-full text-left border-collapse">
                 <thead>
                   <tr className="text-xs text-zinc-500 uppercase tracking-widest border-b border-white/5">
                     <th className="p-4 font-bold">Invoice #</th>
                     <th className="p-4 font-bold">Client</th>
                     <th className="p-4 font-bold">Date</th>
                     <th className="p-4 font-bold text-right">Amount</th>
                     <th className="p-4 font-bold text-center">Status</th>
                     <th className="p-4 font-bold text-center">Actions</th>
                   </tr>
                 </thead>
                 <tbody>
                   {invoices.map(inv => (
                     <tr key={inv.id} className="border-b border-white/5 hover:bg-zinc-800/30 transition-colors">
                       <td className="p-4 font-mono text-sm text-white">{inv.invoiceNumber}</td>
                       <td className="p-4 font-bold text-white">{inv.clientName || 'Unnamed Client'}</td>
                       <td className="p-4 text-sm text-zinc-400">{inv.date}</td>
                       <td className="p-4 font-bold text-white text-right">Rp {calculateTotal(inv.items).toLocaleString('id-ID')}</td>
                       <td className="p-4 text-center">
                         <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                           inv.status === 'PAID' ? 'bg-green-500/20 text-green-400' :
                           inv.status === 'SENT' ? 'bg-blue-500/20 text-blue-400' :
                           'bg-zinc-700/50 text-zinc-400'
                         }`}>
                           {inv.status}
                         </span>
                       </td>
                       <td className="p-4 text-center">
                         <div className="flex justify-center gap-2">
                           <button 
                             onClick={() => { setActiveInvoice(inv); setShowModal(true); }}
                             className="p-2 hover:bg-zinc-700 rounded-lg text-zinc-400 hover:text-white transition-colors"
                             title="Edit"
                           >
                             <FileText size={16} />
                           </button>
                           {inv.status !== 'PAID' && (
                             <button 
                               onClick={() => markAsPaid(inv.id)}
                               className="p-2 hover:bg-green-500/20 rounded-lg text-zinc-400 hover:text-green-400 transition-colors"
                               title="Mark as Paid"
                             >
                               <DollarSign size={16} />
                             </button>
                           )}
                         </div>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
            )}
         </div>
      </div>

      {/* MODAL EDIT/CREATE INVOICE */}
      {showModal && activeInvoice && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-4 bg-black/90 backdrop-blur-md">
          <div className="bg-[#111113] md:border md:border-white/10 md:rounded-3xl w-full h-full md:h-auto md:max-h-[95vh] md:max-w-4xl flex flex-col overflow-hidden shadow-2xl">
            
            {/* Modal Header */}
            <div className="p-4 md:p-6 border-b border-white/5 flex justify-between items-center bg-black/20">
               <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <FileText className="text-blue-500" />
                    {activeInvoice.id ? 'Edit Invoice' : 'New Invoice'}
                  </h3>
               </div>
               <div className="flex gap-2">
                 <button onClick={downloadInvoice} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl text-sm transition-colors flex items-center gap-2">
                   <Download size={16} /> <span className="hidden md:inline">Download PDF</span>
                 </button>
                 <button onClick={saveActiveInvoice} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm transition-colors flex items-center gap-2">
                   <Save size={16} /> Save
                 </button>
                 <button onClick={() => setShowModal(false)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 transition-colors">
                   X
                 </button>
               </div>
            </div>

            {/* Modal Body - Split Layout */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 flex flex-col md:flex-row gap-6">
               
               {/* Left Col: Details */}
               <div className="flex-1 space-y-6">
                 
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Invoice No.</label>
                      <input 
                        type="text" 
                        value={activeInvoice.invoiceNumber}
                        onChange={e => setActiveInvoice({...activeInvoice, invoiceNumber: e.target.value})}
                        className="w-full bg-zinc-900 border border-white/10 rounded-xl p-3 text-white font-mono focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Status</label>
                      <select 
                        value={activeInvoice.status}
                        onChange={e => setActiveInvoice({...activeInvoice, status: e.target.value as any})}
                        className="w-full bg-zinc-900 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500 transition-colors appearance-none"
                      >
                        <option value="DRAFT">Draft</option>
                        <option value="SENT">Sent</option>
                        <option value="PAID">Paid</option>
                      </select>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Issue Date</label>
                      <input 
                        type="date" 
                        value={activeInvoice.date}
                        onChange={e => setActiveInvoice({...activeInvoice, date: e.target.value})}
                        className="w-full bg-zinc-900 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Due Date</label>
                      <input 
                        type="date" 
                        value={activeInvoice.dueDate}
                        onChange={e => setActiveInvoice({...activeInvoice, dueDate: e.target.value})}
                        className="w-full bg-zinc-900 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                 </div>

                 <div className="bg-zinc-800/40 p-5 rounded-2xl border border-white/5 space-y-4">
                    <h4 className="font-bold text-white flex items-center gap-2 border-b border-white/5 pb-2">
                       <User size={16} className="text-zinc-400" /> Client Details
                    </h4>
                    <div>
                      <input 
                        type="text" 
                        placeholder="Client Name / Company"
                        value={activeInvoice.clientName}
                        onChange={e => setActiveInvoice({...activeInvoice, clientName: e.target.value})}
                        className="w-full bg-zinc-900 border border-white/10 rounded-xl p-3 text-white font-bold focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                    <div>
                      <input 
                        type="email" 
                        placeholder="client@email.com"
                        value={activeInvoice.clientEmail}
                        onChange={e => setActiveInvoice({...activeInvoice, clientEmail: e.target.value})}
                        className="w-full bg-zinc-900 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                    <div>
                      <textarea 
                        placeholder="Billing Address"
                        rows={2}
                        value={activeInvoice.clientAddress}
                        onChange={e => setActiveInvoice({...activeInvoice, clientAddress: e.target.value})}
                        className="w-full bg-zinc-900 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500 transition-colors resize-none"
                      />
                    </div>
                 </div>

               </div>

               {/* Right Col: Items & Total */}
               <div className="flex-[1.5] flex flex-col h-full bg-zinc-800/40 rounded-2xl border border-white/5 p-5">
                  <h4 className="font-bold text-white border-b border-white/5 pb-3 mb-3">Line Items</h4>
                  
                  <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
                    {activeInvoice.items.map((item, idx) => (
                      <div key={item.id} className="group relative bg-zinc-900 border border-white/10 rounded-xl p-3">
                         <div className="flex gap-2">
                            <div className="flex-1">
                              <input 
                                type="text"
                                placeholder="Description of service/product"
                                value={item.description}
                                onChange={e => updateItem(item.id, 'description', e.target.value)}
                                className="w-full bg-transparent text-white font-medium focus:outline-none border-b border-white/10 focus:border-blue-500 pb-1 mb-2"
                              />
                              <div className="flex gap-4">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-zinc-500">Qty:</span>
                                  <input 
                                    type="number"
                                    min="1"
                                    value={item.quantity}
                                    onChange={e => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                                    className="w-16 bg-zinc-800 rounded p-1 text-white text-center font-mono text-sm focus:outline-none"
                                  />
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-zinc-500">Rate: Rp</span>
                                  <input 
                                    type="number"
                                    value={item.rate}
                                    onChange={e => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                                    className="w-32 bg-zinc-800 rounded p-1 text-white font-mono text-sm focus:outline-none"
                                  />
                                </div>
                              </div>
                            </div>
                            <div className="w-32 flex flex-col items-end justify-between">
                              <button onClick={() => removeItem(item.id)} className="text-zinc-600 hover:text-red-400 transition-colors">
                                <Trash2 size={16} />
                              </button>
                              <div className="font-bold text-white whitespace-nowrap">
                                Rp {(item.quantity * item.rate).toLocaleString('id-ID')}
                              </div>
                            </div>
                         </div>
                      </div>
                    ))}
                    
                    <button onClick={addItem} className="w-full py-3 border border-dashed border-white/20 rounded-xl text-sm font-bold text-zinc-400 hover:text-white hover:border-white/40 transition-colors flex items-center justify-center gap-2">
                      <Plus size={16} /> Add Item
                    </button>
                  </div>
                  
                  {/* Totals Footer */}
                  <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
                     <div className="flex justify-between text-zinc-400 text-sm">
                       <span>Subtotal</span>
                       <span>Rp {calculateTotal(activeInvoice.items).toLocaleString('id-ID')}</span>
                     </div>
                     <div className="flex justify-between items-center text-white">
                       <span className="font-bold text-lg">Total</span>
                       <span className="font-black text-2xl text-blue-400">Rp {calculateTotal(activeInvoice.items).toLocaleString('id-ID')}</span>
                     </div>
                  </div>
                  
                  <div className="mt-4">
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Notes / Terms</label>
                    <textarea 
                      rows={2}
                      value={activeInvoice.notes}
                      onChange={e => setActiveInvoice({...activeInvoice, notes: e.target.value})}
                      className="w-full bg-zinc-900 border border-white/10 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors resize-none"
                    />
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
