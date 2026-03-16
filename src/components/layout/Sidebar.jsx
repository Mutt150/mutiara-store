import React from 'react';
import { ShoppingBasket, ChevronRight, ChevronLeft, LogOut } from 'lucide-react';

const NavButton = ({ id, label, icon: Icon, activeTab, setActiveTab, setIsSidebarOpen, isSidebarMini }) => (
    <button 
      onClick={() => {setActiveTab(id); setIsSidebarOpen(false)}} 
      className={`flex items-center transition-all duration-200 shrink-0 
        ${activeTab === id ? 'bg-pink-600 text-white shadow-lg shadow-pink-200' : 'text-gray-500 hover:bg-pink-50 hover:text-pink-600'} 
        ${isSidebarMini 
            ? 'w-full gap-4 px-6 py-3.5 rounded-2xl md:w-12 md:h-12 md:gap-0 md:px-0 md:py-0 md:justify-center md:mx-auto' 
            : 'w-full gap-4 px-6 py-3.5 rounded-2xl'}`
      }
      title={isSidebarMini ? label : ''}
    >
      <Icon 
         strokeWidth={activeTab === id ? 2.5 : 2} 
         className={`shrink-0 transition-all ${isSidebarMini ? 'w-[16px] h-[16px] md:w-[20px] md:h-[20px]' : 'w-[16px] h-[16px]'} ${isSidebarMini && activeTab === id ? 'md:scale-110' : ''}`} 
      /> 
      <span className={`font-bold text-[15px] tracking-wide ${isSidebarMini ? 'block md:hidden' : 'block'}`}>
          {label}
      </span>
    </button>
);

export default function Sidebar({ isSidebarOpen, isSidebarMini, setIsSidebarMini, activeTab, setActiveTab, setIsSidebarOpenState, handleLogout, navItems }) {
    return (
        <aside className={`fixed inset-y-0 left-0 z-50 bg-white border-r border-pink-100 transform transition-transform duration-300 md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} ${isSidebarMini ? 'w-72 md:w-20' : 'w-72 md:w-80'} print:hidden flex flex-col h-full shadow-2xl md:shadow-none`}>
            <div className={`flex items-center gap-4 mb-2 shrink-0 ${isSidebarMini ? 'p-6 md:p-4 md:justify-center' : 'p-6 md:p-8'}`}>
                <div className="w-12 h-12 bg-gradient-to-tr from-pink-600 to-rose-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-pink-200 shrink-0">
                    <ShoppingBasket size={24} strokeWidth={2.5}/>
                </div>
                <div className={`overflow-hidden whitespace-nowrap ${isSidebarMini ? 'block md:hidden' : 'block'}`}>
                    <h1 className="font-extrabold text-2xl tracking-tight text-gray-800 leading-none">Mutiara</h1>
                    <span className="text-xs font-bold text-pink-500 uppercase tracking-widest">Store</span>
                </div>
            </div>
            
            <div className="hidden md:flex justify-end px-4 mb-2 shrink-0">
                <button onClick={() => setIsSidebarMini(!isSidebarMini)} className="p-1.5 rounded-lg bg-pink-50 text-pink-400 hover:text-pink-600 hover:bg-pink-100 transition-colors">
                    {isSidebarMini ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                </button>
            </div>

            <nav className={`space-y-1.5 overflow-y-auto custom-scrollbar flex-1 pb-10 ${isSidebarMini ? 'px-6 md:px-2' : 'px-6'}`}>
                <p className={`px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-2 ${isSidebarMini ? 'block md:hidden' : 'block'}`}>Utama</p>
                {navItems.main.map(item => (
                    <NavButton key={item.id} id={item.id} label={item.label} icon={item.icon} activeTab={activeTab} setActiveTab={setActiveTab} setIsSidebarOpen={setIsSidebarOpenState} isSidebarMini={isSidebarMini} />
                ))}
                
                <p className={`px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-6 ${isSidebarMini ? 'block md:hidden' : 'block'}`}>Gudang</p>
                {navItems.inventory.map(item => (
                    <NavButton key={item.id} id={item.id} label={item.label} icon={item.icon} activeTab={activeTab} setActiveTab={setActiveTab} setIsSidebarOpen={setIsSidebarOpenState} isSidebarMini={isSidebarMini} />
                ))}

                <p className={`px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-6 ${isSidebarMini ? 'block md:hidden' : 'block'}`}>Sistem</p>
                {navItems.system?.map(item => (
                    <NavButton key={item.id} id={item.id} label={item.label} icon={item.icon} activeTab={activeTab} setActiveTab={setActiveTab} setIsSidebarOpen={setIsSidebarOpenState} isSidebarMini={isSidebarMini} />
                ))}
                
                <div className="h-10"></div> 
            </nav>

            <div className={`p-4 border-t border-pink-50 shrink-0 bg-white ${isSidebarMini ? 'flex flex-col md:items-center' : 'flex flex-col'}`}>
                <button onClick={handleLogout} className={`flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-all ${isSidebarMini ? 'w-full md:w-12 md:h-12 md:p-0 md:justify-center' : 'w-full'}`} title="Keluar Aplikasi">
                    <LogOut className={`shrink-0 ${isSidebarMini ? 'w-[20px] h-[20px] md:w-[24px] md:h-[24px]' : 'w-[20px] h-[20px]'}`}/>
                    <span className={`font-bold text-[15px] ${isSidebarMini ? 'block md:hidden' : 'block'}`}>Keluar</span>
                </button>
                
                {/* Teks Hak Cipta untuk Desktop Mini */}
                <div className={`mt-4 text-center ${isSidebarMini ? 'hidden md:block' : 'hidden'}`} title="Hak Cipta © 2026 Mutiara Store. All rights reserved.">
                    <p className="text-[10px] text-gray-400 font-medium">&copy; '26</p>
                </div>

                {/* Teks Hak Cipta untuk Layar Penuh/Mobile */}
                <div className={`mt-4 text-center ${isSidebarMini ? 'block md:hidden' : 'block'}`}>
                    <p className="text-[10px] text-gray-400 font-medium">Hak Cipta &copy; 2026 Mutiara Store.</p>
                    <p className="text-[10px] text-gray-400 font-medium">All rights reserved.</p>
                </div>
            </div>
        </aside>
    );
}