import React, { useRef } from 'react';
import type { ExcelRow } from '../types';
import { UploadIcon } from './Icons';

// Declare XLSX as a global variable from CDN script
declare var XLSX: any;

interface FileUploadProps {
    onFileLoaded: (data: ExcelRow[]) => void;
    onError: (error: string) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileLoaded, onError }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary', codepage: 1256, raw: false });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData: ExcelRow[] = XLSX.utils.sheet_to_json(worksheet, { header: "A", raw: false, defval: "" });

                if (jsonData.length > 0) {
                    const firstRowKeys = Object.keys(jsonData[0]);
                    if (!firstRowKeys.includes('I')) {
                        onError("الملف المحمل لا يحتوي على العمود 'I' المطلوب للباركود.");
                        return;
                    }
                } else {
                    onError("الملف فارغ أو لا يمكن قراءته.");
                    return;
                }
                
                onFileLoaded(jsonData);
            } catch (err) {
                console.error(err);
                onError('حدث خطأ أثناء قراءة الملف. تأكد من أنه ملف Excel صالح.');
            }
        };
        reader.onerror = () => {
             onError('فشل في قراءة الملف.');
        }
        reader.readAsBinaryString(file);
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".xlsx, .xls, .csv"
            />
            <button
                onClick={handleClick}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition"
            >
                <UploadIcon />
                اختر ملف Excel
            </button>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                يجب أن يحتوي الملف على الأعمدة F, G, H, I.
            </p>
        </div>
    );
};

export default FileUpload;