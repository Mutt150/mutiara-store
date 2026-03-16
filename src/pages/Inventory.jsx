import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, Scan, Trash2, Camera, Calendar, Package, ChevronRight, Tag, DollarSign, PackagePlus, History, Edit, User, CheckCircle, ChevronDown } from 'lucide-react';

// Fungsi helper disematkan langsung untuk menghindari error import
const formatCurrency = (value) => {
    if (!value) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
};

const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(dateString));
};

// Komponen simulasi CameraScanner disematkan langsung
const CameraScanner = ({ onScanSuccess, onClose }) => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
        <div className="bg-white rounded-[32px] p-6 w-full max-w-sm flex flex-col items-center gap-4 relative">
            <button onClick={onClose} className="absolute right-5 top-5 text-gray-400 hover:text-gray-600 font-bold text-lg">✕</button>
            <div className="w-16 h-16 bg-pink-100 text-pink-500 rounded-full flex items-center justify-center mt-4 mb-2"><Camera size={32}/></div>
            <h3 className="font-bold text-gray-800 text-lg">Simulasi Scanner Kamera</h3>
            <p className="text-gray-500 text-sm text-center mb-4">Fitur kamera disimulasikan agar dapat berjalan. Klik tombol di bawah untuk menjalankan simulasi scan barcode.</p>
            <button onClick={() => { onScanSuccess("899" + Math.floor(100000 + Math.random() * 900000)); onClose(); }} className="w-full bg-pink-600 text-white font-bold py-3.5 rounded-xl hover:bg-pink-700 transition-colors shadow-lg shadow-pink-200">
                Simulasi Scan Berhasil
            </button>
        </div>
    </div>
);

