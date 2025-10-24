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
        <div className="mt-6 p-5 bg-black/20 rounded-xl border border-[#1a1a1d]">
            <h3 className="text-xl font-semibold mb-4 border-b pb-2 border-[#1a1a1d]">
                📊 إحصائيات الجرد
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-center">
                <div className="p-4 bg-[#111113] rounded-xl border border-[#1a1a1d]">
                    <p className="text-sm text-gray-400">🧮 إجمالي القطع</p>
                    <p className="text-4xl font-bold text-[#00ff9d]">{stats.totalItems}</p>
                </div>
                <div className="p-4 bg-[#111113] rounded-xl border border-[#1a1a1d]">
                    <p className="text-sm text-gray-400">📦 الأكواد الفريدة</p>
                    <p className="text-4xl font-bold text-[#00ff9d]">{stats.uniqueBarcodesCount}</p>
                </div>
            </div>

            <h4 className="text-lg font-semibold mb-2">ملخص الكميات</h4>
            <div className="overflow-x-auto max-h-60 relative border rounded-xl border-[#1a1a1d]">
                <table className="w-full text-sm text-right text-gray-400">
                    <thead className="text-xs text-gray-300 uppercase bg-[#1a1a1d] sticky top-0">
                        <tr>
                            <th scope="col" className="px-6 py-3">الباركود</th>
                            <th scope="col" className="px-6 py-3">الاسم/الكود</th>
                            <th scope="col" className="px-6 py-3 text-center">الكمية</th>
                        </tr>
                    </thead>
                    <tbody>
                        {stats.summary.map((item) => (
                            <tr key={item.barcode} className="bg-[#111113] border-b border-[#1a1a1d] last:border-b-0 hover:bg-[#1a1a1d]/50 transition-colors duration-200">
                                <td className="px-6 py-2 font-mono text-gray-200">{item.barcode}</td>
                                <td className="px-6 py-2">{item.model}</td>
                                <td className="px-6 py-2 font-bold text-center text-[#00ff9d]">{item.count}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Statistics;
