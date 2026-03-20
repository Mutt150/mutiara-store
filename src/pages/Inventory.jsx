import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
    Search, Scan, Trash2, Camera, Calendar, Package, ChevronRight, Tag, DollarSign, 
    PackagePlus, History, Edit, User, CheckCircle, ChevronDown,
    Bot, Sparkles, X, Image as ImageIcon, RefreshCw, Key,
    Plus, AlertTriangle, FileText, Archive, Truck, ArrowUpDown 
} from 'lucide-react';

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount || 0);
};

const formatDate = (timestamp) => {
    if (!timestamp) return '-';
    let date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date);
};

const CameraScanner = ({ onScanSuccess, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white p-6 rounded-3xl w-full max-w-sm flex flex-col gap-4 text-center animate-fade-in">
                <div className="mx-auto bg-blue-50 text-blue-500 p-4 rounded-full">
                    <Camera size={32} />
                </div>
                <h3 className="font-bold text-xl text-gray-800">Scanner Kamera</h3>
                <p className="text-sm text-gray-500 mb-2">Simulasi scanner barcode untuk lingkungan pratinjau.</p>
                <button onClick={() => { onScanSuccess('8999999123456'); onClose(); }} className="bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors">
                    Simulasikan Scan Berhasil
                </button>
                <button onClick={onClose} className="bg-gray-100 text-gray-600 font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors">
                    Tutup Kamera
                </button>
            </div>
        </div>
    );
};

