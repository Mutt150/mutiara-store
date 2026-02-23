import React, { useState, useRef, useEffect } from 'react';
import { ShoppingCart, Camera, Scan, Plus, CreditCard } from 'lucide-react';
import { formatCurrency } from '../utils/helpers';
import CameraScanner from '../components/ui/CameraScanner';

export default function Sales({ inventory, handleSaveOrder }) {
    const [cart, setCart] = useState([]);
    const [date, setDate] = useState(new Date().toISOString().slice(0, 16));
    const [notes, setNotes] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('Cash'); 
    const [paymentStatus, setPaymentStatus] = useState('Lunas');
    const [selectedItemId, setSelectedItemId] = useState('');
    const [qty, setQty] = useState('');
    const [price, setPrice] = useState('');
    const [activeCategory, setActiveCategory] = useState('Semua');
    const categories = ['Semua', ...new Set(inventory.map(i => i.category || 'Umum'))];
    const [barcodeMode, setBarcodeMode] = useState(false);
    const [showCamera, setShowCamera] = useState(false);
    const barcodeInputRef = useRef(null);
    const [barcodeBuffer, setBarcodeBuffer] = useState('');
    const [scanSuccess, setScanSuccess] = useState(false);

    const filteredInventory = inventory.filter(i => activeCategory === 'Semua' || (i.category || 'Umum') === activeCategory);
    const selectedItemData = inventory.find(i => i.id === selectedItemId);

    useEffect(() => {
        if (barcodeMode && barcodeInputRef.current) barcodeInputRef.current.focus();
    }, [barcodeMode]);

    const processBarcode = (scannedBarcode) => {
        const item = inventory.find(i => i.barcode === scannedBarcode);
        if(item) {
            if(item.stock <= 0) alert("Stok Habis!");
            else {
                if (navigator.vibrate) navigator.vibrate(200);
                setScanSuccess(true);
                setTimeout(() => setScanSuccess(false), 2000);
                const priceToUse = item.sellPrice || item.lastPrice || item.avgCost; 
                setCart(prevCart => {
                    const existIdx = prevCart.findIndex(c => c.itemId === item.id);
                    if(existIdx >= 0) {
                        const newCart = [...prevCart];
                        if(newCart[existIdx].quantity + 1 > item.stock) { alert("Stok kurang!"); return prevCart; }
                        newCart[existIdx].quantity += 1;
                        newCart[existIdx].subtotal = newCart[existIdx].quantity * newCart[existIdx].price;
                        return newCart;
                    } else {
                        return [...prevCart, { itemId: item.id, itemName: item.name, unit: item.unit, quantity: 1, price: parseFloat(priceToUse), subtotal: parseFloat(priceToUse) }];
                    }
                });
            }
            setBarcodeBuffer('');
        } else {
            alert("Barang tidak ditemukan (Barcode: " + scannedBarcode + ")");
        }
    }

    const handleBarcodeScan = (e) => {
        if(e.key === 'Enter') processBarcode(e.target.value);
        else setBarcodeBuffer(e.target.value);
    }

    const addItem = () => {
        if (!selectedItemData || !qty || !price) return;
        if (selectedItemData.stock < parseFloat(qty)) return alert("Stok tidak cukup!");
        setCart([...cart, { itemId: selectedItemData.id, itemName: selectedItemData.name, unit: selectedItemData.unit, quantity: parseFloat(qty), price: parseFloat(price), subtotal: parseFloat(qty) * parseFloat(price) }]);
        setSelectedItemId(''); setQty(''); setPrice('');
    };

    const updateCartItem = (idx, field, value) => {
        const newCart = [...cart];
        const val = parseFloat(value);
        if (field === 'quantity') {
             const itemInv = inventory.find(i => i.id === newCart[idx].itemId);
             if (itemInv && val > itemInv.stock) return alert(`Stok hanya tersedia ${itemInv.stock}`);
        }
        newCart[idx][field] = isNaN(val) ? 0 : val;
        newCart[idx].subtotal = newCart[idx].quantity * newCart[idx].price;
        setCart(newCart);
    };

    const handleProcess = async () => {
       const success = await handleSaveOrder(cart, date, notes, customerName, paymentMethod, paymentStatus); 
       if(success) { setCart([]); setNotes(''); setCustomerName(''); setPaymentMethod('Cash'); setPaymentStatus('Lunas'); }
    };

    const totalCart = cart.reduce((sum, i) => sum + i.subtotal, 0);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-24 md:pb-0 animate-fade-in">
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-pink-100">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-3 mb-6 border-b border-pink-50 pb-4">
                        <div className="flex items-center gap-3 w-full">
                            <div className="p-3 bg-pink-100 text-pink-600 rounded-xl"><ShoppingCart size={24}/></div>
                            <div><h3 className="font-bold text-xl text-gray-800">Kasir</h3><p className="text-xs text-gray-500">Input barang belanjaan cust kita gess!</p></div>
                        </div>
                        <div className="flex gap-2 w-full md:w-auto">
                            <button onClick={() => setShowCamera(true)} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 hover:bg-blue-700 shadow-lg">
                                <Camera size={16}/> Scan Kamera
                            </button>
                            <button onClick={() => setBarcodeMode(!barcodeMode)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${barcodeMode ? 'bg-purple-600 text-white shadow-lg' : 'bg-gray-100 text-gray-500'}`}>
                                <Scan size={16}/> {barcodeMode ? 'USB Mode ON' : 'USB Mode OFF'}
                            </button>
                        </div>
                    </div>
                    
                    {barcodeMode && (
                        <div className="mb-6 bg-purple-50 p-4 rounded-xl border border-purple-100 relative">
                            <label className="text-xs font-bold text-purple-600 mb-1 block">Scan Barcode (USB/Bluetooth)</label>
                            <input ref={barcodeInputRef} className="w-full p-3 bg-white border border-purple-200 rounded-xl outline-none" placeholder="Klik disini lalu scan..." value={barcodeBuffer} onChange={(e) => setBarcodeBuffer(e.target.value)} onKeyDown={handleBarcodeScan} autoFocus />
                            {scanSuccess && <div className="absolute top-4 right-4 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">Berhasil Masuk!</div>}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="md:col-span-2">
                            <div className="flex gap-2 overflow-x-auto pb-2 mb-2 custom-scrollbar">
                                {categories.map(cat => (
                                    <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap ${activeCategory === cat ? 'bg-pink-600 text-white' : 'bg-gray-100'}`}>{cat}</button>
                                ))}
                            </div>
                            <label className="text-xs font-bold text-gray-500 ml-1 mb-1 block">Pilih Barang</label>
                            <select className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none" value={selectedItemId} onChange={e => {
                                setSelectedItemId(e.target.value);
                                const i = inventory.find(x => x.id === e.target.value);
                                if(i) setPrice(i.sellPrice || i.lastPrice || i.avgCost);
                            }}>
                                <option value="">-- Cari Barang --</option>
                                {filteredInventory.map(i => <option key={i.id} value={i.id}>{i.name} (Sisa: {i.stock} {i.unit})</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 ml-1 mb-1 block">Jumlah</label>
                            <input type="number" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none" placeholder="0" value={qty} onChange={e => setQty(e.target.value)} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 ml-1 mb-1 block">Harga Jual</label>
                            <input type="number" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none" placeholder="Rp" value={price} onChange={e => setPrice(e.target.value)} />
                        </div>
                    </div>
                    <button onClick={addItem} disabled={!selectedItemId} className="w-full py-4 bg-pink-600 text-white rounded-2xl font-bold hover:bg-pink-700 flex justify-center gap-2"><Plus size={20}/> Tambah ke Keranjang</button>
                </div>
            </div>

            <div className="lg:col-span-1">
                <div className="bg-white p-6 rounded-3xl shadow-lg border border-pink-100 sticky top-6">
                    <h3 className="font-bold text-lg mb-4 text-gray-800 border-b pb-2">Nota Penjualan</h3>
                    <div className="space-y-3 mb-4">
                        <input className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none" placeholder="Nama Customer (Opsional)" value={customerName} onChange={e => setCustomerName(e.target.value)} />
                        <input type="datetime-local" className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none" value={date} onChange={e => setDate(e.target.value)} />
                        <div>
                            <label className="text-xs font-bold text-gray-400 ml-1 mb-1 flex items-center gap-1"><CreditCard size={12}/> METODE & STATUS</label>
                            <div className="flex gap-2">
                                <select className="flex-1 p-3 bg-gray-50 border rounded-xl text-sm" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                                    <option value="Cash">Cash</option><option value="QRIS">QRIS</option><option value="Transfer">Transfer</option><option value="Hutang">Hutang</option>
                                </select>
                                <select className={`flex-1 p-3 border rounded-xl text-sm font-bold ${paymentStatus === 'Lunas' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`} value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}>
                                    <option value="Lunas">Lunas</option><option value="Belum Lunas">Belum Lunas</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    
                    <div className="max-h-60 overflow-y-auto space-y-2 mb-4 pr-1">
                        {cart.map((item, idx) => (
                            <div key={idx} className="flex flex-col gap-2 p-3 bg-pink-50/50 rounded-xl border border-pink-100">
                                <div className="flex justify-between items-start">
                                    <div className="font-bold text-gray-700 text-sm">{item.itemName}</div>
                                    <button onClick={() => setCart(cart.filter((_,i)=>i!==idx))} className="text-red-400 text-xs">Hapus</button>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input type="number" className="w-10 p-1 text-xs border bg-white rounded text-center" value={item.quantity} onChange={e => updateCartItem(idx, 'quantity', e.target.value)} />
                                    <span className="text-xs">x</span>
                                    <input type="number" className="flex-1 p-1 text-xs border bg-white rounded" value={item.price} onChange={e => updateCartItem(idx, 'price', e.target.value)} />
                                </div>
                                <div className="text-right font-bold text-pink-700 text-sm">{formatCurrency(item.subtotal)}</div>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-between text-xl font-bold mb-6 border-t pt-4"><span>Total</span><span className="text-pink-600">{formatCurrency(totalCart)}</span></div>
                    <button onClick={handleProcess} disabled={cart.length === 0} className="w-full py-4 bg-gray-900 text-white font-bold rounded-2xl">Simpan Transaksi</button>
                </div>
            </div>
            {showCamera && <CameraScanner onScanSuccess={processBarcode} onClose={() => setShowCamera(false)} />}
        </div>
    );
}