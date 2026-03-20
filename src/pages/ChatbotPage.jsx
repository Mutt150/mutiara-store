import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
    Bot, Send, Sparkles, User, RefreshCw, AlertTriangle,
    ShoppingCart, Package, TrendingUp, DollarSign, X, ChevronDown,
    Plus, MessageSquare, PanelLeftClose, PanelLeftOpen
} from 'lucide-react';

// ─── UTILS ───────────────────────────────────────────────────────────────────
const formatCurrency = (a) => new Intl.NumberFormat('id-ID', {
    style:'currency', currency:'IDR', minimumFractionDigits:0, maximumFractionDigits:0,
}).format(a||0);

const genId = () => Date.now().toString(36)+Math.random().toString(36).slice(2);
const STORAGE_KEY = 'mutiara_ai_sessions';
const loadSessions = () => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]'); } catch { return []; } };
const saveSessions = (s) => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s.slice(0,30))); } catch {} };

const QUICK_PROMPTS = [
    { icon: TrendingUp,   label: 'Analisis penjualan bulan ini' },
    { icon: Package,      label: 'Stok yang perlu diperhatikan?' },
    { icon: DollarSign,   label: 'Berapa laba bersih saya?' },
    { icon: ShoppingCart, label: 'Tips meningkatkan omzet toko' },
];

