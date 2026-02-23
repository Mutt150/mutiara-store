import React, { useState, useEffect, useRef } from 'react';
import { X, CheckCircle } from 'lucide-react';

export default function CameraScanner({ onScanSuccess, onClose }) {
    const [lastScanned, setLastScanned] = useState(null);
    const scanLockRef = useRef(false);

    useEffect(() => {
        if (!window.Html5QrcodeScanner) {
            alert("Library Scanner belum siap. Coba refresh halaman.");
            onClose();
            return;
        }
        const scanner = new window.Html5QrcodeScanner(
            "reader",
            { fps: 10, qrbox: { width: 250, height: 250 } },
            false
        );
        scanner.render(
            (decodedText) => {
                if (scanLockRef.current) return;
                scanLockRef.current = true;
                if (navigator.vibrate) navigator.vibrate(200);
                setLastScanned(decodedText);
                onScanSuccess(decodedText);

                setTimeout(() => {
                    setLastScanned(null);
                    scanLockRef.current = false;
                }, 1500);
            },
            (errorMessage) => { }
        );
        return () => {
            try { scanner.clear(); } catch (e) { console.log("Scanner cleanup", e) }
        }
    }, [onClose, onScanSuccess]);

    return (
        <div className="fixed inset-0 z-[80] bg-black/80 flex flex-col items-center justify-center p-4">
            <div className="bg-white p-4 rounded-3xl w-full max-w-sm relative">
                <button onClick={onClose} className="absolute top-2 right-2 p-2 bg-gray-100 rounded-full text-gray-600"><X size={20} /></button>
                <h3 className="font-bold text-center mb-4">Scan Barcode Barang</h3>
                <div className="relative">
                    <div id="reader" className="w-full rounded-xl overflow-hidden"></div>
                    {lastScanned && (
                        <div className="absolute inset-0 flex items-center justify-center bg-green-500/80 z-20 animate-fade-in backdrop-blur-sm">
                            <div className="text-white text-center">
                                <CheckCircle size={48} className="mx-auto mb-2" />
                                <h4 className="font-bold text-xl">Berhasil!</h4>
                                <p className="text-sm">{lastScanned}</p>
                            </div>
                        </div>
                    )}
                </div>
                <p className="text-center text-xs text-gray-500 mt-4">Arahkan kamera ke barcode barang.</p>
            </div>
        </div>
    );
}