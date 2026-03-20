import React, { useState, useEffect, useMemo } from 'react';

// --- FIREBASE IMPORTS ---
import {
    collection, addDoc, updateDoc, deleteDoc, doc, getDoc, setDoc,
    onSnapshot, query, orderBy, writeBatch, serverTimestamp, limit
} from "firebase/firestore";
import {
    onAuthStateChanged, signOut, updateProfile, updatePassword
} from "firebase/auth";

import { auth, db, appId } from './config/firebase';

// --- COMPONENTS & PAGES IMPORTS ---
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Sales from './pages/Sales';
import Expenses from './pages/Expenses';
import History from './pages/History';
import Inventory from './pages/Inventory';
import Reports from './pages/Reports';
import ActivityLog from './pages/ActivityLog'; 

import Sidebar from './components/layout/Sidebar';
import ReceiptTemplate from './components/ui/ReceiptTemplate';

import WithdrawalModal from './components/modals/WithdrawalModal';
import EditRestockModal from './components/modals/EditRestockModal';
import EditOrderModal from './components/modals/EditOrderModal';
import UserProfileModal from './components/modals/UserProfileModal';
import ConnectStoreModal from './components/modals/ConnectStoreModal';

import { LayoutDashboard, ShoppingCart, Package, Wallet, FileText, History as HistoryIcon, Menu, Plus, ShoppingBasket, Activity } from 'lucide-react';

