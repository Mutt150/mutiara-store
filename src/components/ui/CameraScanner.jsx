import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, CheckCircle, ScanLine, ZoomIn, RefreshCw, AlertCircle } from 'lucide-react';

/**
 * CameraScanner — Native BarcodeDetector + ZXing Fallback
 * Menggunakan Native Barcode API milik Chrome/Android yang sangat cepat,
 * lalu mundur ke ZXing untuk browser lain (iOS/Safari) dengan canvas scaling.
 */

const CAMERA_FALLBACKS = [
    { video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false },
    { video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false },
    { video: { facingMode: 'environment' }, audio: false },
    { video: true, audio: false },
];

export default function CameraScanner({ onScanSuccess, onClose }) {
    const [status, setStatus]       = useState('starting');
    const [errorMsg, setErrorMsg]   = useState('');
    const [lastScanned, setLastScanned] = useState('');
    const [scanCount, setScanCount] = useState(0);
    const [torchOn, setTorchOn]     = useState(false);
    const [torchSupported, setTorchSupported] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(1);
    const [zoomRange, setZoomRange] = useState({ min: 1, max: 3 });
    const [zoomSupported, setZoomSupported] = useState(false);
    const [focusRipple, setFocusRipple] = useState(null);

    const videoRef    = useRef(null);
    const canvasRef   = useRef(null);
    const containerRef = useRef(null);
    const streamRef   = useRef(null);
    const readerRef   = useRef(null);
    const rafRef      = useRef(null);
    const scanLockRef = useRef(false);
    const mountedRef  = useRef(true);

    // ── Bersihkan semua resource ─────────────────────────────────────────────
    const cleanup = useCallback(() => {
        mountedRef.current = false;
        if (rafRef.current) {
            clearTimeout(rafRef.current);
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        }
        if (readerRef.current) {
            try { readerRef.current.reset(); } catch (_) {}
            readerRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    }, []);

    // ── Buka kamera dengan fallback ──────────────────────────────────────────
    const openCamera = useCallback(async () => {
        for (const constraint of CAMERA_FALLBACKS) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia(constraint);
                return stream;
            } catch (err) {
                const msg = (err?.message || '').toLowerCase();
                if (msg.includes('denied') || msg.includes('notallowed') || msg.includes('permission')) {
                    throw err;
                }
            }
        }
        throw new Error('Kamera tidak dapat dibuka.');
    }, []);

    // ── Loop decode cerdas (Native API + Canvas ZXing Fallback) ──────────────
    const startDecodeLoop = useCallback((reader) => {
        const video  = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
        // 1. Persiapkan Native BarcodeDetector jika didukung (Sangat cepat & akurat)
        let nativeDetector = null;
        if ('BarcodeDetector' in window) {
            try {
                nativeDetector = new window.BarcodeDetector({
                    formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'itf']
                });
            } catch (e) {
                console.warn("Native BarcodeDetector format not supported", e);
            }
        }

        let isDecoding = false;

        const handleSuccess = (text) => {
            scanLockRef.current = true;
            if (navigator.vibrate) navigator.vibrate([80, 40, 80]);
            if (mountedRef.current) {
                setLastScanned(text);
                setStatus('success');
                setScanCount(n => n + 1);
            }
            onScanSuccess(text);

            setTimeout(() => {
                if (mountedRef.current) {
                    setStatus('scanning');
                    scanLockRef.current = false;
                    // Lanjutkan loop scan setelah sukses
                    rafRef.current = requestAnimationFrame(tick);
                }
            }, 1800);
        };

        const tick = async () => {
            if (!mountedRef.current) return;

            if (video.readyState >= 2 && !video.paused && !scanLockRef.current && !isDecoding) {
                isDecoding = true;
                
                try {
                    // PRIORITAS 1: Gunakan Native API (Instan & Anti-noise)
                    if (nativeDetector) {
                        const barcodes = await nativeDetector.detect(video);
                        if (barcodes.length > 0 && !scanLockRef.current) {
                            handleSuccess(barcodes[0].rawValue);
                            isDecoding = false;
                            return; // Stop current loop execution
                        }
                    }

                    // PRIORITAS 2: Fallback ke ZXing JS jika Native API gagal/tidak ada
                    const vw = video.videoWidth;
                    const vh = video.videoHeight;

                    if (vw > 0 && vh > 0) {
                        // KUNCI PERBAIKAN: Scale down video ke maks width 640px.
                        // Resolusi kebesaran malah bikin ZXing JS gagal mengenali garis barcode.
                        const maxW = 640;
                        const scale = Math.min(1, maxW / vw);
                        const drawW = Math.floor(vw * scale);
                        const drawH = Math.floor(vh * scale);

                        canvas.width  = drawW;
                        canvas.height = drawH;

                        // Gambar keseluruhan frame yang di-scale
                        ctx.drawImage(video, 0, 0, drawW, drawH);

                        const luminanceSource = new window.ZXing.HTMLCanvasElementLuminanceSource(canvas);
                        const binaryBitmap = new window.ZXing.BinaryBitmap(new window.ZXing.HybridBinarizer(luminanceSource));
                        const result = reader.decode(binaryBitmap);

                        if (result && !scanLockRef.current) {
                            handleSuccess(result.getText());
                            isDecoding = false;
                            return;
                        }
                    }
                } catch (_) {
                    // Ignored (tidak ada barcode / gambar blur)
                }
                isDecoding = false;
            }

            // Loop jalan ~10 FPS, sudah lebih dari cukup dan hemat CPU HP
            rafRef.current = setTimeout(() => {
                if (mountedRef.current) rafRef.current = requestAnimationFrame(tick);
            }, 100); 
        };

        rafRef.current = requestAnimationFrame(tick);
    }, [onScanSuccess]);

    // ── Start scanner utama ──────────────────────────────────────────────────
    const startScanner = useCallback(async () => {
        if (rafRef.current) { clearTimeout(rafRef.current); cancelAnimationFrame(rafRef.current); }
        if (readerRef.current) { try { readerRef.current.reset(); } catch (_) {} }
        if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); }
        
        mountedRef.current = true;
        scanLockRef.current = false;

        setStatus('starting');
        setErrorMsg('');

        const ZXing = window.ZXing;
        if (!ZXing) {
            setStatus('error');
            setErrorMsg('Library ZXing belum dimuat.\nTambahkan script ZXing di index.html.');
            return;
        }

        try {
            const stream = await openCamera();
            streamRef.current = stream;

            const track = stream.getVideoTracks()[0];
            const caps  = track.getCapabilities?.() || {};
            if (caps.torch) setTorchSupported(true);
            if (caps.zoom)  {
                setZoomSupported(true);
                setZoomRange({ min: caps.zoom.min ?? 1, max: Math.min(caps.zoom.max ?? 4, 5) });
            }

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.onloadedmetadata = async () => {
                    try { await videoRef.current.play(); } catch (_) {}

                    try {
                        await track.applyConstraints({
                            advanced: [{ focusMode: 'continuous' }, { exposureMode: 'continuous' }]
                        });
                    } catch (_) {}

                    const hints = new Map();
                    hints.set(ZXing.DecodeHintType.POSSIBLE_FORMATS, [
                        ZXing.BarcodeFormat.EAN_13,
                        ZXing.BarcodeFormat.EAN_8,
                        ZXing.BarcodeFormat.UPC_A,
                        ZXing.BarcodeFormat.UPC_E,
                        ZXing.BarcodeFormat.CODE_128,
                        ZXing.BarcodeFormat.CODE_39,
                    ]);
                    hints.set(ZXing.DecodeHintType.TRY_HARDER, true);

                    const reader = new ZXing.MultiFormatReader();
                    reader.setHints(hints);
                    readerRef.current = reader;

                    if (mountedRef.current) {
                        setStatus('scanning');
                        startDecodeLoop(reader);
                    }
                };
            }

        } catch (err) {
            if (!mountedRef.current) return;
            setStatus('error');
            const msg = (err?.message || '').toLowerCase();
            if (msg.includes('denied') || msg.includes('notallowed') || msg.includes('permission')) {
                setErrorMsg('Izin kamera ditolak.\n\nBuka pengaturan browser → cari izin kamera → izinkan → muat ulang halaman.');
            } else if (msg.includes('notfound') || msg.includes('devicenotfound')) {
                setErrorMsg('Kamera tidak ditemukan.');
            } else if (msg.includes('notreadable') || msg.includes('in use')) {
                setErrorMsg('Kamera sedang digunakan aplikasi lain.\nTutup dulu lalu coba lagi.');
            } else {
                setErrorMsg(`Gagal membuka kamera.\nCoba ganti ke Chrome lalu muat ulang.\n\n(${err?.message})`);
            }
        }
    }, [openCamera, startDecodeLoop]);

    useEffect(() => {
        mountedRef.current = true;
        startScanner();
        return cleanup;
    }, []);

    const handleClose = () => {
        cleanup();
        onClose();
    };

    // ── Tap to focus ─────────────────────────────────────────────────────────
    const handleTap = useCallback(async (e) => {
        if (status !== 'scanning' || !streamRef.current) return;
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;

        const px = e.clientX - rect.left;
        const py = e.clientY - rect.top;

        setFocusRipple({ x: px, y: py, key: Date.now() });

        try {
            const track = streamRef.current.getVideoTracks()[0];
            const caps  = track.getCapabilities?.() || {};
            if (caps.focusMode?.includes?.('manual') && caps.pointsOfInterest) {
                await track.applyConstraints({
                    advanced: [{ focusMode: 'manual', pointsOfInterest: [{ x: px / rect.width, y: py / rect.height }] }],
                });
                setTimeout(async () => {
                    try { await track.applyConstraints({ advanced: [{ focusMode: 'continuous' }] }); } catch (_) {}
                }, 1500);
            } else {
                await track.applyConstraints({ advanced: [{ focusMode: 'continuous' }] });
            }
        } catch (_) {}
    }, [status]);

    // ── Torch ────────────────────────────────────────────────────────────────
    const toggleTorch = useCallback(async () => {
        if (!streamRef.current) return;
        try {
            const next = !torchOn;
            const track = streamRef.current.getVideoTracks()[0];
            await track.applyConstraints({ advanced: [{ torch: next }] });
            setTorchOn(next);
        } catch (_) {}
    }, [torchOn]);

    // ── Zoom ─────────────────────────────────────────────────────────────────
    const handleZoom = useCallback(async (val) => {
        if (!streamRef.current) return;
        const v = parseFloat(val);
        try {
            const track = streamRef.current.getVideoTracks()[0];
            await track.applyConstraints({ advanced: [{ zoom: v }] });
            setZoomLevel(v);
        } catch (_) {}
    }, []);

    return (
        <div className="fixed inset-0 z-[999] bg-black/90 flex items-center justify-center p-3 backdrop-blur-sm">
            <canvas ref={canvasRef} className="hidden"/>

            <div
                className="bg-white rounded-[20px] w-full max-w-sm flex flex-col overflow-hidden shadow-2xl animate-fade-in"
                style={{ maxHeight: '93vh' }}
            >
                <div className="bg-gray-900 px-4 py-3 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-2">
                        <ScanLine size={16} className="text-pink-400"/>
                        <span className="font-bold text-sm text-white">Scan Barcode</span>
                        {scanCount > 0 && (
                            <span className="bg-pink-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                {scanCount}×
                            </span>
                        )}
                    </div>
                    <button onClick={handleClose} className="p-1.5 bg-white/10 text-gray-300 rounded-full hover:bg-red-500 hover:text-white transition-all">
                        <X size={15}/>
                    </button>
                </div>

                <div
                    ref={containerRef}
                    className="relative bg-black overflow-hidden cursor-crosshair"
                    style={{ aspectRatio: '4/3' }}
                    onClick={handleTap}
                >
                    <video ref={videoRef} className="w-full h-full object-cover" playsInline muted autoPlay/>

                    {status === 'scanning' && (
                        <>
                            <div className="absolute inset-0 pointer-events-none" style={{
                                background: 'radial-gradient(ellipse 88% 78% at 50% 50%, transparent 35%, rgba(0,0,0,0.65) 100%)'
                            }}/>
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="relative" style={{ width: '82%', height: 68 }}>
                                    <div className="absolute top-0 left-0  w-5 h-5 border-t-[3px] border-l-[3px] border-pink-400"/>
                                    <div className="absolute top-0 right-0 w-5 h-5 border-t-[3px] border-r-[3px] border-pink-400"/>
                                    <div className="absolute bottom-0 left-0  w-5 h-5 border-b-[3px] border-l-[3px] border-pink-400"/>
                                    <div className="absolute bottom-0 right-0 w-5 h-5 border-b-[3px] border-r-[3px] border-pink-400"/>
                                    <div className="absolute left-2 right-2 h-0.5 bg-pink-400 rounded-full"
                                        style={{ boxShadow: '0 0 10px 3px rgba(244,114,182,0.8)', animation: 'scanline 2s ease-in-out infinite' }}
                                    />
                                    <p className="absolute -bottom-5 left-0 right-0 text-center text-[9px] text-pink-300">
                                        Arahkan barcode ke dalam kotak · Tap untuk fokus
                                    </p>
                                </div>
                            </div>
                        </>
                    )}

                    {focusRipple && (
                        <div key={focusRipple.key} className="absolute pointer-events-none"
                            style={{ left: focusRipple.x - 22, top: focusRipple.y - 22, width: 44, height: 44 }}
                        >
                            <div className="w-full h-full rounded-full border-2 border-yellow-400 animate-ping opacity-80"
                                style={{ boxShadow: '0 0 8px rgba(250,204,21,0.5)' }}
                            />
                        </div>
                    )}

                    {status === 'starting' && (
                        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-3 z-10">
                            <div className="w-9 h-9 border-2 border-pink-400 border-t-transparent rounded-full animate-spin"/>
                            <p className="text-white text-xs">Membuka kamera...</p>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="absolute inset-0 bg-green-600/95 flex flex-col items-center justify-center gap-2 z-20 animate-fade-in">
                            <CheckCircle size={52} className="text-white animate-bounce"/>
                            <p className="text-white font-bold text-xl">Terbaca!</p>
                            <p className="text-green-100 text-xs font-mono bg-green-700/50 px-3 py-1.5 rounded-lg break-all max-w-[85%] text-center">{lastScanned}</p>
                            <p className="text-green-200 text-[10px] mt-1">Lanjut scan otomatis...</p>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="absolute inset-0 bg-black/93 flex flex-col items-center justify-center gap-3 z-10 p-5">
                            <AlertCircle size={38} className="text-red-400"/>
                            <p className="text-white text-xs text-center leading-relaxed whitespace-pre-line">{errorMsg}</p>
                            <button onClick={startScanner}
                                className="flex items-center gap-2 px-5 py-2.5 bg-pink-600 text-white text-xs font-bold rounded-xl active:scale-95 transition-all hover:bg-pink-700">
                                <RefreshCw size={13}/> Coba Lagi
                            </button>
                        </div>
                    )}
                </div>

                <div className="bg-gray-900 px-4 py-3 space-y-2 shrink-0">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className={`w-2 h-2 rounded-full shrink-0 ${
                                status === 'scanning' ? 'bg-green-400 animate-pulse' :
                                status === 'success'  ? 'bg-green-400' :
                                status === 'starting' ? 'bg-yellow-400 animate-pulse' : 'bg-red-500'
                            }`}/>
                            <span className="text-[11px] text-gray-300 truncate">
                                {status === 'scanning' ? 'Mendeteksi barcode...' :
                                 status === 'success'  ? `✓ ${lastScanned}` :
                                 status === 'starting' ? 'Membuka kamera...' : 'Error'}
                            </span>
                        </div>
                        {torchSupported && status === 'scanning' && (
                            <button onClick={toggleTorch}
                                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${torchOn ? 'bg-yellow-400 text-gray-900' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}>
                                ⚡ {torchOn ? 'ON' : 'Lampu'}
                            </button>
                        )}
                    </div>

                    {zoomSupported && status === 'scanning' && (
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] text-gray-400 shrink-0">🔍</span>
                            <input type="range" min={zoomRange.min} max={zoomRange.max} step="0.1"
                                value={zoomLevel} onChange={e => handleZoom(e.target.value)}
                                className="flex-1 h-1 accent-pink-500 cursor-pointer"
                            />
                            <span className="text-[10px] text-gray-300 w-8 text-right shrink-0">{zoomLevel.toFixed(1)}×</span>
                        </div>
                    )}

                    <div className="flex items-start gap-2 bg-white/5 rounded-xl p-2.5">
                        <ZoomIn size={12} className="text-blue-400 shrink-0 mt-0.5"/>
                        <p className="text-[10px] text-gray-400 leading-relaxed">
                            <span className="text-white font-semibold">Tips: </span>
                            Jarak ideal 8–15 cm. Tap layar untuk paksa fokus ulang.
                            {zoomSupported && ' Geser zoom untuk barcode kecil.'}
                        </p>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes scanline {
                    0%, 100% { top: 8%;  opacity: 0.4; }
                    50%       { top: 86%; opacity: 1;   }
                }
            `}</style>
        </div>
    );
}