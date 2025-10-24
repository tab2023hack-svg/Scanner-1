import React from 'react';
import type { ScannedItem } from '../types';
import { TrashIcon } from './Icons';

interface ScannedItemsTableProps {
    items: ScannedItem[];
    onDelete: (timestamp: Date) => void;
}

const ScannedItemsTable: React.FC<ScannedItemsTableProps> = ({ items, onDelete }) => {
    if (items.length === 0) {
        return (
            <div className="text-center py-10 text-gray-500">
                <p>لم يتم مسح أي عناصر بعد.</p>
                <p className="text-sm mt-1">ابدأ باستخدام الكاميرا أو الإدخال اليدوي.</p>
            </div>
        );
    }
    
    return (
        <div className="overflow-x-auto max-h-[60vh] relative border border-[#1a1a1d] rounded-xl">
            <table className="w-full text-sm text-right text-gray-400">
                <thead className="text-xs text-gray-300 uppercase bg-[#1a1a1d] sticky top-0">
                    <tr>
                        <th scope="col" className="px-4 py-3">#</th>
                        <th scope="col" className="px-6 py-3">الباركود</th>
                        <th scope="col" className="px-6 py-3">الاسم/الكود</th>
                        <th scope="col" className="px-6 py-3">المقاس</th>
                        <th scope="col" className="px-6 py-3">اللون</th>
                        <th scope="col" className="px-6 py-3">الوقت</th>
                        <th scope="col" className="px-4 py-3"></th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, index) => (
                        <tr key={item.timestamp.getTime()} className="border-b border-[#1a1a1d] hover:bg-[#1a1a1d]/50 transition-colors duration-200">
                            <td className="px-4 py-3 font-medium text-gray-200">{items.length - index}</td>
                            <td className="px-6 py-3 font-mono text-base text-[#00ff9d]">{item.barcode}</td>
                            <td className="px-6 py-3">{item.model}</td>
                            <td className="px-6 py-3">{item.size}</td>
                            <td className="px-6 py-3">{item.color}</td>
                            <td className="px-6 py-3 text-xs">{item.timestamp.toLocaleTimeString('ar-EG')}</td>
                            <td className="px-4 py-3">
                                <button onClick={() => onDelete(item.timestamp)} className="text-red-500/80 hover:text-red-500 transition-colors duration-200">
                                    <TrashIcon />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ScannedItemsTable;
