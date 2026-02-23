import React, { useState, useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';

export default function EditRestockModal({ editingRestock, setEditingRestock, inventory, handleUpdateRestock }) {
    if (!editingRestock) return null;

    const [formData, setFormData] = useState({
        itemName: editingRestock.itemName || '',
        barcode: editingRestock.barcode || '',
        category: editingRestock.category || 'Umum',
        qty: editingRestock.qty || 0,
        unit: editingRestock.unit || 'pcs',
        pricePerUnit: editingRestock.pricePerUnit || 0,
        supplier: editingRestock.supplier || '',
        sellPrice: '',
        inputDate: editingRestock.inputDate || new Date().toISOString().slice(0, 16)
    });

    useEffect(() => {
        const item = inventory.find(i => i.id === editingRestock.itemId);
        if (item) {
            setFormData(prev => ({ ...prev, sellPrice: item.sellPrice || item.lastPrice || '' }));
        }
    }, [inventory, editingRestock.itemId]);

    const handleSave = () => {
        if (!formData.itemName || !formData.qty || !formData.pricePerUnit) return alert("Lengkapi data!");
        handleUpdateRestock(editingRestock.id, formData);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6 relative overflow-y-auto max-h-[90vh]">
                <button onClick={() => setEditingRestock(null)} className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X size={18} /></button>
                <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-gray-800">Edit Data Masuk</h3>
                    <p className="text-xs text-gray-500">Koreksi typo, tanggal, atau harga.</p>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-gray-500 ml-1">Tanggal Masuk</label>
                        <input type="datetime-local" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold" value={formData.inputDate} onChange={e => setFormData({ ...formData, inputDate: e.target.value })} />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-500 ml-1">Nama Barang</label>
                        <input className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl" value={formData.itemName} onChange={e => setFormData({ ...formData, itemName: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-bold text-gray-500 ml-1">Barcode</label>
                            <input className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl" value={formData.barcode} onChange={e => setFormData({ ...formData, barcode: e.target.value })} placeholder="Scan/Ketik..." />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 ml-1">Kategori</label>
                            <input className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-bold text-gray-500 ml-1">Jumlah</label>
                            <input type="number" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold" value={formData.qty} onChange={e => setFormData({ ...formData, qty: e.target.value })} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 ml-1">Harga Beli / Unit</label>
                            <input type="number" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl" value={formData.pricePerUnit} onChange={e => setFormData({ ...formData, pricePerUnit: e.target.value })} />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-pink-500 ml-1">Harga Jual (Update)</label>
                        <input type="number" className="w-full p-3 bg-pink-50 border border-pink-100 rounded-xl font-bold text-pink-700" value={formData.sellPrice} onChange={e => setFormData({ ...formData, sellPrice: e.target.value })} placeholder="Rp..." />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-500 ml-1">Supplier</label>
                        <input className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl" value={formData.supplier} onChange={e => setFormData({ ...formData, supplier: e.target.value })} />
                    </div>

                    <div className="bg-yellow-50 p-3 rounded-xl border border-yellow-100 text-xs text-yellow-700">
                        <AlertTriangle size={14} className="inline mr-1" />
                        Mengubah jumlah/harga akan otomatis menyesuaikan stok & HPP gudang.
                    </div>

                    <button onClick={handleSave} className="w-full py-3 bg-pink-600 text-white font-bold rounded-xl hover:bg-pink-700 shadow-lg shadow-pink-200">
                        Simpan Perubahan
                    </button>
                </div>
            </div>
        </div>
    );
}