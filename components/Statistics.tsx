import React, { useMemo } from 'react';
import type { ScannedItem } from '../types';

interface StatisticsProps {
    items: ScannedItem[];
}

interface SummaryItem {
    barcode: string;
    model: string;
    count: number;
}

const Statistics: React.FC<StatisticsProps> = ({ items }) => {
    const stats = useMemo(() => {
        if (items.length === 0) {
            return {
                totalItems: 0,
                uniqueBarcodesCount: 0,
                summary: [],
            };
        }

        const barcodeCounts = new Map<string, { model: string; count: number }>();
        items.forEach(item => {
            if (barcodeCounts.has(item.barcode)) {
                barcodeCounts.get(item.barcode)!.count++;
            } else {
                barcodeCounts.set(item.barcode, { model: item.model, count: 1 });
            }
        });

        const summary: SummaryItem[] = Array.from(barcodeCounts.entries())
            .map(([barcode, { model, count }]) => ({ barcode, model, count }))
            .sort((a, b) => b.count - a.count);

        return {
            totalItems: items.length,
            uniqueBarcodesCount: barcodeCounts.size,
            summary,
        };
    }, [items]);

    if (items.length === 0) {
        return null; // Don't show stats if there are no items
    }

    return (
        <div className="mt-6 p-5 bg-gray-50 dark:bg-gray-900/50 rounded-lg shadow-inner border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold mb-4 border-b pb-2 border-gray-200 dark:border-gray-700">
                📊 إحصائيات الجرد
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-center">
                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
                    <p className="text-sm text-gray-500 dark:text-gray-400">🧮 إجمالي القطع</p>
                    <p className="text-4xl font-bold text-teal-600 dark:text-teal-400">{stats.totalItems}</p>
                </div>
                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
                    <p className="text-sm text-gray-500 dark:text-gray-400">📦 الأكواد الفريدة</p>
                    <p className="text-4xl font-bold text-purple-600 dark:text-purple-400">{stats.uniqueBarcodesCount}</p>
                </div>
            </div>

            <h4 className="text-lg font-semibold mb-2">ملخص الكميات</h4>
            <div className="overflow-x-auto max-h-60 relative border rounded-md border-gray-200 dark:border-gray-700">
                <table className="w-full text-sm text-right text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-100 dark:bg-gray-700 dark:text-gray-300 sticky top-0">
                        <tr>
                            <th scope="col" className="px-6 py-3">الباركود</th>
                            <th scope="col" className="px-6 py-3">الاسم/الكود</th>
                            <th scope="col" className="px-6 py-3 text-center">الكمية</th>
                        </tr>
                    </thead>
                    <tbody>
                        {stats.summary.map((item) => (
                            <tr key={item.barcode} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                <td className="px-6 py-2 font-mono">{item.barcode}</td>
                                <td className="px-6 py-2">{item.model}</td>
                                <td className="px-6 py-2 font-bold text-center text-gray-900 dark:text-white">{item.count}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Statistics;
