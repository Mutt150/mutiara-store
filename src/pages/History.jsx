import React, { useState, useMemo } from 'react';
import { Search, List, UserCheck, Edit, Trash2, Printer, CheckCircle } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/helpers';

export default function History({ orders, setEditingOrder, handleDeleteOrder, handlePrint, handleQuickPay }) {
    const [expandedId, setExpandedId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState('orders'); 
    const [expandedCustomer, setExpandedCustomer] = useState(null);
    const [filterDateStart, setFilterDateStart] = useState('');
    const [filterDateEnd, setFilterDateEnd] = useState('');

    const toggleExpand = (id) => setExpandedId(expandedId === id ? null : id);
    const toggleCustomerExpand = (name) => setExpandedCustomer(expandedCustomer === name ? null : name);

    const getSequentialID = (orderId) => {
        const index = orders.findIndex(o => o.id === orderId);
        if (index === -1) return "???";
        const num = orders.length - index;
        return `NOTA #${String(num).padStart(5, '0')}`;
    };

    const filteredOrders = orders.filter(order => {
        const query = searchQuery.toLowerCase();
        const seqId = getSequentialID(order.id).toLowerCase(); 
        
        const idMatch = order.id.toLowerCase().includes(query) || seqId.includes(query);
        const customerMatch = (order.customerName || '').toLowerCase().includes(query);
        const noteMatch = (order.notes || '').toLowerCase().includes(query);

        let dateMatch = true;
        if (filterDateStart && filterDateEnd) {
            const oDate = new Date(order.date.toDate ? order.date.toDate() : order.date);
            const start = new Date(filterDateStart);
            const end = new Date(filterDateEnd);
            end.setHours(23, 59, 59); 
            dateMatch = oDate >= start && oDate <= end;
        }

        return (idMatch || customerMatch || noteMatch) && dateMatch;
    });

    const customerGroups = useMemo(() => {
        const groups = {};
        filteredOrders.forEach(order => {
            const rawName = order.customerName || 'No Name';
            const normalizedName = rawName.trim().toUpperCase(); 
            
            if (!groups[normalizedName]) {
                groups[normalizedName] = {
                    name: rawName,
                    orders: [],
                    totalRevenue: 0,
                    totalNetProfit: 0
                };
            }
            groups[normalizedName].orders.push(order);
            groups[normalizedName].totalRevenue += (order.financials?.revenue || 0);
            groups[normalizedName].totalNetProfit += (order.financials?.netProfit || 0);
        });

        return Object.values(groups).sort((a, b) => a.name.localeCompare(b.name));
    }, [filteredOrders]);

    return (
        <div className="pb-24 md:pb-0 animate-fade-in w-full min-w-0">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 w-full">
                <div className="w-full md:w-auto">
                    <h2 className="text-2xl font-bold text-gray-800">Riwayat & Cetak Nota</h2>
                    <p className="text-sm text-gray-500">Lihat data penjualan dan cetak ulang struk.</p>
                </div>

                <div className="flex flex-col md:flex-row gap-3 md:gap-4 w-full md:w-auto items-center">
                    <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-pink-100 shadow-sm w-full md:w-auto">
                        <input type="date" className="text-xs p-2 outline-none rounded-lg focus:ring-2 focus:ring-pink-300 w-full" value={filterDateStart} onChange={e => setFilterDateStart(e.target.value)} />
                        <span className="text-gray-400">-</span>
                        <input type="date" className="text-xs p-2 outline-none rounded-lg focus:ring-2 focus:ring-pink-300 w-full" value={filterDateEnd} onChange={e => setFilterDateEnd(e.target.value)} />
                    </div>

                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-3.5 text-gray-400" size={18} />
                        <input
                            className="w-full pl-10 p-3 bg-white border border-pink-100 rounded-2xl outline-none focus:ring-2 focus:ring-pink-300 transition-all shadow-sm text-sm"
                            placeholder="Cari nota, nama, id..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="bg-gray-100 p-1.5 rounded-xl flex shrink-0 w-full md:w-auto">
                        <button
                            onClick={() => setViewMode('orders')}
                            className={`flex-1 md:flex-none p-2.5 rounded-lg transition-all flex justify-center ${viewMode === 'orders' ? 'bg-white text-pink-600 shadow-sm' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200/50'}`}
                            title="Lihat per Nota"
                        >
                            <List size={20} />
                        </button>
                        <button
                            onClick={() => setViewMode('customers')}
                            className={`flex-1 md:flex-none p-2.5 rounded-lg transition-all flex justify-center ${viewMode === 'customers' ? 'bg-white text-pink-600 shadow-sm' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200/50'}`}
                            title="Lihat per Customer (Group)"
                        >
                            <UserCheck size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {viewMode === 'orders' ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5 animate-fade-in min-w-0">
                    {filteredOrders.map(order => (
                        <div key={order.id}
                            className={`bg-white p-3.5 md:p-5 rounded-[20px] shadow-sm border hover:shadow-lg transition-all cursor-pointer group hover:-translate-y-1 duration-300 min-w-0 flex flex-col ${expandedId === order.id ? 'border-pink-300 ring-2 ring-pink-50' : 'border-pink-50'}`}
                            onClick={() => toggleExpand(order.id)}>

                            {/* PERBAIKAN: Layout card lebih compact, mencegah font tabrakan */}
                            <div className="flex flex-col mb-3 gap-2 min-w-0">
                                <div className="flex justify-between items-start w-full gap-2">
                                    <div className="bg-pink-100 text-pink-600 text-[8px] md:text-[10px] font-bold px-2 py-1 rounded w-fit truncate shrink-0">{getSequentialID(order.id)}</div>
                                    <p className="font-bold text-xs md:text-sm text-gray-800 truncate text-right">{formatCurrency(order.financials.revenue)}</p>
                                </div>
                                <div className="min-w-0 w-full">
                                    <h4 className="font-bold text-gray-800 text-sm md:text-base truncate w-full" title={order.customerName}>{order.customerName || 'No Name'}</h4>
                                    <p className="text-[9px] md:text-[10px] text-gray-400 mt-0.5 truncate">{formatDate(order.date).split(',')[0]}</p>
                                </div>
                                <div className="flex flex-wrap gap-1 mt-1">
                                    <span className={`text-[8px] md:text-[9px] font-bold px-1.5 py-0.5 rounded w-fit shrink-0 ${order.paymentStatus === 'Lunas' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                        {order.paymentStatus || 'Lunas'}
                                    </span>
                                    {order.cashierName && <span className="text-[8px] md:text-[9px] font-bold bg-blue-50 text-blue-500 px-1.5 py-0.5 rounded truncate max-w-[80px]" title={order.cashierName.split('@')[0]}>Kasir: {order.cashierName.split('@')[0]}</span>}
                                </div>
                            </div>

                            {expandedId === order.id && (
                                <div className="mt-2 pt-3 border-t border-gray-100 animate-fade-in w-full" onClick={(e) => e.stopPropagation()}>
                                    <h5 className="font-bold text-gray-700 mb-2 text-[9px] md:text-[10px] uppercase tracking-wide">Rincian Barang:</h5>
                                    <ul className="space-y-1.5 mb-3 max-h-32 overflow-y-auto custom-scrollbar pr-1 w-full">
                                        {order.items.map((item, idx) => (
                                            <li key={idx} className="flex justify-between text-gray-600 text-[9px] md:text-[10px] gap-2 w-full">
                                                <span className="truncate flex-1" title={item.name}>{item.name} <span className="text-gray-400">({item.qty}x)</span></span>
                                                <div className="flex flex-col items-end shrink-0">
                                                    <span className="font-bold">{formatCurrency(item.subtotal)}</span>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                    <div className="flex justify-between text-[9px] md:text-[10px] text-gray-500 pt-1.5 border-t border-gray-100">
                                        <span>Modal Barang:</span>
                                        <span className="font-bold">{formatCurrency(order.financials.cogs)}</span>
                                    </div>

                                    <div className="mt-2 text-[9px] md:text-[10px] text-gray-500 bg-gray-50 p-2 rounded-lg border border-gray-100 space-y-1">
                                        <p><strong className="text-gray-600">Metode:</strong> {order.paymentMethod || 'Cash'}</p>
                                        <p className="flex gap-1"><strong className="text-gray-600 shrink-0">Note:</strong> <span className="line-clamp-2">{order.notes || '-'}</span></p>
                                    </div>
                                </div>
                            )}

                            {order.expenses && order.expenses.length > 0 && (
                                <div className="bg-orange-50 p-2 rounded-lg text-[9px] md:text-[10px] mb-3 border border-orange-100 mt-2 animate-fade-in w-full">
                                    <span className="font-bold text-orange-700 block mb-1">Biaya Ops:</span>
                                    {order.expenses.map((e, idx) => (
                                        <div key={idx} className="flex justify-between text-orange-600 mb-0.5 gap-2 last:mb-0 w-full">
                                            <span className="truncate" title={e.name}>{e.name}</span>
                                            <span className="shrink-0 font-bold">-{formatCurrency(e.amount)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-[10px] md:text-xs border-t border-gray-100 pt-3 mt-auto gap-1">
                                <span className="text-gray-400 font-medium">Laba Bersih:</span>
                                <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100 w-full sm:w-auto text-center">{formatCurrency(order.financials.netProfit)}</span>
                            </div>

                            {/* PERBAIKAN: Tombol aksi lebih padat agar muat di HP */}
                            <div className="flex gap-1.5 mt-3 pt-3 border-t border-gray-50 w-full justify-between" onClick={(e) => e.stopPropagation()}>
                                <button onClick={() => setEditingOrder(order)} className="p-2 text-blue-500 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors shrink-0" title="Edit"><Edit size={14} /></button>
                                <button onClick={() => handleDeleteOrder(order)} className="p-2 text-red-500 bg-red-50 rounded-lg hover:bg-red-100 transition-colors shrink-0" title="Hapus"><Trash2 size={14} /></button>
                                {order.paymentStatus === 'Belum Lunas' && (
                                    <button onClick={() => handleQuickPay(order.id)} className="p-2 text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors border border-green-100 shrink-0" title="Lunas"><CheckCircle size={14} /></button>
                                )}
                                <button onClick={() => handlePrint(order, getSequentialID(order.id))} className="flex-1 py-1.5 bg-pink-600 text-white rounded-lg text-[10px] md:text-xs font-bold hover:bg-pink-700 transition-all shadow-sm active:scale-95 flex items-center justify-center gap-1"><Printer size={12} /> Cetak</button>
                            </div>
                        </div>
                    ))}
                    {filteredOrders.length === 0 && (
                        <div className="col-span-full text-center py-12 text-gray-400 bg-white rounded-[24px] border border-dashed border-gray-200 text-xs md:text-sm">
                            Tidak ada transaksi yang ditemukan.
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-4 md:space-y-6 animate-fade-in w-full min-w-0 mx-auto">
                    <div className="bg-pink-50 border border-pink-100 p-3 md:p-4 rounded-xl text-xs md:text-sm text-pink-700 flex items-center gap-3 shadow-sm">
                        <UserCheck size={20} className="shrink-0" />
                        <span className="leading-snug">Menampilkan total laba bersih per customer dari <strong>{filteredOrders.length}</strong> transaksi.</span>
                    </div>

                    {customerGroups.map((group, idx) => (
                        <div key={idx} className="bg-white rounded-[24px] shadow-sm border border-pink-50 overflow-hidden hover:shadow-md transition-shadow min-w-0 w-full">
                            <div
                                className="p-4 md:p-5 flex justify-between items-center cursor-pointer hover:bg-pink-50/50 transition-colors min-w-0"
                                onClick={() => toggleCustomerExpand(group.name)}
                            >
                                <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
                                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-pink-100 flex items-center justify-center font-bold text-pink-600 text-base md:text-lg shadow-inner shrink-0">
                                        {group.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-bold text-gray-800 text-sm md:text-lg truncate block" title={group.name}>{group.name}</h3>
                                        <p className="text-[10px] md:text-xs text-gray-400 font-medium mt-0.5">{group.orders.length} Transaksi</p>
                                    </div>
                                </div>
                                <div className="text-right shrink-0 ml-2">
                                    <p className="text-[9px] md:text-xs text-gray-400 font-medium mb-0.5">Total Laba Bersih</p>
                                    <p className="text-base md:text-xl font-bold text-emerald-600 truncate">{formatCurrency(group.totalNetProfit)}</p>
                                </div>
                            </div>

                            {expandedCustomer === group.name && (
                                <div className="bg-gray-50 p-3 md:p-4 border-t border-gray-100 animate-fade-in w-full min-w-0">
                                    <div className="overflow-x-auto custom-scrollbar w-full">
                                        <table className="w-full text-xs md:text-sm min-w-[600px]">
                                            <thead>
                                                <tr className="text-left text-gray-400 text-[9px] md:text-[10px] uppercase tracking-wider">
                                                    <th className="pb-3 px-2 font-bold">Tanggal</th>
                                                    <th className="pb-3 px-2 font-bold">ID Nota</th>
                                                    <th className="pb-3 px-2 font-bold text-right">Omzet</th>
                                                    <th className="pb-3 px-2 font-bold text-right">Laba</th>
                                                    <th className="pb-3 px-2 font-bold text-center">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {group.orders.map(order => (
                                                    <tr key={order.id} 
                                                        className="hover:bg-pink-50 transition-colors cursor-pointer group"
                                                        onClick={() => {
                                                            setViewMode('orders'); 
                                                            setSearchQuery(getSequentialID(order.id)); 
                                                            setExpandedId(order.id); 
                                                            window.scrollTo({ top: 0, behavior: 'smooth' }); 
                                                        }}
                                                        title="Klik untuk lihat detail lengkap nota"
                                                    >
                                                        <td className="py-2.5 px-2 text-gray-600 text-[10px] md:text-xs whitespace-nowrap">{formatDate(order.date)}</td>
                                                        <td className="py-2.5 px-2 font-bold text-pink-600 text-[10px] md:text-xs whitespace-nowrap group-hover:underline">
                                                            {getSequentialID(order.id)}
                                                        </td>
                                                        <td className="py-2.5 px-2 text-right font-medium text-gray-700 whitespace-nowrap">{formatCurrency(order.financials.revenue)}</td>
                                                        <td className="py-2.5 px-2 text-right text-emerald-600 font-bold whitespace-nowrap">{formatCurrency(order.financials.netProfit)}</td>
                                                        <td className="py-2.5 px-2 text-center whitespace-nowrap">
                                                            <span className={`text-[8px] md:text-[9px] font-bold px-2 py-1 rounded-md inline-block ${order.paymentStatus === 'Lunas' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                                {order.paymentStatus || 'Lunas'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                    {customerGroups.length === 0 && (
                         <div className="text-center py-12 text-gray-400 bg-white rounded-[24px] border border-dashed border-gray-200 text-xs md:text-sm">
                             Belum ada data customer yang bisa dikelompokkan.
                         </div>
                    )}
                </div>
            )}
        </div>
    );
};