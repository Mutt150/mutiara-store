import React from 'react';
import { ShoppingBasket } from 'lucide-react';
import { formatCurrency, formatDateShort } from '../../utils/helpers';

export default function ReceiptTemplate({ order }) {
    if (!order) return null;
    return (
        <div id="print-area" className="hidden print:block bg-white text-black font-mono" 
            style={{ width: '58mm', padding: '2mm', boxSizing: 'border-box', fontSize: '10px', lineHeight: '1.2' }}>
            
            <div className="text-center mb-2 border-b border-black border-dashed pb-2">
                <div className="flex justify-center mb-1"><ShoppingBasket size={24} color="black" /></div>
                <h1 className="text-xl font-bold uppercase tracking-wider">MUTIARA STORE</h1>
                <p className="text-[9px] mt-1">Jl. Polowijen 2 No. 469</p>
                <p className="text-[9px]">083834701439 / 081233635650</p>
            </div>

            <div className="mb-2 text-[9px]">
                <div className="flex justify-between"><span>Tgl :</span><span>{formatDateShort(order.date)}</span></div>
                <div className="flex justify-between"><span>Jam :</span><span>{new Date(order.date).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'})}</span></div>
                <div className="flex justify-between"><span>Cust:</span><span className="font-bold">{order.customerName || 'Umum'}</span></div>
                {order.cashierName && <div className="flex justify-between"><span>Kasir:</span><span>{order.cashierName.split('@')[0]}</span></div>}
                <div className="flex justify-between mt-1"><span className="font-bold text-lg">{order.sequentialNumber || `#${order.id.slice(-4).toUpperCase()}`}</span></div>
            </div>

            <div className="border-t border-b border-black border-dashed py-1 mb-2">
                {order.items.map((item, index) => (
                    <div key={index} className="mb-1">
                        <div className="font-bold truncate">{item.name}</div>
                        <div className="flex justify-between">
                            <span>{item.qty} x {formatCurrency(item.price).replace('Rp', '')}</span>
                            <span>{formatCurrency(item.subtotal).replace('Rp', '')}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex flex-col items-end text-[11px] font-bold mb-2">
                <div className="w-full flex justify-between"><span>Total :</span><span>{formatCurrency(order.financials.revenue)}</span></div>
                <div className="w-full flex justify-between text-[9px] font-normal mt-1">
                    <span>Bayar ({order.paymentMethod}):</span>
                    <span>{order.paymentStatus || 'Lunas'}</span>
                </div>
            </div>

            <div className="text-center mt-4 pt-2 border-t border-black border-dashed">
                <p className="text-[10px] font-bold">TERIMA KASIH</p>
                <p className="text-[8px] mt-1">Barang yang sudah dibeli tidak dapat ditukar/dikembalikan.</p>
            </div>
        </div>
    );
}
