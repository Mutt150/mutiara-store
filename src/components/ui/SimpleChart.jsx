import React, { useMemo } from 'react';
import { formatCurrency } from '../../utils/helpers';

export default function SimpleChart({ data }) {
    const chartData = useMemo(() => {
        const last7Days = [];
        const today = new Date();
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const dateStr = d.toLocaleDateString('id-ID'); 
            const labelStr = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
            const dailyRevenue = data.filter(o => {
                let orderDateObj;
                if (o.date && o.date.seconds) orderDateObj = new Date(o.date.seconds * 1000);
                else if (o.date) orderDateObj = new Date(o.date);
                else return false;
                return orderDateObj.toLocaleDateString('id-ID') === dateStr;
            }).reduce((sum, o) => sum + (o.financials?.revenue || 0), 0);
            last7Days.push({ label: labelStr, value: dailyRevenue });
        }
        return last7Days;
    }, [data]);

    const maxValue = Math.max(...chartData.map(d => d.value), 100000);

    return (
        <div className="h-48 flex items-end justify-between gap-2 pt-6">
            {chartData.map((d, i) => (
                <div key={i} className="flex flex-col items-center gap-1 flex-1 group relative h-full justify-end">
                    <div className="absolute -top-8 bg-gray-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                        {formatCurrency(d.value)}
                    </div>
                    <div className="w-full bg-pink-200 rounded-t-lg hover:bg-pink-500 transition-all duration-500 relative overflow-hidden min-h-[4px]" style={{ height: `${(d.value / maxValue) * 100}%` }}>
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-pink-300 opacity-50"></div>
                    </div>
                    <span className="text-[10px] text-gray-400 font-medium truncate w-full text-center">{d.label}</span>
                </div>
            ))}
        </div>
    );
}