export default function App() {
    const [user, setUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);

    const [activeStoreId, setActiveStoreId] = useState(null);
    const [showStoreModal, setShowStoreModal] = useState(false);
    const [storeProfile, setStoreProfile] = useState(null);
    const [showProfileEdit, setShowProfileEdit] = useState(false);
    const [showWithdraw, setShowWithdraw] = useState(false);

    const [activeTab, setActiveTab] = useState('dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isSidebarMini, setIsSidebarMini] = useState(false);

    const [printOrder, setPrintOrder] = useState(null);
    const [editingOrder, setEditingOrder] = useState(null);
    const [editingRestock, setEditingRestock] = useState(null);

    const [inventory, setInventory] = useState([]);
    const [orders, setOrders] = useState([]);
    const [generalExpenses, setGeneralExpenses] = useState([]);
    const [restockLogs, setRestockLogs] = useState([]);
    const [withdrawals, setWithdrawals] = useState([]);
    const [recentActivities, setRecentActivities] = useState([]);

    // --- REVISI 1: Handle Tombol Back (Kembali) di HP / Browser ---
    useEffect(() => {
        window.history.replaceState({ tab: 'dashboard' }, '', '?tab=dashboard');

        const handlePopState = (event) => {
            if (event.state && event.state.tab) {
                setActiveTab(event.state.tab);
            } else {
                setActiveTab('dashboard');
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    const handleNavigateTab = (tabId) => {
        if (tabId !== activeTab) {
            window.history.pushState({ tab: tabId }, '', `?tab=${tabId}`);
            setActiveTab(tabId);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };
    // -------------------------------------------------------------

    useEffect(() => {
        const script = document.createElement("script");
        script.src = "https://unpkg.com/html5-qrcode";
        script.async = true;
        document.body.appendChild(script);
        return () => { document.body.removeChild(script); };
    }, []);

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

    useEffect(() => {
        if (!user || !activeStoreId || !db) {
            setInventory([]); setOrders([]); setGeneralExpenses([]); setRestockLogs([]); setWithdrawals([]); setStoreProfile(null); setRecentActivities([]);
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
        const unsubActivities = onSnapshot(query(userPath("recent_activities"), orderBy("createdAt", "desc"), limit(100)),
            (s) => setRecentActivities(s.docs.map(d => ({ id: d.id, ...d.data() })))
        );

        return () => { unsubInventory(); unsubOrders(); unsubGenExp(); unsubRestock(); unsubProfile(); unsubWithdrawals(); unsubActivities(); };
    }, [user, activeStoreId]);

    const getStoreCollection = (colName) => collection(db, "artifacts", appId, "users", activeStoreId, colName);
    const getStoreDoc = (colName, docId) => doc(db, "artifacts", appId, "users", activeStoreId, colName, docId);

    const logActivity = async (action, details) => {
        if (!db || !activeStoreId) return;
        try {
            await addDoc(getStoreCollection("recent_activities"), {
                action,
                details,
                user: user?.displayName || user?.email?.split('@')[0] || 'Sistem',
                createdAt: serverTimestamp()
            });
        } catch (e) { console.error("Gagal mencatat aktivitas:", e); }
    };

    const handleLogout = async () => {
        if (window.confirm("Yakin ingin keluar aplikasi?")) {
            try {
                await signOut(auth);
                localStorage.removeItem('connected_store_id');
                handleNavigateTab('dashboard');
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
                await logActivity("Update Profil Toko", `Mengubah informasi toko menjadi ${storeName}.`);
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

        if (isNaN(qty) || qty <= 0 || isNaN(price) || price < 0) return alert("GAGAL: Jumlah & Harga Beli harus valid!");
        if (!itemName || itemName.trim() === "") return alert("GAGAL: Nama barang tidak boleh kosong!");

        try {
            let existingItem = null;
            if (data.existingId) existingItem = inventory.find(i => i.id === data.existingId);
            else if (barcode) existingItem = inventory.find(i => i.barcode === barcode);
            else existingItem = inventory.find(i => i.name.toLowerCase() === itemName.trim().toLowerCase());

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
                    lastSupplier: supplier || existingItem.lastSupplier || '', 
                    unit: unit || existingItem.unit,
                    category: category || existingItem.category || 'Umum',
                    barcode: barcode || existingItem.barcode || '',
                    updatedAt: serverTimestamp() // REVISI 5: Simpan waktu update agar bisa diurutkan dari terbaru
                });
            } else {
                const newItemRef = await addDoc(getStoreCollection("inventory"), {
                    name: itemName.trim(), stock: qty, unit: unit || 'pcs', avgCost: price, lastPrice: price,
                    sellPrice: sellingPrice, minStock: 5, lastSupplier: supplier || '',
                    category: category || 'Umum', barcode: barcode || '',
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp() // REVISI 5: Simpan waktu pembuatan agar bisa diurutkan dari terbaru
                });
                itemIdForLog = newItemRef.id;
            }

            await addDoc(getStoreCollection("restock_logs"), {
                itemName: itemName.trim(), itemId: itemIdForLog, qty, unit: unit || 'pcs', pricePerUnit: price,
                totalCost: qty * price, supplier: supplier || '', inputDate: date,
                createdAt: serverTimestamp(), barcode: barcode || '', category: category || 'Umum'
            });
            
            await logActivity("Input Restock", `Menambah stok ${itemName.trim()} sebanyak ${qty} ${unit || 'pcs'}.`);
            alert("Stok & Harga berhasil disimpan!");
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
                    sellPrice: parseFloat(newData.sellPrice) || currentItem.sellPrice || 0,
                    updatedAt: serverTimestamp() // REVISI 5: Update waktu
                });
            }
            await batch.commit();
            await logActivity("Edit Restock", `Koreksi data riwayat restock untuk ${newData.itemName}.`);
            alert("Data Restock & Stok Gudang Diperbarui!");
            setEditingRestock(null);
        } catch (e) { alert("Gagal update: " + e.message); }
    };

    const handleDeleteRestock = async (log) => {
        if (!window.confirm(`Hapus riwayat masuk "${log.itemName}"? Stok gudang juga akan dikurangi.`)) return;
        try {
            const itemRef = getStoreDoc("inventory", log.itemId);
            const itemSnap = await getDoc(itemRef);
            if (itemSnap.exists()) {
                const currentStock = itemSnap.data().stock;
                const newStock = currentStock - log.qty;
                
                if (newStock <= 0) {
                    if (window.confirm("Penghapusan ini membuat stok barang habis (0). Hapus permanen barang ini dari list Gudang sekalian?")) {
                        await deleteDoc(itemRef);
                    } else await updateDoc(itemRef, { stock: 0, updatedAt: serverTimestamp() });
                } else await updateDoc(itemRef, { stock: newStock, updatedAt: serverTimestamp() });
            }
            await deleteDoc(getStoreDoc("restock_logs", log.id));
            await logActivity("Hapus Restock", `Menghapus riwayat masuk ${log.itemName} (${log.qty} ${log.unit}).`);
            alert("Riwayat dihapus.");
        } catch (e) { alert("Gagal: " + e.message); }
    };

    const handleDeleteInventoryItem = async (item) => {
        if (!window.confirm(`PERINGATAN 1/2: Hapus "${item.name}"?`)) return;
        if (!window.confirm(`PERINGATAN 2/2: Hapus Permanen barang ini dari sistem?`)) return;
        try {
            await deleteDoc(getStoreDoc("inventory", item.id));
            await logActivity("Hapus Barang Gudang", `Menghapus permanen barang ${item.name} dari master gudang.`);
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
                batch.update(itemRef, { stock: inventoryItem.stock - item.quantity, updatedAt: serverTimestamp() });
                totalRevenue += item.subtotal;
                totalCOGS += (inventoryItem.avgCost * item.quantity);
            }

            const grossProfit = totalRevenue - totalCOGS;
            const orderRef = doc(getStoreCollection("orders"));
            const orderData = {
                type: 'sale', date: date, customerName: customerName || '-',
                items: cartItems.map(i => ({
                    itemId: i.itemId, name: i.itemName, qty: i.quantity, unit: i.unit,
                    price: i.price, subtotal: i.subtotal, costBasis: inventory.find(inv => inv.id === i.itemId)?.avgCost || 0,
                    discount: i.discount || 0
                })),
                expenses: [],
                financials: { revenue: totalRevenue, cogs: totalCOGS, grossProfit: grossProfit, expenseTotal: 0, netProfit: grossProfit },
                notes: notes, paymentMethod: paymentMethod || 'Cash', paymentStatus: paymentStatus || 'Lunas',
                createdAt: serverTimestamp(), cashierName: user.displayName || user.email
            };

            batch.set(orderRef, orderData);
            await batch.commit();
            await logActivity("Transaksi Penjualan", `Membuat nota baru senilai Rp ${totalRevenue.toLocaleString('id-ID')} (${cartItems.length} item).`);
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
                if (currentInv) batch.update(itemRef, { stock: currentInv.stock + oldItem.qty, updatedAt: serverTimestamp() });
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
                batch.update(itemRef, { stock: tempStockMap[newItem.itemId], updatedAt: serverTimestamp() });
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
            await logActivity("Edit Nota", `Mengubah rincian pesanan untuk pelanggan ${metadata.customerName || 'Umum'}.`);
            alert("Nota berhasil diupdate!");
            setEditingOrder(null);
        } catch (e) { alert("Gagal: " + e.message); }
    };

    const handleQuickPay = async (orderId) => {
        if (!window.confirm("Tandai nota ini sebagai LUNAS?")) return;
        try {
            await updateDoc(getStoreDoc("orders", orderId), { paymentStatus: 'Lunas' });
            await logActivity("Update Status Bayar", `Menandai nota penjualan sebagai LUNAS.`);
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
            await logActivity("Input Biaya Operasional", `Mencatat biaya tambahan pada nota.`);
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
                if (itemSnap.exists()) batch.update(itemRef, { stock: itemSnap.data().stock + item.qty, updatedAt: serverTimestamp() });
            }
            batch.delete(getStoreDoc("orders", order.id));
            await batch.commit();
            await logActivity("Hapus Nota Transaksi", `Membatalkan & menghapus nota senilai Rp ${order.financials.revenue.toLocaleString('id-ID')}.`);
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
        await logActivity("Pengeluaran Umum", `Mencatat pengeluaran: ${data.title} senilai Rp ${data.amount.toLocaleString('id-ID')}.`);
        alert("Biaya umum disimpan.");
    };

    const handleWithdrawal = async (data) => {
        if (!activeStoreId) return;
        await addDoc(getStoreCollection("withdrawals"), { ...data, createdAt: serverTimestamp() });
        await logActivity("Penarikan Dana", `Menarik modal/uang laci sebesar Rp ${data.amount.toLocaleString('id-ID')} untuk ${data.note}.`);
        alert("Penarikan uang tercatat!");
    };

    const handleDeleteWithdrawal = async (id) => {
        if (!window.confirm("Hapus catatan penarikan ini?")) return;
        await deleteDoc(getStoreDoc("withdrawals", id));
        await logActivity("Hapus Data Penarikan", `Menghapus riwayat penarikan dana dari sistem.`);
    };

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

    const navItems = {
        main: [
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'sales', label: 'Kasir (Jual)', icon: ShoppingCart },
            { id: 'expenses', label: 'Biaya & Ops', icon: Wallet },
            { id: 'history', label: 'Riwayat Nota', icon: HistoryIcon },
        ],
        inventory: [
            { id: 'inventory', label: 'Manajemen Stok', icon: Package },
            { id: 'reports', label: 'Laporan', icon: FileText },
        ],
        system: [
            { id: 'activity', label: 'Log Aktivitas', icon: Activity },
        ]
    };

    if (authLoading) return <div className="flex h-screen items-center justify-center text-pink-600 font-bold">Memuat data...</div>;
    if (!user) return <Login />;

    return (
        <div className="flex min-h-screen bg-[#FDF2F8] font-sans text-slate-800">
            <Sidebar
                isSidebarOpen={isSidebarOpen}
                isSidebarMini={isSidebarMini}
                setIsSidebarMini={setIsSidebarMini}
                activeTab={activeTab}
                setActiveTab={handleNavigateTab}
                setIsSidebarOpenState={setIsSidebarOpen}
                handleLogout={handleLogout}
                navItems={navItems}
            />

            {isSidebarOpen && <div className="fixed inset-0 bg-black/20 z-40 md:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />}

            <main className={`flex-1 min-w-0 w-full transition-all duration-300 print:ml-0 print:w-full print:p-0 ${isSidebarMini ? 'md:ml-20' : 'md:ml-80'}`}>
                <div className="md:hidden sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-pink-50 px-6 py-4 flex justify-between items-center print:hidden shadow-sm">
                    <div className="font-bold text-lg text-gray-800 flex items-center gap-2"><ShoppingBasket className="text-pink-600" /> Mutiara Store</div>
                    <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-pink-50 text-pink-600 rounded-xl"><Menu /></button>
                </div>

                <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
                    {activeTab === 'dashboard' && (
                        <Dashboard
                            user={user} storeProfile={storeProfile} activeStoreId={activeStoreId}
                            stats={stats} orders={orders} recentActivities={recentActivities} 
                            setShowStoreModal={setShowStoreModal} setShowProfileEdit={setShowProfileEdit} 
                            setShowWithdraw={setShowWithdraw} setActiveTab={handleNavigateTab}
                        />
                    )}
                    {activeTab === 'sales' && (
                        <Sales inventory={inventory} handleSaveOrder={handleSaveOrder} />
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
                            inventory={inventory} restockLogs={restockLogs}
                            handlePurchase={handlePurchase} setEditingRestock={setEditingRestock}
                            handleDeleteRestock={handleDeleteRestock} handleDeleteInventoryItem={handleDeleteInventoryItem}
                        />
                    )}
                    {activeTab === 'reports' && (
                        <Reports orders={orders} inventory={inventory} />
                    )}
                    {activeTab === 'activity' && (
                        <ActivityLog activities={recentActivities} />
                    )}
                </div>

                {printOrder && <ReceiptTemplate order={printOrder} />}
            </main>

            {/* MOBILE BOTTOM NAVIGATION */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-3 flex justify-around z-40 pb-safe print:hidden shadow-[0_-5px_10px_rgba(0,0,0,0.02)]">
                <button onClick={() => handleNavigateTab('dashboard')} className={`p-3 rounded-2xl transition-all ${activeTab === 'dashboard' ? 'bg-pink-50 text-pink-600' : 'text-gray-400'}`}><LayoutDashboard size={24} /></button>
                <button onClick={() => handleNavigateTab('sales')} className={`p-3 rounded-2xl transition-all ${activeTab === 'sales' ? 'bg-pink-600 text-white shadow-lg shadow-pink-200 -translate-y-2' : 'text-gray-400'}`}><Plus size={28} /></button>
                <button onClick={() => handleNavigateTab('history')} className={`p-3 rounded-2xl transition-all ${activeTab === 'history' ? 'bg-pink-50 text-pink-600' : 'text-gray-400'}`}><HistoryIcon size={24} /></button>
            </div>

            {/* RENDER MODALS */}
            {editingOrder && <EditOrderModal editingOrder={editingOrder} setEditingOrder={setEditingOrder} inventory={inventory} handleFullUpdateOrder={handleFullUpdateOrder} />}
            {editingRestock && <EditRestockModal editingRestock={editingRestock} setEditingRestock={setEditingRestock} inventory={inventory} handleUpdateRestock={handleUpdateRestock} />}
            {showStoreModal && <ConnectStoreModal setShowStoreModal={setShowStoreModal} user={user} activeStoreId={activeStoreId} storeProfile={storeProfile} handleConnectStore={handleConnectStore} db={db} appId={appId} />}
            {showProfileEdit && <UserProfileModal setShowProfileEdit={setShowProfileEdit} user={user} storeProfile={storeProfile} activeStoreId={activeStoreId} handleUpdateStoreProfile={handleUpdateStoreProfile} handleUpdateUserProfile={handleUpdateUserProfile} handleChangePassword={handleChangePassword} handleLogout={handleLogout} />}
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