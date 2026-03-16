import React, { useState, useRef, useEffect } from 'react';
import { ShoppingCart, Camera, Scan, Plus, CreditCard, CheckCircle, Percent } from 'lucide-react';
import { formatCurrency } from '../utils/helpers';
import CameraScanner from '../components/ui/CameraScanner';

export default function Sales({ inventory, handleSaveOrder }) {
    const [cart, setCart] = useState([]);
    
    // PERBAIKAN: Gunakan fungsi untuk mendapatkan waktu saat ini secara dinamis (termasuk detiknya agar real-time)
    const getCurrentDateTime = () => {
        const now = new Date();
        // Format ke YYYY-MM-DDTHH:mm
        const tzOffset = (now).getTimezoneOffset() * 60000;
        return new Date(now - tzOffset).toISOString().slice(0, 16);
    };

    const [date, setDate] = useState(getCurrentDateTime());
    
    const [notes, setNotes] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('Cash'); 
    const [paymentStatus, setPaymentStatus] = useState('Lunas');
    
    const [searchItemText, setSearchItemText] = useState('');
    const [showItemDropdown, setShowItemDropdown] = useState(false);
    const [selectedItemObj, setSelectedItemObj] = useState(null);

    const [qty, setQty] = useState('');
    const [price, setPrice] = useState('');
    const [discount, setDiscount] = useState('');

    const [barcodeMode, setBarcodeMode] = useState(false);
    const [showCamera, setShowCamera] = useState(false);
    const barcodeInputRef = useRef(null);
    const dropdownRef = useRef(null);
    const [barcodeBuffer, setBarcodeBuffer] = useState('');
    const [scanSuccessUI, setScanSuccessUI] = useState(false);

    // Update waktu secara berkala setiap detik TAPI HANYA JIKA keranjang kosong (artinya kasir belum memulai transaksi)
    useEffect(() => {
        let interval;
        if (cart.length === 0) {
            interval = setInterval(() => {
                setDate(getCurrentDateTime());
            }, 1000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [cart.length]);

    const sortedInventory = [...(inventory || [])].sort((a,b) => (a.name || '').localeCompare(b.name || ''));
    const searchedInventory = sortedInventory.filter(i => 
        (i.name || '').toLowerCase().includes(searchItemText.toLowerCase()) || 
        (i.barcode && i.barcode.includes(searchItemText))
    );

    useEffect(() => {
        if (barcodeMode && barcodeInputRef.current) barcodeInputRef.current.focus();
    }, [barcodeMode]);

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowItemDropdown(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [dropdownRef]);

    const triggerScanSuccess = () => {
        setScanSuccessUI(true);
        if (navigator.vibrate) navigator.vibrate(200);
        setTimeout(() => setScanSuccessUI(false), 2000);
    }

    const processBarcode = (scannedBarcode) => {
        const item = inventory.find(i => i.barcode === scannedBarcode);
        if(item) {
            if(item.stock <= 0) alert("Stok Habis!");
            else {
                triggerScanSuccess();
                const priceToUse = item.sellPrice || item.lastPrice || item.avgCost; 
                setCart(prevCart => {
                    const existIdx = prevCart.findIndex(c => c.itemId === item.id);
                    if(existIdx >= 0) {
                        const newCart = [...prevCart];
                        if(newCart[existIdx].quantity + 1 > item.stock) { alert("Stok kurang!"); return prevCart; }
                        newCart[existIdx].quantity += 1;
                        newCart[existIdx].subtotal = newCart[existIdx].quantity * (newCart[existIdx].price - newCart[existIdx].discount);
                        return newCart;
                    } else {
                        return [...prevCart, { itemId: item.id, itemName: item.name, unit: item.unit, quantity: 1, price: parseFloat(priceToUse), discount: 0, subtotal: parseFloat(priceToUse) }];
                    }
                });
            }
            setBarcodeBuffer('');
        } else {
            alert("Barang tidak ditemukan (Barcode: " + scannedBarcode + ")");
        }
    }

    const handleBarcodeScan = (e) => {
        if(e.key === 'Enter') {
            e.preventDefault();
            processBarcode(e.target.value);
        } else {
            setBarcodeBuffer(e.target.value);
        }
    }

    const selectItemFromDropdown = (item) => {
        setSelectedItemObj(item);
        setSearchItemText(item.name);
        setPrice(item.sellPrice || item.lastPrice || item.avgCost);
        setDiscount('');
        setShowItemDropdown(false);
        setQty('1');
    }

    const addItem = () => {
        if (!selectedItemObj || !qty || !price) return;
        const finalQty = parseFloat(qty);
        if (selectedItemObj.stock < finalQty) return alert(`Stok tidak cukup! (Sisa: ${selectedItemObj.stock})`);
        
        const disc = parseFloat(discount) || 0;
        const subtotal = finalQty * (parseFloat(price) - disc);

        setCart([...cart, { 
            itemId: selectedItemObj.id, itemName: selectedItemObj.name, unit: selectedItemObj.unit, 
            quantity: finalQty, price: parseFloat(price), discount: disc, subtotal: subtotal 
        }]);
        setSelectedItemObj(null); setSearchItemText(''); setQty(''); setPrice(''); setDiscount('');
    };

    const updateCartItem = (idx, field, value) => {
        const newCart = [...cart];
        const val = parseFloat(value);
        if (field === 'quantity') {
             const itemInv = inventory.find(i => i.id === newCart[idx].itemId);
             if (itemInv && val > itemInv.stock) return alert(`Stok hanya tersedia ${itemInv.stock}`);
        }
        newCart[idx][field] = isNaN(val) ? 0 : val;
        newCart[idx].subtotal = newCart[idx].quantity * (newCart[idx].price - newCart[idx].discount);
        setCart(newCart);
    };

    const handleProcess = async () => {
       const success = await handleSaveOrder(cart, date, notes, customerName, paymentMethod, paymentStatus); 
       if(success) { 
           setCart([]); 
           setNotes(''); 
           setCustomerName(''); 
           setPaymentMethod('Cash'); 
           setPaymentStatus('Lunas'); 
           setSearchItemText('');
           setDate(getCurrentDateTime()); // Reset tanggal setelah transaksi
       }
    };

    const totalCart = cart.reduce((sum, i) => sum + i.subtotal, 0);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-24 md:pb-0 animate-fade-in">
            <div className="lg:col-span-8 space-y-6">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-pink-100">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-3 mb-6 border-b border-pink-50 pb-4">
                        <div className="flex items-center gap-3 w-full">
                            <div className="p-3 bg-pink-100 text-pink-600 rounded-xl"><ShoppingCart size={24}/></div>
                            <div><h3 className="font-bold text-xl text-gray-800">Kasir</h3><p className="text-xs text-gray-500">Input barang belanjaan cust kita gess!</p></div>
                        </div>
                        <div className="flex gap-2 w-full md:w-auto">
                            <button onClick={() => setShowCamera(true)} className="px-3 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 hover:bg-blue-700 shadow-lg whitespace-nowrap">
                                <Camera size={16}/> Scan Hp
                            </button>
                            <button onClick={() => setBarcodeMode(!barcodeMode)} className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${barcodeMode ? 'bg-purple-600 text-white shadow-lg' : 'bg-gray-100 text-gray-500'}`}>
                                <Scan size={16}/> USB {barcodeMode ? 'ON' : 'OFF'}
                            </button>
                        </div>
                    </div>
                    
                    {barcodeMode && (
                        <div className="mb-6 bg-purple-50 p-4 rounded-xl border border-purple-100 relative overflow-hidden transition-all duration-300">
                            <label className="text-xs font-bold text-purple-600 mb-2 block">Mode Scan Alat USB Aktif</label>
                            <input ref={barcodeInputRef} className="w-full p-3 bg-white border border-purple-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-300 text-sm shadow-sm" placeholder="Arahkan kursor kesini, lalu klik alat scan..." value={barcodeBuffer} onChange={(e) => setBarcodeBuffer(e.target.value)} onKeyDown={handleBarcodeScan} autoFocus />
                            {scanSuccessUI && (
                                <div className="absolute inset-0 bg-green-500 flex flex-col items-center justify-center text-white font-bold text-lg gap-2 animate-fade-in backdrop-blur-sm z-10">
                                    <CheckCircle size={32} className="animate-bounce"/>
                                    <span>Berhasil Masuk!</span>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="md:col-span-2 relative" ref={dropdownRef}>
                            <label className="text-xs font-bold text-gray-500 ml-1 mb-1 block">Pilih Barang (Cari Abjad)</label>
                            <input 
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-pink-300 text-sm transition-all"
                                placeholder="Ketik nama barang untuk mencari..."
                                value={searchItemText}
                                onChange={(e) => { setSearchItemText(e.target.value); setShowItemDropdown(true); setSelectedItemObj(null); }}
                                onFocus={() => setShowItemDropdown(true)}
                            />
                            {showItemDropdown && (
                                <ul className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-2xl shadow-xl max-h-48 overflow-y-auto custom-scrollbar">
                                    {searchedInventory.length > 0 ? searchedInventory.map(i => (
                                        <li key={i.id} onClick={() => selectItemFromDropdown(i)} className="p-3 hover:bg-pink-50 cursor-pointer border-b border-gray-50 flex justify-between items-center text-sm transition-colors">
                                            <span className="font-bold text-gray-700">{i.name}</span>
                                            <span className="text-xs text-gray-400">Sisa: <span className={i.stock <= 0 ? 'text-red-500 font-bold' : 'text-gray-700'}>{i.stock}</span> {i.unit}</span>
                                        </li>
                                    )) : <li className="p-3 text-center text-gray-400 text-sm">Barang tidak ditemukan</li>}
                                </ul>
                            )}
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 md:col-span-2">
                            <div>
                                <label className="text-xs font-bold text-gray-500 ml-1 mb-1 block">Jumlah</label>
                                <input type="number" step="0.01" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-pink-300 text-sm font-bold text-gray-800" placeholder="0" value={qty} onChange={e => setQty(e.target.value)} />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 ml-1 mb-1 block">Harga Jual</label>
                                <input type="number" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-pink-300 text-sm" placeholder="Rp" value={price} onChange={e => setPrice(e.target.value)} />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-orange-500 ml-1 mb-1 block" title="Potongan harga per item">Diskon (Rp)</label>
                                <input type="number" className="w-full p-3 bg-orange-50 border border-orange-200 rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-orange-300 text-sm text-orange-700 font-bold" placeholder="Potongan" value={discount} onChange={e => setDiscount(e.target.value)} />
                            </div>
                        </div>
                    </div>
                    <button onClick={addItem} disabled={!selectedItemObj} className="w-full py-4 bg-pink-600 text-white rounded-2xl font-bold hover:bg-pink-700 flex justify-center items-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:active:scale-100 disabled:cursor-not-allowed">
                        <Plus size={20}/> Tambah ke Keranjang
                    </button>
                </div>
            </div>

            <div className="lg:col-span-4">
                <div className="bg-white p-6 rounded-3xl shadow-lg border border-pink-100 lg:sticky top-6 flex flex-col max-h-[calc(100vh-2rem)]">
                    <h3 className="font-bold text-lg mb-4 text-gray-800 border-b pb-2 flex-shrink-0">Nota Penjualan</h3>
                    <div className="space-y-3 mb-4 flex-shrink-0">
                        <input className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-pink-300 transition-all" placeholder="Nama Customer (Opsional)" value={customerName} onChange={e => setCustomerName(e.target.value)} />
                        {/* Waktu diubah agar realtime dan selalu mengikuti waktu saat ini */}
                        <input type="datetime-local" className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-pink-300 transition-all font-medium text-gray-600" value={date} onChange={e => setDate(e.target.value)} />
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 ml-1 mb-1 flex items-center gap-1"><CreditCard size={12}/> METODE & STATUS</label>
                            <div className="flex gap-2">
                                <select className="flex-1 p-2 bg-gray-50 border border-gray-100 rounded-xl text-xs outline-none focus:ring-2 focus:ring-pink-300" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                                    <option value="Cash">Cash</option><option value="QRIS">QRIS</option><option value="Transfer">Transfer</option><option value="Hutang">Hutang</option>
                                </select>
                                <select className={`flex-1 p-2 border rounded-xl text-xs font-bold outline-none ${paymentStatus === 'Lunas' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`} value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}>
                                    <option value="Lunas">Lunas</option><option value="Belum Lunas">Belum Lunas</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    
                    <div className="overflow-y-auto space-y-2 mb-4 pr-1 custom-scrollbar flex-1 min-h-[120px]">
                        {cart.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-gray-400 text-sm border-2 border-dashed border-gray-100 rounded-xl">Keranjang masih kosong</div>
                        ) : cart.map((item, idx) => (
                            <div key={idx} className="flex flex-col gap-2 p-3 bg-pink-50/50 rounded-xl border border-pink-100">
                                <div className="flex justify-between items-start">
                                    <div className="font-bold text-gray-700 text-sm leading-tight">{item.itemName}</div>
                                    <button onClick={() => setCart(cart.filter((_,i)=>i!==idx))} className="text-red-400 text-[10px] font-bold uppercase ml-2 bg-red-50 hover:bg-red-100 px-2 py-0.5 rounded transition-colors">Hapus</button>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <div className="flex gap-1 items-center bg-white border rounded px-1 shadow-sm">
                                        <input type="number" className="w-10 p-1 text-xs font-bold text-center outline-none bg-transparent" value={item.quantity} onChange={e => updateCartItem(idx, 'quantity', e.target.value)} /> 
                                        <span className="text-[10px] text-gray-400">x</span> 
                                        <input type="number" className="w-16 p-1 text-xs text-center outline-none bg-transparent" value={item.price} onChange={e => updateCartItem(idx, 'price', e.target.value)} />
                                    </div>
                                    <div className="flex gap-1 items-center bg-orange-50 text-orange-600 border border-orange-100 rounded px-1 shadow-sm" title="Diskon per item">
                                        <Percent size={10}/> 
                                        <input type="number" className="w-14 p-1 text-xs bg-transparent text-center outline-none font-bold placeholder:text-orange-300" value={item.discount || ''} onChange={e => updateCartItem(idx, 'discount', e.target.value)} placeholder="Diskon"/>
                                    </div>
                                </div>
                                <div className="text-right font-bold text-pink-700 text-sm border-t border-pink-100 pt-1 mt-1">{formatCurrency(item.subtotal)}</div>
                            </div>
                        ))}
                    </div>

                    <div className="flex-shrink-0 mt-auto">
                        <textarea className="w-full p-3 mb-3 bg-gray-50 border border-gray-100 rounded-xl text-xs outline-none focus:bg-white focus:ring-2 focus:ring-pink-300 transition-all resize-none" placeholder="Catatan Tambahan (Cth: Dikirim via Gojek / Tanpa Plastik)..." rows="2" value={notes} onChange={(e) => setNotes(e.target.value)}></textarea>

                        <div className="flex justify-between items-center text-xl font-bold mb-4 border-t pt-4">
                            <span>Total</span>
                            <span className="text-pink-600 text-2xl">{formatCurrency(totalCart)}</span>
                        </div>
                        <button onClick={handleProcess} disabled={cart.length === 0} className="w-full py-4 bg-gray-900 text-white font-bold rounded-2xl hover:bg-gray-800 disabled:opacity-50 transition-all shadow-lg active:scale-95">Simpan Transaksi</button>
                    </div>
                </div>
            </div>
            {showCamera && <CameraScanner onScanSuccess={processBarcode} onClose={() => setShowCamera(false)} />}
        </div>
    );
}