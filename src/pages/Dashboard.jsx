import React, { useState, useMemo, useEffect } from 'react';
import { Store, TrendingUp, Wallet, Truck, DollarSign, Archive, Layers, HandCoins, BarChart3, FileText, AlertTriangle, Package, Users, User, ArrowRight, Activity, ShoppingCart, PackagePlus, Sparkles, Bot, Lightbulb, RefreshCw, Key } from 'lucide-react';

// --- INLINE HELPERS & COMPONENTS UNTUK MEMASTIKAN KOMPILASI LANCAR ---
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount || 0);
};

const formatDate = (timestamp) => {
    if (!timestamp) return '-';
    let date;
    if (timestamp.toDate) {
        date = timestamp.toDate();
    } else if (typeof timestamp === 'string') {
        date = new Date(timestamp);
    } else {
        date = timestamp;
    }
    const options = { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' };
    return date.toLocaleDateString('id-ID', options);
};

// REDESIGN: Chart Tren Penjualan (Hanya Muncul Rupiah jika di-Klik)
const SimpleChart = ({ data }) => {
    const [activeBar, setActiveBar] = useState(null); 

    useEffect(() => {
        const handleClickOutside = () => setActiveBar(null);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const chartData = useMemo(() => {
        const last7Days = [];
        const today = new Date();
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const dateStr = d.toLocaleDateString('id-ID'); 
            const labelStr = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
            const dailyRevenue = (data || []).filter(o => {
                let orderDateObj;
                if (o.date && o.date.seconds) orderDateObj = new Date(o.date.seconds * 1000);
                else if (o.date) orderDateObj = new Date(o.date);
                else return false;
                return orderDateObj.toLocaleDateString('id-ID') === dateStr;
            }).reduce((sum, o) => sum + (o.financials?.revenue || 0), 0);
            last7Days.push({ label: labelStr, value: dailyRevenue });
        }
        return last7Days;
    }, [data]);

    const maxValue = Math.max(...chartData.map(d => d.value), 100000);

    return (
        <div className="h-56 flex items-end justify-around gap-2 pt-12 px-2 w-full">
            {chartData.map((d, i) => (
                <div 
                    key={i} 
                    className="flex flex-col items-center gap-2 relative h-full justify-end flex-1 max-w-[48px] cursor-pointer group"
                    onClick={(e) => {
                        e.stopPropagation(); 
                        setActiveBar(activeBar === i ? null : i); 
                    }} 
                >
                    <div className={`absolute -top-10 transition-all duration-300 bg-gray-800 text-white text-[10px] md:text-xs font-bold py-1.5 px-2.5 rounded-lg whitespace-nowrap z-10 shadow-lg flex flex-col items-center pointer-events-none ${activeBar === i ? 'opacity-100 -translate-y-2' : 'opacity-0 translate-y-0'}`}>
                        {formatCurrency(d.value)}
                        <div className="absolute -bottom-1 w-2 h-2 bg-gray-800 rotate-45"></div>
                    </div>
                    
                    <div 
                        className={`w-full rounded-xl transition-all duration-300 relative overflow-hidden min-h-[6px] shadow-sm ${activeBar === i ? 'bg-gradient-to-t from-pink-300 to-pink-600 shadow-pink-300 scale-105' : 'bg-gradient-to-t from-pink-100 to-pink-200 hover:from-pink-200 hover:to-pink-300'}`} 
                        style={{ height: `${Math.max((d.value / maxValue) * 100, 2)}%` }}
                    >
                        <div className="absolute top-0 left-0 right-0 h-1 bg-white/40 rounded-t-xl"></div>
                    </div>
                    
                    <span className={`text-[9px] md:text-[10px] font-medium whitespace-nowrap mt-1 transition-colors ${activeBar === i ? 'text-pink-600 font-bold' : 'text-gray-400'}`}>{d.label}</span>
                </div>
            ))}
        </div>
    );
};
// ---------------------------------------------------------------------

export default function Dashboard({ user, storeProfile, activeStoreId, stats, orders, recentActivities, setShowStoreModal, setShowProfileEdit, setShowWithdraw, setActiveTab, inventory }) {
    
    // --- STATE UNTUK AI ADVISOR ---
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [aiSummary, setAiSummary] = useState('');
    const [aiInsights, setAiInsights] = useState(null);
    const [apiError, setApiError] = useState('');
    
    const [customApiKey, setCustomApiKey] = useState('');
    const [showKeyInput, setShowKeyInput] = useState(false);

    useEffect(() => {
        const savedKey = localStorage.getItem('gemini_api_key');
        if (savedKey) setCustomApiKey(savedKey);
    }, []);

    const handleNavigate = (tabId) => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setActiveTab(tabId);
    };

    const analyzeData = async () => {
        setIsAnalyzing(true);
        setApiError('');
        try {
            let storedKey = localStorage.getItem('gemini_api_key');
            let envKey = typeof import.meta.env !== 'undefined' ? import.meta.env.VITE_GEMINI_API_KEY : '';
            let apiKeyToUse = storedKey || customApiKey || envKey;

            if (!apiKeyToUse) {
                setShowKeyInput(true);
                throw new Error("API Key belum ditemukan.");
            }

            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKeyToUse}`;

            const topItemsMap = {};
            orders.forEach(o => {
                o.items?.forEach(i => {
                    topItemsMap[i.name] = (topItemsMap[i.name] || 0) + (parseFloat(i.qty) || 0);
                });
            });
            const topItems = Object.entries(topItemsMap).sort((a,b)=>b[1]-a[1]).slice(0,4).map(e=>`${e[0]} (${e[1]} terjual)`).join(', ');
            
            const lowStockNames = inventory ? inventory.filter(i => i.stock > 0 && i.stock <= (i.minStock || 5)).slice(0,4).map(i => `${i.name} (sisa ${i.stock})`).join(', ') : 'Aman';
            const outOfStockNames = inventory ? inventory.filter(i => i.stock <= 0).slice(0,3).map(i => i.name).join(', ') : 'Aman';

            const systemPrompt = "Kamu adalah AI Business Advisor cerdas untuk 'Mutiara Store'. Tugasmu menganalisis data toko dan memberikan 3 insight bisnis konkrit beserta saran tindakan. Gunakan bahasa Indonesia santai.\n\nBALAS HANYA DENGAN JSON VALID. JANGAN MENGGUNAKAN TEKS LAIN. Format:\n{\n \"summary\": \"Pesan semangat 1 kalimat\",\n \"insights\": [\n  { \"title\": \"Judul\", \"description\": \"Saran konkrit\", \"type\": \"positive\" }\n ]\n}";
            
            const userQuery = `DATA TOKO BULAN INI:\n- Total Omzet: Rp ${stats.salesRevenue}\n- Laba Kotor: Rp ${stats.salesGrossProfit}\n- Laba Bersih: Rp ${stats.netProfitGlobal}\n- Total Pengeluaran Ops & Umum: Rp ${stats.orderExpenses + stats.generalExpTotal}\n- Barang Terlaris (Top 4): ${topItems || 'Belum ada data'}\n- Peringatan Stok Menipis: ${lowStockNames}\n- Stok Habis: ${outOfStockNames}`;

            const payload = {
                contents: [{ parts: [{ text: userQuery }] }],
                systemInstruction: { parts: [{ text: systemPrompt }] },
                generationConfig: {
                    responseMimeType: "application/json" 
                }
            };

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const responseData = await response.json();

            if (!response.ok) {
                console.error("Gemini API Error Detail:", responseData);
                const errMsg = responseData.error?.message || "Terjadi kesalahan internal pada server Google AI.";
                
                if (errMsg.includes("API_KEY_INVALID")) {
                    setShowKeyInput(true);
                    throw new Error("Kunci API tidak valid. Coba salin ulang API Key-nya.");
                }
                
                throw new Error(`Google AI Error: ${errMsg}`);
            }

            const textResponse = responseData.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!textResponse) throw new Error("Respons AI kosong.");

            const cleanTextResponse = textResponse.replace(/```json/gi, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(cleanTextResponse);
            
            setAiSummary(parsed.summary);
            setAiInsights(parsed.insights);
            setShowKeyInput(false); 

        } catch (error) {
            console.error("AI Catch Error:", error);
            setApiError(error.message);
            if(error.message.includes("API Key belum ditemukan") || error.message.includes("API_KEY_INVALID")) {
                setShowKeyInput(true);
            }
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleSaveApiKey = () => {
        if (!customApiKey.trim()) return alert("API Key tidak boleh kosong!");
        localStorage.setItem('gemini_api_key', customApiKey.trim());
        setShowKeyInput(false);
        analyzeData(); 
    };

    return (
        <div className="flex flex-col gap-6 pb-24 md:pb-0 animate-fade-in w-full max-w-full min-w-0 overflow-x-hidden">
            {/* Bagian Header Welcome */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 w-full bg-white p-6 rounded-[28px] shadow-sm border border-gray-100">
                <div className="flex flex-col gap-1 min-w-0 w-full">
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-800 tracking-tight truncate">Halo, {storeProfile?.ownerName || user?.displayName || user?.email?.split('@')[0]}! 👋</h2>
                    <div className="text-gray-500 text-xs md:text-sm font-medium flex gap-2 items-center truncate">
                        <Store size={14} className="shrink-0 text-pink-500"/> <span className="truncate">{storeProfile?.storeName || 'Toko Saya'}</span>
                        {activeStoreId !== user?.uid && <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-[10px] font-bold shrink-0 border border-blue-100">MODE KARYAWAN</span>}
                    </div>
                </div>
                
                <div className="flex gap-3 shrink-0 self-start md:self-auto mt-2 md:mt-0 items-center flex-wrap">
                    {/* SHORTCUT AI DI HEADER */}
                    <button 
                        onClick={() => handleNavigate('chatbot')} 
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-xl font-bold text-xs md:text-sm hover:shadow-lg hover:shadow-purple-200 hover:-translate-y-0.5 transition-all animate-pulse shadow-md"
                    >
                        <Bot size={16}/> Tanya Mutiara AI
                    </button>

                    <button onClick={() => setShowStoreModal(true)} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl font-semibold text-xs md:text-sm hover:bg-gray-50 transition-all shadow-sm hover:border-pink-300 hover:text-pink-600">
                        <Users size={16}/> {activeStoreId === user?.uid ? "Tim Toko" : "Ganti Toko"}
                    </button>
                    <button onClick={() => setShowProfileEdit(true)} className="relative group hover:scale-105 transition-transform duration-300">
                        <div className="w-10 h-10 rounded-full bg-pink-50 border border-pink-200 shadow-sm overflow-hidden flex items-center justify-center">
                            {storeProfile?.photoURL ? <img src={storeProfile.photoURL} alt="profile" className="w-full h-full object-cover"/> : <User size={20} className="text-pink-400"/>}
                        </div>
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
                    </button>
                </div>
            </div>
            
            {/* Bagian Ringkasan 4 Kartu Atas */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                {/* Card 1: Omzet */}
                <div className="relative p-5 rounded-[24px] bg-gradient-to-br from-pink-500 to-rose-500 shadow-md shadow-pink-200 flex flex-col justify-between gap-4 overflow-hidden group hover:-translate-y-1 transition-all duration-300 min-h-[130px]">
                    <div className="absolute -right-4 -bottom-4 text-white opacity-25 group-hover:scale-110 transition-transform duration-500 pointer-events-none">
                        <TrendingUp size={110} strokeWidth={2}/>
                    </div>
                    <div className="relative z-10 flex items-center gap-2">
                        <div className="p-2 bg-white/20 text-white rounded-lg backdrop-blur-sm shadow-sm"><TrendingUp size={16}/></div>
                        <span className="text-xs font-bold text-white uppercase tracking-wider truncate drop-shadow-md">Total Omzet</span>
                    </div>
                    <h3 className="relative z-10 text-xl md:text-[26px] font-bold text-white tracking-tight truncate drop-shadow-sm" title={formatCurrency(stats.salesRevenue)}>{formatCurrency(stats.salesRevenue)}</h3>
                </div>

                {/* Card 2: Laba Kotor */}
                <div className="relative p-5 rounded-[24px] bg-white border border-gray-100 shadow-sm hover:shadow-md flex flex-col justify-between gap-4 overflow-hidden group hover:-translate-y-1 transition-all duration-300 min-h-[130px]">
                    <div className="absolute -right-6 -bottom-6 text-pink-100 group-hover:scale-110 transition-transform duration-500 pointer-events-none">
                        <Wallet size={120} strokeWidth={1.5}/>
                    </div>
                    <div className="relative z-10 flex items-center gap-2">
                        <div className="p-2 bg-pink-50 text-pink-600 rounded-lg"><Wallet size={16}/></div>
                        <span className="text-xs font-bold text-gray-700 uppercase tracking-wider truncate">Laba Kotor</span>
                    </div>
                    <h3 className="relative z-10 text-xl md:text-[26px] font-bold text-gray-800 tracking-tight truncate" title={formatCurrency(stats.salesGrossProfit)}>{formatCurrency(stats.salesGrossProfit)}</h3>
                </div>

                {/* Card 3: Biaya Ops */}
                <div className="relative p-5 rounded-[24px] bg-white border border-gray-100 shadow-sm hover:shadow-md flex flex-col justify-between gap-4 overflow-hidden group hover:-translate-y-1 transition-all duration-300 min-h-[130px]">
                    <div className="absolute -right-6 -bottom-6 text-orange-100 group-hover:scale-110 transition-transform duration-500 pointer-events-none">
                        <Truck size={120} strokeWidth={1.5}/>
                    </div>
                    <div className="relative z-10 flex items-center gap-2">
                        <div className="p-2 bg-orange-50 text-orange-600 rounded-lg"><Truck size={16}/></div>
                        <span className="text-xs font-bold text-gray-700 uppercase tracking-wider truncate">Biaya Ops</span>
                    </div>
                    <h3 className="relative z-10 text-xl md:text-[26px] font-bold text-gray-800 tracking-tight truncate" title={formatCurrency(stats.orderExpenses + stats.generalExpTotal)}>{formatCurrency(stats.orderExpenses + stats.generalExpTotal)}</h3>
                </div>

                {/* Card 4: Laba Bersih */}
                <div className="relative p-5 rounded-[24px] bg-white border border-gray-100 shadow-sm hover:shadow-md hover:border-emerald-200 flex flex-col justify-between gap-4 overflow-hidden group hover:-translate-y-1 transition-all duration-300 min-h-[130px]">
                    <div className="absolute -right-6 -bottom-6 text-emerald-100 group-hover:scale-110 transition-transform duration-500 pointer-events-none">
                        <DollarSign size={120} strokeWidth={1.5}/>
                    </div>
                    <div className="relative z-10 flex items-center gap-2">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><DollarSign size={16}/></div>
                        <span className="text-xs font-bold text-gray-700 uppercase tracking-wider truncate">Laba Bersih</span>
                    </div>
                    <h3 className="relative z-10 text-xl md:text-[26px] font-bold text-emerald-600 tracking-tight truncate" title={formatCurrency(stats.netProfitGlobal)}>{formatCurrency(stats.netProfitGlobal)}</h3>
                </div>
            </div>

            {/* Bagian Status Modal & Aset */}
            <div className="grid grid-cols-2 gap-4 w-full">
                {/* Card 5: Nilai Aset Gudang */}
                <div className="relative p-5 rounded-[24px] bg-white border border-gray-100 shadow-sm hover:shadow-md flex flex-col justify-between gap-4 overflow-hidden group hover:-translate-y-1 transition-all duration-300 min-h-[120px]">
                    <div className="absolute -right-6 -bottom-6 text-emerald-100 group-hover:scale-110 transition-transform duration-500 pointer-events-none">
                        <Archive size={120} strokeWidth={1.5}/>
                    </div>
                    <div className="relative z-10 flex items-center gap-2">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><Archive size={16}/></div>
                        <span className="text-xs font-bold text-gray-700 uppercase tracking-wider truncate">Nilai Aset Gudang</span>
                    </div>
                    <h3 className="relative z-10 text-xl md:text-[26px] font-bold text-gray-800 tracking-tight truncate" title={formatCurrency(stats.totalAssetValue)}>{formatCurrency(stats.totalAssetValue)}</h3>
                </div>

                {/* Card 6: Modal Terjual */}
                <div className="relative p-5 rounded-[24px] bg-white border border-gray-100 shadow-sm hover:shadow-md flex flex-col justify-between gap-4 overflow-hidden group hover:-translate-y-1 transition-all duration-300 min-h-[120px]">
                    <div className="absolute -right-6 -bottom-6 text-blue-100 group-hover:scale-110 transition-transform duration-500 pointer-events-none">
                        <Layers size={120} strokeWidth={1.5}/>
                    </div>
                    <div className="relative z-10 flex items-center gap-2">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Layers size={16}/></div>
                        <span className="text-xs font-bold text-gray-700 uppercase tracking-wider truncate">Modal Terjual (HPP)</span>
                    </div>
                    <h3 className="relative z-10 text-xl md:text-[26px] font-bold text-gray-800 tracking-tight truncate" title={formatCurrency(stats.totalCOGS)}>{formatCurrency(stats.totalCOGS)}</h3>
                </div>
            </div>

            {/* Bagian Uang Laci / Dompet */}
            <div className="relative bg-[#0B1121] rounded-[32px] p-6 md:p-8 overflow-hidden shadow-xl border border-gray-800 w-full flex flex-col md:flex-row items-center justify-between gap-6 group hover:shadow-slate-900/40 transition-all duration-500">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-32 -left-32 w-80 h-80 bg-pink-500/40 rounded-full blur-[80px]"></div>
                    <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-blue-500/30 rounded-full blur-[80px]"></div>
                </div>
                
                <div className="absolute -right-12 -bottom-12 opacity-10 group-hover:scale-105 transition-transform duration-700 pointer-events-none">
                    <Wallet size={240} strokeWidth={1} className="text-white" />
                </div>

                <div className="relative z-10 flex flex-col gap-2 flex-1 w-full">
                    <div className="flex items-center gap-2 text-gray-400 mb-1">
                        <Wallet size={16} className="text-pink-400"/> 
                        <span className="text-xs sm:text-sm font-bold uppercase tracking-widest text-white drop-shadow-md">Dompet Toko (Saldo Laci)</span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl md:text-[44px] font-bold text-white tracking-tight truncate block w-full drop-shadow-md">
                        {formatCurrency(stats.cashOnHand)}
                    </h1>
                    
                    <div className="flex flex-wrap gap-3 md:gap-5 text-[10px] md:text-xs text-gray-300 mt-4 bg-white/5 p-3.5 md:p-4 rounded-2xl border border-white/10 w-fit backdrop-blur-md">
                        <div className="flex flex-col gap-1 pr-3 md:pr-5 border-r border-white/10">
                            <span className="text-gray-400 font-medium">Omzet Masuk</span> 
                            <span className="text-emerald-400 font-bold">{formatCurrency(stats.salesRevenue)}</span>
                        </div>
                        <div className="flex flex-col gap-1 pr-3 md:pr-5 border-r border-white/10">
                            <span className="text-gray-400 font-medium">Biaya Keluar</span> 
                            <span className="text-rose-400 font-bold">-{formatCurrency(stats.orderExpenses + stats.generalExpTotal)}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-gray-400 font-medium">Modal Ditarik</span> 
                            <span className="text-orange-400 font-bold">-{formatCurrency(stats.totalWithdrawals)}</span>
                        </div>
                    </div>
                </div>
                
                <button onClick={() => setShowWithdraw(true)} className="relative z-10 w-full md:w-auto px-6 py-4 bg-white text-gray-900 rounded-2xl font-bold hover:bg-gray-100 flex items-center justify-center gap-2 active:scale-95 text-xs md:text-sm transition-all hover:scale-105 shrink-0 shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                    <HandCoins size={18} className="text-gray-700"/> Ambil Uang Modal
                </button>
            </div>

            {/* CONTAINER UNTUK AI ADVISOR DAN CHART TREN */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full min-w-0">
                
                {/* ✨ AI BUSINESS ADVISOR WIDGET ✨ */}
                <div className="bg-gradient-to-br from-[#1a0b2e] via-[#2d1154] to-[#4c1d95] rounded-[32px] p-6 md:p-8 shadow-xl relative overflow-hidden text-white w-full border border-purple-500/20 group flex flex-col h-full order-1 lg:order-none">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.05] pointer-events-none group-hover:scale-110 transition-transform duration-700">
                        <Bot size={150} />
                    </div>
                    <div className="absolute -top-24 -left-24 w-64 h-64 bg-pink-500/20 rounded-full blur-[60px] pointer-events-none"></div>

                    <div className="relative z-10 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-6 shrink-0">
                        <div>
                            <h3 className="text-xl md:text-2xl font-bold flex items-center gap-2 text-white">
                                <Sparkles className="text-yellow-400" size={24} /> Mutiara AI Advisor
                            </h3>
                            <p className="text-purple-200 text-xs md:text-sm mt-1 max-w-sm">
                                Asisten cerdas yang menganalisis performa toko, tren penjualan, dan stok barang.
                            </p>
                        </div>
                        <button
                            onClick={analyzeData}
                            disabled={isAnalyzing}
                            className="w-full xl:w-auto px-5 py-3 bg-white text-purple-900 font-bold rounded-2xl hover:bg-gray-100 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] active:scale-95 flex items-center justify-center gap-2 shrink-0 disabled:opacity-70 disabled:active:scale-100 disabled:shadow-none text-sm"
                        >
                            {isAnalyzing ? <RefreshCw className="animate-spin text-purple-600" size={16} /> : <Bot className="text-purple-600" size={16} />}
                            {isAnalyzing ? 'Menganalisis...' : 'Minta Analisis AI'}
                        </button>
                    </div>

                    {apiError && (
                        <div className="relative z-10 bg-red-500/20 border border-red-500/50 text-red-100 p-4 rounded-2xl text-sm mb-4 flex flex-col items-start gap-2 shrink-0">
                            <div className="flex items-center gap-2">
                                <AlertTriangle size={18} className="shrink-0 text-red-400" />
                                <span className="font-bold">Terjadi Kesalahan:</span>
                            </div>
                            <p className="pl-6 text-xs">{apiError}</p>
                        </div>
                    )}

                    {/* INPUT FORM MANUAL JIKA API KEY BELUM ADA ATAU INVALID */}
                    {showKeyInput && (
                        <div className="relative z-10 bg-black/20 backdrop-blur-md border border-white/20 p-4 rounded-2xl mb-4 animate-fade-in flex flex-col gap-3">
                            <p className="text-xs text-purple-200 font-medium">
                                Tempel API Key Anda di bawah ini untuk memulai (Cukup sekali):
                            </p>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Key size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-300" />
                                    <input 
                                        type="password" 
                                        className="w-full bg-white/10 text-white placeholder-purple-300/50 border border-white/20 rounded-xl py-2.5 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-pink-400"
                                        placeholder="AIzaSy..."
                                        value={customApiKey}
                                        onChange={(e) => setCustomApiKey(e.target.value)}
                                    />
                                </div>
                                <button 
                                    onClick={handleSaveApiKey}
                                    className="bg-pink-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-md hover:bg-pink-500 transition-colors"
                                >
                                    Simpan
                                </button>
                            </div>
                        </div>
                    )}

                    {aiInsights && !isAnalyzing && (
                        <div className="relative z-10 animate-fade-in flex flex-col gap-4 flex-1">
                            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 shrink-0">
                                <p className="font-medium text-purple-50 text-sm leading-relaxed">{aiSummary}</p>
                            </div>
                            
                            <div className="grid grid-cols-1 gap-3 overflow-y-auto custom-scrollbar pr-1 flex-1">
                                {aiInsights.map((insight, idx) => (
                                    <div key={idx} className="bg-black/20 backdrop-blur-md p-4 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors flex gap-3 items-start">
                                        <div className="shrink-0 mt-0.5">
                                            {insight.type === 'positive' && <div className="p-2 bg-green-500/20 text-green-400 rounded-xl"><TrendingUp size={16}/></div>}
                                            {insight.type === 'warning' && <div className="p-2 bg-yellow-500/20 text-yellow-400 rounded-xl"><AlertTriangle size={16}/></div>}
                                            {insight.type === 'neutral' && <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl"><Lightbulb size={16}/></div>}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm text-white mb-1 leading-tight">{insight.title}</h4>
                                            <p className="text-xs text-purple-200 leading-relaxed">{insight.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {!aiInsights && !isAnalyzing && !apiError && !showKeyInput && (
                        <div className="relative z-10 p-6 border-2 border-dashed border-purple-400/30 rounded-2xl flex flex-col items-center justify-center text-center gap-3 opacity-60 flex-1 min-h-[150px]">
                            <Bot size={40} className="text-purple-300" />
                            <p className="text-sm text-purple-200">Klik tombol di atas untuk mendapatkan saran strategi toko dari AI.</p>
                        </div>
                    )}
                </div>

                {/* Bagian Chart Tren */}
                <div className="bg-white p-5 md:p-6 rounded-[28px] shadow-sm border border-gray-100 w-full min-w-0 group hover:shadow-md transition-shadow duration-300 flex flex-col h-full order-2 lg:order-none overflow-hidden">
                    <div className="flex items-center gap-3 mb-4 shrink-0">
                        <div className="p-2.5 bg-pink-50 text-pink-600 rounded-xl group-hover:bg-pink-600 group-hover:text-white transition-colors duration-300"><BarChart3 size={18} className="shrink-0"/></div>
                        <h3 className="font-bold text-base md:text-xl text-gray-800">Tren Penjualan (7 Hari)</h3>
                    </div>
                    
                    <div className="w-full overflow-x-auto custom-scrollbar flex-1 flex flex-col">
                        <div className="min-w-[300px] flex-1 flex flex-col">
                            <SimpleChart data={orders} />
                        </div>
                        <p className="text-[10px] text-gray-400 text-center mt-2 shrink-0">💡 Klik batang grafik untuk melihat nominal rupiah</p>
                    </div>
                </div>

            </div>

            {/* Susunan Kolom Bawah (Flex Column di HP, 3 Kolom di Desktop) */}
            <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6 w-full min-w-0">
                
                {/* Kolom Kiri: Transaksi & Aktivitas */}
                <div className="lg:col-span-2 flex flex-col gap-6 min-w-0 w-full">
                    
                    {/* Widget Transaksi Terakhir */}
                    <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 flex flex-col w-full min-w-0 overflow-hidden group hover:shadow-md transition-shadow duration-300">
                        <div className="p-5 md:p-6 border-b border-gray-50 flex justify-between items-center bg-white">
                            <h3 className="font-bold text-base md:text-lg text-gray-800 flex items-center gap-2"><FileText size={18} className="text-pink-600"/> Transaksi Terakhir</h3>
                            <button onClick={()=>handleNavigate('history')} className="text-xs font-bold text-pink-600 hover:text-white hover:bg-pink-600 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 border border-pink-100">Semua <ArrowRight size={12}/></button>
                        </div>
                        <div className="flex-1 p-2 md:p-3">
                            {orders.slice(0, 5).map(o => (
                                <div key={o.id} className="p-3 md:p-4 flex justify-between items-center gap-3 min-w-0 hover:bg-pink-50/50 cursor-pointer rounded-2xl mb-1 transition-all border border-transparent hover:border-pink-100" onClick={() => handleNavigate('history')}>
                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-pink-50 border border-pink-100 text-pink-600 flex items-center justify-center shrink-0 shadow-sm">
                                            <ShoppingCart size={18}/>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-bold text-gray-800 text-sm md:text-base truncate block" title={o.customerName || 'Umum'}>{o.customerName || 'Umum Customer'}</p>
                                            <p className="text-[10px] md:text-xs text-gray-400 mt-0.5 truncate flex items-center gap-1">
                                                <span>{formatDate(o.date).split(',')[0]}</span>
                                                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                                <span>{o.items.length} Barang</span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="font-bold text-gray-800 text-sm md:text-base truncate">{formatCurrency(o.financials.revenue)}</p>
                                        <p className="text-[10px] md:text-xs text-emerald-500 font-bold truncate bg-emerald-50 px-2 py-0.5 rounded-md inline-block mt-0.5 border border-emerald-100">+{formatCurrency(o.financials.netProfit)}</p>
                                    </div>
                                </div>
                            ))}
                            {orders.length === 0 && <div className="p-8 text-center text-gray-400 text-sm bg-gray-50 rounded-2xl border border-dashed border-gray-200 m-2 font-medium">Belum ada transaksi penjualan.</div>}
                        </div>
                    </div>

                    {/* Widget Aktivitas Terkini */}
                    <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 flex flex-col w-full min-w-0 overflow-hidden group hover:shadow-md transition-shadow duration-300">
                        <div className="p-5 md:p-6 border-b border-gray-50 flex justify-between items-center bg-white">
                            <h3 className="font-bold text-base md:text-lg text-gray-800 flex items-center gap-2"><Activity size={18} className="text-pink-600"/> Aktivitas Terkini</h3>
                            <button onClick={()=>handleNavigate('activity')} className="text-xs font-bold text-gray-400 hover:text-pink-600 hover:underline transition-colors">Lihat Log</button>
                        </div>
                        <div className="max-h-[350px] overflow-y-auto custom-scrollbar p-2 md:p-3">
                            {recentActivities?.slice(0, 10).map((act) => (
                                <div key={act.id} className="p-3 md:p-4 flex gap-4 items-start min-w-0 hover:bg-gray-50 rounded-2xl mb-1 transition-colors border border-transparent hover:border-gray-100">
                                    <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center shrink-0 mt-1">
                                        <Activity size={16} className="text-gray-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start gap-2 mb-1">
                                            <p className="text-sm font-bold text-gray-800 truncate block">{act.action}</p>
                                            <span className="text-[9px] md:text-[10px] text-gray-400 shrink-0 font-medium">{formatDate(act.createdAt || new Date()).split(',')[0]}</span>
                                        </div>
                                        <p className="text-[11px] md:text-xs text-gray-500 line-clamp-2 leading-relaxed">{act.details}</p>
                                        <div className="mt-2 flex items-center gap-2">
                                            <span className="text-[9px] bg-pink-50 text-pink-600 font-bold px-2 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 border border-pink-100">
                                                <User size={10}/> <span className="truncate max-w-[120px] block">{act.user}</span>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {(!recentActivities || recentActivities.length === 0) && <div className="text-center py-8 text-gray-400 text-sm bg-gray-50 rounded-2xl border border-dashed border-gray-200 m-2 font-medium">Belum ada catatan aktivitas.</div>}
                        </div>
                    </div>

                </div>

                {/* Kolom Kanan: Status Gudang & Menu Cepat */}
                <div className="flex flex-col gap-6 w-full min-w-0 h-fit">
                    
                    {/* Widget Status Gudang */}
                    <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-5 md:p-6 min-w-0 w-full group hover:shadow-md transition-shadow duration-300">
                        <div className="flex items-center gap-2 mb-5">
                            <div className="p-2 bg-gray-100 rounded-xl"><Package size={16} className="text-gray-600"/></div>
                            <h3 className="font-bold text-base md:text-lg text-gray-800">Status Gudang</h3>
                        </div>
                        <div className="space-y-3">
                            <div className="p-4 bg-red-50 rounded-2xl border border-red-100 flex items-center justify-between min-w-0 w-full hover:bg-red-100 hover:-translate-y-0.5 transition-all cursor-default shadow-sm">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="p-2 bg-white rounded-full shadow-sm"><AlertTriangle className="text-red-500 shrink-0" size={16}/></div>
                                    <span className="text-xs md:text-sm font-bold text-red-700 truncate">Stok Habis (0)</span>
                                </div>
                                <span className="font-bold text-xl text-red-700 shrink-0 ml-2">{stats.outStock}</span>
                            </div>
                            <div className="p-4 bg-yellow-50 rounded-2xl border border-yellow-100 flex items-center justify-between min-w-0 w-full hover:bg-yellow-100 hover:-translate-y-0.5 transition-all cursor-default shadow-sm">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="p-2 bg-white rounded-full shadow-sm"><Package className="text-yellow-600 shrink-0" size={16}/></div>
                                    <span className="text-xs md:text-sm font-bold text-yellow-700 truncate">Stok Menipis</span>
                                </div>
                                <span className="font-bold text-xl text-yellow-700 shrink-0 ml-2">{stats.lowStock}</span>
                            </div>
                            <button onClick={()=>handleNavigate('inventory')} className="w-full py-3.5 mt-2 bg-gray-900 text-white rounded-2xl font-bold text-sm hover:bg-pink-600 transition-colors active:scale-95 shadow-md flex items-center justify-center gap-2">
                                Cek Detail Gudang <ArrowRight size={16}/>
                            </button>
                        </div>
                    </div>

                    {/* Widget Menu Cepat (Desktop/Tablet) */}
                    <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-5 md:p-6 min-w-0 w-full hidden md:flex md:flex-col group hover:shadow-md transition-shadow duration-300">
                        <h3 className="font-bold text-base md:text-lg text-gray-800 mb-5 flex items-center gap-2">Akses Cepat</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => handleNavigate('sales')} className="p-4 bg-pink-50 hover:bg-pink-600 hover:text-white rounded-[24px] flex flex-col items-center justify-center gap-3 transition-all duration-300 text-pink-600 group/btn border border-pink-100 hover:border-pink-600 shadow-sm hover:shadow-md hover:-translate-y-1">
                                <div className="p-3 bg-white rounded-xl group-hover/btn:bg-pink-500 transition-colors shadow-sm text-pink-600 group-hover/btn:text-white"><ShoppingCart size={24} /></div>
                                <span className="text-xs font-bold tracking-wide">Buka Kasir</span>
                            </button>
                            <button onClick={() => handleNavigate('inventory')} className="p-4 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-[24px] flex flex-col items-center justify-center gap-3 transition-all duration-300 text-blue-600 group/btn border border-blue-100 hover:border-blue-600 shadow-sm hover:shadow-md hover:-translate-y-1">
                                <div className="p-3 bg-white rounded-xl group-hover/btn:bg-blue-500 transition-colors shadow-sm text-blue-600 group-hover/btn:text-white"><PackagePlus size={24} /></div>
                                <span className="text-xs font-bold tracking-wide">Restock Brg</span>
                            </button>
                            <button onClick={() => handleNavigate('expenses')} className="p-4 bg-orange-50 hover:bg-orange-500 hover:text-white rounded-[24px] flex flex-col items-center justify-center gap-3 transition-all duration-300 text-orange-600 group/btn border border-orange-100 hover:border-orange-500 shadow-sm hover:shadow-md hover:-translate-y-1">
                                <div className="p-3 bg-white rounded-xl group-hover/btn:bg-orange-400 transition-colors shadow-sm text-orange-600 group-hover/btn:text-white"><Wallet size={24} /></div>
                                <span className="text-xs font-bold tracking-wide">Catat Biaya</span>
                            </button>
                            <button onClick={() => handleNavigate('reports')} className="p-4 bg-emerald-50 hover:bg-emerald-600 hover:text-white rounded-[24px] flex flex-col items-center justify-center gap-3 transition-all duration-300 text-emerald-600 group/btn border border-emerald-100 hover:border-emerald-600 shadow-sm hover:shadow-md hover:-translate-y-1">
                                <div className="p-3 bg-white rounded-xl group-hover/btn:bg-emerald-500 transition-colors shadow-sm text-emerald-600 group-hover/btn:text-white"><FileText size={24} /></div>
                                <span className="text-xs font-bold tracking-wide">Laporan</span>
                            </button>
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
}