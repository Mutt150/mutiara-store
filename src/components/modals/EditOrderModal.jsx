import React, { useState } from 'react';
import { X, Trash2, Save, Percent } from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';

export default function EditOrderModal({ editingOrder, setEditingOrder, inventory, handleFullUpdateOrder }) {
    if (!editingOrder) return null;

    const [formData, setFormData] = useState({
        customerName: editingOrder.customerName || '',
        date: typeof editingOrder.date === 'string' ? editingOrder.date : new Date(editingOrder.date?.seconds * 1000 || Date.now()).toISOString().slice(0, 16),
        paymentMethod: editingOrder.paymentMethod || 'Cash',
        paymentStatus: editingOrder.paymentStatus || 'Lunas',
        notes: editingOrder.notes || ''
    });

    // REVISI 9: Pastikan item yang diedit memiliki properti diskon
    const [editItems, setEditItems] = useState(
        editingOrder.items.map(i => ({ ...i, discount: i.discount || 0 }))
    );

    const [newItemId, setNewItemId] = useState('');

    const handleQtyChange = (idx, newQty) => {
        const updated = [...editItems];
        updated[idx].qty = parseFloat(newQty) || 0;
        updated[idx].subtotal = updated[idx].qty * (updated[idx].price - (updated[idx].discount || 0));
        setEditItems(updated);
    };

    const handlePriceChange = (idx, newPrice) => {
        const updated = [...editItems];
        updated[idx].price = parseFloat(newPrice) || 0;
        updated[idx].subtotal = updated[idx].qty * (updated[idx].price - (updated[idx].discount || 0));
        setEditItems(updated);
    };

    // FUNGSI BARU: Untuk handle perubahan input diskon
    const handleDiscountChange = (idx, newDiscount) => {
        const updated = [...editItems];
        updated[idx].discount = parseFloat(newDiscount) || 0;
        updated[idx].subtotal = updated[idx].qty * (updated[idx].price - updated[idx].discount);
        setEditItems(updated);
    };

    const handleDeleteItem = (idx) => {
        if (window.confirm("Hapus item ini dari nota?")) {
            setEditItems(editItems.filter((_, i) => i !== idx));
        }
    };

    const handleAddItem = () => {
        if (!newItemId) return;
        const invItem = inventory.find(i => i.id === newItemId);
        if (!invItem) return;

        const existIdx = editItems.findIndex(i => i.itemId === newItemId);
        if (existIdx >= 0) {
            const updated = [...editItems];
            updated[existIdx].qty += 1;
            updated[existIdx].subtotal = updated[existIdx].qty * (updated[existIdx].price - (updated[existIdx].discount || 0));
            setEditItems(updated);
        } else {
            setEditItems([...editItems, {
                itemId: invItem.id,
                name: invItem.name,
                qty: 1,
                unit: invItem.unit,
                price: invItem.sellPrice || invItem.lastPrice || 0,
                discount: 0, // Inisiasi diskon 0 saat tambah barang baru
                subtotal: invItem.sellPrice || invItem.lastPrice || 0,
                costBasis: invItem.avgCost
            }]);
        }
        setNewItemId('');
    };

    const grandTotal = editItems.reduce((sum, i) => sum + i.subtotal, 0);

    const handleSave = () => {
        if (editItems.length === 0) return alert("Nota tidak boleh kosong itemnya!");
        handleFullUpdateOrder(editingOrder, editItems, formData);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl animate-fade-in flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-3xl shrink-0">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800">Edit Transaksi</h3>
                        <p className="text-xs text-gray-500">Nota #{editingOrder.id.slice(-4).toUpperCase()}</p>
                    </div>
                    <button onClick={() => setEditingOrder(null)} className="p-2 bg-white rounded-full hover:bg-gray-200 shadow-sm transition-colors"><X size={20} /></button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 ml-1 block mb-1">Customer</label>
                            <input className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-pink-300 transition-all text-sm" value={formData.customerName} onChange={e => setFormData({ ...formData, customerName: e.target.value })} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 ml-1 block mb-1">Tanggal</label>
                            <input type="datetime-local" className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-pink-300 transition-all text-sm" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 ml-1 block mb-1">Status</label>
                            <select className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-pink-300 text-sm" value={formData.paymentStatus} onChange={e => setFormData({ ...formData, paymentStatus: e.target.value })}>
                                <option value="Lunas">Lunas</option><option value="Belum Lunas">Belum Lunas</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 ml-1 block mb-1">Metode</label>
                            <select className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-pink-300 text-sm" value={formData.paymentMethod} onChange={e => setFormData({ ...formData, paymentMethod: e.target.value })}>
                                <option value="Cash">Cash</option><option value="QRIS">QRIS</option><option value="Transfer">Transfer</option><option value="Hutang">Hutang</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-end mb-3 border-b border-gray-100 pb-3">
                            <label className="text-sm font-bold text-gray-700">Item Pesanan</label>
                            <div className="flex gap-2 w-full md:w-2/3">
                                <select className="w-full p-2.5 text-xs bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-pink-300" value={newItemId} onChange={e => setNewItemId(e.target.value)}>
                                    <option value="">+ Tambah Barang Baru...</option>
                                    {inventory.map(i => <option key={i.id} value={i.id}>{i.name} (Sisa: {i.stock})</option>)}
                                </select>
                                <button onClick={handleAddItem} disabled={!newItemId} className="bg-pink-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 shadow-md">Add</button>
                            </div>
                        </div>

                        <div className="space-y-3 bg-gray-50/50 p-2 rounded-xl max-h-64 overflow-y-auto custom-scrollbar">
                            {editItems.map((item, idx) => (
                                <div key={idx} className="flex flex-col gap-2 bg-white p-3.5 rounded-xl border border-pink-50 shadow-sm">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="text-sm font-bold text-gray-700 leading-tight">{item.name}</div>
                                            <div className="text-[10px] text-gray-400 mt-0.5">Satuan: {item.unit}</div>
                                        </div>
                                        <button onClick={() => handleDeleteItem(idx)} className="text-red-400 hover:text-red-600 p-1.5 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"><Trash2 size={14} /></button>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2 mt-1">
                                        <div className="flex items-center bg-gray-50 rounded-lg border border-gray-200 px-1">
                                            <input type="number" className="w-12 p-1.5 text-xs bg-transparent text-center font-bold outline-none" value={item.qty} onChange={e => handleQtyChange(idx, e.target.value)} />
                                        </div>
                                        <div className="text-xs text-gray-400">x</div>
                                        <div className="flex items-center bg-gray-50 rounded-lg border border-gray-200 px-1 w-24">
                                            <input type="number" className="w-full p-1.5 text-xs bg-transparent text-center outline-none" value={item.price} onChange={e => handlePriceChange(idx, e.target.value)} />
                                        </div>
                                        
                                        {/* Input Diskon */}
                                        <div className="flex items-center gap-1 bg-orange-50 text-orange-600 rounded-lg border border-orange-100 px-2" title="Diskon (Rp)">
                                            <Percent size={12}/>
                                            <input type="number" className="w-16 p-1.5 text-xs bg-transparent text-center outline-none font-bold placeholder:text-orange-300" value={item.discount || ''} onChange={e => handleDiscountChange(idx, e.target.value)} placeholder="Diskon"/>
                                        </div>
                                        
                                        <div className="font-bold text-sm text-pink-600 ml-auto whitespace-nowrap">{formatCurrency(item.subtotal)}</div>
                                    </div>
                                </div>
                            ))}
                            {editItems.length === 0 && <div className="text-center py-4 text-xs text-gray-400">Belum ada item pesanan</div>}
                        </div>
                        <div className="flex justify-between items-center mt-4 bg-pink-50 p-4 rounded-xl border border-pink-100">
                            <span className="text-sm font-bold text-gray-700">Total Akhir:</span>
                            <span className="text-xl font-bold text-pink-600">{formatCurrency(grandTotal)}</span>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-500 ml-1 block mb-1">Catatan Tambahan</label>
                        <textarea className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-pink-300 transition-all text-sm resize-none" rows="2" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
                    </div>
                </div>

                <div className="p-6 border-t border-gray-100 flex gap-3 bg-white rounded-b-3xl shrink-0">
                    <button onClick={() => setEditingOrder(null)} className="flex-1 py-3.5 bg-gray-50 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-100 transition-colors">Batal</button>
                    <button onClick={handleSave} className="flex-[2] py-3.5 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 shadow-lg flex justify-center items-center gap-2 transition-all active:scale-95">
                        <Save size={18} /> Simpan Perubahan
                    </button>
                </div>
            </div>
        </div>
    );
}