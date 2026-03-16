import React, { useState, useMemo } from 'react';
import { FileText, Printer, Download, Package, BarChart2, TrendingUp, DollarSign, Activity, Trophy, Star } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/helpers.js';

export default function Reports({ orders, inventory }) {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const [selectedMonth, setSelectedMonth] = useState(currentMonth.toString());
    const [selectedYear, setSelectedYear] = useState(currentYear.toString());
    const [isAllData, setIsAllData] = useState(false);

    const months = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];

    const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

    const filteredOrders = useMemo(() => {
        if (!orders) return [];
        if (isAllData) return orders;

        return orders.filter(o => {
            const d = o.date ? (o.date.toDate ? o.date.toDate() : new Date(o.date)) : new Date();
            const sameMonth = d.getMonth() === parseInt(selectedMonth);
            const sameYear = d.getFullYear() === parseInt(selectedYear);
            return sameMonth && sameYear;
        });
    }, [orders, selectedMonth, selectedYear, isAllData]);

    const summaryStats = useMemo(() => {
        let totalRevenue = 0;
        let totalNetProfit = 0;
        
        filteredOrders.forEach(o => {
            totalRevenue += (o.financials?.revenue || 0);
            totalNetProfit += (o.financials?.netProfit || 0);
        });

        const totalTransactions = filteredOrders.length;
        const averageOrderValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

        return { totalRevenue, totalNetProfit, totalTransactions, averageOrderValue };
    }, [filteredOrders]);

    const totalAssetValue = useMemo(() => {
        return (inventory || []).reduce((sum, i) => sum + (i.stock * (i.avgCost || 0)), 0);
    }, [inventory]);

    const activeProducts = useMemo(() => {
        return (inventory || []).filter(i => i.stock > 0).length;
    }, [inventory]);

    // FITUR BARU: Menghitung Barang Terlaris (Top Selling Items)
    const topSellingItems = useMemo(() => {
        const itemMap = {};
        filteredOrders.forEach(o => {
            (o.items || []).forEach(item => {
                if (!itemMap[item.itemId]) {
                    itemMap[item.itemId] = { name: item.name, qty: 0, revenue: 0 };
                }
                itemMap[item.itemId].qty += parseFloat(item.qty || 0);
                itemMap[item.itemId].revenue += parseFloat(item.subtotal || 0);
            });
        });
        
        // Convert object to array, sort by qty (Terbanyak), ambil 5 teratas
        return Object.values(itemMap).sort((a, b) => b.qty - a.qty).slice(0, 5);
    }, [filteredOrders]);

    const getSequentialID = (orderId) => {
        if (!orders) return "???";
        const index = orders.findIndex(o => o.id === orderId);
        if (index === -1) return "???";
        const num = orders.length - index;
        return `NOTA #${String(num).padStart(5, '0')}`;
    };

    const downloadTxCSV = () => {
        const dataToDownload = filteredOrders;
        const headers = [
            'Order_ID', 'Tanggal', 'Jam', 'Customer', 'Kasir',
            'Nama_Barang_Terjual', 'Qty', 'Satuan', 'Harga_Jual_Satuan',
            'Modal_Satuan', 'Subtotal_Jual', 'Subtotal_Modal', 'Total_Nota',
            'Total_Laba_Nota', 'Metode_Pembayaran', 'Status_Pembayaran', 'Catatan'
        ];
        const rows = [];
        dataToDownload.forEach(o => {
            const orderDate = o.date ? (o.date.toDate ? o.date.toDate() : new Date(o.date)) : new Date();
            const dateStr = orderDate.toLocaleDateString('id-ID');
            const timeStr = orderDate.toLocaleTimeString('id-ID');

            const orderId = `"${getSequentialID(o.id)}"`;
            const customer = `"${o.customerName || '-'}"`;
            const cashier = `"${o.cashierName ? o.cashierName.split('@')[0] : '-'}"`;
            const paymentMethod = `"${o.paymentMethod || 'Cash'}"`;
            const paymentStatus = `"${o.paymentStatus || 'Lunas'}"`;
            const notes = `"${o.notes || ''}"`;

            const totalRevenue = o.financials.revenue;
            const totalNetProfit = o.financials.netProfit;

            if (o.items && o.items.length > 0) {
                o.items.forEach(item => {
                    const modalSatuan = item.costBasis || 0;
                    const subtotalModal = modalSatuan * item.qty;
                    rows.push([
                        orderId, `"${dateStr}"`, `"${timeStr}"`, customer, cashier,
                        `"${item.name}"`, item.qty, `"${item.unit}"`, item.price,
                        modalSatuan, item.subtotal, subtotalModal, totalRevenue,
                        totalNetProfit, paymentMethod, paymentStatus, notes
                    ]);
                });
            } else {
                rows.push([
                    orderId, `"${dateStr}"`, `"${timeStr}"`, customer, cashier,
                    "-", 0, "-", 0, 0, 0, 0, totalRevenue, totalNetProfit,
                    paymentMethod, paymentStatus, notes
                ]);
            }
        });
        const csvContent = "sep=;\n" + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        const fileName = isAllData ? `Laporan_Transaksi_SemuaData.csv` : `Laporan_Transaksi_${months[selectedMonth]}_${selectedYear}.csv`;
        link.setAttribute("download", fileName);
        document.body.appendChild(link);
        link.click();
    };

    const downloadStockCSV = () => {
        const rows = inventory.map(i => [
            `"${i.name}"`, i.stock, `"${i.unit}"`, i.avgCost,
            i.stock * i.avgCost, i.sellPrice || 0, `"${i.lastSupplier || '-'}"`
        ]);
        const headers = ['Nama Barang', 'Stok Saat Ini', 'Satuan', 'Harga Rata-rata Beli', 'Total Nilai Aset', 'Harga Jual (Rencana)', 'Supplier Terakhir'];
        const csvContent = "sep=;\n" + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Laporan_Stok_Aset_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
    };

    return (
        <div className="flex flex-col gap-6 pb-24 md:pb-0 animate-fade-in w-full max-w-full min-w-0 overflow-x-hidden">
            <div className="w-full">
                <h2 className="text-2xl font-extrabold text-gray-800 tracking-tight">Pusat Laporan</h2>
                <p className="text-sm text-gray-500 font-medium">Download dan cetak laporan keuangan toko</p>
            </div>

            <div className="bg-slate-900 rounded-[24px] p-5 md:p-8 text-white relative overflow-hidden shadow-xl shadow-slate-200 w-full min-w-0">
                <div className="absolute top-4 right-4 opacity-5 pointer-events-none">
                    <BarChart2 size={100} strokeWidth={1} />
                </div>
                
                <p className="text-[10px] md:text-xs font-bold text-slate-400 tracking-widest uppercase mb-1 truncate">
                    {isAllData ? 'SEMUA WAKTU' : `${months[selectedMonth]} ${selectedYear}`}
                </p>
                <h3 className="text-xl md:text-2xl font-bold mb-5 md:mb-6 text-slate-50 truncate">Ringkasan Periode</h3>
                
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 relative z-10 w-full min-w-0">
                    <div className="bg-slate-800 p-3 md:p-4 rounded-2xl border border-slate-700/50 min-w-0 w-full">
                        <div className="flex items-center gap-1.5 text-pink-400 mb-1.5 md:mb-2">
                            <TrendingUp size={12} className="shrink-0"/>
                            <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider truncate block">Total Omzet</span>
                        </div>
                        <h4 className="text-sm sm:text-lg md:text-xl font-bold truncate block w-full" title={formatCurrency(summaryStats.totalRevenue)}>{formatCurrency(summaryStats.totalRevenue)}</h4>
                    </div>
                    <div className="bg-slate-800 p-3 md:p-4 rounded-2xl border border-slate-700/50 min-w-0 w-full">
                        <div className="flex items-center gap-1.5 text-emerald-400 mb-1.5 md:mb-2">
                            <DollarSign size={12} className="shrink-0"/>
                            <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider truncate block">Laba Bersih</span>
                        </div>
                        <h4 className="text-sm sm:text-lg md:text-xl font-bold truncate block w-full" title={formatCurrency(summaryStats.totalNetProfit)}>{formatCurrency(summaryStats.totalNetProfit)}</h4>
                    </div>
                    <div className="bg-slate-800 p-3 md:p-4 rounded-2xl border border-slate-700/50 min-w-0 w-full">
                        <div className="flex items-center gap-1.5 text-blue-400 mb-1.5 md:mb-2">
                            <FileText size={12} className="shrink-0"/>
                            <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider truncate block">Transaksi</span>
                        </div>
                        <h4 className="text-sm sm:text-lg md:text-xl font-bold truncate block w-full">{summaryStats.totalTransactions}</h4>
                    </div>
                    <div className="bg-slate-800 p-3 md:p-4 rounded-2xl border border-slate-700/50 min-w-0 w-full">
                        <div className="flex items-center gap-1.5 text-yellow-400 mb-1.5 md:mb-2">
                            <Activity size={12} className="shrink-0"/>
                            <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider truncate block">Rata-Rata Nota</span>
                        </div>
                        <h4 className="text-sm sm:text-lg md:text-xl font-bold truncate block w-full" title={formatCurrency(summaryStats.averageOrderValue)}>{formatCurrency(summaryStats.averageOrderValue)}</h4>
                    </div>
                </div>
            </div>

            <div className="flex flex-col md:grid md:grid-cols-2 gap-4 md:gap-6 print:hidden min-w-0 w-full">
                <div className="bg-white p-4 md:p-6 rounded-[24px] shadow-sm border border-gray-100 flex flex-col min-w-0 w-full">
                    <div className="flex items-center gap-3 mb-4 md:mb-6 min-w-0">
                        <div className="p-2.5 md:p-3 bg-blue-50 text-blue-600 rounded-xl shrink-0"><FileText size={18} /></div>
                        <div className="min-w-0 flex-1">
                            <h3 className="font-bold text-sm md:text-lg text-gray-800 truncate block">Laporan Transaksi</h3>
                            <p className="text-[9px] md:text-xs text-gray-400 truncate block">Rekap penjualan detail per nota</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4 min-w-0">
                        <div className="min-w-0">
                            <label className="text-[9px] md:text-[10px] font-bold text-gray-500 ml-1 mb-1 block truncate">Bulan</label>
                            <select disabled={isAllData} className="w-full p-2 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 disabled:opacity-50 text-xs font-medium cursor-pointer truncate" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
                                {months.map((m, idx) => <option key={idx} value={idx}>{m}</option>)}
                            </select>
                        </div>
                        <div className="min-w-0">
                            <label className="text-[9px] md:text-[10px] font-bold text-gray-500 ml-1 mb-1 block truncate">Tahun</label>
                            <select disabled={isAllData} className="w-full p-2 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 disabled:opacity-50 text-xs font-medium cursor-pointer truncate" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
                                {years.map((y) => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="mb-4 md:mb-6 flex items-center justify-between bg-gray-50 p-2 md:p-3 rounded-xl border border-gray-100 min-w-0">
                        <span className="text-[10px] md:text-xs font-bold text-gray-600 truncate mr-2">Semua Data (Tanpa Filter)</span>
                        <label className="relative inline-flex items-center cursor-pointer shrink-0">
                            <input type="checkbox" className="sr-only peer" checked={isAllData} onChange={(e) => setIsAllData(e.target.checked)} />
                            <div className="w-8 h-4 md:w-10 md:h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 md:after:h-4 md:after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>

                    <div className="flex gap-2 md:gap-3 mt-auto w-full">
                        <button onClick={() => window.print()} className="flex-1 py-2.5 md:py-3 bg-slate-800 text-white font-bold rounded-xl active:scale-95 flex justify-center gap-1.5 items-center text-xs shadow-md">
                            <Printer size={14} /> Print
                        </button>
                        <button onClick={downloadTxCSV} className="flex-[1.5] md:flex-1 py-2.5 md:py-3 bg-blue-600 text-white font-bold rounded-xl active:scale-95 flex justify-center gap-1.5 items-center text-xs shadow-md shadow-blue-200 truncate px-2">
                            <Download size={14} className="shrink-0" /> <span className="truncate">CSV/Excel</span>
                        </button>
                    </div>
                </div>

                <div className="bg-white p-4 md:p-6 rounded-[24px] shadow-sm border border-gray-100 flex flex-col min-w-0 w-full">
                    <div className="flex items-center gap-3 mb-4 md:mb-6 min-w-0">
                        <div className="p-2.5 md:p-3 bg-emerald-50 text-emerald-600 rounded-xl shrink-0"><Package size={18} /></div>
                        <div className="min-w-0 flex-1">
                            <h3 className="font-bold text-sm md:text-lg text-gray-800 truncate block">Laporan Stok Gudang</h3>
                            <p className="text-[9px] md:text-xs text-gray-400 truncate block">Nilai inventaris aset saat ini</p>
                        </div>
                    </div>

                    <div className="mb-4 md:mb-6 p-4 md:p-5 bg-emerald-50/50 rounded-xl border border-emerald-100/50 flex flex-col justify-center h-full min-w-0">
                        <span className="text-[9px] md:text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1 truncate block">Total Nilai Aset</span>
                        <span className="font-extrabold text-xl md:text-3xl text-emerald-700 mb-1.5 truncate block w-full" title={formatCurrency(totalAssetValue)}>{formatCurrency(totalAssetValue)}</span>
                        <span className="text-[9px] md:text-[10px] text-emerald-600/80 font-bold truncate block w-full">{activeProducts} produk aktif di gudang</span>
                    </div>

                    <button onClick={downloadStockCSV} className="w-full py-2.5 md:py-3 bg-emerald-600 text-white font-bold rounded-xl active:scale-95 flex justify-center gap-1.5 items-center text-xs shadow-md shadow-emerald-200 mt-auto truncate px-2">
                        <Download size={14} className="shrink-0"/> <span className="truncate">Download Data Stok</span>
                    </button>
                </div>
            </div>

            {/* FITUR BARU: Top 5 Barang Terlaris */}
            {topSellingItems.length > 0 && (
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-[24px] shadow-sm border border-amber-200 overflow-hidden w-full p-5 md:p-6 flex flex-col relative">
                    <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                        <Trophy size={100} />
                    </div>
                    <div className="flex items-center gap-3 mb-5 relative z-10">
                        <div className="p-2 md:p-3 bg-amber-500 text-white rounded-xl shadow-md"><Star size={20} /></div>
                        <div>
                            <h3 className="font-bold text-base md:text-lg text-amber-900">5 Barang Paling Laris</h3>
                            <p className="text-[10px] md:text-xs text-amber-700/80 font-medium">Berdasarkan data {isAllData ? 'seluruh waktu' : 'bulan ini'}</p>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 relative z-10">
                        {topSellingItems.map((item, idx) => (
                            <div key={idx} className="bg-white p-3 md:p-4 rounded-xl border border-amber-100 shadow-sm flex flex-col h-full hover:-translate-y-1 transition-transform cursor-default">
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${idx === 0 ? 'bg-yellow-400 text-yellow-900 shadow-md' : idx === 1 ? 'bg-gray-300 text-gray-800' : idx === 2 ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-500'}`}>#{idx + 1}</span>
                                </div>
                                <h4 className="font-bold text-gray-800 text-xs md:text-sm line-clamp-2 leading-tight flex-1 mb-2" title={item.name}>{item.name}</h4>
                                <div className="mt-auto">
                                    <div className="text-[10px] text-gray-400 font-medium">Terjual</div>
                                    <div className="font-black text-amber-600 text-lg">{item.qty} <span className="text-[10px] font-medium text-amber-500 uppercase">Unit</span></div>
                                    <div className="text-[9px] md:text-[10px] font-bold text-gray-500 mt-1 pt-1 border-t border-gray-100">Omzet: {formatCurrency(item.revenue)}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Table Preview */}
            <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden w-full min-w-0 flex flex-col mt-2">
                <div className="p-4 md:p-5 border-b border-gray-50 flex justify-between items-center bg-white min-w-0 w-full">
                    <h3 className="font-bold text-sm md:text-base text-gray-800 truncate flex-1">Preview Transaksi ({isAllData ? 'Semua Data' : 'Bulan Ini'})</h3>
                    <span className="text-[9px] md:text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-full shrink-0 ml-2">{filteredOrders.length} TRX</span>
                </div>

                <div className="w-full overflow-x-auto custom-scrollbar flex-1">
                    <table className="w-full text-xs text-left min-w-[650px]">
                        <thead className="text-slate-400 uppercase font-bold text-[9px] tracking-wider border-b border-gray-50 bg-gray-50/50">
                            <tr>
                                <th className="p-3 pl-4 md:pl-5 whitespace-nowrap">Tanggal</th>
                                <th className="p-3 whitespace-nowrap">Nota</th>
                                <th className="p-3 whitespace-nowrap">Customer</th>
                                <th className="p-3 text-right whitespace-nowrap">Omzet</th>
                                <th className="p-3 text-right whitespace-nowrap">Modal (HPP)</th>
                                <th className="p-3 text-right whitespace-nowrap">Biaya Ops</th>
                                <th className="p-3 pr-4 md:pr-5 text-right whitespace-nowrap">Laba Bersih</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50/80">
                            {filteredOrders.slice(0, 15).map(o => (
                                <tr key={o.id} className="hover:bg-pink-50/30 transition-colors">
                                    <td className="p-3 pl-4 md:pl-5 text-gray-500 whitespace-nowrap">{formatDate(o.date).split(',')[0]}</td>
                                    <td className="p-3 font-bold text-pink-600 whitespace-nowrap">{getSequentialID(o.id)}</td>
                                    <td className="p-3 text-gray-700 font-medium whitespace-nowrap max-w-[120px] truncate" title={o.customerName || '-'}>{o.customerName || '-'}</td>
                                    <td className="p-3 text-right font-bold text-slate-700 whitespace-nowrap">{formatCurrency(o.financials.revenue)}</td>
                                    <td className="p-3 text-right text-gray-400 whitespace-nowrap">{formatCurrency(o.financials.cogs)}</td>
                                    <td className="p-3 text-right text-orange-400 whitespace-nowrap">{formatCurrency(o.financials.expenseTotal)}</td>
                                    <td className="p-3 pr-4 md:pr-5 text-right font-bold text-emerald-600 whitespace-nowrap">{formatCurrency(o.financials.netProfit)}</td>
                                </tr>
                            ))}
                            {filteredOrders.length === 0 && (
                                <tr>
                                    <td colSpan="7" className="p-8 text-center text-gray-400 text-xs border-t border-dashed">
                                        Belum ada data bulan ini.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                {filteredOrders.length > 15 && (
                    <div className="text-center pt-2 pb-3 bg-gray-50/30 border-t border-gray-50">
                        <span className="text-[9px] md:text-[10px] text-gray-400 font-medium">Menampilkan 15 data terbaru. Download CSV untuk data penuh.</span>
                    </div>
                )}
            </div>
        </div>
    );
}