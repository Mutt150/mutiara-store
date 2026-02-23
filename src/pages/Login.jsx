import React, { useState } from 'react';
import { ShoppingBasket, Mail, Lock, CheckSquare, Square, UserPlus, LogIn } from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, setPersistence, browserLocalPersistence, browserSessionPersistence } from "firebase/auth";
import { auth, googleProvider } from '../config/firebase';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
            if (isSignUp) {
                await createUserWithEmailAndPassword(auth, email, password);
                alert("Akun berhasil dibuat! Silakan masuk.");
            } else {
                await signInWithEmailAndPassword(auth, email, password);
            }
        } catch (error) {
            alert((isSignUp ? "Daftar Gagal: " : "Login Gagal: ") + error.message);
        }
        setLoading(false);
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        try {
            await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
            await signInWithPopup(auth, googleProvider);
        } catch (error) {
            console.error("Login Error:", error);
            alert("Login Google Gagal: " + error.message);
        }
        setLoading(false);
    }

    return (
        <div className="fixed inset-0 z-[60] bg-gradient-to-br from-pink-50 to-white flex flex-col items-center justify-center p-6 animate-fade-in text-center">
            <div className="w-24 h-24 bg-gradient-to-tr from-pink-600 to-rose-500 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-pink-200 mb-8 animate-bounce-slow">
                <ShoppingBasket size={48} strokeWidth={2}/>
            </div>
            <h1 className="text-4xl font-extrabold text-gray-800 mb-2 tracking-tight">Mutiara <span className="text-pink-600">Store</span></h1>
            <p className="text-gray-500 text-sm mb-8 max-w-sm">
                {isSignUp ? "Buat akun baru untuk mengelola toko Anda sendiri." : "Login duls yuu buat mengelola toko."}
            </p>
            
            <div className="w-full max-w-sm bg-white p-8 rounded-3xl shadow-xl shadow-pink-100 border border-pink-50 space-y-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative">
                        <Mail className="absolute left-4 top-3.5 text-gray-400" size={20}/>
                        <input type="email" required className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-300 focus:bg-white" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)}/>
                    </div>
                    <div className="relative">
                        <Lock className="absolute left-4 top-3.5 text-gray-400" size={20}/>
                        <input type="password" required className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-300 focus:bg-white" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)}/>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer" onClick={() => setRememberMe(!rememberMe)}>
                        {rememberMe ? <CheckSquare size={20} className="text-pink-600"/> : <Square size={20} className="text-gray-400"/>}
                        <span>Ingat Saya (Tetap Login)</span>
                    </div>

                    <button type="submit" disabled={loading} className="w-full py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-pink-600 transition-all shadow-lg hover:shadow-pink-300 flex justify-center items-center gap-2">
                        {loading ? 'Memproses...' : (isSignUp ? <><UserPlus size={18}/> Daftar Akun</> : <><LogIn size={18}/> Masuk Aplikasi</>)}
                    </button>
                </form>
                
                <div className="flex items-center gap-4 my-2"><div className="h-px bg-gray-100 flex-1"></div><span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Atau masuk dengan</span><div className="h-px bg-gray-100 flex-1"></div></div>
                
                <div className="flex justify-center">
                    <button onClick={handleGoogleLogin} disabled={loading} className="p-3 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 transition-all shadow-sm hover:shadow-md flex items-center justify-center group" title="Masuk dengan Google">
                        <svg className="w-6 h-6" viewBox="0 0 24 24" xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                    </button>
                </div>
                <div className="pt-2"><button type="button" onClick={() => setIsSignUp(!isSignUp)} className="text-sm text-pink-600 font-bold hover:underline">{isSignUp ? "Sudah punya akun? Login disini" : "Belum punya akun? Daftar sekarang"}</button></div>
            </div>
        </div>
    );
}