import React, { useState, useEffect, useMemo } from 'react';

// --- FIREBASE IMPORTS ---
import {
    collection, addDoc, updateDoc, deleteDoc, doc, getDoc, setDoc,
    onSnapshot, query, orderBy, writeBatch, serverTimestamp, limit
} from "firebase/firestore";
import {
    onAuthStateChanged, signOut, updateProfile, updatePassword
} from "firebase/auth";

// Import config dari file firebase.js yang sudah kita pisah
import { auth, db, appId } from './config/firebase';

// --- COMPONENTS & PAGES IMPORTS ---
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Sales from './pages/Sales';
import Expenses from './pages/Expenses';
import History from './pages/History';
import Inventory from './pages/Inventory';
import Purchases from './pages/Purchases';
import Reports from './pages/Reports';

import Sidebar from './components/layout/Sidebar';
import ReceiptTemplate from './components/ui/ReceiptTemplate';

// Modals
import WithdrawalModal from './components/modals/WithdrawalModal';
import EditRestockModal from './components/modals/EditRestockModal';
import EditOrderModal from './components/modals/EditOrderModal';
import UserProfileModal from './components/modals/UserProfileModal';
import ConnectStoreModal from './components/modals/ConnectStoreModal';

// Icons untuk Menu Navigation
import { LayoutDashboard, ShoppingCart, PackagePlus, Package, Wallet, FileText, History as HistoryIcon, Menu, Plus, ShoppingBasket } from 'lucide-react';

