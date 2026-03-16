import React from 'react';
import { Store, TrendingUp, Wallet, Truck, DollarSign, Archive, Layers, HandCoins, BarChart3, FileText, AlertTriangle, Package, Users, User, ArrowRight, Activity, ShoppingCart, PackagePlus } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/helpers';
import SimpleChart from '../components/ui/SimpleChart';

export default function Dashboard({ user, storeProfile, activeStoreId, stats, orders, recentActivities, setShowStoreModal, setShowProfileEdit, setShowWithdraw, setActiveTab }) {
    return (
        <div className="flex flex-col gap-6 pb-24 md:pb-0 animate-fade-in w-full max-w-full min-w-0 overflow-x-hidden">
            {/* Bagian Header Welcome */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 w-full">
                <div className="flex flex-col gap-1 min-w-0 w-full">
                    <h2 className="text-2xl md:text-3xl font-extrabold text-gray-800 tracking-tight truncate">Halo, {storeProfile?.ownerName || user?.displayName || user?.email?.split('@')[0]}! 👋</h2>
                    <div className="text-gray-500 text-xs md:text-sm font-medium flex gap-2 items-center truncate">
                        <Store size={14} className="shrink-0"/> <span className="truncate">{storeProfile?.storeName || 'Toko Saya'}</span>
                        {activeStoreId !== user?.uid && <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold shrink-0">MODE KARYAWAN</span>}
                    </div>
                </div>
                
                <div className="flex gap-2 shrink-0 self-start md:self-auto mt-2 md:mt-0">
                    <button onClick={() => setShowStoreModal(true)} className="flex items-center gap-2 px-3 py-2 md:px-4 bg-white border border-pink-200 text-pink-600 rounded-xl font-bold text-xs md:text-sm hover:bg-pink-50 transition-all shadow-sm">
                        <Users size={16}/> {activeStoreId === user?.uid ? "Tim" : "Ganti Toko"}
                    </button>
                    <button onClick={() => setShowProfileEdit(true)} className="relative group">
                        <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-pink-100 border-2 border-pink-200 overflow-hidden flex items-center justify-center">
                            {storeProfile?.photoURL ? <img src={storeProfile.photoURL} alt="profile" className="w-full h-full object-cover"/> : <User size={20} className="text-pink-400"/>}
                        </div>
                        <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></div>
                    </button>
                </div>
            </div>
            
            {/* Bagian Ringkasan 4 Kartu */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5 w-full">
                <div className="bg-gradient-to-br from-pink-500 to-rose-500 p-4 md:p-6 rounded-[20px] md:rounded-[24px] shadow-sm text-white relative overflow-hidden flex flex-col justify-center min-w-0 w-full">
                    <div className="absolute top-0 right-0 p-3 opacity-10"><TrendingUp size={60}/></div>
                    <div className="text-pink-100 font-medium text-[9px] md:text-xs uppercase tracking-wider mb-1 truncate">Total Omzet</div>
                    <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold truncate block w-full" title={formatCurrency(stats.salesRevenue)}>{formatCurrency(stats.salesRevenue)}</h3>
                </div>
                <div className="bg-white p-4 md:p-6 rounded-[20px] md:rounded-[24px] shadow-sm border border-pink-100 flex flex-col justify-center min-w-0 w-full">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 md:p-2 bg-pink-50 text-pink-600 rounded-lg shrink-0"><Wallet size={14}/></div>
                        <span className="text-[9px] md:text-xs font-bold text-gray-400 uppercase tracking-wider truncate">Profit</span>
                    </div>
                    <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 truncate block w-full" title={formatCurrency(stats.salesGrossProfit)}>{formatCurrency(stats.salesGrossProfit)}</h3>
                </div>
                <div className="bg-white p-4 md:p-6 rounded-[20px] md:rounded-[24px] shadow-sm border border-pink-100 flex flex-col justify-center min-w-0 w-full">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 md:p-2 bg-orange-50 text-orange-600 rounded-lg shrink-0"><Truck size={14}/></div>
                        <span className="text-[9px] md:text-xs font-bold text-gray-400 uppercase tracking-wider truncate">Expenses</span>
                    </div>
                    <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 truncate block w-full" title={formatCurrency(stats.orderExpenses + stats.generalExpTotal)}>{formatCurrency(stats.orderExpenses + stats.generalExpTotal)}</h3>
                </div>
                <div className="bg-white p-4 md:p-6 rounded-[20px] md:rounded-[24px] shadow-sm border border-emerald-100 flex flex-col justify-center min-w-0 w-full">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 md:p-2 bg-emerald-50 text-emerald-600 rounded-lg shrink-0"><DollarSign size={14}/></div>
                        <span className="text-[9px] md:text-xs font-bold text-emerald-600 uppercase tracking-wider truncate">Net Profit</span>
                    </div>
                    <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-emerald-600 truncate block w-full" title={formatCurrency(stats.netProfitGlobal)}>{formatCurrency(stats.netProfitGlobal)}</h3>
                </div>
            </div>

            {/* Bagian Status Modal & Aset */}
            <div className="grid grid-cols-2 gap-3 md:gap-5 w-full">
                <div className="bg-white p-4 md:p-6 rounded-[20px] md:rounded-[24px] shadow-sm border border-emerald-100 min-w-0">
                    <div className="flex items-center gap-2 mb-2 md:mb-4">
                        <div className="p-1.5 md:p-2.5 bg-emerald-50 text-emerald-600 rounded-xl shrink-0"><Archive size={16}/></div>
                        <span className="text-[9px] md:text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full truncate">ASET GUDANG</span>
                    </div>
                    <h3 className="text-lg sm:text-2xl md:text-3xl font-bold text-gray-800 truncate block w-full" title={formatCurrency(stats.totalAssetValue)}>{formatCurrency(stats.totalAssetValue)}</h3>
                </div>
                <div className="bg-white p-4 md:p-6 rounded-[20px] md:rounded-[24px] shadow-sm border border-blue-100 min-w-0">
                    <div className="flex items-center gap-2 mb-2 md:mb-4">
                        <div className="p-1.5 md:p-2.5 bg-blue-50 text-blue-600 rounded-xl shrink-0"><Layers size={16}/></div>
                        <span className="text-[9px] md:text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full truncate">MODAL TERJUAL</span>
                    </div>
                    <h3 className="text-lg sm:text-2xl md:text-3xl font-bold text-gray-800 truncate block w-full" title={formatCurrency(stats.totalCOGS)}>{formatCurrency(stats.totalCOGS)}</h3>
                </div>
            </div>

            {/* Bagian Uang Laci / Dompet */}
            <div className="bg-slate-900 p-5 md:p-8 rounded-[24px] shadow-xl text-white relative overflow-hidden w-full min-w-0">
                <div className="absolute top-0 right-0 p-6 opacity-5"><Wallet size={100}/></div>
                <div className="relative z-10 flex flex-col gap-4 w-full">
                    <div className="min-w-0 w-full flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-gray-400">
                            <Wallet size={14}/> <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest">Dompet Toko (Saldo)</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight truncate block w-full" title={formatCurrency(stats.cashOnHand)}>{formatCurrency(stats.cashOnHand)}</h1>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px] md:text-xs text-gray-400 mt-2">
                            <div className="truncate">Omzet: <span className="text-white">{formatCurrency(stats.salesRevenue)}</span></div>
                            <div className="truncate">Keluar: <span className="text-white">-{formatCurrency(stats.orderExpenses + stats.generalExpTotal)}</span></div>
                            <div className="truncate">Tarik: <span className="text-orange-400">-{formatCurrency(stats.totalWithdrawals)}</span></div>
                        </div>
                    </div>
                    <button onClick={() => setShowWithdraw(true)} className="w-full sm:w-fit px-5 py-3 md:py-3.5 bg-white text-gray-900 rounded-xl font-bold hover:bg-gray-100 shadow-md flex items-center justify-center gap-2 active:scale-95 text-xs md:text-sm mt-2">
                        <HandCoins size={16}/> Ambil Uang Modal
                    </button>
                </div>
            </div>

            {/* Bagian Chart Tren */}
            <div className="bg-white p-4 md:p-6 rounded-[24px] shadow-sm border border-pink-50 w-full min-w-0">
                <div className="flex items-center gap-2 mb-3">
                    <BarChart3 size={18} className="text-pink-600 shrink-0"/>
                    <h3 className="font-bold text-sm md:text-lg text-gray-800">Tren Penjualan (7 Hari)</h3>
                </div>
                <div className="w-full overflow-x-auto custom-scrollbar pb-2">
                    <div className="min-w-[450px]">
                        <SimpleChart data={orders} />
                    </div>
                </div>
            </div>

            {/* Susunan Kolom Bawah (Flex Column di HP, 3 Kolom di Desktop) */}
            <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6 w-full min-w-0">
                
                {/* Kolom Kiri: Transaksi & Aktivitas */}
                <div className="lg:col-span-2 flex flex-col gap-6 min-w-0 w-full">
                    
                    <div className="bg-white rounded-[24px] shadow-sm border border-pink-50 flex flex-col w-full min-w-0">
                        <div className="p-4 md:p-6 border-b border-pink-50 flex justify-between items-center">
                            <h3 className="font-bold text-sm md:text-lg text-gray-800">Transaksi Terakhir</h3>
                            <button onClick={()=>setActiveTab('history')} className="text-xs font-bold text-pink-600 hover:underline flex items-center gap-1">Semua <ArrowRight size={12}/></button>
                        </div>
                        <div className="divide-y divide-gray-50 flex-1">
                            {orders.slice(0, 5).map(o => (
                                <div key={o.id} className="p-4 flex justify-between items-center gap-2 min-w-0">
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-pink-50 text-pink-600 flex items-center justify-center shrink-0">
                                            <FileText size={16}/>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-bold text-gray-800 text-xs md:text-sm truncate block" title={o.customerName || 'Umum'}>{o.customerName || 'Umum'}</p>
                                            <p className="text-[9px] md:text-xs text-gray-400 truncate">{formatDate(o.date).split(',')[0]} &bull; {o.items.length} Brg</p>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="font-bold text-gray-800 text-xs md:text-sm truncate max-w-[80px] md:max-w-none">{formatCurrency(o.financials.revenue)}</p>
                                        <p className="text-[9px] md:text-[10px] text-emerald-500 font-bold truncate max-w-[80px] md:max-w-none">+{formatCurrency(o.financials.netProfit)}</p>
                                    </div>
                                </div>
                            ))}
                            {orders.length === 0 && <div className="p-8 text-center text-gray-400 text-xs">Belum ada transaksi.</div>}
                        </div>
                    </div>

                    <div className="bg-white rounded-[24px] shadow-sm border border-pink-50 flex flex-col w-full min-w-0">
                        <div className="p-4 md:p-6 border-b border-pink-50 flex items-center gap-2">
                            <Activity size={18} className="text-pink-600 shrink-0"/>
                            <h3 className="font-bold text-sm md:text-lg text-gray-800">Aktivitas Terkini</h3>
                        </div>
                        <div className="divide-y divide-gray-50 max-h-[300px] overflow-y-auto custom-scrollbar">
                            {recentActivities?.map((act) => (
                                <div key={act.id} className="p-4 flex gap-3 items-start min-w-0">
                                    <div className="w-8 h-8 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                                        <Activity size={12} className="text-pink-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start gap-2 mb-1">
                                            <p className="text-xs md:text-sm font-bold text-gray-800 truncate block">{act.action}</p>
                                            <span className="text-[9px] md:text-[10px] text-gray-400 shrink-0">{formatDate(act.createdAt || new Date()).split(',')[0]}</span>
                                        </div>
                                        <p className="text-[10px] md:text-xs text-gray-500 line-clamp-2 leading-snug">{act.details}</p>
                                        <span className="text-[8px] md:text-[9px] bg-gray-100 text-gray-500 font-bold px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1 mt-1.5 w-fit">
                                            <User size={8}/> <span className="truncate max-w-[100px] block">{act.user}</span>
                                        </span>
                                    </div>
                                </div>
                            ))}
                            {(!recentActivities || recentActivities.length === 0) && <div className="text-center py-8 text-gray-400 text-xs">Belum ada aktivitas.</div>}
                        </div>
                    </div>

                </div>

                {/* Kolom Kanan: Status Gudang & Menu Cepat (PERBAIKAN AGAR TIDAK KOSONG) */}
                <div className="flex flex-col gap-6 w-full min-w-0 h-fit">
                    
                    <div className="bg-white rounded-[24px] shadow-sm border border-pink-50 p-5 md:p-6 min-w-0 w-full">
                        <h3 className="font-bold text-sm md:text-lg text-gray-800 mb-4">Status Gudang</h3>
                        <div className="space-y-3">
                            <div className="p-3 md:p-4 bg-red-50 rounded-xl border border-red-100 flex items-center justify-between min-w-0 w-full">
                                <div className="flex items-center gap-2 md:gap-3 min-w-0">
                                    <AlertTriangle className="text-red-500 shrink-0" size={16}/>
                                    <span className="text-xs md:text-sm font-medium text-red-700 truncate">Stok Habis</span>
                                </div>
                                <span className="font-bold text-lg md:text-xl text-red-700 shrink-0 ml-2">{stats.outStock}</span>
                            </div>
                            <div className="p-3 md:p-4 bg-yellow-50 rounded-xl border border-yellow-100 flex items-center justify-between min-w-0 w-full">
                                <div className="flex items-center gap-2 md:gap-3 min-w-0">
                                    <Package className="text-yellow-600 shrink-0" size={16}/>
                                    <span className="text-xs md:text-sm font-medium text-yellow-700 truncate">Stok Menipis</span>
                                </div>
                                <span className="font-bold text-lg md:text-xl text-yellow-700 shrink-0 ml-2">{stats.lowStock}</span>
                            </div>
                            <button onClick={()=>setActiveTab('inventory')} className="w-full py-3 mt-1 bg-gray-900 text-white rounded-xl font-bold text-xs md:text-sm hover:bg-gray-800 transition-colors active:scale-95">Cek Gudang</button>
                        </div>
                    </div>

                    {/* PERBAIKAN: Menu Cepat untuk mengisi ruang kosong di kolom kanan saat dibuka di Desktop/Laptop */}
                    <div className="bg-white rounded-[24px] shadow-sm border border-pink-50 p-5 md:p-6 min-w-0 w-full hidden lg:flex lg:flex-col">
                        <h3 className="font-bold text-sm md:text-lg text-gray-800 mb-4">Akses Cepat</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => setActiveTab('sales')} className="p-4 bg-pink-50 hover:bg-pink-100 rounded-xl flex flex-col items-center justify-center gap-2 transition-colors text-pink-600">
                                <ShoppingCart size={24} />
                                <span className="text-xs font-bold">Kasir</span>
                            </button>
                            <button onClick={() => setActiveTab('inventory')} className="p-4 bg-blue-50 hover:bg-blue-100 rounded-xl flex flex-col items-center justify-center gap-2 transition-colors text-blue-600">
                                <PackagePlus size={24} />
                                <span className="text-xs font-bold">Restock</span>
                            </button>
                            <button onClick={() => setActiveTab('expenses')} className="p-4 bg-orange-50 hover:bg-orange-100 rounded-xl flex flex-col items-center justify-center gap-2 transition-colors text-orange-600">
                                <Wallet size={24} />
                                <span className="text-xs font-bold">Biaya Ops</span>
                            </button>
                            <button onClick={() => setActiveTab('reports')} className="p-4 bg-emerald-50 hover:bg-emerald-100 rounded-xl flex flex-col items-center justify-center gap-2 transition-colors text-emerald-600">
                                <FileText size={24} />
                                <span className="text-xs font-bold">Laporan</span>
                            </button>
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
}