// ─── MARKDOWN ────────────────────────────────────────────────────────────────
const ri = (text, k='') => {
    const parts=[]; const re=/(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g; let last=0,m;
    while((m=re.exec(text))!==null){
        if(m.index>last) parts.push(<span key={`${k}t${last}`}>{text.slice(last,m.index)}</span>);
        if(m[2]) parts.push(<strong key={`${k}b${m.index}`} className="font-semibold text-gray-900">{m[2]}</strong>);
        else if(m[3]) parts.push(<em key={`${k}i${m.index}`}>{m[3]}</em>);
        else if(m[4]) parts.push(<code key={`${k}c${m.index}`} className="bg-pink-50 text-pink-600 px-1 py-0.5 rounded text-[11px] font-mono border border-pink-100">{m[4]}</code>);
        last=m.index+m[0].length;
    }
    if(last<text.length) parts.push(<span key={`${k}e`}>{text.slice(last)}</span>);
    return parts.length?parts:[text];
};

const MD = ({content}) => {
    const lines=content.split('\n'); const els=[]; let i=0;
    while(i<lines.length){
        const line=lines[i].trim();
        if(!line){i++;continue;}
        if(/^# /.test(line)){els.push(<h1 key={i} className="text-[15px] font-bold text-gray-900 mt-3 mb-1 first:mt-0">{ri(line.slice(2),`h1${i}`)}</h1>);i++;continue;}
        if(/^## /.test(line)){
            els.push(<h2 key={i} className="text-[13px] font-bold text-gray-800 mt-2.5 mb-1 first:mt-0 flex items-center gap-1.5">
                <span className="w-[3px] h-[14px] bg-pink-500 rounded-full shrink-0"></span>
                {ri(line.slice(3),`h2${i}`)}
            </h2>);i++;continue;
        }
        if(/^#{3,} /.test(line)){els.push(<p key={i} className="text-[13px] font-semibold text-gray-800 mt-2 mb-0.5">{ri(line.replace(/^#{3,} /,''),`h3${i}`)}</p>);i++;continue;}
        if(/^[*\-] /.test(line)){
            const items=[];
            while(i<lines.length&&/^[*\-] /.test(lines[i].trim())){
                items.push(<li key={i} className="flex gap-2 items-start"><span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-pink-400 shrink-0"></span><span className="flex-1">{ri(lines[i].trim().slice(2),`li${i}`)}</span></li>);
                i++;
            }
            els.push(<ul key={`ul${i}`} className="flex flex-col gap-1 my-1.5">{items}</ul>);continue;
        }
        if(/^\d+\. /.test(line)){
            const items=[];let n=1;
            while(i<lines.length&&/^\d+\. /.test(lines[i].trim())){
                items.push(<li key={i} className="flex gap-2 items-start"><span className="shrink-0 w-[17px] h-[17px] rounded-full bg-pink-100 text-pink-600 text-[10px] font-bold flex items-center justify-center mt-0.5 border border-pink-200">{n}</span><span className="flex-1">{ri(lines[i].trim().replace(/^\d+\. /,''),`ol${i}`)}</span></li>);
                i++;n++;
            }
            els.push(<ol key={`ol${i}`} className="flex flex-col gap-1.5 my-1.5">{items}</ol>);continue;
        }
        if(/^---+$/.test(line)){els.push(<hr key={i} className="my-2 border-gray-100"/>);i++;continue;}
        els.push(<p key={i} className="text-gray-700 leading-relaxed">{ri(line,`p${i}`)}</p>);
        i++;
    }
    return <div className="flex flex-col gap-1 text-sm">{els}</div>;
};

// ─── BUBBLES ─────────────────────────────────────────────────────────────────
const Dots = () => (
    <div className="flex gap-1.5 items-center py-1">
        {[0,150,300].map((d,k)=><span key={k} className="w-2 h-2 rounded-full bg-pink-300 animate-bounce" style={{animationDelay:`${d}ms`}}/>)}
    </div>
);

const AIBubble = ({msg}) => (
    <div className="flex items-start gap-2.5" style={{animation:'msgIn .25s cubic-bezier(.34,1.56,.64,1) both'}}>
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-pink-500 to-rose-400 flex items-center justify-center shadow-sm shrink-0 mt-0.5">
            <Bot size={13} className="text-white"/>
        </div>
        <div className="flex-1 min-w-0">
            <div className="bg-white rounded-2xl rounded-tl-sm px-3.5 py-3 shadow-sm border border-gray-100 inline-block max-w-full">
                <MD content={msg.content}/>
            </div>
            <p className="text-[10px] text-gray-400 mt-1 ml-1">{msg.time}</p>
        </div>
    </div>
);

const UserBubble = ({msg}) => (
    <div className="flex items-end justify-end gap-2.5" style={{animation:'msgIn .25s cubic-bezier(.34,1.56,.64,1) both'}}>
        <div className="flex flex-col items-end">
            <div className="bg-gray-900 text-gray-100 rounded-2xl rounded-tr-sm px-3.5 py-2.5 max-w-[82%] shadow-sm">
                <p className="text-sm leading-relaxed">{msg.content}</p>
            </div>
            <p className="text-[10px] text-gray-400 mt-1 mr-1">{msg.time}</p>
        </div>
        <div className="w-7 h-7 rounded-lg bg-gray-800 flex items-center justify-center shrink-0 mb-5">
            <User size={12} className="text-gray-400"/>
        </div>
    </div>
);

// ─── WELCOME ──────────────────────────────────────────────────────────────────
const Welcome = ({ownerName, storeName, onPrompt, isLoading}) => {
    const h = new Date().getHours();
    const g = h<11?'Pagi':h<15?'Siang':h<18?'Sore':'Malam';
    return (
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-3 gap-4">
            <div className="flex flex-col items-center gap-2 text-center">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-400 flex items-center justify-center shadow-md shadow-pink-200/60">
                    <Sparkles size={18} className="text-white"/>
                </div>
                <div>
                    <h2 className="text-[17px] font-bold text-gray-900">Selamat {g}, <span className="text-pink-600">{ownerName}</span>!</h2>
                    <p className="text-gray-500 text-[12px] mt-0.5">Tanyakan apa saja tentang <span className="font-semibold text-gray-700">{storeName}</span></p>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-2 w-full max-w-xs">
                {QUICK_PROMPTS.map((qp,i)=>{
                    const Icon=qp.icon;
                    return (
                        <button key={i} onClick={()=>onPrompt(qp.label)} disabled={isLoading}
                            className="flex items-center gap-2 p-3 bg-white border border-gray-200 rounded-xl hover:border-pink-200 hover:bg-pink-50/40 hover:shadow-sm transition-all text-left group disabled:opacity-50">
                            <div className="w-7 h-7 rounded-lg bg-pink-50 border border-pink-100 flex items-center justify-center shrink-0 group-hover:bg-pink-100 transition-colors">
                                <Icon size={13} className="text-pink-500"/>
                            </div>
                            <span className="text-[11.5px] font-medium text-gray-700 leading-snug">{qp.label}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

// ─── SIDEBAR ─────────────────────────────────────────────────────────────────
const Sidebar = ({sessions, activeId, onSelect, onDelete, onNew}) => {
    const grouped = useMemo(()=>{
        const today=new Date();today.setHours(0,0,0,0);
        const yest=new Date(today);yest.setDate(yest.getDate()-1);
        const g={'Hari ini':[],'Kemarin':[],'Lama':[]};
        sessions.forEach(s=>{
            const d=new Date(s.createdAt);d.setHours(0,0,0,0);
            if(d>=today)g['Hari ini'].push(s);
            else if(d>=yest)g['Kemarin'].push(s);
            else g['Lama'].push(s);
        });
        return g;
    },[sessions]);

    return (
        <div className="flex flex-col h-full bg-gray-50/80 w-full">
            <div className="px-2.5 pt-2.5 pb-2 shrink-0">
                <button onClick={onNew}
                    className="w-full flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-xl hover:border-pink-200 hover:bg-pink-50/30 transition-all text-[12px] font-semibold text-gray-700 shadow-sm group">
                    <Plus size={13} className="text-pink-500 group-hover:rotate-90 transition-transform duration-200"/>
                    Chat Baru
                </button>
            </div>
            <div className="flex-1 overflow-y-auto px-2 pb-2 hist-scroll">
                {sessions.length===0&&(
                    <div className="text-center py-6 text-gray-400 text-[11px]">
                        <MessageSquare size={18} className="mx-auto mb-1.5 opacity-30"/>
                        Belum ada riwayat
                    </div>
                )}
                {Object.entries(grouped).map(([label,items])=>items.length===0?null:(
                    <div key={label} className="mb-2.5">
                        <p className="text-[9.5px] font-bold text-gray-400 uppercase tracking-wider px-2 mb-1">{label}</p>
                        <div className="space-y-0.5">
                            {items.map(s=>(
                                <div key={s.id}
                                    className={`group flex items-center gap-1.5 px-2.5 py-2 rounded-xl cursor-pointer transition-all ${activeId===s.id?'bg-white shadow-sm border border-gray-200/80':'hover:bg-white/70'}`}
                                    onClick={()=>onSelect(s.id)}>
                                    <MessageSquare size={10} className={`shrink-0 ${activeId===s.id?'text-pink-500':'text-gray-400'}`}/>
                                    <p className="flex-1 text-[11.5px] text-gray-700 truncate font-medium">{s.title}</p>
                                    <button onClick={e=>{e.stopPropagation();onDelete(s.id);}}
                                        className="shrink-0 opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-50 hover:text-red-500 text-gray-400 transition-all">
                                        <X size={10}/>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
            <div className="px-3 py-1.5 border-t border-gray-200/60 shrink-0">
                <p className="text-[9.5px] text-gray-400 text-center">Tersimpan lokal di browser</p>
            </div>
        </div>
    );
};

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function ChatbotPage({stats, orders, inventory, storeProfile}) {
    const [sessions, setSessions]               = useState(()=>loadSessions());
    const [activeSessionId, setActiveSessionId] = useState(null);
    const [messages, setMessages]               = useState([]);
    const [input, setInput]                     = useState('');
    const [isLoading, setIsLoading]             = useState(false);
    const [apiError, setApiError]               = useState('');
    const [showScroll, setShowScroll]           = useState(false);
    const [showSidebar, setShowSidebar]         = useState(false);

    const bottomRef    = useRef(null);
    const containerRef = useRef(null);
    const taRef        = useRef(null);
    const wrapRef      = useRef(null);

    // Dynamic height: account for mobile topbar + bottom nav + page padding
    useEffect(()=>{
        const setH = () => {
            if(!wrapRef.current) return;
            const isMobile = window.innerWidth < 768;
            if(isMobile) {
                // topbar ≈ 56px, bottom nav ≈ 64px, page p-4 top+bottom = 32px
                wrapRef.current.style.height = (window.innerHeight - 56 - 64 - 32) + 'px';
            } else {
                // desktop: page p-8 top+bottom = 64px, some margin
                wrapRef.current.style.height = Math.min(window.innerHeight - 80, 900) + 'px';
            }
        };
        setH();
        window.addEventListener('resize', setH);
        return () => window.removeEventListener('resize', setH);
    }, []);

    useEffect(()=>{
        if(!activeSessionId){setMessages([]);return;}
        const s=sessions.find(x=>x.id===activeSessionId);
        setMessages(s?.messages||[]);
    },[activeSessionId]);

    useEffect(()=>{
        bottomRef.current?.scrollIntoView({behavior:'smooth'});
    },[messages, isLoading]);

    const handleScroll = ()=>{
        const el=containerRef.current;
        if(el) setShowScroll(el.scrollHeight-el.scrollTop-el.clientHeight>80);
    };

    const storeContext = useMemo(()=>{
        const map={};
        (orders||[]).forEach(o=>o.items?.forEach(i=>{map[i.name]=(map[i.name]||0)+(parseFloat(i.qty)||0);}));
        const top=Object.entries(map).sort((a,b)=>b[1]-a[1]).slice(0,5).map(e=>`${e[0]}(${e[1]}x)`).join(', ');
        const low=inventory?.filter(i=>i.stock>0&&i.stock<=(i.minStock||5)).map(i=>`${i.name}(${i.stock})`).join(', ')||'-';
        const out=inventory?.filter(i=>i.stock<=0).map(i=>i.name).join(', ')||'-';
        return `Toko:${storeProfile?.storeName||'Mutiara Store'}|Pemilik:${storeProfile?.ownerName||'Pemilik'}
Omzet:${formatCurrency(stats?.salesRevenue)}|LabaKotor:${formatCurrency(stats?.salesGrossProfit)}
Biaya:${formatCurrency((stats?.orderExpenses||0)+(stats?.generalExpTotal||0))}|LabaBersih:${formatCurrency(stats?.netProfitGlobal)}
Kas:${formatCurrency(stats?.cashOnHand)}|Aset:${formatCurrency(stats?.totalAssetValue)}|HPP:${formatCurrency(stats?.totalCOGS)}
Top5:${top||'-'}|Menipis:${low}|Habis:${out}|JmlHabis:${stats?.outStock||0}|JmlMenipis:${stats?.lowStock||0}`;
    },[stats,orders,inventory,storeProfile]);

    const persistSession = useCallback((sid,msgs)=>{
        setSessions(prev=>{
            const title=msgs.find(m=>m.role==='user')?.content?.slice(0,40)||'Chat baru';
            const exists=prev.find(x=>x.id===sid);
            let next=exists
                ?prev.map(x=>x.id===sid?{...x,messages:msgs,title,updatedAt:Date.now()}:x)
                :[{id:sid,title,messages:msgs,createdAt:Date.now(),updatedAt:Date.now()},...prev];
            next.sort((a,b)=>b.updatedAt-a.updatedAt);
            saveSessions(next);
            return next;
        });
    },[]);

    const startNewChat = useCallback(()=>{
        setActiveSessionId(null);setMessages([]);setInput('');setApiError('');
        if(taRef.current) taRef.current.style.height='auto';
    },[]);

    const selectSession = useCallback((id)=>{
        setActiveSessionId(id);setApiError('');
        if(window.innerWidth<768) setShowSidebar(false);
    },[]);

    const deleteSession = useCallback((id)=>{
        setSessions(prev=>{const next=prev.filter(x=>x.id!==id);saveSessions(next);return next;});
        if(activeSessionId===id) startNewChat();
    },[activeSessionId,startNewChat]);

    const sendMessage = async(text)=>{
        const userText=(text||input).trim();
        if(!userText||isLoading) return;

        const apiKey=import.meta.env.VITE_GEMINI_API_KEY;
        if(!apiKey){setApiError('VITE_GEMINI_API_KEY belum diset di .env');return;}

        const time=new Date().toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'});
        const sid=activeSessionId||genId();
        if(!activeSessionId) setActiveSessionId(sid);

        const updated=[...messages,{role:'user',content:userText,time}];
        setMessages(updated);
        setInput('');
        if(taRef.current) taRef.current.style.height='auto';
        setIsLoading(true);setApiError('');

        try{
            const history=updated.map(m=>({role:m.role==='user'?'user':'model',parts:[{text:m.content}]}));
            const sys=`Kamu adalah Mutiara AI, asisten bisnis untuk "${storeProfile?.storeName||'Mutiara Store'}".
DATA TOKO: ${storeContext}
FORMAT WAJIB: Bahasa Indonesia santai. **bold** angka/kata penting. ## untuk heading (BUKAN ###). * bullet, 1. langkah urut. Jawaban HARUS TUNTAS dan diakhiri kalimat penutup. Emoji secukupnya.`;

            const call=async(contents,maxTok)=>fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
                {method:'POST',headers:{'Content-Type':'application/json'},
                 body:JSON.stringify({system_instruction:{parts:[{text:sys}]},contents,generationConfig:{temperature:0.75,maxOutputTokens:maxTok}})}
            ).then(r=>r.json());

            const data=await call(history,2500);
            if(data.error) throw new Error(data.error.message);

            const candidate=data.candidates?.[0];
            let reply=candidate?.content?.parts?.[0]?.text;
            if(!reply) throw new Error('Respons AI kosong.');

            // Auto-continue if truncated
            if(candidate?.finishReason==='MAX_TOKENS'){
                try{
                    const cont=[...history,
                        {role:'model',parts:[{text:reply}]},
                        {role:'user',parts:[{text:'Lanjutkan dari kalimat terakhir yang terpotong.'}]}
                    ];
                    const d2=await call(cont,1200);
                    const r2=d2.candidates?.[0]?.content?.parts?.[0]?.text;
                    if(r2) reply=reply+' '+r2;
                }catch{}
            }

            const t2=new Date().toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'});
            const finalMsgs=[...updated,{role:'assistant',content:reply,time:t2}];
            setMessages(finalMsgs);
            persistSession(sid,finalMsgs);
        }catch(e){
            setApiError(e.message);
        }finally{
            setIsLoading(false);
        }
    };

    const onKeyDown=(e)=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMessage();}};

    const ownerName  = storeProfile?.ownerName||storeProfile?.storeName||'Pemilik';
    const storeName  = storeProfile?.storeName||'Mutiara Store';
    const hasMessages = messages.length>0;

    return(
        <>
        <style>{`
            @keyframes msgIn{from{opacity:0;transform:translateY(8px) scale(.98);}to{opacity:1;transform:translateY(0) scale(1);}}
            .chat-scroll::-webkit-scrollbar{width:4px;}.chat-scroll::-webkit-scrollbar-track{background:transparent;}.chat-scroll::-webkit-scrollbar-thumb{background:#fce7f3;border-radius:99px;}
            .hist-scroll::-webkit-scrollbar{width:3px;}.hist-scroll::-webkit-scrollbar-track{background:transparent;}.hist-scroll::-webkit-scrollbar-thumb{background:#e5e7eb;border-radius:99px;}
            .prompt-hide::-webkit-scrollbar{display:none;}
        `}</style>

        {/* WRAPPER — height set dynamically via JS ref */}
        <div ref={wrapRef} className="flex flex-col bg-white rounded-[20px] overflow-hidden border border-gray-200/80 shadow-sm w-full" style={{minHeight:'400px'}}>

            {/* TOP BAR */}
            <div className="shrink-0 h-11 px-3 flex items-center gap-2 bg-white border-b border-gray-100">
                <button onClick={()=>setShowSidebar(v=>!v)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all shrink-0">
                    {showSidebar?<PanelLeftClose size={15}/>:<PanelLeftOpen size={15}/>}
                </button>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="relative shrink-0">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-pink-500 to-rose-400 flex items-center justify-center shadow-sm">
                            <Bot size={13} className="text-white"/>
                        </div>
                        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-[1.5px] border-white"></span>
                    </div>
                    <div className="min-w-0">
                        <p className="font-semibold text-[13px] text-gray-900 leading-none flex items-center gap-1">
                            Mutiara AI <Sparkles size={10} className="text-amber-400 shrink-0"/>
                        </p>
                        {hasMessages&&<p className="text-[10px] text-gray-400 mt-0.5 truncate">{sessions.find(s=>s.id===activeSessionId)?.title||'Chat baru'}</p>}
                    </div>
                </div>
                <button onClick={startNewChat}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[12px] font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-all shrink-0">
                    <Plus size={13}/><span className="hidden sm:inline ml-0.5">Baru</span>
                </button>
            </div>

            {/* BODY ROW */}
            <div className="flex flex-1 min-h-0 overflow-hidden">

                {/* SIDEBAR — same on mobile & desktop, width-based toggle */}
                <div className={`shrink-0 border-r border-gray-100 transition-all duration-300 overflow-hidden ${showSidebar?'w-[170px]':'w-0'}`}>
                    <Sidebar sessions={sessions} activeId={activeSessionId} onSelect={selectSession} onDelete={deleteSession} onNew={startNewChat}/>
                </div>

                {/* CHAT */}
                <div className="flex flex-col flex-1 min-w-0 min-h-0">

                    {/* Error banner */}
                    {apiError&&(
                        <div className="shrink-0 mx-3 mt-2 bg-red-50 border border-red-100 px-3 py-2 rounded-xl flex items-center gap-2">
                            <AlertTriangle size={12} className="text-red-500 shrink-0"/>
                            <p className="text-xs text-red-600 flex-1">{apiError}</p>
                            <button onClick={()=>setApiError('')}><X size={11} className="text-red-400 hover:text-red-600"/></button>
                        </div>
                    )}

                    {/* Messages or Welcome */}
                    {!hasMessages&&!isLoading
                        ?<Welcome ownerName={ownerName} storeName={storeName} onPrompt={sendMessage} isLoading={isLoading}/>
                        :(
                            <div ref={containerRef} onScroll={handleScroll}
                                 className="flex-1 overflow-y-auto px-3 md:px-5 py-3 flex flex-col gap-3.5 chat-scroll"
                                 style={{background:'linear-gradient(180deg,#fdf6fa 0%,#fff 60%)'}}>
                                {messages.map((msg,i)=>msg.role==='user'?<UserBubble key={i} msg={msg}/>:<AIBubble key={i} msg={msg}/>)}
                                {isLoading&&(
                                    <div className="flex items-start gap-2.5" style={{animation:'msgIn .2s ease both'}}>
                                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-pink-500 to-rose-400 flex items-center justify-center shadow-sm shrink-0 mt-0.5"><Bot size={13} className="text-white"/></div>
                                        <div className="bg-white rounded-2xl rounded-tl-sm px-3.5 py-3 shadow-sm border border-gray-100"><Dots/></div>
                                    </div>
                                )}
                                <div ref={bottomRef}/>
                            </div>
                        )
                    }

                    {/* Scroll btn */}
                    {showScroll&&(
                        <button onClick={()=>bottomRef.current?.scrollIntoView({behavior:'smooth'})}
                            className="absolute bottom-[90px] right-3 w-7 h-7 bg-white border border-gray-200 shadow-md rounded-full flex items-center justify-center hover:bg-gray-50 z-20">
                            <ChevronDown size={13} className="text-gray-500"/>
                        </button>
                    )}

                    {/* INPUT */}
                    <div className="shrink-0 px-3 pb-2.5 pt-2 bg-white border-t border-gray-100">
                        {hasMessages&&(
                            <div className="flex gap-1.5 overflow-x-auto prompt-hide mb-2">
                                {QUICK_PROMPTS.map((qp,i)=>{
                                    const Icon=qp.icon;
                                    return(
                                        <button key={i} onClick={()=>sendMessage(qp.label)} disabled={isLoading}
                                            className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-50 border border-gray-200 text-gray-500 rounded-full text-[11px] font-medium whitespace-nowrap hover:border-pink-300 hover:text-pink-600 hover:bg-pink-50 transition-all disabled:opacity-40 shrink-0">
                                            <Icon size={10} className="text-pink-400 shrink-0"/> {qp.label}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {/* Input row — items-center so placeholder is vertically centered */}
                        <div className="flex items-center gap-2 bg-gray-50 border-2 border-gray-200 rounded-2xl px-3.5 focus-within:border-pink-400 focus-within:bg-white transition-all" style={{minHeight:'44px'}}>
                            <textarea
                                ref={taRef}
                                rows={1}
                                value={input}
                                onChange={e=>{
                                    setInput(e.target.value);
                                    e.target.style.height='auto';
                                    e.target.style.height=Math.min(e.target.scrollHeight,96)+'px';
                                }}
                                onKeyDown={onKeyDown}
                                placeholder="Tanya apa saja tentang toko kamu..."
                                disabled={isLoading}
                                className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none resize-none py-3 leading-[1.4]"
                                style={{minHeight:'20px',maxHeight:'96px'}}
                            />
                            <button onClick={()=>sendMessage()} disabled={isLoading||!input.trim()}
                                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all shrink-0 ${input.trim()&&!isLoading?'bg-gray-900 text-white hover:bg-pink-600 shadow-sm active:scale-95':'bg-gray-200 text-gray-400'}`}>
                                {isLoading?<RefreshCw size={13} className="animate-spin"/>:<Send size={13}/>}
                            </button>
                        </div>
                        <p className="text-[10px] text-gray-400 text-center mt-1.5">Enter kirim · Shift+Enter baris baru</p>
                    </div>

                </div>
            </div>
        </div>
        </>
    );
}