export default function App() {
    // --- 1. GLOBAL STATES ---
    const [user, setUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);

    // State untuk Multi-User / Shared Store
    const [activeStoreId, setActiveStoreId] = useState(null);
    const [showStoreModal, setShowStoreModal] = useState(false);
    const [storeProfile, setStoreProfile] = useState(null);
    const [showProfileEdit, setShowProfileEdit] = useState(false);
    const [showWithdraw, setShowWithdraw] = useState(false);

    // State Layout & Navigasi
    const [activeTab, setActiveTab] = useState('dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isSidebarMini, setIsSidebarMini] = useState(false);

    // State Editing & Print
    const [printOrder, setPrintOrder] = useState(null);
    const [editingOrder, setEditingOrder] = useState(null);
    const [editingRestock, setEditingRestock] = useState(null);

    // Data States (Dari Firestore)
    const [inventory, setInventory] = useState([]);
    const [orders, setOrders] = useState([]);
    const [generalExpenses, setGeneralExpenses] = useState([]);
    const [restockLogs, setRestockLogs] = useState([]);
    const [withdrawals, setWithdrawals] = useState([]);

    // --- 2. EFFECTS & LISTENERS ---

    // Load HTML5-QRCode Script (Untuk Scanner)
    useEffect(() => {
        const script = document.createElement("script");
        script.src = "https://unpkg.com/html5-qrcode";
        script.async = true;
        document.body.appendChild(script);
        return () => { document.body.removeChild(script); };
    }, []);

    // Auth Listener
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                const savedStoreId = localStorage.getItem('connected_store_id');
                setActiveStoreId(savedStoreId || currentUser.uid);
            } else {
                setActiveStoreId(null);
            }
            setAuthLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // Data Snapshot Listener
    useEffect(() => {
        if (!user || !activeStoreId || !db) {
            setInventory([]); setOrders([]); setGeneralExpenses([]); setRestockLogs([]); setWithdrawals([]); setStoreProfile(null);
            return;
        }

        const userPath = (colName) => collection(db, "artifacts", appId, "users", activeStoreId, colName);

        const unsubProfile = onSnapshot(doc(db, "artifacts", appId, "users", activeStoreId, "settings", "profile"), (docSnap) => {
            setStoreProfile(docSnap.exists() ? docSnap.data() : null);
        });
        const unsubInventory = onSnapshot(userPath("inventory"),
            (s) => setInventory(s.docs.map(d => ({ id: d.id, ...d.data() })))
        );
        const unsubOrders = onSnapshot(query(userPath("orders"), orderBy("createdAt", "desc"), limit(500)),
            (s) => setOrders(s.docs.map(d => ({ id: d.id, ...d.data() })))
        );
        const unsubGenExp = onSnapshot(query(userPath("general_expenses"), orderBy("date", "desc"), limit(50)),
            (s) => setGeneralExpenses(s.docs.map(d => ({ id: d.id, ...d.data() })))
        );
        const unsubRestock = onSnapshot(query(userPath("restock_logs"), orderBy("createdAt", "desc"), limit(100)),
            (s) => setRestockLogs(s.docs.map(d => ({ id: d.id, ...d.data() })))
        );
        const unsubWithdrawals = onSnapshot(query(userPath("withdrawals"), orderBy("date", "desc"), limit(50)),
            (s) => setWithdrawals(s.docs.map(d => ({ id: d.id, ...d.data() })))
        );

        return () => { unsubInventory(); unsubOrders(); unsubGenExp(); unsubRestock(); unsubProfile(); unsubWithdrawals(); };
    }, [user, activeStoreId]);

    // --- 3. HELPER & HANDLERS ---
    const getStoreCollection = (colName) => collection(db, "artifacts", appId, "users", activeStoreId, colName);
    const getStoreDoc = (colName, docId) => doc(db, "artifacts", appId, "users", activeStoreId, colName, docId);

    const handleLogout = async () => {
        if (window.confirm("Yakin ingin keluar aplikasi?")) {
            try {
                await signOut(auth);
                localStorage.removeItem('connected_store_id');
                setActiveTab('dashboard');
            } catch (error) { alert("Logout Gagal: " + error.message); }
        }
    };

    const handleConnectStore = async (targetInput) => {
        if (!targetInput) {
            localStorage.removeItem('connected_store_id');
            setActiveStoreId(user.uid);
            alert("Kembali ke Toko Pribadi (Mode Bos).");
            setShowStoreModal(false);
            return;
        }
        try {
            const aliasRef = doc(db, 'artifacts', appId, 'public', 'data', 'store_aliases', targetInput.toLowerCase());
            const aliasSnap = await getDoc(aliasRef);
            let targetUid = targetInput;
            if (aliasSnap.exists()) {
                targetUid = aliasSnap.data().ownerUid;
                alert(`Berhasil menemukan toko: ${aliasSnap.data().storeName || targetInput}`);
            }
            localStorage.setItem('connected_store_id', targetUid);
            setActiveStoreId(targetUid);
            alert("Berhasil terhubung! Data akan disinkronkan.");
            setShowStoreModal(false);
        } catch (error) { alert("Gagal menghubungkan: " + error.message); }
    };

    const handleUpdateStoreProfile = async (storeName, storeAddress) => {
        if (!activeStoreId) return;
        try {
            if (activeStoreId === user.uid) {
                await setDoc(getStoreDoc("settings", "profile"), {
                    storeName: storeName, storeAddress: storeAddress, updatedAt: serverTimestamp()
                }, { merge: true });
                alert("Informasi Toko Diperbarui!");
            } else alert("Hanya pemilik toko yang bisa mengubah info toko.");
        } catch (e) { alert("Gagal update toko: " + e.message); }
    };

    const handleUpdateUserProfile = async (displayName, photoURL, phoneNumber) => {
        try {
            await updateProfile(user, { displayName });
            const userRef = doc(db, "artifacts", appId, "users", user.uid, "settings", "profile");
            await setDoc(userRef, {
                phoneNumber: phoneNumber, photoURL: photoURL, ownerName: displayName
            }, { merge: true });
            alert("Profil Pribadi Diperbarui!");
        } catch (e) { alert("Gagal update profil: " + e.message); }
    };

    const handleChangePassword = async (newPass) => {
        try {
            await updatePassword(user, newPass);
            alert("Password berhasil diubah! Silakan login ulang nanti.");
        } catch (e) { alert("Gagal ganti password: " + e.message); }
    };

    const handlePurchase = async (data) => {
        if (!db || !activeStoreId) return alert("Koneksi database belum siap.");
        const { itemName, quantity, unit, pricePerUnit, supplier, date, barcode, category, sellPrice } = data;
        const qty = parseFloat(quantity);
        const price = parseFloat(pricePerUnit);
        const sellingPrice = parseFloat(sellPrice) || 0;

        try {
            let existingItem = null;
            if (data.existingId) existingItem = inventory.find(i => i.id === data.existingId);
            else if (barcode) existingItem = inventory.find(i => i.barcode === barcode);
            else existingItem = inventory.find(i => i.name.toLowerCase() === itemName.toLowerCase());

            let itemIdForLog = "";

            if (existingItem) {
                itemIdForLog = existingItem.id;
                const currentTotalValue = existingItem.stock * existingItem.avgCost;
                const newPurchaseValue = qty * price;
                const newTotalStock = existingItem.stock + qty;
                const newAvgCost = newTotalStock > 0 ? (currentTotalValue + newPurchaseValue) / newTotalStock : price;

                await updateDoc(getStoreDoc("inventory", existingItem.id), {
                    stock: newTotalStock, avgCost: newAvgCost, lastPrice: price,
                    sellPrice: sellingPrice > 0 ? sellingPrice : (existingItem.sellPrice || 0),
                    lastSupplier: supplier, unit: unit || existingItem.unit,
                    category: category || existingItem.category || 'Umum',
                    barcode: barcode || existingItem.barcode || ''
                });
            } else {
                const newItemRef = await addDoc(getStoreCollection("inventory"), {
                    name: itemName, stock: qty, unit: unit, avgCost: price, lastPrice: price,
                    sellPrice: sellingPrice, minStock: 5, lastSupplier: supplier,
                    category: category || 'Umum', barcode: barcode || ''
                });
                itemIdForLog = newItemRef.id;
            }

            await addDoc(getStoreCollection("restock_logs"), {
                itemName, itemId: itemIdForLog, qty, unit, pricePerUnit: price,
                totalCost: qty * price, supplier, inputDate: date,
                createdAt: serverTimestamp(), barcode: barcode || '', category: category || 'Umum'
            });
            alert("Stok & Harga Jual berhasil disimpan!");
        } catch (error) { alert("Gagal: " + error.message); }
    };

    const handleUpdateRestock = async (logId, newData) => {
        if (!activeStoreId) return;
        try {
            const batch = writeBatch(db);
            const logRef = getStoreDoc("restock_logs", logId);
            const originalLog = restockLogs.find(r => r.id === logId);
            if (!originalLog) throw new Error("Log not found");

            const updatedLogData = { ...newData, totalCost: parseFloat(newData.qty) * parseFloat(newData.pricePerUnit) };
            batch.update(logRef, updatedLogData);

            const itemRef = getStoreDoc("inventory", originalLog.itemId);
            const itemSnap = await getDoc(itemRef);

            if (itemSnap.exists()) {
                const currentItem = itemSnap.data();
                const qtyDiff = parseFloat(newData.qty) - parseFloat(originalLog.qty);
                const newStock = currentItem.stock + qtyDiff;
                const currentTotalValue = currentItem.stock * currentItem.avgCost;
                const valueWithoutOldLog = currentTotalValue - (originalLog.qty * originalLog.pricePerUnit);
                const valueWithNewLog = valueWithoutOldLog + (newData.qty * newData.pricePerUnit);
                const newAvgCost = newStock > 0 ? valueWithNewLog / newStock : currentItem.avgCost;

                batch.update(itemRef, {
                    name: newData.itemName, barcode: newData.barcode, category: newData.category,
                    lastSupplier: newData.supplier, stock: newStock, avgCost: newAvgCost, unit: newData.unit,
                    sellPrice: parseFloat(newData.sellPrice) || currentItem.sellPrice || 0
                });
            }
            await batch.commit();
            alert("Data Restock & Stok Gudang Diperbarui!");
            setEditingRestock(null);
        } catch (e) { alert("Gagal update: " + e.message); }
    };

    const handleDeleteRestock = async (log) => {
        if (!window.confirm(`Hapus riwayat masuk "${log.itemName}"? Stok akan dikurangi.`)) return;
        try {
            const itemRef = getStoreDoc("inventory", log.itemId);
            const itemSnap = await getDoc(itemRef);
            if (itemSnap.exists()) {
                const currentStock = itemSnap.data().stock;
                const newStock = currentStock - log.qty;
                if (newStock < 0 && !window.confirm("Stok akan minus. Lanjut?")) return;
                await updateDoc(itemRef, { stock: newStock });
            }
            await deleteDoc(getStoreDoc("restock_logs", log.id));
            alert("Riwayat dihapus.");
        } catch (e) { alert("Gagal: " + e.message); }
    };

    const handleDeleteInventoryItem = async (item) => {
        if (!window.confirm(`PERINGATAN 1/2: Hapus "${item.name}"?`)) return;
        if (!window.confirm(`PERINGATAN 2/2: Hapus Permanen?`)) return;
        try {
            await deleteDoc(getStoreDoc("inventory", item.id));
            alert("Barang berhasil dihapus.");
        } catch (e) { alert("Gagal menghapus: " + e.message); }
    };

    const handleSaveOrder = async (cartItems, date, notes, customerName, paymentMethod, paymentStatus) => {
        if (!db || !activeStoreId) return alert("Koneksi database belum siap.");
        if (cartItems.length === 0) return alert("Keranjang kosong!");
        try {
            const batch = writeBatch(db);
            let totalRevenue = 0; let totalCOGS = 0;

            for (const item of cartItems) {
                const inventoryItem = inventory.find(i => i.id === item.itemId);
                if (!inventoryItem) throw new Error(`Barang ${item.itemName} tidak ditemukan!`);

                const itemRef = getStoreDoc("inventory", item.itemId);
                batch.update(itemRef, { stock: inventoryItem.stock - item.quantity });
                totalRevenue += item.subtotal;
                totalCOGS += (inventoryItem.avgCost * item.quantity);
            }

            const grossProfit = totalRevenue - totalCOGS;
            const orderRef = doc(getStoreCollection("orders"));
            const orderData = {
                type: 'sale', date: date, customerName: customerName || '-',
                items: cartItems.map(i => ({
                    itemId: i.itemId, name: i.itemName, qty: i.quantity, unit: i.unit,
                    price: i.price, subtotal: i.subtotal, costBasis: inventory.find(inv => inv.id === i.itemId)?.avgCost || 0
                })),
                expenses: [],
                financials: { revenue: totalRevenue, cogs: totalCOGS, grossProfit: grossProfit, expenseTotal: 0, netProfit: grossProfit },
                notes: notes, paymentMethod: paymentMethod || 'Cash', paymentStatus: paymentStatus || 'Lunas',
                createdAt: serverTimestamp(), cashierName: user.displayName || user.email
            };

            batch.set(orderRef, orderData);
            await batch.commit();
            alert("Pesanan Berhasil Disimpan!");
            return true;
        } catch (error) { alert("Gagal: " + error.message); return false; }
    };

    const handleFullUpdateOrder = async (originalOrder, newItemList, metadata) => {
        if (!activeStoreId) return;
        try {
            const batch = writeBatch(db);
            for (const oldItem of originalOrder.items) {
                const itemRef = getStoreDoc("inventory", oldItem.itemId);
                const currentInv = inventory.find(i => i.id === oldItem.itemId);
                if (currentInv) batch.update(itemRef, { stock: currentInv.stock + oldItem.qty });
            }

            let newRevenue = 0; let newCOGS = 0;
            let tempStockMap = {};
            inventory.forEach(i => tempStockMap[i.id] = i.stock);
            originalOrder.items.forEach(i => { if (tempStockMap[i.itemId] !== undefined) tempStockMap[i.itemId] += i.qty; });

            for (const newItem of newItemList) {
                const itemRef = getStoreDoc("inventory", newItem.itemId);
                const currentAvgCost = inventory.find(i => i.id === newItem.itemId)?.avgCost || 0;
                if (tempStockMap[newItem.itemId] < newItem.qty) throw new Error(`Stok ${newItem.name} kurang!`);
                tempStockMap[newItem.itemId] -= newItem.qty;
                batch.update(itemRef, { stock: tempStockMap[newItem.itemId] });
                newRevenue += newItem.subtotal;
                newCOGS += (currentAvgCost * newItem.qty);
            }

            const newGrossProfit = newRevenue - newCOGS;
            const currentExpenseTotal = originalOrder.financials.expenseTotal || 0;
            const orderRef = getStoreDoc("orders", originalOrder.id);

            batch.update(orderRef, {
                ...metadata, items: newItemList,
                "financials.revenue": newRevenue, "financials.cogs": newCOGS,
                "financials.grossProfit": newGrossProfit, "financials.netProfit": newGrossProfit - currentExpenseTotal
            });

            await batch.commit();
            alert("Nota berhasil diupdate!");
            setEditingOrder(null);
        } catch (e) { alert("Gagal: " + e.message); }
    };

    const handleQuickPay = async (orderId) => {
        if (!window.confirm("Tandai nota ini sebagai LUNAS?")) return;
        try {
            await updateDoc(getStoreDoc("orders", orderId), { paymentStatus: 'Lunas' });
            alert("Status diperbarui menjadi Lunas.");
        } catch (e) { alert("Gagal update: " + e.message); }
    };

    const handleUpdateOrderExpenses = async (orderId, newExpensesList) => {
        if (!activeStoreId) return;
        try {
            const orderRef = getStoreDoc("orders", orderId);
            const orderSnap = await getDoc(orderRef);
            if (!orderSnap.exists()) return alert("Nota hilang");

            const orderData = orderSnap.data();
            const totalExp = newExpensesList.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
            const newNetProfit = orderData.financials.grossProfit - totalExp;

            await updateDoc(orderRef, { expenses: newExpensesList, "financials.expenseTotal": totalExp, "financials.netProfit": newNetProfit });
            return true;
        } catch (e) { alert("Gagal: " + e.message); return false; }
    };

    const handleDeleteOrder = async (order) => {
        if (!activeStoreId) return;
        if (!window.confirm("Hapus Nota? Stok akan dikembalikan.")) return;
        try {
            const batch = writeBatch(db);
            for (const item of order.items) {
                const itemRef = getStoreDoc("inventory", item.itemId);
                const itemSnap = await getDoc(itemRef);
                if (itemSnap.exists()) batch.update(itemRef, { stock: itemSnap.data().stock + item.qty });
            }
            batch.delete(getStoreDoc("orders", order.id));
            await batch.commit();
            alert("Nota dihapus.");
        } catch (error) { alert("Gagal: " + error.message); }
    };

    const handlePrint = (order, sequentialNumber) => {
        setPrintOrder({ ...order, sequentialNumber });
        setTimeout(() => { window.print(); }, 500);
    };

    const handleGeneralExpense = async (data) => {
        if (!activeStoreId) return;
        await addDoc(getStoreCollection("general_expenses"), { ...data, createdAt: serverTimestamp() });
        alert("Biaya umum disimpan.");
    };

    const handleWithdrawal = async (data) => {
        if (!activeStoreId) return;
        await addDoc(getStoreCollection("withdrawals"), { ...data, createdAt: serverTimestamp() });
        alert("Penarikan uang tercatat!");
    };

    const handleDeleteWithdrawal = async (id) => {
        if (!window.confirm("Hapus catatan penarikan ini?")) return;
        await deleteDoc(getStoreDoc("withdrawals", id));
    };

    // --- 4. DATA CALCULATIONS ---
    const stats = useMemo(() => {
        const salesRevenue = orders.reduce((acc, o) => acc + (o.financials?.revenue || 0), 0);
        const salesGrossProfit = orders.reduce((acc, o) => acc + (o.financials?.grossProfit || 0), 0);
        const totalCOGS = orders.reduce((acc, o) => acc + (o.financials?.cogs || 0), 0);
        const orderExpenses = orders.reduce((acc, o) => acc + (o.financials?.expenseTotal || 0), 0);
        const generalExpTotal = generalExpenses.reduce((acc, e) => acc + (parseFloat(e.amount) || 0), 0);
        const netProfitGlobal = salesGrossProfit - orderExpenses - generalExpTotal;

        const totalWithdrawals = withdrawals.reduce((acc, w) => acc + (parseFloat(w.amount) || 0), 0);
        const paidOrders = orders.filter(o => o.paymentStatus === 'Lunas');
        const totalOmzetLunas = paidOrders.reduce((acc, o) => acc + (o.financials?.revenue || 0), 0);
        const cashOnHand = totalOmzetLunas - orderExpenses - generalExpTotal - totalWithdrawals;

        const lowStock = inventory.filter(i => i.stock > 0 && i.stock <= i.minStock).length;
        const outStock = inventory.filter(i => i.stock <= 0).length;
        const totalAssetValue = inventory.reduce((acc, i) => acc + (i.stock * i.avgCost), 0);

        return {
            salesRevenue, salesGrossProfit, totalCOGS, orderExpenses, generalExpTotal, netProfitGlobal,
            lowStock, outStock, totalAssetValue, totalWithdrawals, cashOnHand
        };
    }, [orders, generalExpenses, inventory, withdrawals]);

    // Menu Sidebar Config
    const navItems = {
        main: [
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'sales', label: 'Kasir (Jual)', icon: ShoppingCart },
            { id: 'expenses', label: 'Biaya & Ops', icon: Wallet },
            { id: 'history', label: 'Riwayat Nota', icon: HistoryIcon },
        ],
        inventory: [
            { id: 'inventory', label: 'Stok Barang', icon: Package },
            { id: 'purchases', label: 'Restock (Beli)', icon: PackagePlus },
            { id: 'reports', label: 'Laporan', icon: FileText },
        ]
    };

    // --- RENDER ---
    if (authLoading) return <div className="flex h-screen items-center justify-center text-pink-600 font-bold">Memuat data...</div>;
    if (!user) return <Login />;

    return (
        <div className="flex min-h-screen bg-[#FDF2F8] font-sans text-slate-800">
            <Sidebar
                isSidebarOpen={isSidebarOpen}
                isSidebarMini={isSidebarMini}
                setIsSidebarMini={setIsSidebarMini}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                setIsSidebarOpenState={setIsSidebarOpen}
                handleLogout={handleLogout}
                navItems={navItems}
            />

            {isSidebarOpen && <div className="fixed inset-0 bg-black/20 z-40 md:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />}

            <main className={`flex-1 transition-all duration-300 print:ml-0 print:w-full print:p-0 ${isSidebarMini ? 'md:ml-20' : 'md:ml-80'}`}>
                <div className="md:hidden sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-pink-50 px-6 py-4 flex justify-between items-center print:hidden shadow-sm">
                    <div className="font-bold text-lg text-gray-800 flex items-center gap-2"><ShoppingBasket className="text-pink-600" /> Mutiara Store</div>
                    <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-pink-50 text-pink-600 rounded-xl"><Menu /></button>
                </div>

                <div className="p-4 md:p-10 max-w-7xl mx-auto">
                    {/* ROUTER / PAGE RENDERER berdasarkan activeTab */}
                    {activeTab === 'dashboard' && (
                        <Dashboard
                            user={user} storeProfile={storeProfile} activeStoreId={activeStoreId}
                            stats={stats} orders={orders} setShowStoreModal={setShowStoreModal}
                            setShowProfileEdit={setShowProfileEdit} setShowWithdraw={setShowWithdraw}
                            setActiveTab={setActiveTab}
                        />
                    )}
                    {activeTab === 'sales' && (
                        <Sales
                            inventory={inventory}
                            handleSaveOrder={handleSaveOrder}
                        />
                    )}
                    {activeTab === 'expenses' && (
                        <Expenses
                            orders={orders} generalExpenses={generalExpenses}
                            handleUpdateOrderExpenses={handleUpdateOrderExpenses}
                            handleGeneralExpense={handleGeneralExpense}
                        />
                    )}
                    {activeTab === 'history' && (
                        <History
                            orders={orders} setEditingOrder={setEditingOrder}
                            handleDeleteOrder={handleDeleteOrder} handlePrint={handlePrint}
                            handleQuickPay={handleQuickPay}
                        />
                    )}
                    {activeTab === 'inventory' && (
                        <Inventory
                            inventory={inventory}
                            handleDeleteInventoryItem={handleDeleteInventoryItem}
                        />
                    )}
                    {activeTab === 'purchases' && (
                        <Purchases
                            inventory={inventory} restockLogs={restockLogs}
                            handlePurchase={handlePurchase} setEditingRestock={setEditingRestock}
                            handleDeleteRestock={handleDeleteRestock}
                        />
                    )}
                    {activeTab === 'reports' && (
                        <Reports
                            orders={orders} inventory={inventory}
                        />
                    )}
                </div>

                {printOrder && <ReceiptTemplate order={printOrder} />}
            </main>

            {/* MOBILE BOTTOM NAVIGATION */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-3 flex justify-around z-40 pb-safe print:hidden shadow-[0_-5px_10px_rgba(0,0,0,0.02)]">
                <button onClick={() => setActiveTab('dashboard')} className={`p-3 rounded-2xl transition-all ${activeTab === 'dashboard' ? 'bg-pink-50 text-pink-600' : 'text-gray-400'}`}><LayoutDashboard size={24} /></button>
                <button onClick={() => setActiveTab('sales')} className={`p-3 rounded-2xl transition-all ${activeTab === 'sales' ? 'bg-pink-600 text-white shadow-lg shadow-pink-200 -translate-y-2' : 'text-gray-400'}`}><Plus size={28} /></button>
                <button onClick={() => setActiveTab('history')} className={`p-3 rounded-2xl transition-all ${activeTab === 'history' ? 'bg-pink-50 text-pink-600' : 'text-gray-400'}`}><HistoryIcon size={24} /></button>
            </div>

            {/* RENDER MODALS */}
            {editingOrder && <EditOrderModal editingOrder={editingOrder} setEditingOrder={setEditingOrder} inventory={inventory} handleFullUpdateOrder={handleFullUpdateOrder} />}
            {editingRestock && <EditRestockModal editingRestock={editingRestock} setEditingRestock={setEditingRestock} inventory={inventory} handleUpdateRestock={handleUpdateRestock} />}
            {showStoreModal && <ConnectStoreModal setShowStoreModal={setShowStoreModal} user={user} activeStoreId={activeStoreId} storeProfile={storeProfile} handleConnectStore={handleConnectStore} db={db} appId={appId} />}
            {showProfileEdit && <UserProfileModal setShowProfileEdit={setShowProfileEdit} user={user} storeProfile={storeProfile} activeStoreId={activeStoreId} handleUpdateStoreProfile={handleUpdateStoreProfile} handleUpdateUserProfile={handleUpdateUserProfile} handleChangePassword={handleChangePassword} />}
            {showWithdraw && <WithdrawalModal onClose={() => setShowWithdraw(false)} handleWithdrawal={handleWithdrawal} withdrawals={withdrawals} handleDeleteWithdrawal={handleDeleteWithdrawal} user={user} />}

            <style>{`
        @media print {
           aside, .md\\:hidden, button, .print\\:hidden, nav, header { display: none !important; }
           body { background: white; margin: 0; padding: 0; }
           main { margin: 0; padding: 0; width: 100%; visibility: hidden; }
           #print-area { display: block !important; visibility: visible; position: absolute; top: 0; left: 0; width: 58mm; margin: 0; }
           @page { size: auto; margin: 0mm; }
        }
        .pb-safe { padding-bottom: env(safe-area-inset-bottom); }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #fce7f3; border-radius: 20px; }
        .animate-fade-in { animation: fadeIn 0.5s ease-in-out; }
        .animate-bounce-slow { animation: bounce 3s infinite; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
        </div>
    );
}