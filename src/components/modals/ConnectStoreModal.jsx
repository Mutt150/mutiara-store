import React, { useState } from 'react';
import { X, Users, Copy } from 'lucide-react';
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

export default function ConnectStoreModal({ setShowStoreModal, user, activeStoreId, storeProfile, handleConnectStore, db, appId }) {
    const [inputStoreId, setInputStoreId] = useState('');
    const [storeName, setStoreName] = useState(storeProfile?.storeName || '');
    const [customAlias, setCustomAlias] = useState(storeProfile?.customAlias || '');
    const [loadingAlias, setLoadingAlias] = useState(false);

    const isOwner = activeStoreId === user?.uid;

    const handleSaveProfile = async () => {
        if (!isOwner) return;
        try {
            const profileRef = doc(db, "artifacts", appId, "users", user.uid, "settings", "profile");
            await setDoc(profileRef, {
                storeName: storeName,
                customAlias: customAlias,
                updatedAt: serverTimestamp()
            }, { merge: true });

            if (customAlias) {
                setLoadingAlias(true);
                const aliasId = customAlias.toLowerCase().replace(/\s+/g, '-');
                const aliasRef = doc(db, "artifacts", appId, "public", "data", "store_aliases", aliasId);

                const snap = await getDoc(aliasRef);
                if (snap.exists() && snap.data().ownerUid !== user.uid) {
                    alert("Maaf, ID Custom ini sudah dipakai toko lain. Cari yang lain ya!");
                    setLoadingAlias(false);
                    return;
                }

                await setDoc(aliasRef, {
                    ownerUid: user.uid,
                    storeName: storeName
                });
                setLoadingAlias(false);
            }
            alert("Pengaturan Toko Disimpan!");
        } catch (e) {
            alert("Gagal simpan: " + e.message);
            setLoadingAlias(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6 relative overflow-y-auto max-h-[90vh]">
                <button onClick={() => setShowStoreModal(false)} className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X size={18} /></button>

                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-pink-100 text-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Users size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800">Hubungkan Tim</h3>
                    <p className="text-sm text-gray-500 mt-2">
                        Kelola koneksi tim atau masuk ke toko lain.
                    </p>
                </div>

                {isOwner ? (
                    <div className="space-y-4 mb-6 border-b border-gray-100 pb-6">
                        <h4 className="font-bold text-gray-800 text-sm bg-pink-50 p-2 rounded-lg text-center">Pengaturan Toko Saya</h4>

                        <div>
                            <label className="text-xs font-bold text-gray-400 ml-1 block mb-1">Nama Toko (Untuk Dashboard)</label>
                            <input
                                className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-pink-300 outline-none"
                                placeholder="Contoh: Mutiara Store Pusat"
                                value={storeName}
                                onChange={e => setStoreName(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-gray-400 ml-1 block mb-1">ID Custom / Alias (Opsional)</label>
                            <div className="flex gap-2">
                                <input
                                    className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-pink-300 outline-none"
                                    placeholder="Contoh: mutiara-pusat"
                                    value={customAlias}
                                    onChange={e => setCustomAlias(e.target.value)}
                                />
                            </div>
                            <p className="text-[10px] text-gray-400 mt-1">Buat ID pendek agar karyawan mudah login.</p>
                        </div>

                        <button onClick={handleSaveProfile} className="w-full py-2 bg-gray-800 text-white text-xs font-bold rounded-xl hover:bg-gray-700">
                            {loadingAlias ? "Menyimpan..." : "Simpan Info Toko"}
                        </button>

                        <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 mt-4">
                            <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">ID Asli (Backup)</label>
                            <div className="flex gap-2 items-center">
                                <code className="text-xs text-gray-600 truncate flex-1">{user?.uid}</code>
                                <button onClick={() => { navigator.clipboard.writeText(user?.uid); alert("Disalin!"); }} className="p-1 bg-white border rounded hover:text-pink-600"><Copy size={14} /></button>
                            </div>
                        </div>
                    </div>
                ) : null}

                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-gray-500 ml-1 block mb-1">Masuk ke Toko Lain (Untuk Karyawan)</label>
                        <input
                            className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-300 text-sm"
                            placeholder="Masukkan ID Custom atau ID Asli Bos..."
                            value={inputStoreId}
                            onChange={(e) => setInputStoreId(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => handleConnectStore(inputStoreId)}
                        disabled={!inputStoreId}
                        className="w-full py-3 bg-pink-600 text-white font-bold rounded-xl hover:bg-pink-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-lg shadow-pink-200"
                    >
                        Sambungkan Sekarang
                    </button>

                    {!isOwner && (
                        <button
                            onClick={() => handleConnectStore(null)}
                            className="w-full py-3 bg-white border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-all text-sm"
                        >
                            Kembali ke Toko Pribadi Saya
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}