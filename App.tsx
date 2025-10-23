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
            showToast(`تمت إضافة: ${code}`);
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
            <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-800 p-4">
                <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-lg shadow-xl p-8 text-center">
                    <h1 className="text-2xl font-bold mb-4 text-teal-600 dark:text-teal-400">برنامج جرد المنتجات</h1>
                    <p className="mb-6 text-gray-600 dark:text-gray-300">الرجاء إدخال اسم الفاتورة أو الجلسة للبدء.</p>
                    <input
                        type="text"
                        value={tempInvoiceName}
                        onChange={(e) => setTempInvoiceName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSetInvoiceName()}
                        placeholder="مثال: فاتورة المورد س"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition"
                        autoFocus
                    />
                    <button
                        onClick={handleSetInvoiceName}
                        className="w-full mt-4 bg-teal-600 text-white font-bold py-2 px-4 rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition disabled:bg-gray-400"
                        disabled={!tempInvoiceName.trim()}
                    >
                        بدء الجرد
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 font-sans">
            {toastMessage && <Toast message={toastMessage} />}
            <header className="mb-6 flex flex-wrap justify-between items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
                <div>
                    <h1 className="text-3xl font-bold text-teal-600 dark:text-teal-400">برنامج جرد المنتجات</h1>
                    <p className="text-gray-600 dark:text-gray-300">فاتورة: <span className="font-semibold">{invoiceName}</span></p>
                </div>
                <div className="flex items-center gap-2">
                     <button
                        onClick={() => setSoundEnabled(prev => !prev)}
                        className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-300"
                        title={soundEnabled ? 'إيقاف الصوت' : 'تشغيل الصوت'}
                        aria-label={soundEnabled ? 'إيقاف الصوت' : 'تشغيل الصوت'}
                    >
                        {soundEnabled ? <SoundOnIcon /> : <SoundOffIcon />}
                    </button>
                    <button
                        onClick={() => setVibrationEnabled(prev => !prev)}
                        className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-300"
                        title={vibrationEnabled ? 'إيقاف الاهتزاز' : 'تشغيل الاهتزاز'}
                        aria-label={vibrationEnabled ? 'إيقاف الاهتزاز' : 'تشغيل الاهتزاز'}
                    >
                        {vibrationEnabled ? <VibrationOnIcon /> : <VibrationOffIcon />}
                    </button>
                    <div className="border-l h-6 border-gray-300 dark:border-gray-600 mx-2"></div>
                    <button
                        onClick={() => {
                            if (window.confirm('هل تريد تغيير اسم الفاتورة؟ سيتم الاحتفاظ بالبيانات الممسوحة.')) {
                                setInvoiceName('');
                            }
                        }}
                        className="text-sm text-blue-600 hover:underline dark:text-blue-400"
                    >
                        تغيير اسم الفاتورة
                    </button>
                </div>
            </header>

            <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 flex flex-col gap-6">
                    <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-md">
                        <h2 className="text-xl font-semibold mb-3 border-b pb-2 border-gray-200 dark:border-gray-700">1. تحميل الملف</h2>
                        <FileUpload onFileLoaded={handleFileLoaded} onError={handleFileError} />
                        {error && <p className="mt-3 text-red-500 text-sm">{error}</p>}
                    </div>

                    <div className={`bg-white dark:bg-gray-800 p-5 rounded-lg shadow-md transition-opacity duration-500 ${excelData.length > 0 ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                        <h2 className="text-xl font-semibold mb-3 border-b pb-2 border-gray-200 dark:border-gray-700">2. مسح أو إدخال الباركود</h2>
                        <Scanner onCodeScanned={handleCodeProcess} disabled={excelData.length === 0} />
                    </div>
                </div>

                <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-5 rounded-lg shadow-md">
                    <div className="flex justify-between items-center mb-3 border-b pb-2 border-gray-200 dark:border-gray-700">
                        <h2 className="text-xl font-semibold">العناصر الممسوحة ({scannedItems.length})</h2>
                        <div className="flex gap-2">
                           <button onClick={handleExport} className="flex items-center gap-2 bg-green-600 text-white text-sm font-bold py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition disabled:bg-gray-400" disabled={scannedItems.length === 0}>
                                <ExportIcon />
                                تصدير
                            </button>
                            <button onClick={handleClearAll} className="bg-red-600 text-white text-sm font-bold py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition disabled:bg-gray-400" disabled={scannedItems.length === 0}>
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
                                    placeholder="🔍 بحث (باركود، اسم، لون، مقاس)..."
                                    className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition"
                                />
                                {searchQuery && (
                                    <button 
                                        onClick={() => setSearchQuery('')}
                                        className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                        title="مسح البحث"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                    
                    {searchQuery && filteredItems.length === 0 ? (
                        <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                            <p className="text-lg">❌ لا توجد نتائج مطابقة.</p>
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