export default function Inventory({ inventory, restockLogs, handlePurchase, setEditingRestock, handleDeleteRestock, handleDeleteInventoryItem }) {
    const [mainTab, setMainTab] = useState('restock');

    // ================= STATES UNTUK LIST STOK =================
    const [searchStock, setSearchStock] = useState('');
    const [sortStock, setSortStock] = useState('newest');

    const sortedInventory = useMemo(() => {
        if (!inventory) return [];
        let filtered = inventory.filter(i => 
            (i.name && i.name.toLowerCase().includes(searchStock.toLowerCase())) || 
            (i.category && i.category.toLowerCase().includes(searchStock.toLowerCase())) ||
            (i.barcode && i.barcode.includes(searchStock))
        );
        
        switch(sortStock) {
            case 'alphabet': return filtered.sort((a, b) => a.name.localeCompare(b.name));
            case 'stock_asc': return filtered.sort((a, b) => a.stock - b.stock);
            case 'stock_desc': return filtered.sort((a, b) => b.stock - a.stock);
            case 'newest': 
            default: 
                return [...filtered].reverse(); 
        }
    }, [inventory, searchStock, sortStock]);

    // ================= STATES UNTUK RESTOCK =================
    const [form, setForm] = useState({
        itemName: '', quantity: '', pricePerUnit: '', totalPrice: '', 
        unit: 'pcs', supplier: '', date: new Date().toISOString().slice(0, 16),
        barcode: '', category: 'Umum', sellPrice: ''
    });
    const [mode, setMode] = useState('existing');
    const [showCamera, setShowCamera] = useState(false);
    const [barcodeMode, setBarcodeMode] = useState(false);
    const [barcodeBuffer, setBarcodeBuffer] = useState('');
    const [scanSuccessUI, setScanSuccessUI] = useState(false);
    
    // Fitur Pencarian Dropdown Barang Lama
    const [showItemDropdown, setShowItemDropdown] = useState(false);
    const [itemSearchQuery, setItemSearchQuery] = useState('');
    
    // REVISI: Menaikkan limit default penampilan Riwayat Masuk menjadi 15
    const [visibleHistory, setVisibleHistory] = useState(15);
    
    const quantityInputRef = useRef(null);
    const barcodeInputRef = useRef(null);

    // Filter Riwayat
    const [searchHistory, setSearchHistory] = useState('');
    const [sortHistory, setSortHistory] = useState('newest');

    useEffect(() => {
        if (barcodeMode && barcodeInputRef.current && mainTab === 'restock') {
            barcodeInputRef.current.focus();
        }
    }, [barcodeMode, mainTab]);

    const triggerScanSuccess = () => {
        setScanSuccessUI(true);
        if (navigator.vibrate) navigator.vibrate(200);
        setTimeout(() => setScanSuccessUI(false), 2000);
    }

    const processBarcodeRestock = (scannedBarcode) => {
        triggerScanSuccess();
        setForm(prev => ({ ...prev, barcode: scannedBarcode }));
        const exists = inventory.find(i => i.barcode === scannedBarcode);
        if (exists) {
            setMode('existing');
            setForm(prev => ({
                ...prev, barcode: scannedBarcode, itemName: exists.name, unit: exists.unit,
                category: exists.category || 'Umum', existingId: exists.id, sellPrice: exists.sellPrice || exists.lastPrice || ''
            }));
            if (quantityInputRef.current) quantityInputRef.current.focus();
        } else {
            setMode('new');
            setForm(prev => ({ ...prev, barcode: scannedBarcode, itemName: '', existingId: null }));
        }
        setBarcodeBuffer('');
    }

    const handleBarcodeKeyDown = (e) => {
        if(e.key === 'Enter') {
            e.preventDefault();
            processBarcodeRestock(e.target.value);
        } else {
            setBarcodeBuffer(e.target.value);
        }
    }

    const submitRestock = (e) => {
        e.preventDefault();
        // Validasi ekstra jika mode existing tapi belum pilih barang
        if (mode === 'existing' && !form.existingId) {
            alert('Mohon pilih barang dari gudang terlebih dahulu.');
            return;
        }
        handlePurchase(form);
        setForm({ ...form, itemName: '', quantity: '', pricePerUnit: '', totalPrice: '', barcode: '', existingId: null, sellPrice: '' });
    }

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

    const filteredLogs = useMemo(() => {
        if (!restockLogs) return [];
        let logs = [...restockLogs];
        
        if (searchHistory) {
            const query = searchHistory.toLowerCase();
            logs = logs.filter(log => 
                (log.itemName && log.itemName.toLowerCase().includes(query)) || 
                (log.supplier && log.supplier.toLowerCase().includes(query))
            );
        }
        
        logs.sort((a, b) => {
            const dateA = new Date(a.inputDate || 0); 
            const dateB = new Date(b.inputDate || 0);
            return sortHistory === 'oldest' ? dateA - dateB : dateB - dateA;
        });
        
        return logs;
    }, [restockLogs, searchHistory, sortHistory]);

    // LOGIK: Menghitung baris kosong (filler rows) agar tabel selalu terlihat penuh/rapi
    const displayLogs = filteredLogs.slice(0, visibleHistory);
    const fillerRowsCount = Math.max(0, 8 - displayLogs.length);

    return (
        <div className="pb-24 md:pb-0 animate-fade-in space-y-6 w-full min-w-0">
            
            <div className="flex w-full mb-6">
                <div className="flex w-full gap-1 sm:gap-2 bg-white p-1.5 sm:p-2 rounded-2xl shadow-sm border border-pink-50">
                    <button 
                        onClick={() => setMainTab('restock')} 
                        className={`flex-1 py-3 md:py-3.5 rounded-xl font-bold text-sm md:text-base transition-all duration-300 ${mainTab === 'restock' ? 'bg-pink-600 text-white shadow-md shadow-pink-200 scale-100' : 'bg-transparent text-gray-500 hover:bg-gray-50 scale-[0.98]'}`}
                    >
                        Input Restock
                    </button>
                    <button 
                        onClick={() => setMainTab('list')} 
                        className={`flex-1 py-3 md:py-3.5 rounded-xl font-bold text-sm md:text-base transition-all duration-300 ${mainTab === 'list' ? 'bg-pink-600 text-white shadow-md shadow-pink-200 scale-100' : 'bg-transparent text-gray-500 hover:bg-gray-50 scale-[0.98]'}`}
                    >
                        Stok Gudang
                    </button>
                </div>
            </div>

            {/* ================= TAB: STOK GUDANG ================= */}
            {mainTab === 'list' && (
                <div className="space-y-4 animate-fade-in">
                    <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-3 text-gray-400" size={16} />
                            <input className="w-full pl-9 p-2.5 bg-white border border-pink-100 rounded-2xl outline-none focus:ring-2 focus:ring-pink-300 text-xs md:text-sm shadow-sm" placeholder="Cari nama barang, kategori, barcode..." value={searchStock} onChange={e => setSearchStock(e.target.value)} />
                        </div>
                        <select className="w-full md:w-auto p-2.5 bg-white border border-pink-100 rounded-2xl outline-none focus:ring-2 focus:ring-pink-300 text-xs md:text-sm font-bold text-gray-700 shadow-sm cursor-pointer" value={sortStock} onChange={(e) => setSortStock(e.target.value)}>
                            <option value="newest">Diupdate (Terbaru)</option>
                            <option value="alphabet">Abjad (A-Z)</option>
                            <option value="stock_asc">Stok Terdikit</option>
                            <option value="stock_desc">Stok Terbanyak</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {sortedInventory.map(i => (
                            <div key={i.id} className="bg-white p-4 md:p-5 rounded-3xl shadow-sm border border-pink-50 hover:shadow-lg transition-all group relative flex flex-col h-full min-w-0 hover:-translate-y-1">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex-1 pr-2 min-w-0">
                                        <h3 className="font-bold text-gray-800 text-sm md:text-base leading-tight truncate" title={i.name}>{i.name}</h3>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            <span className="text-[9px] md:text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded font-medium">{i.category || 'Umum'}</span>
                                            {i.barcode && <span className="text-[9px] md:text-[10px] bg-purple-50 text-purple-600 px-2 py-0.5 rounded flex items-center gap-1 w-fit truncate max-w-full font-medium" title={i.barcode}><Scan size={10} className="shrink-0" /> {i.barcode}</span>}
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2 shrink-0">
                                        <span className={`px-2 py-1 rounded-lg text-[10px] md:text-xs font-bold whitespace-nowrap border ${i.stock <= (i.minStock || 5) ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-600 border-green-100'}`}>{i.stock} {i.unit}</span>
                                        <button onClick={() => handleDeleteInventoryItem(i)} className="p-1.5 bg-red-50 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-colors border border-red-100" title="Hapus Permanen"><Trash2 size={14} /></button>
                                    </div>
                                </div>
                                <div className="mt-auto space-y-2">
                                    <div className="flex justify-between items-center text-[10px] md:text-xs text-gray-500 bg-gray-50 p-2 md:p-3 rounded-xl border border-gray-100">
                                        <span className="font-medium">Modal (Avg):</span><span className="font-bold text-gray-700 truncate max-w-[100px] text-right" title={formatCurrency(i.avgCost)}>{formatCurrency(i.avgCost)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[10px] md:text-xs text-pink-700 bg-pink-50 p-2 md:p-3 rounded-xl border border-pink-100">
                                        <span className="font-bold">Harga Jual:</span><span className="font-bold text-pink-600 truncate max-w-[100px] text-right text-xs md:text-sm" title={i.sellPrice ? formatCurrency(i.sellPrice) : '-'}>{i.sellPrice ? formatCurrency(i.sellPrice) : '-'}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {sortedInventory.length === 0 && (
                            <div className="col-span-full py-16 text-center text-gray-400 bg-white rounded-[32px] border border-dashed border-gray-200 text-sm flex flex-col items-center justify-center gap-2">
                                <Package className="text-gray-300" size={48}/>
                                {searchStock ? 'Barang tidak ditemukan.' : 'Gudang masih kosong. Tambahkan barang di menu Input Restock.'}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ================= TAB: RESTOCK BARANG (Layout Vertikal) ================= */}
            {mainTab === 'restock' && (
                <div className="flex flex-col gap-6 animate-fade-in w-full min-w-0">
                    {/* BAGIAN ATAS: FORM MASUK (Full Width) */}
                    <div className="w-full">
                        <div className="bg-white p-5 md:p-8 rounded-[32px] shadow-sm border border-pink-100 w-full min-w-0">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-base md:text-lg text-gray-800 flex items-center gap-2">
                                    <div className="bg-pink-50 text-pink-600 p-2.5 rounded-xl"><PackagePlus size={20}/></div> 
                                    Form Masuk Barang
                                </h3>
                                <div className="flex gap-2">
                                    <button onClick={() => setShowCamera(true)} className="p-2.5 md:p-3 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl hover:bg-blue-600 hover:text-white transition-colors" title="Scan pakai HP"><Camera size={18}/></button>
                                    <button onClick={() => setBarcodeMode(!barcodeMode)} className={`p-2.5 md:p-3 rounded-xl border transition-colors ${barcodeMode ? 'bg-purple-600 text-white border-purple-600 shadow-lg shadow-purple-200' : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'}`} title="Alat Scanner USB"><Scan size={18}/></button>
                                </div>
                            </div>

                            {barcodeMode && (
                                <div className="mb-6 bg-purple-50 p-4 rounded-2xl border border-purple-100 relative overflow-hidden transition-all duration-300">
                                    <label className="text-[10px] md:text-xs font-bold text-purple-600 mb-2 block uppercase tracking-wider">Mode Alat USB Aktif</label>
                                    <input ref={barcodeInputRef} className="w-full p-3.5 bg-white border border-purple-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-400 text-sm md:text-base shadow-sm" placeholder="Klik disini & scan dari alat..." value={barcodeBuffer} onChange={(e) => setBarcodeBuffer(e.target.value)} onKeyDown={handleBarcodeKeyDown} autoFocus />
                                    {scanSuccessUI && (
                                        <div className="absolute inset-0 bg-emerald-500 flex flex-col items-center justify-center text-white font-bold text-base gap-2 animate-fade-in backdrop-blur-sm z-10 rounded-2xl">
                                            <CheckCircle size={32} className="animate-bounce"/><span>Terdeteksi!</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* REVISI DESAIN TOMBOL SWITCH: Warna pink pastel elegan saat aktif (tidak terlalu terang seperti putih) */}
                            <div className="bg-gray-100 p-1.5 rounded-2xl mb-6 flex relative border border-gray-200/60 shadow-inner w-full">
                                <button type="button" onClick={() => { setMode('existing'); setForm({ ...form, existingId: null, barcode: '' }); }} className={`flex-1 py-3 rounded-xl font-bold text-xs md:text-sm transition-all z-10 ${mode === 'existing' ? 'bg-pink-100 text-pink-700 shadow-sm border border-pink-200' : 'text-gray-500 hover:text-gray-700'}`}>Pilih Stok Lama</button>
                                <button type="button" onClick={() => { setMode('new'); setForm({ ...form, existingId: null, barcode: '' }); }} className={`flex-1 py-3 rounded-xl font-bold text-xs md:text-sm transition-all z-10 ${mode === 'new' ? 'bg-pink-100 text-pink-700 shadow-sm border border-pink-200' : 'text-gray-500 hover:text-gray-700'}`}>Input Barang Baru</button>
                            </div>

                            <form onSubmit={submitRestock} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                                    <div>
                                        <label className="text-[10px] md:text-xs font-bold text-gray-400 ml-1 mb-1.5 block uppercase tracking-wider">Tanggal Masuk</label>
                                        <input type="datetime-local" className="w-full p-3.5 md:p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-pink-300 transition-all text-sm md:text-base font-medium text-gray-700" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required/>
                                    </div>

                                    <div>
                                        <label className="text-[10px] md:text-xs font-bold text-gray-400 ml-1 mb-1.5 block uppercase tracking-wider">{mode === 'existing' ? 'Cari Barang Gudang' : 'Nama Barang Baru'}</label>
                                        {mode === 'existing' ? (
                                            /* REVISI DROPDOWN: Dibuat custom agar bisa dicari/di-search */
                                            <div className="relative">
                                                <div 
                                                    className="w-full p-3.5 md:p-4 bg-gray-50 border border-gray-200 rounded-2xl flex items-center justify-between cursor-pointer focus-within:ring-2 focus-within:ring-pink-300 focus-within:bg-white transition-all"
                                                    onClick={() => setShowItemDropdown(!showItemDropdown)}
                                                >
                                                    <span className={form.existingId ? "text-gray-800 font-medium text-sm md:text-base truncate pr-4" : "text-gray-400 font-medium text-sm md:text-base"}>
                                                        {form.existingId ? inventory.find(i => i.id === form.existingId)?.name : "-- Cari & Pilih Barang --"}
                                                    </span>
                                                    <ChevronDown size={18} className={`text-pink-400 shrink-0 transition-transform ${showItemDropdown ? 'rotate-180' : ''}`} />
                                                </div>

                                                {/* Dropdown Content & Overlay */}
                                                {showItemDropdown && (
                                                    <>
                                                        {/* Invisible overlay untuk mendeteksi klik di luar kotak dropdown */}
                                                        <div className="fixed inset-0 z-10" onClick={() => setShowItemDropdown(false)}></div>
                                                        
                                                        <div className="absolute z-20 w-full mt-2 bg-white border border-pink-100 rounded-2xl shadow-xl max-h-64 flex flex-col overflow-hidden animate-fade-in">
                                                            <div className="p-3 border-b border-gray-50 bg-gray-50/50 sticky top-0">
                                                                <div className="relative">
                                                                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                                                    <input 
                                                                        autoFocus
                                                                        type="text" 
                                                                        className="w-full pl-10 p-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-300 text-sm shadow-sm"
                                                                        placeholder="Ketik nama barang..."
                                                                        value={itemSearchQuery}
                                                                        onChange={(e) => setItemSearchQuery(e.target.value)}
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="overflow-y-auto custom-scrollbar p-2 flex flex-col gap-1">
                                                                {inventory.filter(i => i.name.toLowerCase().includes(itemSearchQuery.toLowerCase())).length > 0 ? (
                                                                    inventory.filter(i => i.name.toLowerCase().includes(itemSearchQuery.toLowerCase())).map(i => (
                                                                        <div 
                                                                            key={i.id} 
                                                                            className="p-3 hover:bg-pink-50 rounded-xl cursor-pointer transition-colors text-sm md:text-base text-gray-700 font-medium flex justify-between items-center"
                                                                            onClick={() => {
                                                                                setForm({ ...form, itemName: i.name, unit: i.unit, category: i.category || 'Umum', existingId: i.id, barcode: i.barcode || '', sellPrice: i.sellPrice || i.lastPrice || '' });
                                                                                setShowItemDropdown(false);
                                                                                setItemSearchQuery('');
                                                                            }}
                                                                        >
                                                                            <span className="truncate">{i.name}</span>
                                                                            <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded ml-2 shrink-0">{i.stock} {i.unit}</span>
                                                                        </div>
                                                                    ))
                                                                ) : (
                                                                    <div className="p-4 text-center text-gray-400 text-sm">Barang tidak ditemukan</div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        ) : (
                                            <input className="w-full p-3.5 md:p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-pink-300 text-sm md:text-base placeholder:text-gray-300 font-medium" placeholder="Contoh: Indomie Goreng Spesial" value={form.itemName} onChange={e => setForm({ ...form, itemName: e.target.value })} required />
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                                    <div>
                                        <label className="text-[10px] md:text-xs font-bold text-gray-400 ml-1 mb-1.5 block uppercase tracking-wider">Kode Barcode</label>
                                        <input className="w-full p-3.5 md:p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-pink-300 text-sm md:text-base font-medium" placeholder="Ketik atau scan barcode..." value={form.barcode} onChange={e => setForm({ ...form, barcode: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="text-[10px] md:text-xs font-bold text-gray-400 ml-1 mb-1.5 block uppercase tracking-wider">Kategori</label>
                                        <input className="w-full p-3.5 md:p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-pink-300 text-sm md:text-base font-medium" placeholder="Cth: Makanan / Minuman" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} list="categories" />
                                        <datalist id="categories"><option value="Makanan" /><option value="Minuman" /><option value="Sembako" /><option value="Rokok" /><option value="Alat Tulis" /></datalist>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 p-5 md:p-6 rounded-[24px] border border-gray-200">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] md:text-xs font-bold text-gray-400 text-center uppercase tracking-wider">Jumlah</label>
                                        <input ref={quantityInputRef} type="number" step="0.01" className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-300 text-center font-bold text-gray-800 text-sm md:text-base shadow-sm" placeholder="0" value={form.quantity} onChange={e => handleQtyChange(e.target.value)} required />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] md:text-xs font-bold text-gray-400 text-center uppercase tracking-wider">Satuan</label>
                                        <input className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-300 text-center text-sm md:text-base shadow-sm font-medium" placeholder="pcs" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} required/>
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] md:text-xs font-bold text-gray-400 text-center uppercase tracking-wider">Harga Beli</label>
                                        <input type="number" className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-300 text-sm md:text-base shadow-sm font-medium text-center" placeholder="Rp" value={form.pricePerUnit} onChange={e => handleUnitPriceChange(e.target.value)} required />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] md:text-xs font-bold text-blue-500 text-center uppercase tracking-wider">Total Beli</label>
                                        <input type="number" className="w-full p-3 bg-blue-50 border border-blue-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-400 text-sm md:text-base font-bold text-blue-700 shadow-sm text-center" placeholder="Rp" value={form.totalPrice} onChange={e => handleTotalPriceChange(e.target.value)} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-[10px] md:text-xs font-bold text-pink-600 ml-1 mb-1.5 block uppercase tracking-widest">Harga Jual Nanti (Di Kasir)</label>
                                        <div className="flex items-center w-full bg-pink-50 border border-pink-200 rounded-2xl focus-within:bg-white focus-within:ring-2 focus-within:ring-pink-400 transition-all shadow-inner overflow-hidden">
                                            <span className="pl-4 pr-1 text-pink-500 font-bold text-sm md:text-base whitespace-nowrap">Rp</span>
                                            <input type="number" className="w-full py-3.5 md:py-4 pr-4 bg-transparent outline-none text-sm md:text-lg font-bold text-pink-700 placeholder:font-bold placeholder:text-pink-300" placeholder="Masukan harga jual..." value={form.sellPrice} onChange={e => setForm({ ...form, sellPrice: e.target.value })} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] md:text-xs font-bold text-gray-400 ml-1 mb-1.5 block uppercase tracking-wider">Nama Supplier (Opsional)</label>
                                        <input className="w-full p-3.5 md:p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-pink-300 text-sm md:text-base font-medium" placeholder="Toko tempat beli barang ini" value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })} />
                                    </div>
                                </div>

                                <button type="submit" className="w-full p-4 md:p-5 bg-gray-900 text-white font-bold rounded-[24px] hover:bg-pink-600 transition-all shadow-lg text-sm md:text-lg active:scale-[0.98] flex justify-center items-center gap-3 hover:shadow-pink-300 group mt-4">
                                    <PackagePlus size={22} className="group-hover:scale-110 transition-transform" /> Simpan Stok Masuk
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* BAGIAN BAWAH: RIWAYAT MASUK (Full Width) */}
                    <div className="w-full">
                        <div className="bg-white rounded-[32px] shadow-sm border border-pink-100 flex flex-col min-w-0 w-full overflow-hidden">
                            <div className="p-5 md:p-8 bg-white flex flex-col md:flex-row justify-between items-start md:items-center gap-5 border-b border-gray-50 shrink-0">
                                <h3 className="font-bold text-base md:text-lg text-gray-800 flex items-center gap-3">
                                    <div className="bg-gray-100 p-2.5 rounded-xl text-gray-600"><History size={20}/></div> 
                                    Riwayat Masuk Terbaru
                                    <span className="text-xs bg-gray-100 text-gray-500 px-3 py-1 rounded-full ml-1 font-bold">{filteredLogs.length} Data</span>
                                </h3>
                                
                                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                                    <div className="relative w-full sm:w-64">
                                        <Search className="absolute left-4 top-3.5 text-gray-400" size={16} />
                                        <input className="w-full pl-10 p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-pink-300 transition-all font-medium" placeholder="Cari rincian/supplier..." value={searchHistory} onChange={(e) => setSearchHistory(e.target.value)} />
                                    </div>
                                    <select className="w-full sm:w-auto p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-pink-300 font-bold text-gray-600 cursor-pointer" value={sortHistory} onChange={(e) => setSortHistory(e.target.value)}>
                                        <option value="newest">Paling Baru</option><option value="oldest">Paling Lama</option>
                                    </select>
                                </div>
                            </div>

                            <div className="w-full overflow-x-auto custom-scrollbar relative">
                                <table className="w-full text-sm text-left min-w-[700px]">
                                    <thead className="bg-pink-50/50 text-gray-500 text-[10px] md:text-xs uppercase font-bold sticky top-0 z-10 backdrop-blur-sm">
                                        <tr>
                                            <th className="p-5 whitespace-nowrap">Tgl Masuk</th>
                                            <th className="p-5">Rincian Barang</th>
                                            <th className="p-5 text-center">Jumlah</th>
                                            <th className="p-5 text-right whitespace-nowrap">Total Modal</th>
                                            <th className="p-5 text-center">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {displayLogs.map(log => (
                                            <tr key={log.id} className="hover:bg-pink-50/30 transition-colors group">
                                                <td className="p-5 text-xs md:text-sm text-gray-500 whitespace-nowrap font-medium">{formatDate(log.inputDate).split(',')[0]}</td>
                                                <td className="p-5">
                                                    <div className="font-bold text-gray-800 leading-tight truncate max-w-[250px]" title={log.itemName}>{log.itemName}</div>
                                                    <div className="text-[10px] md:text-xs text-gray-400 mt-1 truncate font-medium flex items-center gap-1.5">
                                                        <User size={12} className="shrink-0"/> Supp: {log.supplier || '-'}
                                                    </div>
                                                </td>
                                                <td className="p-5 text-center whitespace-nowrap">
                                                    <span className="bg-gray-100 text-gray-700 font-bold px-3 py-1.5 rounded-lg text-xs border border-gray-200 group-hover:bg-white group-hover:border-pink-200 transition-colors">{log.qty} {log.unit}</span>
                                                </td>
                                                <td className="p-5 text-right font-bold text-gray-800 whitespace-nowrap text-base">{formatCurrency(log.totalCost)}</td>
                                                <td className="p-5 text-center whitespace-nowrap">
                                                    <div className="flex justify-center items-center gap-2">
                                                        <button onClick={() => setEditingRestock(log)} className="p-2.5 text-blue-500 hover:bg-blue-50 hover:text-blue-700 rounded-xl transition-colors border border-transparent hover:border-blue-100" title="Koreksi Data"><Edit size={16} /></button>
                                                        <button onClick={() => handleDeleteRestock(log)} className="p-2.5 text-red-500 hover:bg-red-50 hover:text-red-700 rounded-xl transition-colors border border-transparent hover:border-red-100" title="Hapus Riwayat"><Trash2 size={16} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}

                                        {/* Filler rows agar tabel tidak terlihat nanggung/kosong di bawah */}
                                        {Array.from({ length: fillerRowsCount }).map((_, idx) => (
                                            <tr key={`filler-${idx}`} className="hidden md:table-row border-transparent">
                                                <td className="p-5 h-[76px]" colSpan="5"></td>
                                            </tr>
                                        ))}

                                        {filteredLogs.length === 0 && (
                                            <tr>
                                                <td colSpan="5" className="p-16 text-center text-gray-400 text-sm font-medium">
                                                    <div className="flex flex-col items-center gap-3">
                                                        <History size={48} className="opacity-10"/>
                                                        Belum ada riwayat masuk barang.
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            
                            {filteredLogs.length > visibleHistory && (
                                <div className="p-6 flex justify-center border-t border-gray-50 bg-gray-50/50 shrink-0">
                                    <button 
                                        onClick={() => setVisibleHistory(prev => prev + 15)}
                                        className="px-8 py-3 bg-white border-2 border-pink-100 text-pink-600 text-sm font-bold rounded-full hover:bg-pink-600 hover:text-white hover:border-pink-600 transition-all shadow-sm active:scale-95 flex items-center gap-2"
                                    >
                                        Tampilkan Lebih Banyak ({filteredLogs.length - visibleHistory})
                                        <ChevronDown size={18} />
                                    </button>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            )}
            {showCamera && <CameraScanner onScanSuccess={processBarcodeRestock} onClose={() => setShowCamera(false)} />}
        </div>
    )
}