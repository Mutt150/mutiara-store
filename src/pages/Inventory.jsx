import React, { useState } from 'react';
import { Search, Scan, Trash2 } from 'lucide-react';
import { formatCurrency } from '../utils/helpers';

export default function Inventory({ inventory, handleDeleteInventoryItem }) {
    const [search, setSearch] = useState('');
    const filtered = inventory.filter(i =>
        i.name.toLowerCase().includes(search.toLowerCase()) ||
        (i.category && i.category.toLowerCase().includes(search.toLowerCase())) ||
        (i.barcode && i.barcode.includes(search))
    );

    return (
        <div className="pb-24 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h2 className="text-2xl font-bold text-gray-800">Stok Gudang</h2>
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                    <input className="w-full pl-10 p-3 border border-pink-100 rounded-2xl outline-none focus:ring-2 focus:ring-pink-300 transition-all" placeholder="Cari nama, barcode, kategori..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map(i => (
                    <div key={i.id} className="bg-white p-5 rounded-3xl shadow-sm border border-pink-50 hover:shadow-lg hover:-translate-y-1 transition-all group relative">
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <h3 className="font-bold text-gray-800 text-lg">{i.name}</h3>
                                <div className="flex gap-2 mt-1">
                                    <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded">{i.category || 'Umum'}</span>
                                    {i.barcode && <span className="text-[10px] bg-purple-50 text-purple-600 px-2 py-0.5 rounded flex items-center gap-1"><Scan size={10} /> {i.barcode}</span>}
                                </div>
                            </div>

                            <div className="flex flex-col items-end gap-2">
                                <span className={`px-3 py-1 rounded-lg text-xs font-bold ${i.stock <= i.minStock ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>{i.stock} {i.unit}</span>
                                <button onClick={() => handleDeleteInventoryItem(i)} className="p-2 bg-red-50 text-red-400 rounded-lg hover:bg-red-100 hover:text-red-600 transition-all" title="Hapus Barang Permanen">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                        <div className="flex justify-between text-sm text-gray-500 bg-gray-50 p-3 rounded-xl mb-2">
                            <span>Modal Avg:</span>
                            <span className="font-bold text-gray-700">{formatCurrency(i.avgCost)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-pink-600 bg-pink-50/50 p-3 rounded-xl">
                            <span>Harga Jual:</span>
                            <span className="font-bold">{i.sellPrice ? formatCurrency(i.sellPrice) : '-'}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}