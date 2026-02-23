import React, { useState, useEffect } from 'react';
import { Truck, Wallet, Trash2, Plus } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/helpers';

export default function Expenses({ orders, generalExpenses, handleUpdateOrderExpenses, handleGeneralExpense }) {
    const [tab, setTab] = useState('nota');
    const [selectedOrderId, setSelectedOrderId] = useState('');
    const [tempExpenses, setTempExpenses] = useState([{ name: '', amount: '' }]);
    const [genDate, setGenDate] = useState(new Date().toISOString().slice(0, 10));
    const [genTitle, setGenTitle] = useState('');
    const [genAmount, setGenAmount] = useState('');

    const recentOrders = orders.slice(0, 50);
    const selectedOrder = orders.find(o => o.id === selectedOrderId);

    useEffect(() => {
        if (selectedOrder && selectedOrder.expenses) {
            setTempExpenses(selectedOrder.expenses.length > 0 ? selectedOrder.expenses : [{ name: '', amount: '' }]);
        } else {
            setTempExpenses([{ name: '', amount: '' }]);
        }
    }, [selectedOrderId, selectedOrder]);

    const handleExpChange = (index, field, value) => {
        const newExps = [...tempExpenses];
        newExps[index][field] = value;
        setTempExpenses(newExps);
    };

    const addExpRow = () => setTempExpenses([...tempExpenses, { name: '', amount: '' }]);
    const removeExpRow = (index) => {
        const newExps = tempExpenses.filter((_, i) => i !== index);
        setTempExpenses(newExps.length ? newExps : [{ name: '', amount: '' }]);
    };

    const saveBulkExpenses = async () => {
        if (!selectedOrderId) return;
        const cleanExpenses = tempExpenses.filter(e => e.name && e.amount);
        const success = await handleUpdateOrderExpenses(selectedOrderId, cleanExpenses);
        if (success) { alert("Semua biaya berhasil disimpan!"); }
    };

    const submitGenExp = () => {
        handleGeneralExpense({ date: genDate, title: genTitle, amount: parseFloat(genAmount) });
        setGenTitle(''); setGenAmount('');
    };

    return (
        <div className="pb-24 md:pb-0 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div><h2 className="text-2xl font-bold text-gray-800">Pusat Biaya & Operasional</h2><p className="text-gray-500 text-sm">Kelola pengeluaran nota dan biaya umum toko</p></div>
                <div className="flex bg-gray-100 p-1.5 rounded-2xl w-full md:w-auto">
                    <button onClick={() => setTab('nota')} className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${tab === 'nota' ? 'bg-white shadow-sm text-pink-600' : 'text-gray-500 hover:text-gray-700'}`}>Biaya per Nota</button>
                    <button onClick={() => setTab('umum')} className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${tab === 'umum' ? 'bg-white shadow-sm text-pink-600' : 'text-gray-500 hover:text-gray-700'}`}>Biaya Umum Toko</button>
                </div>
            </div>

            {tab === 'nota' ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-pink-100">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-orange-100 text-orange-600 rounded-xl"><Truck size={24} /></div>
                            <h3 className="font-bold text-xl text-gray-800">Input Biaya Nota (Bulk)</h3>
                        </div>
                        <p className="text-sm text-gray-500 mb-6 bg-pink-50 p-4 rounded-xl border border-pink-100">Masukkin semua biaya operasional kita gesss (Bensin, Makan, Parkir).</p>

                        <div className="space-y-5">
                            <div>
                                <label className="text-xs font-bold text-gray-500 ml-1 mb-1 block">Pilih Nota / Transaksi</label>
                                <select className="w-full p-4 border border-gray-200 rounded-2xl bg-gray-50 focus:ring-2 focus:ring-pink-300 outline-none max-w-full"
                                    value={selectedOrderId} onChange={e => setSelectedOrderId(e.target.value)}>
                                    <option value="">-- Cari Nota Terakhir --</option>
                                    {recentOrders.map(o => (
                                        <option key={o.id} value={o.id}>{formatDate(o.date)} - {o.customerName || 'No Name'} - {formatCurrency(o.financials.revenue)}</option>
                                    ))}
                                </select>
                            </div>

                            {selectedOrder && (
                                <div className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-2">
                                    <div className="flex justify-between text-sm"><span className="text-gray-500">Laba Kotor:</span><span className="font-bold text-gray-800">{formatCurrency(selectedOrder.financials.grossProfit)}</span></div>
                                    <div className="flex justify-between text-sm pt-2 border-t font-bold"><span className="text-gray-500">Net Profit Saat Ini:</span><span className="text-green-600">{formatCurrency(selectedOrder.financials.netProfit)}</span></div>
                                </div>
                            )}

                            <div className="space-y-3">
                                <label className="text-xs font-bold text-gray-500 ml-1 block">Daftar Biaya</label>
                                {tempExpenses.map((exp, idx) => (
                                    <div key={idx} className="flex gap-2">
                                        <input className="flex-[2] p-3 border border-gray-200 rounded-xl bg-white text-sm outline-none focus:ring-1 focus:ring-pink-300 w-full" placeholder="Nama Biaya" value={exp.name} onChange={(e) => handleExpChange(idx, 'name', e.target.value)} />
                                        <input type="number" className="flex-1 p-3 border border-gray-200 rounded-xl bg-white text-sm outline-none focus:ring-1 focus:ring-pink-300 w-24" placeholder="Rp" value={exp.amount} onChange={(e) => handleExpChange(idx, 'amount', e.target.value)} />
                                        <button onClick={() => removeExpRow(idx)} className="p-3 text-red-500 hover:bg-red-50 rounded-xl"><Trash2 size={16} /></button>
                                    </div>
                                ))}
                                <button onClick={addExpRow} className="text-xs font-bold text-pink-600 hover:text-pink-700 flex items-center gap-1 mt-2"><Plus size={14} /> Tambah Baris Biaya</button>
                            </div>
                            <button onClick={saveBulkExpenses} disabled={!selectedOrderId} className="w-full py-4 bg-pink-600 text-white rounded-2xl font-bold hover:bg-pink-700 disabled:bg-gray-200 transition-all shadow-lg shadow-pink-200 disabled:shadow-none">Simpan Semua Biaya</button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-pink-100 h-fit">
                        <div className="flex items-center gap-3 mb-6"><div className="p-3 bg-red-100 text-red-600 rounded-xl"><Wallet size={24} /></div><h3 className="font-bold text-xl text-gray-800">Input Biaya Umum</h3></div>
                        <div className="space-y-5">
                            <div><label className="text-xs font-bold text-gray-500 ml-1 mb-1 block">Tanggal</label><input type="date" className="w-full p-4 border border-gray-200 rounded-2xl bg-gray-50 outline-none focus:ring-2 focus:ring-pink-300" value={genDate} onChange={e => setGenDate(e.target.value)} /></div>
                            <div><label className="text-xs font-bold text-gray-500 ml-1 mb-1 block">Keperluan</label><input className="w-full p-4 border border-gray-200 rounded-2xl bg-gray-50 outline-none focus:ring-2 focus:ring-pink-300" placeholder="Contoh: Listrik, Gaji Karyawan" value={genTitle} onChange={e => setGenTitle(e.target.value)} /></div>
                            <div><label className="text-xs font-bold text-gray-500 ml-1 mb-1 block">Nominal</label><input type="number" className="w-full p-4 border border-gray-200 rounded-2xl bg-gray-50 outline-none focus:ring-2 focus:ring-pink-300" placeholder="Rp" value={genAmount} onChange={e => setGenAmount(e.target.value)} /></div>
                            <button onClick={submitGenExp} className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-gray-800 transition-all shadow-lg shadow-gray-200">Simpan Pengeluaran</button>
                        </div>
                    </div>
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-pink-100">
                        <h3 className="font-bold text-gray-800 mb-6">Riwayat Pengeluaran Umum</h3>
                        <div className="max-h-[500px] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                            {generalExpenses.map(ge => (
                                <div key={ge.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-white hover:shadow-sm transition-all">
                                    <div><div className="font-bold text-gray-800">{ge.title}</div><div className="text-xs text-gray-400 font-medium">{formatDate(ge.date)}</div></div>
                                    <div className="text-red-500 font-bold bg-red-50 px-3 py-1 rounded-lg">-{formatCurrency(ge.amount)}</div>
                                </div>
                            ))}
                            {generalExpenses.length === 0 && <p className="text-center text-gray-400 py-10">Belum ada data</p>}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}