export default function Inventory({ inventory, restockLogs, handlePurchase, setEditingRestock, handleDeleteRestock, handleDeleteInventoryItem }) {
    const [mainTab, setMainTab] = useState('restock');

    const getCurrentDateTime = () => {
        const now = new Date();
        const tzOffset = now.getTimezoneOffset() * 60000;
        return new Date(now - tzOffset).toISOString().slice(0, 16);
    };

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
                return [...filtered].sort((a, b) => {
                    const timeA = a.updatedAt?.toMillis ? a.updatedAt.toMillis() : (a.createdAt?.toMillis ? a.createdAt.toMillis() : 0);
                    const timeB = b.updatedAt?.toMillis ? b.updatedAt.toMillis() : (b.createdAt?.toMillis ? b.createdAt.toMillis() : 0);
                    if (timeA === 0 && timeB === 0) return a.name.localeCompare(b.name); 
                    return timeB - timeA; 
                });
        }
    }, [inventory, searchStock, sortStock]);

    const [form, setForm] = useState({
        itemName: '', quantity: '', pricePerUnit: '', totalPrice: '', 
        unit: 'pcs', supplier: '', date: getCurrentDateTime(),
        barcode: '', category: 'Umum', sellPrice: '', scanIndex: undefined
    });
    const [mode, setMode] = useState('existing');
    const [showCamera, setShowCamera] = useState(false);
    const [barcodeMode, setBarcodeMode] = useState(false);
    const [barcodeBuffer, setBarcodeBuffer] = useState('');
    const [scanSuccessUI, setScanSuccessUI] = useState(false);
    
    const [showItemDropdown, setShowItemDropdown] = useState(false);
    const [itemSearchQuery, setItemSearchQuery] = useState('');
    
    const [visibleHistory, setVisibleHistory] = useState(15);
    
    const quantityInputRef = useRef(null);
    const barcodeInputRef = useRef(null);

    const [searchHistory, setSearchHistory] = useState('');
    const [sortHistory, setSortHistory] = useState('newest');

    const [showScannerModal, setShowScannerModal] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null); 
    const [imageBase64, setImageBase64] = useState(''); 
    const [isScanning, setIsScanning] = useState(false);
    const [scanResults, setScanResults] = useState([]);
    const [processedIndices, setProcessedIndices] = useState([]); 
    const [scannerError, setScannerError] = useState('');
    const [customApiKey, setCustomApiKey] = useState('');
    const [showKeyInput, setShowKeyInput] = useState(false);

    useEffect(() => {
        const savedKey = localStorage.getItem('gemini_api_key');
        if (savedKey) setCustomApiKey(savedKey);
    }, []);

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
        if (mode === 'existing' && !form.existingId) {
            alert('Mohon pilih barang dari gudang terlebih dahulu.');
            return;
        }
        handlePurchase(form);
        
        if (form.scanIndex !== undefined) {
            setProcessedIndices(prev => [...prev, form.scanIndex]);
        }

        setForm({ ...form, itemName: '', quantity: '', pricePerUnit: '', totalPrice: '', barcode: '', existingId: null, sellPrice: '', date: getCurrentDateTime(), scanIndex: undefined });
    }

    const handleQtyChange = (val) => {
        const newQty = val;
        const unitPrice = parseFloat(form.pricePerUnit);
        const totalP = parseFloat(form.totalPrice);

        let newTotal = form.totalPrice;
        let newUnit = form.pricePerUnit;

        if (newQty) {
            if (totalP && !unitPrice) {
                newUnit = (totalP / parseFloat(newQty)).toString();
            } else if (unitPrice) {
                newTotal = (parseFloat(newQty) * unitPrice).toString();
            }
        }
        setForm({ ...form, quantity: newQty, totalPrice: newTotal, pricePerUnit: newUnit });
    };

    const handleUnitPriceChange = (val) => {
        const newPrice = val;
        const qty = parseFloat(form.quantity);
        let newTotal = form.totalPrice;

        if (newPrice && qty) {
            newTotal = (qty * parseFloat(newPrice)).toString();
        }
        setForm({ ...form, pricePerUnit: newPrice, totalPrice: newTotal });
    };

    const handleTotalPriceChange = (val) => {
        const newTotal = val;
        const qty = parseFloat(form.quantity);
        let newUnit = form.pricePerUnit;

        if (newTotal && qty) {
            newUnit = (parseFloat(newTotal) / qty).toString();
        }
        setForm({ ...form, totalPrice: newTotal, pricePerUnit: newUnit });
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setSelectedImage(URL.createObjectURL(file));
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result.split(',')[1];
            setImageBase64(base64String);
            setScanResults([]); 
            setProcessedIndices([]);
            setScannerError('');
        };
        reader.readAsDataURL(file);
    };

    const analyzeReceipt = async () => {
        if (!imageBase64) return;
        setIsScanning(true);
        setScannerError('');
        
        try {
            let storedKey = localStorage.getItem('gemini_api_key');
            let envKey = typeof import.meta.env !== 'undefined' ? import.meta.env.VITE_GEMINI_API_KEY : '';
            let apiKeyToUse = storedKey || customApiKey || envKey;

            if (!apiKeyToUse) {
                setShowKeyInput(true);
                throw new Error("API Key belum ditemukan.");
            }

            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKeyToUse}`;

            const systemPrompt = `Kamu adalah sistem ekstraksi data OCR cerdas untuk nota belanja grosir.
Tugasmu: Ekstrak daftar barang yang dibeli dari gambar nota ini.
HANYA kembalikan format JSON murni, tanpa teks markdown atau backticks.
Format Wajib:
{
  "items": [
    { "itemName": "Nama Barang", "qty": 10, "pricePerUnit": 5000, "total": 50000 }
  ]
}
Catatan: Jika ada nama barang yang terpotong/disingkat, perbaiki ejaannya secara logis. Abaikan total keseluruhan nota, fokus pada daftar per item.`;

            const payload = {
                contents: [
                    {
                        parts: [
                            { text: systemPrompt },
                            { inlineData: { mimeType: "image/jpeg", data: imageBase64 } }
                        ]
                    }
                ],
                generationConfig: { responseMimeType: "application/json" }
            };

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const responseData = await response.json();

            if (!response.ok) {
                const errMsg = responseData.error?.message || "Error server Google AI.";
                if (errMsg.includes("API_KEY_INVALID")) {
                    setShowKeyInput(true);
                    throw new Error("Kunci API tidak valid.");
                }
                throw new Error(errMsg);
            }

            const textResponse = responseData.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!textResponse) throw new Error("AI tidak mengembalikan teks.");

            const cleanTextResponse = textResponse.replace(/```json/gi, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(cleanTextResponse);
            
            if (!parsed.items || !Array.isArray(parsed.items)) {
                throw new Error("Format JSON AI tidak sesuai struktur.");
            }

            const processedItems = parsed.items.map(aiItem => {
                const aiNameLower = aiItem.itemName.toLowerCase();
                const aiWords = aiNameLower.split(/[\s-]+/).filter(w => w.length > 2); 

                let matchedInventory = inventory.find(inv => {
                    const invNameLower = inv.name.toLowerCase();
                    
                    if (invNameLower === aiNameLower || 
                        invNameLower.includes(aiNameLower) || 
                        aiNameLower.includes(invNameLower)) {
                        return true;
                    }

                    const invWords = invNameLower.split(/[\s-]+/).filter(w => w.length > 2);
                    const matchedWordsCount = aiWords.filter(w => invWords.includes(w)).length;
                    if (matchedWordsCount >= 2) return true;
                    
                    return false;
                });

                return matchedInventory 
                    ? { ...aiItem, status: 'matched', existingItem: matchedInventory } 
                    : { ...aiItem, status: 'new', existingItem: null };
            });

            setScanResults(processedItems);
            setShowKeyInput(false);

        } catch (error) {
            console.error("Scan Error:", error);
            setScannerError(error.message);
            if(error.message.includes("API Key") || error.message.includes("valid")) setShowKeyInput(true);
        } finally {
            setIsScanning(false);
        }
    };

    const handleProcessScanItem = (item, index) => {
        setMode(item.status === 'matched' ? 'existing' : 'new');
        
        const qty = item.qty || '';
        const price = item.pricePerUnit || '';
        const total = (qty && price) ? (parseFloat(qty) * parseFloat(price)).toString() : '';

        setForm(prev => ({
            ...prev,
            itemName: item.status === 'matched' ? item.existingItem.name : item.itemName,
            quantity: qty,
            unit: item.status === 'matched' ? item.existingItem.unit : 'pcs',
            pricePerUnit: price,
            totalPrice: total,
            supplier: 'Grosir (AI Scan)', 
            date: getCurrentDateTime(),
            barcode: item.status === 'matched' ? (item.existingItem.barcode || '') : '',
            category: item.status === 'matched' ? (item.existingItem.category || 'Umum') : 'Umum',
            sellPrice: item.status === 'matched' ? (item.existingItem.sellPrice || item.existingItem.lastPrice || '') : '',
            existingId: item.status === 'matched' ? item.existingItem.id : '',
            scanIndex: index
        }));
        
        setShowScannerModal(false);
        window.scrollTo({ top: 0, behavior: 'smooth' }); 
    };

    const handleSaveApiKey = () => {
        if (!customApiKey.trim()) return alert("API Key tidak boleh kosong!");
        localStorage.setItem('gemini_api_key', customApiKey.trim());
        setShowKeyInput(false);
        if (imageBase64) analyzeReceipt();
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

            {/* ================= TAB: RESTOCK BARANG ================= */}
            {mainTab === 'restock' && (
                <div className="flex flex-col gap-6 animate-fade-in w-full min-w-0">
                    <div className="w-full">
                        <div className="bg-white p-4 md:p-8 rounded-[32px] shadow-sm border border-pink-100 w-full min-w-0">
                            
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                                <h3 className="font-bold text-base md:text-lg text-gray-800 flex items-center gap-2">
                                    <div className="bg-pink-50 text-pink-600 p-2.5 rounded-xl"><PackagePlus size={20}/></div> 
                                    Form Masuk Barang
                                </h3>
                                
                                <div className="grid grid-cols-3 md:flex md:flex-row gap-2 w-full md:w-auto">
                                    <button onClick={() => setShowScannerModal(true)} className="p-2 md:px-4 md:py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95 flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 text-[10px] md:text-sm font-bold border border-purple-400" title="Scan Nota (AI)">
                                        <Sparkles size={18}/> <span>Nota AI</span>
                                    </button>
                                    
                                    <button onClick={() => setShowCamera(true)} className="p-2 md:p-3 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl hover:bg-blue-600 hover:text-white transition-colors flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 text-[10px] md:text-sm font-bold" title="Scan Barcode HP">
                                        <Camera size={18}/> <span>Kamera</span>
                                    </button>

                                    <button onClick={() => setBarcodeMode(!barcodeMode)} className={`p-2 md:p-3 rounded-xl border transition-colors flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 text-[10px] md:text-sm font-bold ${barcodeMode ? 'bg-purple-600 text-white border-purple-600 shadow-lg shadow-purple-200' : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'}`} title="Alat Scanner USB">
                                        <Scan size={18}/> <span>Alat USB</span>
                                    </button>
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

                            {form.scanIndex !== undefined && (
                                <div className="bg-purple-50 border border-purple-100 p-4 rounded-2xl mb-6 flex gap-3 items-start animate-fade-in">
                                    <div className="p-2 bg-purple-100 text-purple-600 rounded-lg shrink-0 mt-0.5"><Bot size={18}/></div>
                                    <div>
                                        <p className="text-sm font-bold text-purple-800">Review Data dari AI Scanner</p>
                                        <p className="text-xs text-purple-600 mt-1">Data di bawah otomatis diisi dari nota. Silakan periksa kembali dan lengkapi sebelum menyimpan.</p>
                                    </div>
                                    <button onClick={() => setForm({ ...form, scanIndex: undefined })} className="ml-auto text-purple-400 hover:text-purple-600" title="Batal Review"><X size={16}/></button>
                                </div>
                            )}

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

                                                {showItemDropdown && (
                                                    <>
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

            {/* ✨ MODAL SCANNER NOTA AI ✨ */}
            {showScannerModal && (
                <div className="fixed inset-0 bg-black/60 z-[80] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-[32px] w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-fade-in border border-purple-100">
                        
                        <div className="p-5 md:p-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-purple-50 to-white shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-purple-100 text-purple-600 rounded-xl"><Bot size={24} /></div>
                                <div>
                                    <h2 className="text-lg md:text-xl font-bold text-gray-800">Auto-Restock AI</h2>
                                    <p className="text-[10px] md:text-xs text-gray-500">Scan nota belanja, biarkan AI yang membaca.</p>
                                </div>
                            </div>
                            <button onClick={() => setShowScannerModal(false)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors"><X size={24} /></button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50/50 custom-scrollbar">
                            <div className="flex flex-col md:flex-row gap-6 h-full">
                                
                                {/* KIRI: Area Upload Gambar */}
                                <div className="w-full md:w-5/12 flex flex-col gap-4">
                                    <label className={`w-full aspect-[3/4] border-2 border-dashed rounded-3xl flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden ${selectedImage ? 'border-purple-300 bg-purple-50/30 shadow-inner' : 'border-gray-300 hover:border-purple-400 hover:bg-purple-50 bg-white'}`}>
                                        {selectedImage ? (
                                            <div className="relative w-full h-full p-2 group">
                                                <img src={selectedImage} alt="Nota" className="w-full h-full object-contain rounded-2xl" />
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl m-2">
                                                    <span className="text-white font-bold text-sm flex items-center gap-2 bg-black/40 px-4 py-2 rounded-xl backdrop-blur-md"><Camera size={16}/> Ganti Foto</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center gap-3 text-gray-400 p-6 text-center">
                                                <div className="p-5 bg-gray-100 rounded-full shadow-sm"><ImageIcon size={32} className="text-gray-500"/></div>
                                                <span className="text-sm font-bold text-gray-600">Ambil Foto Nota</span>
                                                <span className="text-xs">Ketuk untuk buka galeri/kamera</span>
                                            </div>
                                        )}
                                        <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageChange} />
                                    </label>
                                    
                                    <button 
                                        onClick={analyzeReceipt} 
                                        disabled={!imageBase64 || isScanning}
                                        className="w-full py-4 bg-purple-600 text-white rounded-2xl font-bold hover:bg-purple-700 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-md disabled:opacity-50 disabled:active:scale-100 text-sm md:text-base"
                                    >
                                        {isScanning ? <RefreshCw size={20} className="animate-spin" /> : <Sparkles size={20} />}
                                        {isScanning ? 'Membaca Nota...' : 'Ekstrak dengan AI'}
                                    </button>

                                    {/* Input API Key darurat jika error */}
                                    {showKeyInput && (
                                        <div className="bg-white p-4 rounded-2xl flex flex-col gap-3 border border-purple-200 shadow-sm animate-fade-in">
                                            <div className="flex items-center gap-2 text-purple-700">
                                                <Key size={16}/><p className="text-xs font-bold">API Key Dibutuhkan:</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <input type="password" value={customApiKey} onChange={(e) => setCustomApiKey(e.target.value)} placeholder="AIzaSy..." className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100" />
                                                <button onClick={handleSaveApiKey} className="bg-purple-600 text-white px-4 rounded-xl text-xs font-bold hover:bg-purple-700 transition-colors">Simpan</button>
                                            </div>
                                        </div>
                                    )}
                                    {scannerError && (
                                        <div className="flex items-start gap-2 bg-red-50 p-3 rounded-2xl border border-red-100 text-red-600 animate-fade-in">
                                            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                                            <p className="text-xs font-medium leading-relaxed">{scannerError}</p>
                                        </div>
                                    )}
                                </div>

                                {/* KANAN: Area Meja Review (Staging) */}
                                <div className="w-full md:w-7/12 flex flex-col h-full bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm">
                                    <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between shrink-0">
                                        <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm md:text-base">
                                            <FileText size={18} className="text-purple-600"/> Meja Review AI 
                                        </h3>
                                        {scanResults.filter(s => !s.ignored).length > 0 && <span className="bg-purple-100 text-purple-700 px-2.5 py-1 rounded-lg text-[10px] md:text-xs font-bold">{scanResults.filter(s => !s.ignored).length} Terdeteksi</span>}
                                    </div>
                                    
                                    <div className="flex-1 overflow-y-auto p-3 md:p-4 custom-scrollbar bg-white min-h-[300px]">
                                        {scanResults.filter(s => !s.ignored).length === 0 ? (
                                            <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8 text-center gap-4 opacity-60">
                                                <div className="p-4 bg-gray-100 rounded-full"><Bot size={40} className="text-gray-400"/></div>
                                                <p className="text-sm font-medium leading-relaxed max-w-xs">Hasil scan nota akan muncul di sini.<br/>AI akan otomatis mencocokkannya dengan stok gudangmu.</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {scanResults.map((item, idx) => {
                                                    // Jika sudah dihapus secara soft (ignored), tidak perlu di-render
                                                    if (item.ignored) return null;

                                                    const isProcessed = processedIndices.includes(idx);
                                                    return (
                                                        <div key={idx} className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${isProcessed ? 'bg-gray-50 border-gray-100 opacity-50 grayscale-[50%]' : item.status === 'matched' ? 'bg-emerald-50/30 border-emerald-100 hover:border-emerald-300 hover:shadow-sm' : 'bg-yellow-50/30 border-yellow-100 hover:border-yellow-300 hover:shadow-sm'}`}>
                                                            <div className="flex-1 min-w-0 w-full">
                                                                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                                                    <p className={`font-bold text-sm md:text-base truncate max-w-full ${isProcessed ? 'text-gray-500 line-through' : 'text-gray-800'}`} title={item.itemName}>{item.itemName}</p>
                                                                    {!isProcessed && (
                                                                        item.status === 'matched' 
                                                                        ? <span className="bg-emerald-100 text-emerald-700 text-[9px] md:text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0"><CheckCircle size={10}/> Stok Lama</span>
                                                                        : <span className="bg-yellow-100 text-yellow-700 text-[9px] md:text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0"><Plus size={10}/> Barang Baru</span>
                                                                    )}
                                                                </div>
                                                                <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                                                                    <span className="bg-white px-2 py-1 rounded border border-gray-100">Qty: <strong className="text-gray-700">{item.qty}</strong></span>
                                                                    <span className="bg-white px-2 py-1 rounded border border-gray-100">Satuan: <strong className="text-gray-700">{formatCurrency(item.pricePerUnit)}</strong></span>
                                                                </div>
                                                            </div>

                                                            {/* Tombol Aksi Kanan */}
                                                            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto mt-3 sm:mt-0 shrink-0">
                                                                {!isProcessed && (
                                                                    <button 
                                                                        onClick={() => {
                                                                            if(window.confirm(`Abaikan "${item.itemName}" dari daftar ini?`)) {
                                                                                const newRes = [...scanResults];
                                                                                newRes[idx].ignored = true;
                                                                                setScanResults(newRes);
                                                                            }
                                                                        }}
                                                                        className="w-full sm:w-auto p-2.5 rounded-xl text-xs md:text-sm font-bold flex items-center justify-center bg-red-50 text-red-500 hover:bg-red-100 transition-all border border-red-100"
                                                                        title="Hapus / Abaikan Barang"
                                                                    >
                                                                        <Trash2 size={16}/>
                                                                    </button>
                                                                )}
                                                                <button 
                                                                    onClick={() => handleProcessScanItem(item, idx)}
                                                                    disabled={isProcessed}
                                                                    className={`w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold flex items-center justify-center gap-1.5 transition-all ${isProcessed ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-purple-600 text-white hover:bg-purple-700 shadow-md shadow-purple-200 active:scale-95'}`}
                                                                >
                                                                    {isProcessed ? <><CheckCircle size={16}/> Selesai</> : <><ChevronRight size={16}/> Isi Form</>}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}