
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
                        onCodeScanned(result.getText());
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
    }, [onCodeScanned, disabled]);

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
                    className="w-full flex items-center justify-center gap-2 bg-purple-600 text-white font-bold py-2 px-4 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition disabled:bg-gray-400"
                >
                    <CameraIcon />
                    {isCameraActive ? 'إيقاف الكاميرا' : 'تفعيل الكاميرا'}
                </button>
                <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${isCameraActive ? 'grid-rows-[1fr] mt-4' : 'grid-rows-[0fr]'}`}>
                    <div className="overflow-hidden">
                       <div className="border-4 border-purple-400 rounded-lg aspect-video">
                            <video ref={videoRef} className="w-full h-full object-cover" playsInline autoPlay muted />
                       </div>
                    </div>
                </div>
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
                        className="w-full pl-3 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition disabled:bg-gray-200 dark:disabled:bg-gray-700"
                    />
                </div>
            </div>
        </div>
    );
};

export default Scanner;
