import React, { useState } from 'react';
import { FileText, Printer, Download, Package } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/helpers';

export default function Reports({ orders, inventory }) {
    const currentMonth = new Date().getMonth();
    const monthlyOrders = orders.filter(o => {
        const orderDate = o.date ? (o.date.toDate ? o.date.toDate() : new Date(o.date)) : new Date();
        return orderDate.getMonth() === currentMonth;
    });

    const currentYear = new Date().getFullYear();
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth().toString());
    const [selectedYear, setSelectedYear] = useState(currentYear.toString());
    const [isAllData, setIsAllData] = useState(false);

    const months = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];

    const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

    const getFilteredOrdersForReport = () => {
        if (isAllData) return orders;

        return orders.filter(o => {
            const d = o.date ? (o.date.toDate ? o.date.toDate() : new Date(o.date)) : new Date();
            const sameMonth = d.getMonth() === parseInt(selectedMonth);
            const sameYear = d.getFullYear() === parseInt(selectedYear);
            return sameMonth && sameYear;
        });
    }

    const downloadTxCSV = () => {
        const dataToDownload = getFilteredOrdersForReport();

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

            const orderId = `"${o.id}"`;
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
        const fileName = isAllData ? `Laporan_Detail_Transaksi_SemuaData.csv` : `Laporan_Detail_Transaksi_${months[selectedMonth]}_${selectedYear}.csv`;
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

    const totalAssetValue = inventory.reduce((sum, i) => sum + (i.stock * i.avgCost), 0);

    return (
        <div className="pb-24 md:pb-0 space-y-8 animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-800">Pusat Laporan</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:hidden">
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-pink-100 hover:shadow-lg hover:-translate-y-1 transition-all">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl"><FileText size={28} /></div>
                        <div>
                            <h3 className="font-bold text-xl text-gray-800">Laporan Transaksi</h3>
                            <p className="text-sm text-gray-400">Rekap semua penjualan dan pembelian barang.</p>
                        </div>
                    </div>

                    <div className="mb-4 space-y-3">
                        <label className="text-xs font-bold text-gray-500 ml-1 mb-1 block">Pilih Periode Download</label>
                        <div className="flex gap-2">
                            <select disabled={isAllData} className="flex-1 p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-200 disabled:opacity-50" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
                                {months.map((m, idx) => <option key={idx} value={idx}>{m}</option>)}
                            </select>
                            <select disabled={isAllData} className="flex-1 p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-200 disabled:opacity-50" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
                                {years.map((y) => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                            <input type="checkbox" id="allData" checked={isAllData} onChange={(e) => setIsAllData(e.target.checked)} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"/>
                            <label htmlFor="allData" className="text-sm text-gray-600">Download Semua Data (Tanpa Filter)</label>
                        </div>
                    </div>

                    <div className="flex gap-2 flex-col md:flex-row">
                        <button onClick={() => window.print()} className="flex-1 py-4 bg-gray-900 text-white font-bold rounded-2xl hover:bg-gray-800 transition-all flex justify-center gap-2 items-center"><Printer size={18} /> Print</button>
                        <button onClick={downloadTxCSV} className="flex-1 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all flex justify-center gap-2 items-center"><Download size={18} /> Excel/CSV</button>
                    </div>
                </div>
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-pink-100 hover:shadow-lg hover:-translate-y-1 transition-all">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl"><Package size={28} /></div>
                        <div>
                            <h3 className="font-bold text-xl text-gray-800">Laporan Stok Aset</h3>
                            <p className="text-sm text-gray-400">Nilai aset stok saat ini berdasarkan rata-rata harga beli.</p>
                        </div>
                    </div>
                    <div className="mb-4 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                        <span className="text-xs font-bold text-emerald-700 uppercase">Total Aset:</span>
                        <span className="ml-2 font-bold text-xl text-emerald-800">{formatCurrency(totalAssetValue)}</span>
                    </div>
                    <button onClick={downloadStockCSV} className="w-full py-4 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-all flex justify-center gap-2 items-center"><Download size={18} /> Download Stok</button>
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-pink-100 overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-6 border-b border-pink-50">
                    <h3 className="font-bold text-lg text-gray-800">Preview Laporan (Bulan Ini)</h3>
                </div>

                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-pink-50/50 text-gray-500 uppercase font-bold text-xs">
                            <tr>
                                <th className="p-4 whitespace-nowrap">Tanggal</th>
                                <th className="p-4 whitespace-nowrap">Uraian / Nota</th>
                                <th className="p-4 whitespace-nowrap">Customer</th>
                                <th className="p-4 text-right whitespace-nowrap">Omzet (Jual)</th>
                                <th className="p-4 text-right whitespace-nowrap">Modal (HPP)</th>
                                <th className="p-4 text-right whitespace-nowrap">Biaya Ops</th>
                                <th className="p-4 text-right whitespace-nowrap">Laba Bersih</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {monthlyOrders.slice(0, 10).map(o => (
                                <tr key={o.id} className="hover:bg-pink-50/20 transition-colors">
                                    <td className="p-4 whitespace-nowrap">{formatDate(o.date)}</td>
                                    <td className="p-4 font-bold text-gray-700 whitespace-nowrap">#{o.id.slice(-4).toUpperCase()}</td>
                                    <td className="p-4 text-gray-600 whitespace-nowrap">{o.customerName || '-'}</td>
                                    <td className="p-4 text-right text-gray-800 font-medium whitespace-nowrap">{formatCurrency(o.financials.revenue)}</td>
                                    <td className="p-4 text-right text-gray-500 whitespace-nowrap">{formatCurrency(o.financials.cogs)}</td>
                                    <td className="p-4 text-right text-red-400 whitespace-nowrap">{formatCurrency(o.financials.expenseTotal)}</td>
                                    <td className="p-4 text-right font-bold text-emerald-600 whitespace-nowrap">{formatCurrency(o.financials.netProfit)}</td>
                                </tr>
                            ))}
                            {monthlyOrders.length === 0 && <tr><td colSpan="7" className="p-8 text-center text-gray-400">Belum ada data bulan ini.</td></tr>}
                        </tbody>
                    </table>
                </div>

                <div className="md:hidden p-4 space-y-4">
                    {monthlyOrders.slice(0, 10).map(o => (
                        <div key={o.id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex flex-col gap-3">
                            <div className="flex justify-between items-start border-b border-gray-50 pb-2">
                                <div>
                                    <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded mr-2">{formatDate(o.date)}</span>
                                    <span className="font-bold text-pink-600 text-sm">#{o.id.slice(-4).toUpperCase()}</span>
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${o.paymentStatus === 'Lunas' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>{o.paymentStatus}</span>
                            </div>

                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">Customer</p>
                                    <p className="font-bold text-gray-800">{o.customerName || 'Umum'}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 bg-gray-50 p-2 rounded-xl">
                                <div>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">Omzet</p>
                                    <p className="font-bold text-blue-600 text-sm">{formatCurrency(o.financials.revenue)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">Laba Bersih</p>
                                    <p className="font-bold text-emerald-600 text-sm">{formatCurrency(o.financials.netProfit)}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                    {monthlyOrders.length === 0 && <div className="p-8 text-center text-gray-400">Belum ada data bulan ini.</div>}
                </div>
            </div>
        </div>
    );
}