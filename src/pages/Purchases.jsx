import React, { useState, useMemo, useRef } from 'react';
import { Camera, Calendar, Package, ChevronRight, Tag, DollarSign, PackagePlus, History, Search, ArrowDownUp, Filter, RefreshCcw, Edit, Trash2, User } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/helpers';
import CameraScanner from '../components/ui/CameraScanner';

export default function Purchases({ inventory, restockLogs, handlePurchase, setEditingRestock, handleDeleteRestock }) {
    const [form, setForm] = useState({
        itemName: '', quantity: '', pricePerUnit: '', totalPrice: '', 
        unit: 'pcs', supplier: '', date: new Date().toISOString().slice(0, 16),
        barcode: '', category: 'Umum', sellPrice: ''
    });

    const [mode, setMode] = useState('existing');
    const [showCamera, setShowCamera] = useState(false);
    const quantityInputRef = useRef(null);

    const [filterStartDate, setFilterStartDate] = useState('');
    const [filterEndDate, setFilterEndDate] = useState('');
    const [visibleLimit, setVisibleLimit] = useState(10);
    const [searchSupplier, setSearchSupplier] = useState('');
    const [sortBy, setSortBy] = useState('newest');

    const handleQtyChange = (val) => {
        const newQty = val;
        const unitPrice = parseFloat(form.pricePerUnit) || 0;
        const newTotal = newQty && unitPrice ? (parseFloat(newQty) * unitPrice).toString() : form.totalPrice;
        setForm({ ...form, quantity: newQty, totalPrice: newTotal });
    };

    const handleUnitPriceChange = (val) => {
        const newPrice = val;
        const qty = parseFloat(form.quantity) || 0;
        const newTotal = qty && newPrice ? (qty * parseFloat(newPrice)).toString() : '';
        setForm({ ...form, pricePerUnit: newPrice, totalPrice: newTotal });
    };

    const handleTotalPriceChange = (val) => {
        const newTotal = val;
        const qty = parseFloat(form.quantity) || 0;
        const newUnitPrice = qty > 0 && newTotal ? (parseFloat(newTotal) / qty).toString() : '';
        setForm({ ...form, totalPrice: newTotal, pricePerUnit: newUnitPrice });
    };

    const handleExistSelect = (e) => {
        const i = inventory.find(x => x.id === e.target.value);
        if (i) {
            setForm({
                ...form, itemName: i.name, unit: i.unit, category: i.category || 'Umum',
                barcode: i.barcode || '', existingId: i.id, sellPrice: i.sellPrice || i.lastPrice || ''
            });
            if (quantityInputRef.current) quantityInputRef.current.focus();
        }
    }

    const submit = (e) => {
        e.preventDefault();
        handlePurchase(form);
        setForm({ ...form, quantity: '', pricePerUnit: '', totalPrice: '', barcode: '', existingId: null, sellPrice: '' });
    }

    const processBarcodeRestock = (scannedBarcode) => {
        setForm(prev => ({ ...prev, barcode: scannedBarcode }));
        const exists = inventory.find(i => i.barcode === scannedBarcode);
        if (exists) {
            setMode('existing');
            setForm(prev => ({
                ...prev, barcode: scannedBarcode, itemName: exists.name, unit: exists.unit,
                category: exists.category || 'Umum', existingId: exists.id, sellPrice: exists.sellPrice || exists.lastPrice || ''
            }));
        } else {
            setMode('new');
            setForm(prev => ({ ...prev, barcode: scannedBarcode, itemName: '', existingId: null }));
        }
    }

    const filteredLogs = useMemo(() => {
        let logs = [...restockLogs];
        if (filterStartDate || filterEndDate) {
            const start = filterStartDate ? new Date(filterStartDate) : new Date(0);
            const end = filterEndDate ? new Date(filterEndDate) : new Date(8640000000000000);
            end.setHours(23, 59, 59, 999);
            logs = logs.filter(log => {
                const logDate = log.inputDate ? new Date(log.inputDate) : new Date();
                return logDate >= start && logDate <= end;
            });
        }
        if (searchSupplier) {
            const query = searchSupplier.toLowerCase();
            logs = logs.filter(log => (log.supplier || '').toLowerCase().includes(query));
        }
        logs.sort((a, b) => {
            const dateA = new Date(a.inputDate || 0);
            const dateB = new Date(b.inputDate || 0);
            const costA = a.totalCost || 0;
            const costB = b.totalCost || 0;
            switch (sortBy) {
                case 'oldest': return dateA - dateB;
                case 'highest': return costB - costA;
                case 'lowest': return costA - costB;
                case 'newest': default: return dateB - dateA;
            }
        });
        return logs;
    }, [restockLogs, filterStartDate, filterEndDate, searchSupplier, sortBy]);

    const visibleLogs = filteredLogs.slice(0, visibleLimit);

    return (
        <div className="w-full pb-32 md:pb-0 animate-fade-in space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Restock Gudang</h2>
                    <p className="text-gray-500 text-sm">Input pembelian barang baru atau tambah stok.</p>
                </div>
                <button onClick={() => setShowCamera(true)} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 hover:bg-blue-700 shadow-lg w-fit">
                    <Camera size={16} /> Scan Barcode
                </button>
            </div>

            <div className="bg-white p-5 md:p-8 rounded-3xl shadow-sm border border-pink-100 w-full">
                <div className="bg-pink-50/50 p-1.5 rounded-2xl mb-6 max-w-md mx-auto w-full flex relative">
                    <button onClick={() => { setMode('existing'); setForm({ ...form, existingId: null }); }} className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all relative z-10 ${mode === 'existing' ? 'text-pink-600 shadow-sm bg-white' : 'text-gray-400 hover:text-gray-600'}`}>Stok Lama</button>
                    <button onClick={() => { setMode('new'); setForm({ ...form, existingId: null }); }} className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all relative z-10 ${mode === 'new' ? 'text-pink-600 shadow-sm bg-white' : 'text-gray-400 hover:text-gray-600'}`}>Barang Baru</button>
                </div>

                <form onSubmit={submit} className="space-y-5">
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-gray-400 ml-1 mb-1 flex items-center gap-1"><Calendar size={12} /> TANGGAL MASUK</label>
                            <input type="datetime-local" className="w-full p-3 md:p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-pink-300 transition-all text-sm md:text-base font-medium text-gray-700" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-gray-400 ml-1 mb-1 flex items-center gap-1"><Package size={12} /> {mode === 'existing' ? 'PILIH BARANG' : 'NAMA BARANG BARU'}</label>
                            {mode === 'existing' ? (
                                <div className="relative">
                                    <select className="w-full p-3 md:p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-pink-300 transition-all appearance-none text-sm md:text-base" onChange={handleExistSelect} value={form.existingId || ''}>
                                        <option value="">-- Cari / Scan Barang --</option>
                                        {inventory.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400"><ChevronRight size={16} className="rotate-90" /></div>
                                </div>
                            ) : (
                                <div className="flex gap-2">
                                    <input className="flex-[3] p-3 md:p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-pink-300 w-full text-sm md:text-base placeholder:text-gray-300" placeholder="Nama Barang" value={form.itemName} onChange={e => setForm({ ...form, itemName: e.target.value })} />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-bold text-gray-400 ml-1 mb-1">BARCODE (Auto)</label>
                            <input className="w-full p-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-pink-300 text-sm" placeholder="Scan/Ketik Barcode" value={form.barcode} onChange={e => setForm({ ...form, barcode: e.target.value })} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-400 ml-1 mb-1">KATEGORI</label>
                            <input className="w-full p-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-pink-300 text-sm" placeholder="Cth: Makanan, Minuman" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} list="categories" />
                            <datalist id="categories"><option value="Makanan" /><option value="Minuman" /><option value="Sembako" /><option value="Rokok" /><option value="Alat Tulis" /></datalist>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                        <div className="col-span-1">
                            <label className="text-xs font-bold text-gray-400 ml-1 mb-1 block">JUMLAH</label>
                            <input
                                ref={quantityInputRef}
                                type="number" step="0.01" inputMode="decimal"
                                className="w-full p-3 md:p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-pink-300 text-center font-bold text-gray-800 text-sm md:text-base"
                                placeholder="0"
                                value={form.quantity}
                                onChange={e => handleQtyChange(e.target.value)} 
                            />
                        </div>
                        <div className="col-span-1">
                            <label className="text-xs font-bold text-gray-400 ml-1 mb-1 block">SATUAN</label>
                            <input className="w-full p-3 md:p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-pink-300 text-center text-sm md:text-base" placeholder="Unit" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} />
                        </div>
                        <div className="col-span-1 md:col-span-1">
                            <label className="text-xs font-bold text-gray-400 ml-1 mb-1 flex items-center gap-1"><Tag size={12} /> HARGA SATUAN</label>
                            <input type="number" inputMode="numeric" className="w-full p-3 md:p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-pink-300 text-sm md:text-base" placeholder="Rp"
                                value={form.pricePerUnit}
                                onChange={e => handleUnitPriceChange(e.target.value)} 
                            />
                        </div>
                        <div className="col-span-1 md:col-span-1">
                            <label className="text-xs font-bold text-blue-500 ml-1 mb-1 flex items-center gap-1"><DollarSign size={12} /> TOTAL BELI</label>
                            <input type="number" inputMode="numeric" className="w-full p-3 md:p-4 bg-blue-50 border border-blue-100 rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-300 text-sm md:text-base font-bold text-blue-700" placeholder="Rp"
                                value={form.totalPrice}
                                onChange={e => handleTotalPriceChange(e.target.value)} 
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-pink-500 ml-1 mb-1 flex items-center gap-1"><DollarSign size={12} /> HARGA JUAL (RENCANA)</label>
                        <input type="number" inputMode="numeric" className="w-full p-3 md:p-4 bg-pink-50 border border-pink-200 rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-pink-400 text-sm md:text-base font-bold text-pink-700" placeholder="Rp (Otomatis muncul di kasir)" value={form.sellPrice} onChange={e => setForm({ ...form, sellPrice: e.target.value })} />
                        <p className="text-[10px] text-gray-400 mt-1 ml-1">*Harga ini akan otomatis terisi jika barang lama dipilih, tapi tetap bisa diedit.</p>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-400 ml-1 mb-1 flex items-center gap-1"><User size={12} /> SUPPLIER</label>
                        <input className="w-full p-3 md:p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-pink-300 text-sm md:text-base" placeholder="Nama Toko / Supplier" value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })} />
                    </div>

                    <button className="w-full p-4 bg-gray-900 text-white font-bold rounded-2xl hover:bg-gray-800 transition-all shadow-lg text-base md:text-lg mt-4 active:scale-95 flex justify-center items-center gap-2">
                        <PackagePlus size={20} /> Simpan Stok
                    </button>
                </form>
            </div>

            <div className="space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-2">
                    <div className="flex items-center gap-2">
                        <History size={20} className="text-pink-600" />
                        <h3 className="font-bold text-lg text-gray-800">Riwayat Masuk ({filteredLogs.length})</h3>
                    </div>

                    <div className="flex flex-col xl:flex-row gap-2 w-full md:w-auto">
                        <div className="relative min-w-[200px]">
                            <Search className="absolute left-3 top-2.5 text-gray-400" size={14} />
                            <input className="w-full pl-9 p-2 bg-white border border-gray-100 rounded-xl text-xs outline-none focus:ring-2 focus:ring-pink-300 shadow-sm" placeholder="Cari Supplier..." value={searchSupplier} onChange={(e) => setSearchSupplier(e.target.value)} />
                        </div>
                        <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto bg-white p-2 rounded-xl border border-gray-100 shadow-sm">
                            <div className="relative">
                                <ArrowDownUp size={14} className="absolute left-2 top-2.5 text-gray-400" />
                                <select className="pl-7 p-2 bg-gray-50 rounded-lg text-xs border border-gray-200 outline-none w-full md:w-auto cursor-pointer font-bold text-gray-600" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                                    <option value="newest">Terbaru</option>
                                    <option value="oldest">Terlama</option>
                                    <option value="highest">Termahal (Total)</option>
                                    <option value="lowest">Termurah (Total)</option>
                                </select>
                            </div>
                            <div className="flex items-center gap-2 px-2 border-l border-gray-100">
                                <Filter size={14} className="text-gray-400" />
                                <span className="text-xs font-bold text-gray-500 hidden md:inline">Tgl:</span>
                            </div>
                            <input type="date" className="p-2 bg-gray-50 rounded-lg text-xs border border-gray-200 outline-none" value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)} placeholder="Dari" />
                            <span className="text-gray-400 hidden md:block">-</span>
                            <input type="date" className="p-2 bg-gray-50 rounded-lg text-xs border border-gray-200 outline-none" value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)} placeholder="Sampai" />
                            {(filterStartDate || filterEndDate || searchSupplier || sortBy !== 'newest') && (
                                <button onClick={() => { setFilterStartDate(''); setFilterEndDate(''); setSearchSupplier(''); setSortBy('newest'); }} className="p-2 bg-red-50 text-red-500 rounded-lg text-xs hover:bg-red-100"><RefreshCcw size={14} /></button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="hidden md:block bg-white rounded-3xl shadow-sm border border-pink-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-pink-50/50 text-gray-500 uppercase font-bold text-xs">
                                <tr>
                                    <th className="p-4">Tanggal Input</th>
                                    <th className="p-4">Barang</th>
                                    <th className="p-4 text-center">Jml</th>
                                    <th className="p-4 text-right">Harga Beli</th>
                                    <th className="p-4 text-right">Total</th>
                                    <th className="p-4">Supplier</th>
                                    <th className="p-4 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {visibleLogs.map(log => (
                                    <tr key={log.id} className="hover:bg-pink-50/20">
                                        <td className="p-4 text-gray-500">{formatDate(log.inputDate)}</td>
                                        <td className="p-4 font-bold text-gray-700">{log.itemName}</td>
                                        <td className="p-4 text-center">{log.qty} {log.unit}</td>
                                        <td className="p-4 text-right">{formatCurrency(log.pricePerUnit)}</td>
                                        <td className="p-4 text-right font-bold text-gray-800">{formatCurrency(log.totalCost)}</td>
                                        <td className="p-4 text-gray-500 text-xs">{log.supplier || '-'}</td>
                                        <td className="p-4 text-center">
                                            <div className="flex justify-center gap-2">
                                                <button onClick={() => setEditingRestock(log)} className="p-2 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit"><Edit size={16} /></button>
                                                <button onClick={() => handleDeleteRestock(log)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Hapus"><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {visibleLogs.length === 0 && <tr><td colSpan="7" className="p-8 text-center text-gray-400">Tidak ada riwayat ditemukan.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="md:hidden space-y-3">
                    {visibleLogs.map(log => (
                        <div key={log.id} className="bg-white p-4 rounded-2xl shadow-sm border border-pink-50 flex flex-col gap-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <span className="text-[10px] font-bold bg-pink-50 text-pink-600 px-2 py-1 rounded-md mb-1 inline-block">{formatDate(log.inputDate)}</span>
                                    <h4 className="font-bold text-gray-800 text-lg">{log.itemName}</h4>
                                    <p className="text-xs text-gray-400">{log.supplier || 'Tanpa Supplier'}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => setEditingRestock(log)} className="p-2 text-blue-400 bg-blue-50 rounded-xl"><Edit size={18} /></button>
                                    <button onClick={() => handleDeleteRestock(log)} className="p-2 text-red-400 bg-red-50 rounded-xl"><Trash2 size={18} /></button>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl">
                                <div className="flex-1 text-center border-r border-gray-200">
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">Jumlah</p>
                                    <p className="font-bold text-gray-800">{log.qty} <span className="text-xs font-normal">{log.unit}</span></p>
                                </div>
                                <div className="flex-1 text-center">
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">Total Beli</p>
                                    <p className="font-bold text-gray-800">{formatCurrency(log.totalCost)}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                    {visibleLogs.length === 0 && <div className="text-center text-gray-400 py-10">Tidak ada riwayat ditemukan.</div>}
                </div>

                {visibleLogs.length < filteredLogs.length && (
                    <button onClick={() => setVisibleLimit(prev => prev + 10)} className="w-full py-3 bg-gray-100 text-gray-500 font-bold rounded-2xl hover:bg-gray-200 transition-all text-sm mt-4">
                        Muat Lebih Banyak ({filteredLogs.length - visibleLogs.length} lagi)
                    </button>
                )}
            </div>

            {showCamera && <CameraScanner onScanSuccess={processBarcodeRestock} onClose={() => setShowCamera(false)} />}
        </div>
    )
}