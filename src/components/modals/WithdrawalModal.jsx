import React, { useState } from 'react';
import { X, HandCoins } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/helpers';

export default function WithdrawalModal({ onClose, handleWithdrawal, withdrawals, handleDeleteWithdrawal, user }) {
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

    const handleSubmit = () => {
        if (!amount) return alert("Isi jumlah uang!");
        handleWithdrawal({
            amount: parseFloat(amount),
            note: note || 'Penarikan Modal/Prive',
            date: date,
            user: user?.displayName || 'Staff'
        });
        setAmount(''); setNote('');
        onClose();
    }

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl relative flex flex-col max-h-[90vh]">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X size={18} /></button>
                <div className="text-center mb-6">
                    <div className="w-14 h-14 bg-gray-900 text-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-gray-200">
                        <HandCoins size={28} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800">Tarik Uang / Modal</h3>
                    <p className="text-xs text-gray-500">Ambil uang dari laci untuk keperluan pribadi atau simpanan bos.</p>
                </div>

                <div className="space-y-4 mb-6">
                    <div>
                        <label className="text-xs font-bold text-gray-500 ml-1">Jumlah Penarikan</label>
                        <input type="number" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-gray-300 font-bold text-lg" placeholder="Rp 0" value={amount} onChange={e => setAmount(e.target.value)} autoFocus />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 ml-1">Keterangan</label>
                        <input className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-gray-300" placeholder="Cth: Ambil Modal Balik, Gaji Bos" value={note} onChange={e => setNote(e.target.value)} />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 ml-1">Tanggal</label>
                        <input type="date" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" value={date} onChange={e => setDate(e.target.value)} />
                    </div>
                    <button onClick={handleSubmit} className="w-full py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 shadow-lg shadow-gray-200">
                        Konfirmasi Ambil Uang
                    </button>
                </div>

                <div className="border-t border-gray-100 pt-4 flex-1 overflow-hidden flex flex-col">
                    <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">Riwayat Penarikan Terakhir</h4>
                    <div className="overflow-y-auto custom-scrollbar flex-1 space-y-2 pr-1">
                        {withdrawals.map(w => (
                            <div key={w.id} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded-lg text-sm">
                                <div>
                                    <div className="font-bold text-gray-800">{w.note}</div>
                                    <div className="text-[10px] text-gray-400">{formatDate(w.date)}</div>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-red-500">-{formatCurrency(w.amount)}</div>
                                    <button onClick={() => handleDeleteWithdrawal(w.id)} className="text-[9px] text-gray-400 underline hover:text-red-500">Hapus</button>
                                </div>
                            </div>
                        ))}
                        {withdrawals.length === 0 && <p className="text-center text-gray-400 text-xs py-4">Belum ada riwayat.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}