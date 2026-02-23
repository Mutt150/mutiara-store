import React, { useState } from 'react';
import { X, User, Upload, Store, Phone, Mail, Shield, Lock, MapPin, LogOut } from 'lucide-react';

export default function UserProfileModal({ setShowProfileEdit, user, storeProfile, activeStoreId, handleUpdateStoreProfile, handleUpdateUserProfile, handleChangePassword, handleLogout }) {
    if (!showProfileEdit) return null;

    const [activeTab, setActiveTab] = useState('pribadi'); 

    const [displayName, setDisplayName] = useState(storeProfile?.ownerName || user?.displayName || '');
    const [phoneNumber, setPhoneNumber] = useState(storeProfile?.phoneNumber || '');
    const [photo, setPhoto] = useState(storeProfile?.photoURL || user?.photoURL || '');
    const [storeName, setStoreName] = useState(storeProfile?.storeName || '');
    const [storeAddress, setStoreAddress] = useState(storeProfile?.storeAddress || '');
    const [newPassword, setNewPassword] = useState('');

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 700000) return alert("Ukuran foto terlalu besar! Maksimal 700KB agar muat di database.");
            const reader = new FileReader();
            reader.onloadend = () => setPhoto(reader.result);
            reader.readAsDataURL(file);
        }
    }

    const isOwner = activeStoreId === user?.uid;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-md p-4 animate-fade-in">
            <div className="bg-white rounded-[32px] w-full max-w-md shadow-2xl flex flex-col max-h-[90vh] overflow-hidden relative">
                <div className="h-24 bg-gradient-to-r from-pink-500 to-rose-400 absolute top-0 left-0 right-0 z-0"></div>
                <button onClick={() => setShowProfileEdit(false)} className="absolute top-4 right-4 p-2 bg-white/20 text-white rounded-full hover:bg-white/30 backdrop-blur-sm z-50 transition-all"><X size={20} /></button>

                <div className="relative z-10 px-6 pt-12 pb-4 flex flex-col items-center">
                    <div className="w-24 h-24 rounded-full bg-white p-1 shadow-lg mb-3 relative group cursor-pointer">
                        <div className="w-full h-full rounded-full overflow-hidden border-2 border-gray-100 bg-gray-50 flex items-center justify-center">
                            {photo ? <img src={photo} alt="Profile" className="w-full h-full object-cover" /> : <User size={40} className="text-gray-300" />}
                        </div>
                        <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-bold cursor-pointer">
                            <Upload size={16} className="mb-1" />
                            <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                        </label>
                        <div className={`absolute bottom-0 right-0 border-2 border-white rounded-full p-1.5 ${isOwner ? 'bg-blue-500' : 'bg-gray-500'}`} title={isOwner ? "Owner" : "Staff"}>
                            {isOwner ? <Store size={12} className="text-white" /> : <User size={12} className="text-white" />}
                        </div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800">{displayName || 'Tanpa Nama'}</h3>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                    <span className={`mt-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${isOwner ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                        {isOwner ? 'Pemilik Toko' : 'Karyawan'}
                    </span>
                </div>

                <div className="flex border-b border-gray-100 px-6 gap-6">
                    <button onClick={() => setActiveTab('pribadi')} className={`pb-3 text-sm font-bold transition-all relative ${activeTab === 'pribadi' ? 'text-pink-600' : 'text-gray-400 hover:text-gray-600'}`}>
                        Data Diri {activeTab === 'pribadi' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-600 rounded-t-full"></div>}
                    </button>
                    <button onClick={() => setActiveTab('keamanan')} className={`pb-3 text-sm font-bold transition-all relative ${activeTab === 'keamanan' ? 'text-pink-600' : 'text-gray-400 hover:text-gray-600'}`}>
                        Keamanan {activeTab === 'keamanan' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-600 rounded-t-full"></div>}
                    </button>
                    <button onClick={() => setActiveTab('toko')} className={`pb-3 text-sm font-bold transition-all relative ${activeTab === 'toko' ? 'text-pink-600' : 'text-gray-400 hover:text-gray-600'}`}>
                        Info Toko {activeTab === 'toko' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-600 rounded-t-full"></div>}
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    {activeTab === 'pribadi' && (
                        <div className="space-y-4 animate-fade-in">
                            <div>
                                <label className="text-xs font-bold text-gray-400 ml-1 mb-1 block">Nama Panggilan</label>
                                <div className="relative"><User className="absolute left-3 top-3.5 text-gray-400" size={16} /><input className="w-full pl-10 p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-pink-300 text-sm font-medium" value={displayName} onChange={e => setDisplayName(e.target.value)} /></div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400 ml-1 mb-1 block">No. Handphone</label>
                                <div className="relative"><Phone className="absolute left-3 top-3.5 text-gray-400" size={16} /><input className="w-full pl-10 p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-pink-300 text-sm font-medium" placeholder="08..." value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} /></div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400 ml-1 mb-1 block">Email (Tidak bisa diubah)</label>
                                <div className="relative"><Mail className="absolute left-3 top-3.5 text-gray-400" size={16} /><input className="w-full pl-10 p-3 bg-gray-100 border border-gray-100 rounded-xl text-sm text-gray-500" value={user?.email} disabled /></div>
                            </div>
                            <button onClick={() => handleUpdateUserProfile(displayName, photo, phoneNumber)} className="w-full py-3 mt-2 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 shadow-lg shadow-gray-200 transition-all">Simpan Perubahan</button>
                        </div>
                    )}

                    {activeTab === 'keamanan' && (
                        <div className="space-y-4 animate-fade-in">
                            <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 flex gap-3"><Shield className="text-yellow-600 shrink-0" size={20} /><p className="text-xs text-yellow-700">Untuk keamanan, ganti kata sandi secara berkala.</p></div>
                            <div>
                                <label className="text-xs font-bold text-gray-400 ml-1 mb-1 block">Kata Sandi Baru</label>
                                <div className="relative"><Lock className="absolute left-3 top-3.5 text-gray-400" size={16} /><input type="password" className="w-full pl-10 p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-pink-300 text-sm font-medium" placeholder="Minimal 6 karakter" value={newPassword} onChange={e => setNewPassword(e.target.value)} /></div>
                            </div>
                            <button onClick={() => handleChangePassword(newPassword)} disabled={!newPassword} className="w-full py-3 mt-2 bg-pink-600 text-white font-bold rounded-xl hover:bg-pink-700 shadow-lg shadow-pink-200 transition-all disabled:bg-gray-300">Update Password</button>
                        </div>
                    )}

                    {activeTab === 'toko' && (
                        <div className="space-y-4 animate-fade-in">
                            {!isOwner && <div className="bg-blue-50 p-3 rounded-xl text-xs text-blue-600 border border-blue-100">Informasi toko hanya bisa diubah oleh pemilik.</div>}
                            <div>
                                <label className="text-xs font-bold text-gray-400 ml-1 mb-1 block">Nama Toko</label>
                                <div className="relative"><Store className="absolute left-3 top-3.5 text-gray-400" size={16} /><input disabled={!isOwner} className="w-full pl-10 p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-pink-300 text-sm font-medium disabled:bg-gray-100" value={storeName} onChange={e => setStoreName(e.target.value)} /></div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400 ml-1 mb-1 block">Alamat / Lokasi</label>
                                <div className="relative"><MapPin className="absolute left-3 top-3.5 text-gray-400" size={16} /><input disabled={!isOwner} className="w-full pl-10 p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-pink-300 text-sm font-medium disabled:bg-gray-100" placeholder="Contoh: Jl. Mawar No. 12" value={storeAddress} onChange={e => setStoreAddress(e.target.value)} /></div>
                            </div>
                            {isOwner && <button onClick={() => handleUpdateStoreProfile(storeName, storeAddress)} className="w-full py-3 mt-2 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 shadow-lg shadow-gray-200 transition-all">Simpan Info Toko</button>}
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-gray-50 bg-gray-50/50">
                    <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-red-100 text-red-500 font-bold rounded-xl hover:bg-red-50 transition-all text-sm shadow-sm">
                        <LogOut size={16} /> Keluar Akun (Sign Out)
                    </button>
                </div>
            </div>
        </div>
    );
}