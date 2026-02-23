import React, { useState } from 'react';
import { X, Trash2, Save } from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';

export default function EditOrderModal({ editingOrder, setEditingOrder, inventory, handleFullUpdateOrder }) {
    if (!editingOrder) return null;

    const [formData, setFormData] = useState({
        customerName: editingOrder.customerName,
        date: typeof editingOrder.date === 'string' ? editingOrder.date : new Date(editingOrder.date.seconds * 1000).toISOString().slice(0, 16),
        paymentMethod: editingOrder.paymentMethod || 'Cash',
        paymentStatus: editingOrder.paymentStatus || 'Lunas',
        notes: editingOrder.notes || ''
    });

    const [editItems, setEditItems] = useState(
        editingOrder.items.map(i => ({ ...i }))
    );

    const [newItemId, setNewItemId] = useState('');

    const handleQtyChange = (idx, newQty) => {
        const updated = [...editItems];
        updated[idx].qty = parseFloat(newQty);
        updated[idx].subtotal = updated[idx].qty * updated[idx].price;
        setEditItems(updated);
    };

    const handlePriceChange = (idx, newPrice) => {
        const updated = [...editItems];
        updated[idx].price = parseFloat(newPrice);
        updated[idx].subtotal = updated[idx].qty * updated[idx].price;
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
            updated[existIdx].subtotal = updated[existIdx].qty * updated[existIdx].price;
            setEditItems(updated);
        } else {
            setEditItems([...editItems, {
                itemId: invItem.id,
                name: invItem.name,
                qty: 1,
                unit: invItem.unit,
                price: invItem.sellPrice || invItem.lastPrice || 0,
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
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-3xl">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800">Edit Transaksi</h3>
                        <p className="text-xs text-gray-500">Nota #{editingOrder.id.slice(-4).toUpperCase()}</p>
                    </div>
                    <button onClick={() => setEditingOrder(null)} className="p-2 bg-white rounded-full hover:bg-gray-200 shadow-sm"><X size={20} /></button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 ml-1 block mb-1">Customer</label>
                            <input className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-pink-300 text-sm" value={formData.customerName} onChange={e => setFormData({ ...formData, customerName: e.target.value })} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 ml-1 block mb-1">Tanggal</label>
                            <input type="datetime-local" className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-pink-300 text-sm" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
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
                        <div className="flex justify-between items-end mb-2 border-b border-gray-100 pb-2">
                            <label className="text-sm font-bold text-gray-700">Item Pesanan</label>
                            <div className="flex gap-2 w-1/2">
                                <select className="w-full p-2 text-xs bg-gray-50 border rounded-lg" value={newItemId} onChange={e => setNewItemId(e.target.value)}>
                                    <option value="">+ Tambah Barang...</option>
                                    {inventory.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                                </select>
                                <button onClick={handleAddItem} disabled={!newItemId} className="bg-pink-600 text-white px-3 rounded-lg text-xs font-bold hover:bg-pink-700">Add</button>
                            </div>
                        </div>

                        <div className="space-y-3 bg-gray-50 p-3 rounded-xl max-h-60 overflow-y-auto custom-scrollbar">
                            {editItems.map((item, idx) => (
                                <div key={idx} className="flex flex-col gap-2 bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                                    <div className="flex justify-between items-start">
                                        <div><div className="text-xs font-bold text-gray-700">{item.name}</div><div className="text-[10px] text-gray-400">Unit: {item.unit}</div></div>
                                        <button onClick={() => handleDeleteItem(idx)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={14} /></button>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center bg-gray-50 rounded border px-1">
                                            <input type="number" className="w-12 p-1 text-xs bg-transparent text-center font-bold outline-none" value={item.qty} onChange={e => handleQtyChange(idx, e.target.value)} />
                                        </div>
                                        <div className="text-xs text-gray-400">x</div>
                                        <div className="flex-1 bg-gray-50 rounded border px-1">
                                            <input type="number" className="w-full p-1 text-xs bg-transparent text-right outline-none" value={item.price} onChange={e => handlePriceChange(idx, e.target.value)} />
                                        </div>
                                        <div className="font-bold text-xs text-pink-600 min-w-[60px] text-right">{formatCurrency(item.subtotal)}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-end mt-2 text-lg font-bold text-gray-800">Total Baru: <span className="text-pink-600 ml-2">{formatCurrency(grandTotal)}</span></div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-500 ml-1 block mb-1">Catatan</label>
                        <textarea className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-pink-300 text-sm" rows="2" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
                    </div>
                </div>

                <div className="p-6 border-t border-gray-100 flex gap-3 bg-gray-50 rounded-b-3xl">
                    <button onClick={() => setEditingOrder(null)} className="flex-1 py-3 bg-white border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-100">Batal</button>
                    <button onClick={handleSave} className="flex-[2] py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 shadow-lg shadow-gray-200 flex justify-center items-center gap-2">
                        <Save size={18} /> Simpan & Update Stok
                    </button>
                </div>
            </div>
        </div>
    );
}