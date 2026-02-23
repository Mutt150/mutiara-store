import React, { useState } from 'react';
import { Store, TrendingUp, Wallet, Truck, DollarSign, Archive, Layers, HandCoins, BarChart3, FileText, AlertTriangle, Package, Users, User, ArrowRight } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/helpers';
import SimpleChart from '../components/ui/SimpleChart';

export default function Dashboard({ user, storeProfile, activeStoreId, stats, orders, setShowStoreModal, setShowProfileEdit, setShowWithdraw, setActiveTab }) {
    return (
        <div className="space-y-8 pb-24 md:pb-0 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex flex-col gap-2">
                    <h2 className="text-3xl font-extrabold text-gray-800 tracking-tight">Halo, {storeProfile?.ownerName || user?.displayName || user?.email?.split('@')[0]}! 👋</h2>
                    <div className="text-gray-500 text-sm font-medium flex gap-2 items-center">
                        <Store size={14}/> {storeProfile?.storeName || 'Toko Saya'}
                        {activeStoreId !== user?.uid && <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold">MODE KARYAWAN</span>}
                    </div>
                </div>
                
                <div className="flex gap-2">
                    <button onClick={() => setShowStoreModal(true)} className="flex items-center gap-2 px-4 py-2 bg-white border border-pink-200 text-pink-600 rounded-xl font-bold text-sm hover:bg-pink-50 transition-all shadow-sm">
                        <Users size={18}/> {activeStoreId === user?.uid ? "Tim" : "Ganti Toko"}
                    </button>
                    <button onClick={() => setShowProfileEdit(true)} className="relative group">
                        <div className="w-10 h-10 rounded-full bg-pink-100 border-2 border-pink-200 overflow-hidden flex items-center justify-center">
                            {storeProfile?.photoURL ? <img src={storeProfile.photoURL} alt="profile" className="w-full h-full object-cover"/> : <User size={24} className="text-pink-400"/>}
                        </div>
                        <div className="absolute top-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    </button>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-gradient-to-br from-pink-500 to-rose-500 p-6 rounded-3xl shadow-lg shadow-pink-200 text-white relative overflow-hidden group hover:scale-[1.02] hover:shadow-xl transition-all duration-300">
                    <div className="absolute top-0 right-0 p-4 opacity-10"><TrendingUp size={80}/></div>
                    <div className="text-pink-100 font-medium text-sm uppercase tracking-wider mb-2">Total Omzet</div>
                    <h3 className="text-3xl font-bold">{formatCurrency(stats.salesRevenue)}</h3>
                    <p className="text-pink-100 text-xs mt-2 opacity-80">Pendapatan Kotor</p>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-pink-100 hover:shadow-lg transition-all group hover:scale-[1.02] duration-300">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-pink-50 text-pink-600 rounded-2xl"><Wallet size={24}/></div>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-50 px-2 py-1 rounded-lg">Profit</span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800">{formatCurrency(stats.salesGrossProfit)}</h3>
                    <p className="text-xs text-gray-400 mt-1">Laba Kotor (Jual - Modal)</p>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-pink-100 hover:shadow-lg transition-all group hover:scale-[1.02] duration-300">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl"><Truck size={24}/></div>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-50 px-2 py-1 rounded-lg">Expenses</span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800">{formatCurrency(stats.orderExpenses + stats.generalExpTotal)}</h3>
                    <p className="text-xs text-gray-400 mt-1">Total Pengeluaran & Ops</p>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-emerald-100 hover:shadow-lg transition-all group hover:scale-[1.02] duration-300">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><DollarSign size={24}/></div>
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">Net Profit</span>
                    </div>
                    <h3 className="text-2xl font-bold text-emerald-600">{formatCurrency(stats.netProfitGlobal)}</h3>
                    <p className="text-xs text-gray-400 mt-1">Laba Bersih Toko</p>
                </div>
            </div>

            <h3 className="text-lg font-bold text-gray-800 mt-2">Info Modal & Stok</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-emerald-100 hover:shadow-lg transition-all group">
                    <div className="flex justify-between items-center mb-4">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><Archive size={24}/></div>
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">ASET GUDANG</span>
                    </div>
                    <h3 className="text-3xl font-bold text-gray-800">{formatCurrency(stats.totalAssetValue)}</h3>
                    <p className="text-sm text-gray-500 mt-2">Nilai uang barang yang <b>belum terjual</b>.</p>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-blue-100 hover:shadow-lg transition-all group">
                    <div className="flex justify-between items-center mb-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><Layers size={24}/></div>
                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">MODAL TERJUAL (HPP)</span>
                    </div>
                    <h3 className="text-3xl font-bold text-gray-800">{formatCurrency(stats.totalCOGS)}</h3>
                    <p className="text-sm text-gray-500 mt-2">Total modal yang sudah <b>kembali</b>.</p>
                </div>
            </div>

            <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-6 rounded-3xl shadow-xl text-white relative overflow-hidden group hover:scale-[1.01] transition-all duration-300">
                <div className="absolute top-0 right-0 p-8 opacity-10"><Wallet size={120}/></div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-1 text-gray-300">
                            <Wallet size={18}/> <span className="text-xs font-bold uppercase tracking-wider">Dompet Toko (Saldo Real)</span>
                        </div>
                        <h1 className="text-4xl font-extrabold text-white mb-2 tracking-tight">{formatCurrency(stats.cashOnHand)}</h1>
                        <div className="flex gap-4 text-xs text-gray-400 flex-wrap">
                            <span>Omzet Lunas: <span className="text-white">{formatCurrency(stats.salesRevenue)}</span></span>
                            <span>Expenses: <span className="text-white">-{formatCurrency(stats.orderExpenses + stats.generalExpTotal)}</span></span>
                            <span>Ditarik: <span className="text-orange-300">-{formatCurrency(stats.totalWithdrawals)}</span></span>
                        </div>
                    </div>
                    <button onClick={() => setShowWithdraw(true)} className="px-6 py-3 bg-white text-gray-900 rounded-xl font-bold hover:bg-gray-100 shadow-lg flex items-center gap-2">
                        <HandCoins size={18}/> Ambil Uang / Modal
                    </button>
                </div>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-pink-50 mt-4">
                <div className="flex items-center gap-2 mb-2">
                    <BarChart3 size={20} className="text-pink-600"/>
                    <h3 className="font-bold text-lg text-gray-800">Tren Penjualan (7 Hari Terakhir)</h3>
                </div>
                <SimpleChart data={orders} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-4">
                <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-pink-50 hover:shadow-md transition-shadow">
                    <div className="p-6 border-b border-pink-50 flex justify-between items-center">
                        <h3 className="font-bold text-lg text-gray-800">Transaksi Terakhir</h3>
                        <button onClick={()=>setActiveTab('history')} className="text-sm font-bold text-pink-600 hover:underline flex items-center gap-1">Lihat Semua <ArrowRight size={14}/></button>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {orders.slice(0, 5).map(o => (
                            <div key={o.id} className="p-4 hover:bg-pink-50/30 transition-colors flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center font-bold">
                                        <FileText size={18}/>
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-800 text-sm">{o.customerName || 'Pelanggan Umum'}</p>
                                        <p className="text-xs text-gray-400">{formatDate(o.date)} &bull; {o.items.length} Barang</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-gray-800">{formatCurrency(o.financials.revenue)}</p>
                                    <p className="text-xs text-emerald-500 font-medium">+{formatCurrency(o.financials.netProfit)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-3xl shadow-sm border border-pink-50 p-6 hover:shadow-md transition-shadow">
                    <h3 className="font-bold text-lg text-gray-800 mb-4">Status Gudang</h3>
                    <div className="space-y-4">
                        <div className="p-4 bg-red-50 rounded-2xl border border-red-100 flex items-center justify-between">
                            <div className="flex items-center gap-3"><AlertTriangle className="text-red-500" size={20}/><span className="text-sm font-medium text-red-700">Stok Habis</span></div>
                            <span className="font-bold text-xl text-red-700">{stats.outStock}</span>
                        </div>
                        <div className="p-4 bg-yellow-50 rounded-2xl border border-yellow-100 flex items-center justify-between">
                            <div className="flex items-center gap-3"><Package className="text-yellow-600" size={20}/><span className="text-sm font-medium text-yellow-700">Stok Menipis</span></div>
                            <span className="font-bold text-xl text-yellow-700">{stats.lowStock}</span>
                        </div>
                        <button onClick={()=>setActiveTab('inventory')} className="w-full py-3 mt-2 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-gray-800">Cek Gudang</button>
                    </div>
                </div>
            </div>
        </div>
    );
}