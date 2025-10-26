import React, { useState, useRef, useEffect, useCallback } from 'react';
import { CameraIcon, BarcodeIcon } from './Icons';

// Declare ZXing as a global variable from CDN script
declare var ZXing: any;

interface ScannerProps {
    onCodeScanned: (code: string) => void;
    disabled: boolean;
}

const Scanner: React.FC<ScannerProps> = ({ onCodeScanned, disabled }) => {
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [detectedCode, setDetectedCode] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const codeReaderRef = useRef<any>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Focus the input when the component is enabled and the camera is not active.
        if (!disabled && !isCameraActive) {
            inputRef.current?.focus();
        }
    }, [disabled, isCameraActive]);

    const stopCamera = useCallback(() => {
        if (codeReaderRef.current) {
            codeReaderRef.current.reset();
            codeReaderRef.current = null;
        }
        setIsCameraActive(false);
        setDetectedCode(null);
    }, []);

    const startCamera = useCallback(async () => {
        if (disabled) return;

        try {
            if (typeof ZXing === 'undefined') {
                alert('مكتبة المسح الضوئي لم يتم تحميلها.');
                return;
            }

            const codeReader = new ZXing.BrowserMultiFormatReader();
            codeReaderRef.current = codeReader;

            const videoInputDevices = await codeReader.listVideoInputDevices();
            
            if (videoInputDevices.length === 0) {
                alert('لم يتم العثور على كاميرا. الرجاء التأكد من توصيل كاميرا ومنح الأذونات اللازمة.');
                setIsCameraActive(false);
                return;
            }

            const rearCamera = videoInputDevices.find(device => /back|rear|environment/i.test(device.label));
            const deviceId = rearCamera ? rearCamera.deviceId : videoInputDevices[0].deviceId;

            if (videoRef.current) {
                setIsCameraActive(true);
                codeReader.decodeFromVideoDevice(deviceId, videoRef.current, (result, err) => {
                    if (result) {
                        setDetectedCode(result.getText());
                    }
                    if (err && !(err instanceof ZXing.NotFoundException)) {
                        console.error('Barcode scan error:', err);
                    }
                });
            }
        } catch (err) {
            console.error('Error initializing camera:', err);
            alert('لا يمكن الوصول إلى الكاميرا. الرجاء التأكد من منح الأذونات اللازمة.');
            setIsCameraActive(false);
        }
    }, [disabled]);

    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, [stopCamera]);

    const handleToggleCamera = () => {
        if (isCameraActive) {
            stopCamera();
        } else {
            startCamera();
        }
    };

    const handleAddDetectedCode = () => {
        if (detectedCode) {
            onCodeScanned(detectedCode);
            setDetectedCode(null);
        }
    };

    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const code = e.currentTarget.value.trim();
            if (code) {
                onCodeScanned(code);
                e.currentTarget.value = '';
            }
        }
    };

    return (
        <div className="space-y-4">
            <div>
                <button
                    onClick={handleToggleCamera}
                    disabled={disabled}
                    className="w-full flex items-center justify-center gap-2 bg-[#00ff9d]/20 text-[#00ff9d] font-bold py-3 px-4 rounded-xl border border-[#00ff9d] hover:bg-[#00ff9d] hover:text-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#111113] focus:ring-[#00ff9d] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed glow-on-hover"
                >
                    <CameraIcon />
                    {isCameraActive ? 'إيقاف الكاميرا' : 'تفعيل الكاميرا'}
                </button>
                <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${isCameraActive ? 'grid-rows-[1fr] mt-4' : 'grid-rows-[0fr]'}`}>
                    <div className="overflow-hidden">
                       <div className="border-2 border-[#00ff9d]/50 rounded-xl aspect-video bg-black">
                            <video ref={videoRef} className="w-full h-full object-cover" playsInline autoPlay muted />
                       </div>
                    </div>
                </div>

                {isCameraActive && (
                    <div className="mt-4 text-center space-y-3">
                        <div>
                             <p className="text-sm text-gray-400 h-5">
                                {detectedCode ? 'الكود المكتشف:' : 'وجه الكاميرا نحو الباركود...'}
                            </p>
                            <p className="font-mono text-2xl text-white h-8 my-1 tracking-wider">{detectedCode || ' '}</p>
                        </div>
                        <button
                            onClick={handleAddDetectedCode}
                            disabled={!detectedCode}
                            className="w-full flex items-center justify-center gap-2 bg-green-500/20 text-green-400 font-bold py-3 px-4 rounded-xl border border-green-500 hover:enabled:bg-green-500 hover:enabled:text-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#111113] focus:ring-green-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <BarcodeIcon />
                            إضافة الكود
                        </button>
                    </div>
                )}
            </div>

            <div>
                 <label htmlFor="barcodeInput" className="sr-only">امسح الباركود هنا أو أدخله يدويًا...</label>
                 <div className="relative">
                     <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                       <BarcodeIcon />
                    </span>
                    <input
                        id="barcodeInput"
                        ref={inputRef}
                        type="text"
                        onKeyDown={handleInputKeyDown}
                        placeholder={isCameraActive ? 'الكاميرا نشطة...' : 'امسح الباركود هنا أو أدخله يدويًا...'}
                        disabled={disabled || isCameraActive}
                        dir="ltr"
                        className="w-full pl-3 pr-10 py-3 border border-[#1a1a1d] rounded-xl bg-[#0b0b0c] text-gray-200 focus:ring-2 focus:ring-[#00ff9d] focus:border-[#00ff9d] outline-none transition-all duration-200 disabled:bg-[#0b0b0c]/50 disabled:cursor-not-allowed"
                    />
                </div>
            </div>
        </div>
    );
};

export default Scanner;