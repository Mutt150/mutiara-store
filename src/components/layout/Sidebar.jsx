import React from 'react';
import { ShoppingBasket, ChevronRight, ChevronLeft, LogOut } from 'lucide-react';

const NavButton = ({ id, label, icon: Icon, activeTab, setActiveTab, setIsSidebarOpen, isSidebarMini }) => (
    <button onClick={() => {setActiveTab(id); setIsSidebarOpen(false)}} 
      className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-200 shrink-0 ${activeTab === id ? 'bg-pink-600 text-white shadow-lg shadow-pink-200 scale-105' : 'text-gray-500 hover:bg-pink-50 hover:text-pink-600'} ${isSidebarMini ? 'justify-center px-2' : ''}`}
      title={isSidebarMini ? label : ''}
    >
      <Icon size={22} strokeWidth={activeTab === id ? 2.5 : 2} /> 
      {!isSidebarMini && <span className="font-bold text-base tracking-wide">{label}</span>}
    </button>
);

export default function Sidebar({ isSidebarOpen, isSidebarMini, setIsSidebarMini, activeTab, setActiveTab, setIsSidebarOpenState, handleLogout, navItems }) {
    return (
        <aside className={`fixed inset-y-0 left-0 z-50 bg-white border-r border-pink-100 transform transition-transform duration-300 md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} ${isSidebarMini ? 'w-20' : 'w-80'} print:hidden flex flex-col h-full`}>
            <div className={`flex items-center gap-4 mb-2 shrink-0 ${isSidebarMini ? 'p-4 justify-center' : 'p-8'}`}>
                <div className="w-12 h-12 bg-gradient-to-tr from-pink-600 to-rose-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-pink-200 shrink-0">
                    <ShoppingBasket size={24} strokeWidth={2.5}/>
                </div>
                {!isSidebarMini && (
                    <div className="overflow-hidden whitespace-nowrap">
                        <h1 className="font-extrabold text-2xl tracking-tight text-gray-800 leading-none">Mutiara</h1>
                        <span className="text-xs font-bold text-pink-500 uppercase tracking-widest">Store</span>
                    </div>
                )}
            </div>
            
            <div className="hidden md:flex justify-end px-4 mb-2 shrink-0">
                <button onClick={() => setIsSidebarMini(!isSidebarMini)} className="p-1.5 rounded-lg bg-pink-50 text-pink-400 hover:text-pink-600 hover:bg-pink-100 transition-colors">
                    {isSidebarMini ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                </button>
            </div>

            <nav className={`space-y-2 overflow-y-auto custom-scrollbar flex-1 ${isSidebarMini ? 'px-2' : 'px-6'}`}>
                {!isSidebarMini && <p className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider mt-2">Utama</p>}
                {navItems.main.map(item => (
                    <NavButton key={item.id} id={item.id} label={item.label} icon={item.icon} activeTab={activeTab} setActiveTab={setActiveTab} setIsSidebarOpen={setIsSidebarOpenState} isSidebarMini={isSidebarMini} />
                ))}
                
                {!isSidebarMini && <p className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider mt-6">Gudang</p>}
                {navItems.inventory.map(item => (
                    <NavButton key={item.id} id={item.id} label={item.label} icon={item.icon} activeTab={activeTab} setActiveTab={setActiveTab} setIsSidebarOpen={setIsSidebarOpenState} isSidebarMini={isSidebarMini} />
                ))}
                <div className="h-20"></div> 
            </nav>

            <div className={`p-4 border-t border-pink-50 shrink-0 ${isSidebarMini ? 'flex justify-center' : ''}`}>
                <button onClick={handleLogout} className={`flex items-center gap-3 w-full px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-all ${isSidebarMini ? 'justify-center' : ''}`} title="Keluar Aplikasi">
                    <LogOut size={20}/>
                    {!isSidebarMini && <span className="font-bold">Keluar</span>}
                </button>
            </div>
        </aside>
    );
}
