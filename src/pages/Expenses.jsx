import React, { useState, useEffect, useMemo } from 'react';
import { Truck, Wallet, Trash2, Plus, History } from 'lucide-react';
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

    const ordersWithExpenses = useMemo(() => {
        if (!orders) return [];
        return orders.filter(o => o.expenses && o.expenses.length > 0);
    }, [orders]);

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

    const getSequentialID = (orderId) => {
        const index = orders.findIndex(o => o.id === orderId);
        if (index === -1) return "???";
        const num = orders.length - index;
        return `NOTA #${String(num).padStart(5, '0')}`;
    };

    return (
        <div className="pb-24 md:pb-0 animate-fade-in w-full min-w-0">
            {/* Bagian Judul */}
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Pusat Biaya & Operasional</h2>
                <p className="text-gray-500 text-sm mt-1">Kelola pengeluaran nota dan biaya umum toko</p>
            </div>

            {/* Tombol Navigasi Tab */}
            <div className="flex w-full mb-6 md:mb-8">
                <div className="flex bg-gray-100 p-1.5 rounded-2xl w-full shadow-inner">
                    <button 
                        onClick={() => setTab('nota')} 
                        className={`flex-1 px-4 py-3 md:py-3.5 rounded-xl font-bold text-sm md:text-base transition-all duration-300 ${tab === 'nota' ? 'bg-pink-600 text-white shadow-md shadow-pink-200 scale-100' : 'bg-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50 scale-[0.98]'}`}
                    >
                        Biaya per Nota
                    </button>
                    <button 
                        onClick={() => setTab('umum')} 
                        className={`flex-1 px-4 py-3 md:py-3.5 rounded-xl font-bold text-sm md:text-base transition-all duration-300 ${tab === 'umum' ? 'bg-pink-600 text-white shadow-md shadow-pink-200 scale-100' : 'bg-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50 scale-[0.98]'}`}
                    >
                        Biaya Umum Toko
                    </button>
                </div>
            </div>

            {tab === 'nota' ? (
                <div className="w-full flex flex-col gap-6 md:gap-8 min-w-0">
                    {/* BAGIAN ATAS: INPUT FORM */}
                    <div className="bg-white p-5 md:p-8 rounded-[24px] md:rounded-[32px] shadow-sm border border-pink-100 w-full min-w-0 flex flex-col">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-orange-100 text-orange-600 rounded-xl shrink-0"><Truck size={20} className="md:w-6 md:h-6" /></div>
                            <h3 className="font-bold text-lg md:text-xl text-gray-800">Input Biaya Nota (Bulk)</h3>
                        </div>
                        <p className="text-xs md:text-sm text-gray-500 mb-6 bg-pink-50 p-4 rounded-xl border border-pink-100">Masukkin semua biaya operasional kita gesss (Bensin, Makan, Parkir).</p>

                        <div className="space-y-5 w-full">
                            <div>
                                <label className="text-[10px] md:text-xs font-bold text-gray-500 ml-1 mb-1 block uppercase tracking-wider">Pilih Nota / Transaksi</label>
                                <select className="w-full p-3.5 md:p-4 border border-gray-200 rounded-2xl bg-gray-50 focus:ring-2 focus:ring-pink-300 outline-none max-w-full truncate text-sm"
                                    value={selectedOrderId} onChange={e => setSelectedOrderId(e.target.value)}>
                                    <option value="">-- Cari Nota Terakhir --</option>
                                    {recentOrders.map(o => (
                                        <option key={o.id} value={o.id}>{getSequentialID(o.id)} - {formatDate(o.date).split(',')[0]} - {o.customerName || 'Umum'} ({formatCurrency(o.financials.revenue)})</option>
                                    ))}
                                </select>
                            </div>

                            {selectedOrder && (
                                <div className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-2 animate-fade-in">
                                    <div className="flex justify-between text-sm"><span className="text-gray-500">Laba Kotor Awal:</span><span className="font-bold text-gray-800">{formatCurrency(selectedOrder.financials.grossProfit)}</span></div>
                                    <div className="flex justify-between text-sm pt-2 border-t font-bold"><span className="text-gray-500">Net Profit Saat Ini:</span><span className="text-green-600">{formatCurrency(selectedOrder.financials.netProfit)}</span></div>
                                </div>
                            )}

                            <div className="space-y-3 w-full">
                                <label className="text-[10px] md:text-xs font-bold text-gray-500 ml-1 block uppercase tracking-wider">Daftar Biaya</label>
                                {tempExpenses.map((exp, idx) => (
                                    <div key={idx} className="flex gap-2 w-full items-center">
                                        <input className="flex-[2] min-w-0 p-3 md:p-3.5 border border-gray-200 rounded-xl bg-white text-xs md:text-sm outline-none focus:ring-1 focus:ring-pink-300" placeholder="Nama Biaya (Cth: Bensin)" value={exp.name} onChange={(e) => handleExpChange(idx, 'name', e.target.value)} />
                                        <input type="number" className="flex-[1] min-w-0 p-3 md:p-3.5 border border-gray-200 rounded-xl bg-white text-xs md:text-sm outline-none focus:ring-1 focus:ring-pink-300" placeholder="Rp" value={exp.amount} onChange={(e) => handleExpChange(idx, 'amount', e.target.value)} />
                                        <button onClick={() => removeExpRow(idx)} className="p-3 md:p-3.5 shrink-0 text-red-500 hover:bg-red-50 rounded-xl transition-colors"><Trash2 size={16} /></button>
                                    </div>
                                ))}
                                <button onClick={addExpRow} className="text-xs font-bold text-pink-600 hover:text-pink-700 flex items-center gap-1 mt-2 transition-colors"><Plus size={14} /> Tambah Baris Biaya</button>
                            </div>
                            <button onClick={saveBulkExpenses} disabled={!selectedOrderId} className="w-full py-3.5 md:py-4 mt-2 bg-pink-600 text-white rounded-2xl font-bold hover:bg-pink-700 disabled:bg-gray-200 transition-all shadow-lg shadow-pink-200 disabled:shadow-none active:scale-95 text-sm md:text-base">Simpan Semua Biaya</button>
                        </div>
                    </div>

                    {/* BAGIAN BAWAH: RIWAYAT */}
                    <div className="bg-white p-5 md:p-8 rounded-[24px] md:rounded-[32px] shadow-sm border border-pink-100 w-full min-w-0 flex flex-col">
                        <div className="flex items-center gap-3 mb-4 md:mb-6">
                            <div className="p-2 md:p-3 bg-gray-100 text-gray-600 rounded-xl shrink-0"><History size={18} className="md:w-5 md:h-5"/></div>
                            <h3 className="font-bold text-base md:text-xl text-gray-800">Riwayat Biaya per Nota</h3>
                        </div>

                        <div className="overflow-x-auto custom-scrollbar w-full">
                            <table className="w-full text-left min-w-[600px] md:min-w-full">
                                <thead className="text-gray-400 text-[10px] md:text-xs uppercase font-bold border-b border-gray-100 bg-gray-50/50">
                                    <tr>
                                        <th className="p-3 md:p-4">Nota & Tanggal</th>
                                        <th className="p-3 md:p-4">Customer</th>
                                        <th className="p-3 md:p-4">Rincian Biaya</th>
                                        <th className="p-3 md:p-4 text-right">Total Biaya Ops</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 text-xs md:text-sm">
                                    {ordersWithExpenses.slice(0, 20).map(o => (
                                        <tr key={o.id} className="hover:bg-pink-50/30 transition-colors">
                                            <td className="p-3 md:p-4">
                                                <div className="font-bold text-pink-600 text-xs md:text-sm">{getSequentialID(o.id)}</div>
                                                <div className="text-[10px] md:text-xs text-gray-400">{formatDate(o.date).split(',')[0]}</div>
                                            </td>
                                            <td className="p-3 md:p-4 font-medium text-gray-700 truncate max-w-[150px]" title={o.customerName || 'Umum'}>{o.customerName || 'Umum'}</td>
                                            <td className="p-3 md:p-4">
                                                <div className="space-y-1">
                                                    {o.expenses.map((e, idx) => (
                                                        <div key={idx} className="flex justify-between text-[10px] md:text-xs gap-4 max-w-[200px] border-b border-dashed border-gray-100 pb-1 last:border-0 last:pb-0">
                                                            <span className="text-gray-500 truncate" title={e.name}>{e.name}</span>
                                                            <span className="font-bold text-gray-700 shrink-0">{formatCurrency(e.amount)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="p-3 md:p-4 text-right font-bold text-orange-500 whitespace-nowrap">
                                                -{formatCurrency(o.financials.expenseTotal || 0)}
                                            </td>
                                        </tr>
                                    ))}
                                    {ordersWithExpenses.length === 0 && (
                                        <tr>
                                            <td colSpan="4" className="text-center py-10 text-gray-400 text-xs md:text-sm border-t border-dashed border-gray-200">
                                                Belum ada riwayat biaya operasional pada nota.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 w-full min-w-0">
                    <div className="bg-white p-5 md:p-8 rounded-[24px] md:rounded-[32px] shadow-sm border border-pink-100 h-fit min-w-0 flex flex-col">
                        <div className="flex items-center gap-3 mb-6"><div className="p-3 bg-red-100 text-red-600 rounded-xl shrink-0"><Wallet size={20} className="md:w-6 md:h-6"/></div><h3 className="font-bold text-lg md:text-xl text-gray-800">Input Biaya Umum</h3></div>
                        <div className="space-y-4 md:space-y-5 w-full">
                            <div><label className="text-[10px] md:text-xs font-bold text-gray-500 ml-1 mb-1 block uppercase tracking-wider">Tanggal</label><input type="date" className="w-full p-3.5 md:p-4 border border-gray-200 rounded-2xl bg-gray-50 outline-none focus:ring-2 focus:ring-pink-300 text-sm" value={genDate} onChange={e => setGenDate(e.target.value)} /></div>
                            <div><label className="text-[10px] md:text-xs font-bold text-gray-500 ml-1 mb-1 block uppercase tracking-wider">Keperluan</label><input className="w-full p-3.5 md:p-4 border border-gray-200 rounded-2xl bg-gray-50 outline-none focus:ring-2 focus:ring-pink-300 text-sm" placeholder="Contoh: Listrik, Gaji Karyawan" value={genTitle} onChange={e => setGenTitle(e.target.value)} /></div>
                            <div><label className="text-[10px] md:text-xs font-bold text-gray-500 ml-1 mb-1 block uppercase tracking-wider">Nominal</label><input type="number" className="w-full p-3.5 md:p-4 border border-gray-200 rounded-2xl bg-gray-50 outline-none focus:ring-2 focus:ring-pink-300 text-sm" placeholder="Rp" value={genAmount} onChange={e => setGenAmount(e.target.value)} /></div>
                            <button onClick={submitGenExp} className="w-full py-3.5 md:py-4 mt-2 bg-gray-900 text-white rounded-2xl font-bold hover:bg-gray-800 transition-all shadow-lg shadow-gray-200 active:scale-95 text-sm md:text-base">Simpan Pengeluaran</button>
                        </div>
                    </div>
                    <div className="bg-white p-5 md:p-8 rounded-[24px] md:rounded-[32px] shadow-sm border border-pink-100 min-w-0 flex flex-col h-[500px] lg:h-auto">
                        <div className="flex items-center gap-3 mb-6 shrink-0">
                            <div className="p-2 md:p-3 bg-gray-100 text-gray-600 rounded-xl shrink-0"><History size={18} className="md:w-5 md:h-5"/></div>
                            <h3 className="font-bold text-base md:text-lg text-gray-800">Riwayat Pengeluaran Umum</h3>
                        </div>
                        <div className="overflow-y-auto space-y-3 pr-2 custom-scrollbar flex-1 w-full">
                            {generalExpenses.map(ge => (
                                <div key={ge.id} className="flex justify-between items-center p-3.5 md:p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-white hover:shadow-sm transition-all min-w-0 gap-3 w-full">
                                    <div className="min-w-0 flex-1">
                                        <div className="font-bold text-gray-800 text-sm md:text-base truncate block" title={ge.title}>{ge.title}</div>
                                        <div className="text-[10px] md:text-xs text-gray-400 font-medium mt-0.5 truncate block">{formatDate(ge.date)}</div>
                                    </div>
                                    <div className="text-red-500 text-xs md:text-sm font-bold bg-red-50 px-2 md:px-3 py-1.5 rounded-lg shrink-0 whitespace-nowrap">-{formatCurrency(ge.amount)}</div>
                                </div>
                            ))}
                            {generalExpenses.length === 0 && <p className="text-center text-gray-400 py-10 text-xs md:text-sm">Belum ada data pengeluaran umum</p>}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}