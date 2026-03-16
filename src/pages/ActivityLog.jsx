import React, { useState } from 'react';
import { Activity, Search, User, Clock, CalendarDays } from 'lucide-react';
import { formatDate } from '../utils/helpers';

export default function ActivityLog({ activities }) {
    const [search, setSearch] = useState('');

    const filtered = (activities || []).filter(act =>
        (act.action && act.action.toLowerCase().includes(search.toLowerCase())) ||
        (act.details && act.details.toLowerCase().includes(search.toLowerCase())) ||
        (act.user && act.user.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div className="pb-24 md:pb-0 space-y-6 animate-fade-in">
            {/* Header */}
            <div>
                <h2 className="text-2xl md:text-3xl font-extrabold text-gray-800 tracking-tight">Log Aktivitas</h2>
                <p className="text-sm text-gray-500 font-medium mt-1">Lacak semua aktivitas, transaksi, dan perubahan sistem toko.</p>
            </div>

            {/* Compact List Layout */}
            <div className="bg-white rounded-[24px] shadow-sm border border-pink-100 overflow-hidden">
                {/* Search Bar */}
                <div className="relative border-b border-gray-100 bg-gray-50/50">
                    <Search className="absolute left-4 top-4 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Cari aktivitas, nama user, atau rincian..."
                        className="w-full pl-12 pr-4 py-4 bg-transparent outline-none text-sm font-medium focus:bg-white focus:ring-2 focus:ring-pink-300 transition-all"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                {/* Activity List - Menggunakan List Dense yang ramping */}
                <div className="divide-y divide-gray-100">
                    {filtered.map((act) => (
                        <div key={act.id} className="p-4 hover:bg-pink-50/30 transition-colors flex flex-col sm:flex-row gap-2 sm:gap-4 sm:items-center">
                            
                            {/* Desktop Icon - Hidden on very small mobile */}
                            <div className="hidden sm:flex w-8 h-8 bg-pink-50 text-pink-600 rounded-full items-center justify-center shrink-0 border border-pink-100">
                                <Activity size={14} />
                            </div>

                            {/* Details Container */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <span className="font-bold text-gray-800 text-sm">{act.action}</span>
                                    <span className="text-[10px] bg-gray-100 border border-gray-200 text-gray-600 px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
                                        <User size={10}/> {act.user}
                                    </span>
                                </div>
                                {/* truncate on mobile, full text on larger screens */}
                                <p className="text-xs text-gray-600 leading-snug break-words line-clamp-2 sm:line-clamp-none">
                                    {act.details}
                                </p>
                            </div>

                            {/* Timestamp */}
                            <div className="shrink-0 flex items-center gap-1 text-[10px] text-gray-400 font-medium mt-1 sm:mt-0 sm:flex-col sm:items-end sm:gap-0.5">
                                <Clock size={12} className="sm:hidden" />
                                <span>{formatDate(act.createdAt || new Date())}</span>
                            </div>
                        </div>
                    ))}

                    {filtered.length === 0 && (
                        <div className="text-center py-16 text-gray-400 bg-gray-50">
                            <CalendarDays size={48} className="mx-auto mb-4 opacity-30 text-gray-400" />
                            <p className="text-base font-bold text-gray-500">Tidak ada aktivitas ditemukan.</p>
                            <p className="text-sm mt-1">Coba gunakan kata kunci pencarian yang lain.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}