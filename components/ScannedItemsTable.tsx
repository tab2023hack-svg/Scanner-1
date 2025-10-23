
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
            <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                <p>لم يتم مسح أي عناصر بعد.</p>
                <p className="text-sm">ابدأ باستخدام الكاميرا أو الإدخال اليدوي.</p>
            </div>
        );
    }
    
    return (
        <div className="overflow-x-auto max-h-[65vh] relative">
            <table className="w-full text-sm text-right text-gray-500 dark:text-gray-400">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-300 sticky top-0">
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
                        <tr key={item.timestamp.getTime()} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                            <td className="px-4 py-4 font-medium text-gray-900 dark:text-white">{items.length - index}</td>
                            <td className="px-6 py-4 font-mono text-base">{item.barcode}</td>
                            <td className="px-6 py-4">{item.model}</td>
                            <td className="px-6 py-4">{item.size}</td>
                            <td className="px-6 py-4">{item.color}</td>
                            <td className="px-6 py-4 text-xs">{item.timestamp.toLocaleTimeString('ar-EG')}</td>
                            <td className="px-4 py-4">
                                <button onClick={() => onDelete(item.timestamp)} className="text-red-500 hover:text-red-700">
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
