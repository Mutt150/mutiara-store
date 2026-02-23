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

    const filteredOrders = orders.filter(order => {
        const query = searchQuery.toLowerCase();
        const idMatch = order.id.toLowerCase().includes(query);
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
            const name = order.customerName || 'No Name';
            if (!groups[name]) {
                groups[name] = {
                    name,
                    orders: [],
                    totalRevenue: 0,
                    totalNetProfit: 0
                };
            }
            groups[name].orders.push(order);
            groups[name].totalRevenue += (order.financials?.revenue || 0);
            groups[name].totalNetProfit += (order.financials?.netProfit || 0);
        });

        return Object.values(groups).sort((a, b) => a.name.localeCompare(b.name));
    }, [filteredOrders]);

    const getSequentialID = (orderId) => {
        const index = orders.findIndex(o => o.id === orderId);
        if (index === -1) return "???";
        const num = orders.length - index;
        return `NOTA #${String(num).padStart(5, '0')}`;
    };

    return (
        <div className="pb-24 md:pb-0 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Riwayat & Cetak Nota</h2>
                    <p className="text-sm text-gray-500">Lihat data penjualan dan cetak ulang struk.</p>
                </div>

                <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto items-center">
                    <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-pink-100 shadow-sm">
                        <input type="date" className="text-xs p-2 outline-none rounded-lg" value={filterDateStart} onChange={e => setFilterDateStart(e.target.value)} />
                        <span className="text-gray-400">-</span>
                        <input type="date" className="text-xs p-2 outline-none rounded-lg" value={filterDateEnd} onChange={e => setFilterDateEnd(e.target.value)} />
                    </div>

                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                        <input
                            className="w-full pl-10 p-3 border border-pink-100 rounded-2xl outline-none focus:ring-2 focus:ring-pink-300 transition-all"
                            placeholder="Cari nota, nama, id..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="bg-gray-100 p-1 rounded-xl flex shrink-0">
                        <button
                            onClick={() => setViewMode('orders')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'orders' ? 'bg-white text-pink-600 shadow-sm' : 'text-gray-400'}`}
                            title="Lihat per Nota"
                        >
                            <List size={20} />
                        </button>
                        <button
                            onClick={() => setViewMode('customers')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'customers' ? 'bg-white text-pink-600 shadow-sm' : 'text-gray-400'}`}
                            title="Lihat per Customer (Group)"
                        >
                            <UserCheck size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {viewMode === 'orders' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                    {filteredOrders.map(order => (
                        <div key={order.id}
                            className={`bg-white p-6 rounded-3xl shadow-sm border border-pink-100 hover:shadow-lg transition-all cursor-pointer group hover:-translate-y-1 duration-300 ${expandedId === order.id ? 'ring-2 ring-pink-200' : ''}`}
                            onClick={() => toggleExpand(order.id)}>

                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="bg-pink-100 text-pink-600 text-[10px] font-bold px-2 py-1 rounded mb-2 w-fit">{getSequentialID(order.id)}</div>
                                    <h4 className="font-bold text-gray-800">{order.customerName || 'No Name'}</h4>
                                    <p className="text-xs text-gray-400">{formatDate(order.date)}</p>
                                    <div className="flex gap-2">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded mt-1 inline-block ${order.paymentStatus === 'Lunas' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                            {order.paymentStatus || 'Lunas'}
                                        </span>
                                        {order.cashierName && <span className="text-[10px] font-bold bg-blue-50 text-blue-500 px-2 py-0.5 rounded mt-1 inline-block">Kasir: {order.cashierName.split('@')[0]}</span>}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-lg text-gray-800">{formatCurrency(order.financials.revenue)}</p>
                                </div>
                            </div>

                            {expandedId === order.id && (
                                <div className="mt-4 pt-4 border-t border-gray-100 text-sm animate-fade-in" onClick={(e) => e.stopPropagation()}>
                                    <h5 className="font-bold text-gray-700 mb-2 text-xs uppercase tracking-wide">Rincian Barang:</h5>
                                    <ul className="space-y-2 mb-4 max-h-40 overflow-y-auto custom-scrollbar pr-2">
                                        {order.items.map((item, idx) => (
                                            <li key={idx} className="flex justify-between text-gray-600 text-xs">
                                                <span>{item.name} <span className="text-gray-400">({item.qty} x {formatCurrency(item.price)})</span></span>
                                                <span className="font-bold">{formatCurrency(item.subtotal)}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <div className="flex justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                                        <span>Modal Barang:</span>
                                        <span>{formatCurrency(order.financials.cogs)}</span>
                                    </div>

                                    <div className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded">
                                        <p><strong>Metode Bayar:</strong> {order.paymentMethod || 'Cash'}</p>
                                        <p><strong>Catatan:</strong> {order.notes || '-'}</p>
                                    </div>
                                </div>
                            )}

                            {order.expenses && order.expenses.length > 0 && (
                                <div className="bg-orange-50 p-3 rounded-xl text-xs mb-4 border border-orange-100 mt-2">
                                    <span className="font-bold text-orange-700 block mb-1">Biaya Operasional:</span>
                                    {order.expenses.map((e, idx) => (
                                        <div key={idx} className="flex justify-between text-orange-600">
                                            <span>{e.name}</span>
                                            <span>-{formatCurrency(e.amount)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="flex justify-between items-center text-sm border-t border-gray-100 pt-4 mt-2">
                                <span className="text-gray-400 font-medium">Laba Bersih:</span>
                                <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">{formatCurrency(order.financials.netProfit)}</span>
                            </div>

                            <div className="flex gap-2 mt-4" onClick={(e) => e.stopPropagation()}>
                                <button onClick={() => setEditingOrder(order)} className="p-2 text-blue-500 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors" title="Edit Data Nota"><Edit size={16} /></button>
                                <button onClick={() => handleDeleteOrder(order)} className="p-2 text-red-500 bg-red-50 rounded-xl hover:bg-red-100 transition-colors" title="Hapus Nota"><Trash2 size={16} /></button>
                                <button onClick={() => handlePrint(order, getSequentialID(order.id))} className="flex-1 py-2 bg-pink-600 text-white rounded-xl text-xs font-bold hover:bg-pink-700 transition-colors flex items-center justify-center gap-2"><Printer size={16} /> Cetak</button>

                                {order.paymentStatus === 'Belum Lunas' && (
                                    <button onClick={() => handleQuickPay(order.id)} className="p-2 text-green-600 bg-green-50 rounded-xl hover:bg-green-100 transition-colors" title="Tandai Lunas"><CheckCircle size={16} /></button>
                                )}
                            </div>
                        </div>
                    ))}
                    {filteredOrders.length === 0 && (
                        <div className="col-span-full text-center py-10 text-gray-400">
                            Tidak ada transaksi yang ditemukan.
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-4 animate-fade-in max-w-4xl mx-auto">
                    <div className="bg-pink-50 border border-pink-100 p-4 rounded-xl text-sm text-pink-700 flex items-center gap-3">
                        <UserCheck size={20} />
                        <span>Menampilkan total laba bersih per customer dari <strong>{filteredOrders.length}</strong> transaksi yang sesuai filter pencarian.</span>
                    </div>

                    {customerGroups.map((group, idx) => (
                        <div key={idx} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                            <div
                                className="p-5 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors"
                                onClick={() => toggleCustomerExpand(group.name)}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-500">
                                        {group.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-800 text-lg">{group.name}</h3>
                                        <p className="text-xs text-gray-400">{group.orders.length} Transaksi</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-gray-400">Total Laba Bersih</p>
                                    <p className="text-xl font-bold text-emerald-600">{formatCurrency(group.totalNetProfit)}</p>
                                </div>
                            </div>

                            {expandedCustomer === group.name && (
                                <div className="bg-gray-50 p-4 border-t border-gray-100 animate-fade-in">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="text-left text-gray-400 text-xs uppercase">
                                                <th className="pb-2">Tanggal</th>
                                                <th className="pb-2">ID Nota</th>
                                                <th className="pb-2 text-right">Omzet</th>
                                                <th className="pb-2 text-right">Laba</th>
                                                <th className="pb-2 text-center">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {group.orders.map(order => (
                                                <tr key={order.id}>
                                                    <td className="py-2 text-gray-600">{formatDate(order.date)}</td>
                                                    <td className="py-2 font-bold text-pink-600">{getSequentialID(order.id)}</td>
                                                    <td className="py-2 text-right">{formatCurrency(order.financials.revenue)}</td>
                                                    <td className="py-2 text-right text-emerald-600 font-bold">{formatCurrency(order.financials.netProfit)}</td>
                                                    <td className="py-2 text-center">
                                                        <span className={`text-[10px] px-2 py-0.5 rounded ${order.paymentStatus === 'Lunas' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                                            {order.paymentStatus || 'Lunas'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};