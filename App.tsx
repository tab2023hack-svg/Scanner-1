import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { ScannedItem, ExcelRow } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import FileUpload from './components/FileUpload';
import Scanner from './components/Scanner';
import ScannedItemsTable from './components/ScannedItemsTable';
import Toast from './components/Toast';
import { ExportIcon, SoundOnIcon, SoundOffIcon, SearchIcon, VibrationOnIcon, VibrationOffIcon } from './components/Icons';
import Statistics from './components/Statistics';

// Declare XLSX and ZXing as global variables from CDN scripts
declare var XLSX: any;
declare var ZXing: any;

const App: React.FC = () => {
    const [invoiceName, setInvoiceName] = useLocalStorage<string>('invoiceName', '');
    const [tempInvoiceName, setTempInvoiceName] = useState<string>('');
    const [excelData, setExcelData] = useState<ExcelRow[]>([]);
    const [scannedItems, setScannedItems] = useLocalStorage<ScannedItem[]>('scannedItems', []);
    const [isInitialized, setIsInitialized] = useState<boolean>(false);
    const [soundEnabled, setSoundEnabled] = useLocalStorage<boolean>('soundEnabled', true);
    const [vibrationEnabled, setVibrationEnabled] = useLocalStorage<boolean>('vibrationEnabled', true);
    const [searchQuery, setSearchQuery] = useState<string>('');

    const [error, setError] = useState<string | null>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const barcodeBuffer = useRef<string>('');
    const barcodeTimeoutRef = useRef<number | null>(null);

    const filteredItems = useMemo(() => {
        const lowerCaseQuery = searchQuery.toLowerCase().trim();
        if (!lowerCaseQuery) {
            return scannedItems;
        }
        return scannedItems.filter(item => 
            item.barcode.toLowerCase().includes(lowerCaseQuery) ||
            item.model.toLowerCase().includes(lowerCaseQuery) ||
            item.size.toLowerCase().includes(lowerCaseQuery) ||
            item.color.toLowerCase().includes(lowerCaseQuery)
        );
    }, [scannedItems, searchQuery]);

    useEffect(() => {
        setIsInitialized(true);
    }, []);

    const showToast = (message: string) => {
        setToastMessage(message);
        setTimeout(() => setToastMessage(null), 3000);
    };
    
    const playSuccessFeedback = useCallback(() => {
        if (soundEnabled) {
            try {
                const audio = new Audio("https://github.com/tab2023hack-svg/sound-beeb/raw/refs/heads/main/beeb.mp3");
                audio.play().catch(err => console.error("خطأ أثناء تشغيل الصوت:", err));
            } catch(err) {
                console.error("فشل في إنشاء عنصر الصوت:", err);
            }
        }

        if (vibrationEnabled && navigator.vibrate) {
            navigator.vibrate(200);
        }
    }, [soundEnabled, vibrationEnabled]);


    const handleFileLoaded = (data: ExcelRow[]) => {
        setExcelData(data);
        setError(null);
        showToast('تم تحميل ملف Excel بنجاح.');
    };

    const handleFileError = (errorMessage: string) => {
        setError(errorMessage);
        setExcelData([]);
    };

    const handleCodeProcess = useCallback((code: string) => {
        if (!code) return;

        const foundRow = excelData.find(row => row['I']?.toString().trim() === code.trim());
        
        if (foundRow) {
            playSuccessFeedback();
            const newItem: ScannedItem = {
                barcode: code,
                model: foundRow['H'] || 'غير متوفر',
                size: foundRow['G'] || 'غير متوفر',
                color: foundRow['F'] || 'غير متوفر',
                timestamp: new Date(),
            };
            setScannedItems(prev => [newItem, ...prev]);
            showToast(`تمت إضافة: ${code} - ${newItem.model}`);
        } else {
            const confirmAdd = window.confirm(`الكود "${code}" غير موجود في الملف. هل تريد إضافته يدويًا؟`);
            if (confirmAdd) {
                playSuccessFeedback();
                const newItem: ScannedItem = {
                    barcode: code,
                    model: 'إدخال يدوي',
                    size: '-',
                    color: '-',
                    timestamp: new Date(),
                };
                setScannedItems(prev => [newItem, ...prev]);
                showToast(`تمت إضافة الكود يدويًا: ${code}`);
            }
        }
    }, [excelData, setScannedItems, playSuccessFeedback]);

    const handleGlobalKeyDown = useCallback((e: KeyboardEvent) => {
        if (!invoiceName || excelData.length === 0) {
            return;
        }

        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'BUTTON') {
            return;
        }

        if (e.key === 'Enter') {
            e.preventDefault();
            if (barcodeBuffer.current.length > 0) {
                handleCodeProcess(barcodeBuffer.current);
                barcodeBuffer.current = '';
            }
            return;
        }

        if (e.key.length > 1) {
            return;
        }

        barcodeBuffer.current += e.key;

        if (barcodeTimeoutRef.current) {
            clearTimeout(barcodeTimeoutRef.current);
        }

        barcodeTimeoutRef.current = window.setTimeout(() => {
            barcodeBuffer.current = '';
        }, 100);
    }, [invoiceName, excelData, handleCodeProcess]);

    useEffect(() => {
        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => {
            window.removeEventListener('keydown', handleGlobalKeyDown);
            if (barcodeTimeoutRef.current) {
                clearTimeout(barcodeTimeoutRef.current);
            }
        };
    }, [handleGlobalKeyDown]);

    const handleDeleteItem = (timestamp: Date) => {
        setScannedItems(prev => prev.filter(item => item.timestamp.getTime() !== timestamp.getTime()));
    };

    const handleClearAll = () => {
        if (window.confirm('هل أنت متأكد من رغبتك في مسح كل العناصر؟')) {
            setScannedItems([]);
            showToast('تم مسح جميع العناصر.');
        }
    };

    const handleExport = () => {
        if (scannedItems.length === 0) {
            alert('لا توجد بيانات لتصديرها.');
            return;
        }

        const content = scannedItems.map(item => item.barcode).join('\n');
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });

        const now = new Date();
        const timestamp = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}`;
        const filename = `${invoiceName || 'جرد'}_${timestamp}.txt`;

        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('تم تصدير الملف بنجاح.');
    };

    const handleSetInvoiceName = () => {
        if (tempInvoiceName.trim()) {
            setInvoiceName(tempInvoiceName.trim());
        }
    }

    if (!isInitialized) {
        return null; // or a loading spinner
    }

    if (!invoiceName) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0b0b0c] p-4 font-cairo">
                <div className="w-full max-w-md bg-[#111113] border border-[#1a1a1d] rounded-xl p-8 text-center">
                    <h1 className="text-3xl font-bold mb-4 text-[#00ff9d]">برنامج جرد المنتجات</h1>
                    <p className="mb-6 text-gray-400">الرجاء إدخال اسم الفاتورة أو الجلسة للبدء.</p>
                    <input
                        type="text"
                        value={tempInvoiceName}
                        onChange={(e) => setTempInvoiceName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSetInvoiceName()}
                        placeholder="مثال: فاتورة المورد س"
                        className="w-full px-4 py-3 border border-[#1a1a1d] rounded-xl bg-[#0b0b0c] text-gray-200 focus:ring-2 focus:ring-[#00ff9d] focus:border-[#00ff9d] outline-none transition-all duration-200"
                        autoFocus
                    />
                    <button
                        onClick={handleSetInvoiceName}
                        className="w-full mt-4 bg-[#00ff9d]/20 text-[#00ff9d] font-bold py-3 px-4 rounded-xl border border-[#00ff9d] hover:bg-[#00ff9d] hover:text-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0b0b0c] focus:ring-[#00ff9d] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed glow-on-hover"
                        disabled={!tempInvoiceName.trim()}
                    >
                        بدء الجرد
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8 font-sans">
            {toastMessage && <Toast message={toastMessage} />}
            <header className="mb-6 flex flex-wrap justify-between items-center gap-4 bg-[#111113] border border-[#1a1a1d] p-4 rounded-xl">
                <div>
                    <h1 className="text-3xl font-bold text-[#00ff9d] font-cairo">برنامج جرد المنتجات</h1>
                    <p className="text-gray-400">فاتورة: <span className="font-semibold text-gray-200">{invoiceName}</span></p>
                </div>
                <div className="flex items-center gap-2">
                     <button
                        onClick={() => setSoundEnabled(prev => !prev)}
                        className={`p-2 rounded-full transition-all duration-200 ${soundEnabled ? 'text-[#00ff9d] shadow-[0_0_10px_0_rgba(0,255,157,0.5)]' : 'text-gray-400 hover:text-white'} hover:bg-[#1a1a1d]`}
                        title={soundEnabled ? 'إيقاف الصوت' : 'تشغيل الصوت'}
                        aria-label={soundEnabled ? 'إيقاف الصوت' : 'تشغيل الصوت'}
                    >
                        {soundEnabled ? <SoundOnIcon /> : <SoundOffIcon />}
                    </button>
                    <button
                        onClick={() => setVibrationEnabled(prev => !prev)}
                        className={`p-2 rounded-full transition-colors duration-200 ${vibrationEnabled ? 'text-[#00ff9d]' : 'text-gray-400 hover:text-white'} hover:bg-[#1a1a1d]`}
                        title={vibrationEnabled ? 'إيقاف الاهتزاز' : 'تشغيل الاهتزاز'}
                        aria-label={vibrationEnabled ? 'إيقاف الاهتزاز' : 'تشغيل الاهتزاز'}
                    >
                        {vibrationEnabled ? <VibrationOnIcon /> : <VibrationOffIcon />}
                    </button>
                    <div className="border-l h-6 border-[#1a1a1d] mx-2"></div>
                    <button
                        onClick={() => {
                            if (window.confirm('هل تريد تغيير اسم الفاتورة؟ سيتم الاحتفاظ بالبيانات الممسوحة.')) {
                                setInvoiceName('');
                            }
                        }}
                        className="text-sm text-gray-400 hover:text-[#00ff9d] transition-colors duration-200"
                    >
                        تغيير اسم الفاتورة
                    </button>
                </div>
            </header>

            <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 flex flex-col gap-6">
                    <div className="bg-[#111113] border border-[#1a1a1d] p-6 rounded-xl">
                        <h2 className="text-xl font-semibold mb-4 border-b pb-3 border-[#1a1a1d]">1. تحميل الملف</h2>
                        <FileUpload onFileLoaded={handleFileLoaded} onError={handleFileError} />
                        {error && <p className="mt-3 text-red-500 text-sm">{error}</p>}
                    </div>

                    <div className={`bg-[#111113] border border-[#1a1a1d] p-6 rounded-xl transition-opacity duration-300 ${excelData.length > 0 ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                        <h2 className="text-xl font-semibold mb-4 border-b pb-3 border-[#1a1a1d]">2. مسح أو إدخال الباركود</h2>
                        <Scanner onCodeScanned={handleCodeProcess} disabled={excelData.length === 0} />
                    </div>
                </div>

                <div className="lg:col-span-2 bg-[#111113] border border-[#1a1a1d] p-6 rounded-xl">
                    <div className="flex flex-wrap gap-4 justify-between items-center mb-4 border-b pb-3 border-[#1a1a1d]">
                        <h2 className="text-xl font-semibold">العناصر الممسوحة ({scannedItems.length})</h2>
                        <div className="flex gap-2">
                           <button onClick={handleExport} className="glow-on-hover flex items-center gap-2 bg-[#00ff9d]/20 text-[#00ff9d] text-sm font-bold py-2 px-4 rounded-xl border border-[#00ff9d] hover:bg-[#00ff9d] hover:text-black transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#00ff9d]/20 disabled:hover:text-[#00ff9d] disabled:hover:shadow-none" disabled={scannedItems.length === 0}>
                                <ExportIcon />
                                تصدير
                            </button>
                            <button onClick={handleClearAll} className="flex items-center gap-2 bg-red-500/10 text-red-400 text-sm font-bold py-2 px-4 rounded-xl border border-red-500/50 hover:bg-red-500/20 hover:text-red-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed" disabled={scannedItems.length === 0}>
                                مسح الكل
                            </button>
                        </div>
                    </div>

                    {scannedItems.length > 0 && (
                        <div className="mb-4">
                            <div className="relative">
                                <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                    <SearchIcon />
                                </span>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="بحث (باركود، اسم، لون، مقاس)..."
                                    className="w-full pl-3 pr-10 py-2 border border-[#1a1a1d] rounded-xl bg-[#0b0b0c] text-gray-200 focus:ring-2 focus:ring-[#00ff9d] focus:border-[#00ff9d] outline-none transition-all duration-200"
                                />
                                {searchQuery && (
                                    <button 
                                        onClick={() => setSearchQuery('')}
                                        className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 hover:text-gray-200"
                                        title="مسح البحث"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                    
                    {searchQuery && filteredItems.length === 0 ? (
                        <div className="text-center py-10 text-gray-500">
                            <p className="text-lg">❌ لا توجد نتائج مطابقة للبحث.</p>
                        </div>
                    ) : (
                        <ScannedItemsTable items={filteredItems} onDelete={handleDeleteItem} />
                    )}

                    <Statistics items={scannedItems} />
                </div>
            </main>
        </div>
    );
};

export default App;
