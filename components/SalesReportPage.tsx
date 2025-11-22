import React, { useState, useMemo } from 'react';
import { useClinic } from '../context/ClinicContext';
import { FileText, Download, Calendar, Filter, DollarSign, TrendingUp, Printer, Search } from 'lucide-react';
import { Transaction } from '../types';

const SalesReportPage: React.FC = () => {
  const { transactions, customers, isLoadingData, updateTransaction } = useClinic();
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month' | 'custom'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editingItems, setEditingItems] = useState<{ name: string; price: number; quantity: number }[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];

    // Date filter
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    switch (dateFilter) {
      case 'today':
        filtered = filtered.filter(t => t.date.startsWith(todayStr));
        break;
      case 'week':
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        filtered = filtered.filter(t => new Date(t.date) >= weekAgo);
        break;
      case 'month':
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        filtered = filtered.filter(t => new Date(t.date) >= monthAgo);
        break;
      case 'custom':
        if (startDate && endDate) {
          filtered = filtered.filter(t => {
            const tDate = t.date.split('T')[0];
            return tDate >= startDate && tDate <= endDate;
          });
        }
        break;
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(t => {
        const customer = customers.find(c => c.id === t.customerId);
        return customer?.name.toLowerCase().includes(term) || 
               customer?.phone.includes(term) ||
               t.id.toLowerCase().includes(term);
      });
    }

    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, dateFilter, startDate, endDate, searchTerm, customers]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = filteredTransactions.reduce((sum, t) => sum + t.totalAmount, 0);
    const count = filteredTransactions.length;
    const avg = count > 0 ? total / count : 0;
    
    const paymentMethods = filteredTransactions.reduce((acc, t) => {
      const method = t.paymentMethod || 'Other';
      acc[method] = (acc[method] || 0) + t.totalAmount;
      return acc;
    }, {} as Record<string, number>);

    return { total, count, avg, paymentMethods };
  }, [filteredTransactions]);

  const handlePrintReceipt = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const exportToCSV = () => {
    const headers = ['วันที่', 'เลขที่บิล', 'ลูกค้า', 'รายการ', 'จำนวน', 'ยอดรวม', 'วิธีชำระ'];
    const rows = filteredTransactions.map(t => {
      const customer = customers.find(c => c.id === t.customerId);
      const items = Array.isArray(t.items) ? t.items.map(i => `${i.name} x${i.quantity}`).join(', ') : '';
      return [
        new Date(t.date).toLocaleDateString('th-TH'),
        t.id.substring(0, 8),
        customer?.name || 'ไม่ระบุ',
        items,
        Array.isArray(t.items) ? t.items.reduce((sum, i) => sum + i.quantity, 0) : 0,
        t.totalAmount.toFixed(2),
        t.paymentMethod
      ];
    });

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoadingData) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p>กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <FileText className="text-rose-500" size={28} />
              รายงานการขาย (Sales Report)
            </h2>
            <p className="text-gray-500 text-sm mt-1">ดูรายละเอียดการขายและออกใบเสร็จ</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={exportToCSV}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Download size={18} />
              ส่งออก CSV
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">ยอดขายรวม</p>
                <p className="text-2xl font-bold text-gray-800">฿{stats.total.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="text-green-600" size={24} />
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">จำนวนบิล</p>
                <p className="text-2xl font-bold text-gray-800">{stats.count}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <FileText className="text-blue-600" size={24} />
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">ยอดขายเฉลี่ย</p>
                <p className="text-2xl font-bold text-gray-800">฿{stats.avg.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <TrendingUp className="text-purple-600" size={24} />
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">รายการที่แสดง</p>
                <p className="text-2xl font-bold text-gray-800">{filteredTransactions.length}</p>
              </div>
              <div className="p-3 bg-rose-100 rounded-lg">
                <Filter className="text-rose-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Date Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar size={16} className="inline mr-1" />
                กรองตามวันที่
              </label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as any)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none"
              >
                <option value="all">ทั้งหมด</option>
                <option value="today">วันนี้</option>
                <option value="week">7 วันล่าสุด</option>
                <option value="month">30 วันล่าสุด</option>
                <option value="custom">กำหนดเอง</option>
              </select>
            </div>

            {/* Custom Date Range */}
            {dateFilter === 'custom' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">วันที่เริ่มต้น</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">วันที่สิ้นสุด</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none"
                  />
                </div>
              </>
            )}

            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Search size={16} className="inline mr-1" />
                ค้นหา
              </label>
              <input
                type="text"
                placeholder="ค้นหาตามชื่อลูกค้า, เบอร์โทร, เลขที่บิล"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">วันที่/เวลา</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">เลขที่บิล</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ลูกค้า</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">รายการ</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">ยอดรวม</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">วิธีชำระ</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      ไม่พบข้อมูลการขาย
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((transaction) => {
                    const customer = customers.find(c => c.id === transaction.customerId);
                    const items = Array.isArray(transaction.items) ? transaction.items : [];
                    
                    return (
                      <tr key={transaction.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {new Date(transaction.date).toLocaleString('th-TH', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="px-4 py-3 text-sm font-mono text-gray-600">
                          {transaction.id.substring(0, 8).toUpperCase()}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          <div>
                            <p className="font-medium">{customer?.name || 'ไม่ระบุ'}</p>
                            {customer?.phone && (
                              <p className="text-xs text-gray-500">{customer.phone}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          <div className="max-w-xs">
                            {items.slice(0, 2).map((item: any, idx: number) => (
                              <p key={idx} className="truncate">
                                {item.name} x{item.quantity}
                              </p>
                            ))}
                            {items.length > 2 && (
                              <p className="text-xs text-gray-400">+{items.length - 2} รายการ</p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">
                          ฿{transaction.totalAmount.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                            transaction.paymentMethod === 'Cash' ? 'bg-green-100 text-green-800' :
                            transaction.paymentMethod === 'Credit Card' ? 'bg-blue-100 text-blue-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                            {transaction.paymentMethod === 'Cash' ? 'เงินสด' :
                             transaction.paymentMethod === 'Credit Card' ? 'บัตรเครดิต' : 'โอนเงิน'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handlePrintReceipt(transaction)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              title="พิมพ์ใบเสร็จ"
                            >
                              <Printer size={18} />
                            </button>
                            <button
                              onClick={() => {
                                setEditingTransaction(transaction);
                                const items = Array.isArray(transaction.items) ? transaction.items : [];
                                setEditingItems(items.map((it: any) => ({ name: it.name, price: Number(it.price), quantity: Number(it.quantity) })));
                              }}
                              className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition"
                              title="แก้ไขราคา"
                            >
                              แก้ไข
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Receipt Print View */}
      {selectedTransaction && (
        <div className="hidden print:block fixed inset-0 bg-white p-8" id="receipt-print">
          <ReceiptPrintView transaction={selectedTransaction} customer={customers.find(c => c.id === selectedTransaction.customerId)} />
        </div>
      )}
      
      {/* Edit Transaction Modal (rendered from page scope) */}
      {editingTransaction && (
        <EditTransactionModal
          transaction={editingTransaction}
          items={editingItems}
          onClose={() => setEditingTransaction(null)}
          onSave={async (newItems) => {
            if (!editingTransaction) return;
            await updateTransaction(editingTransaction.id, newItems);
            setEditingTransaction(null);
          }}
        />
      )}
    </div>
  );
};

// Edit Transaction Modal
const EditTransactionModal: React.FC<{ transaction: Transaction | null; items: { name: string; price: number; quantity: number }[]; onClose: () => void; onSave: (items: { name: string; price: number; quantity: number }[]) => Promise<void> }> = ({ transaction, items, onClose, onSave }) => {
  const [localItems, setLocalItems] = useState(items);

  React.useEffect(() => setLocalItems(items), [items]);

  const total = localItems.reduce((s, it) => s + it.price * it.quantity, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white w-full max-w-lg rounded-xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">แก้ไขราคาบิล {transaction?.id.substring(0,8).toUpperCase()}</h3>
          <button onClick={onClose} className="text-gray-500">ปิด</button>
        </div>

        <div className="space-y-3 max-h-72 overflow-y-auto">
          {localItems.map((it, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <div className="flex-1">
                <p className="font-medium text-sm">{it.name}</p>
                <p className="text-xs text-gray-400">จำนวน: {it.quantity}</p>
              </div>
              <div className="w-40 flex items-center gap-2">
                <input type="number" className="w-full p-2 border rounded" value={it.price} onChange={(e) => {
                  const v = parseFloat(e.target.value || '0');
                  setLocalItems(prev => prev.map((p, i) => i === idx ? { ...p, price: v } : p));
                }} />
                <span className="text-sm">฿</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex justify-between items-center">
          <div className="text-sm text-gray-600">ยอดรวมใหม่: <span className="font-bold">฿{total.toLocaleString()}</span></div>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 border rounded">ยกเลิก</button>
            <button onClick={async () => { await onSave(localItems); }} className="px-4 py-2 bg-rose-600 text-white rounded">บันทึก</button>
          </div>
        </div>
      </div>
      
    </div>
  );
};

// Receipt Print Component
const ReceiptPrintView: React.FC<{ transaction: Transaction; customer?: any }> = ({ transaction, customer }) => {
  const items = Array.isArray(transaction.items) ? transaction.items : [];
  const date = new Date(transaction.date);

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold mb-2">Patricia Clinic</h1>
        <p className="text-sm text-gray-600">ใบเสร็จรับเงิน / Receipt</p>
      </div>

      <div className="border-t border-b border-gray-300 py-4 mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-600">เลขที่บิล:</span>
          <span className="font-mono">{transaction.id.substring(0, 8).toUpperCase()}</span>
        </div>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-600">วันที่:</span>
          <span>{date.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-600">เวลา:</span>
          <span>{date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        {customer && (
          <>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">ลูกค้า:</span>
              <span>{customer.name}</span>
            </div>
            {customer.phone && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">เบอร์โทร:</span>
                <span>{customer.phone}</span>
              </div>
            )}
          </>
        )}
      </div>

      <div className="mb-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-300">
              <th className="text-left py-2">รายการ</th>
              <th className="text-center py-2">จำนวน</th>
              <th className="text-right py-2">ราคา</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item: any, idx: number) => (
              <tr key={idx} className="border-b border-gray-200">
                <td className="py-2">{item.name}</td>
                <td className="text-center py-2">{item.quantity}</td>
                <td className="text-right py-2">฿{(item.price * item.quantity).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="border-t-2 border-gray-400 pt-4 mb-6">
        <div className="flex justify-between text-lg font-bold mb-2">
          <span>ยอดรวมทั้งสิ้น:</span>
          <span>฿{transaction.totalAmount.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-600">
          <span>วิธีชำระ:</span>
          <span>
            {transaction.paymentMethod === 'Cash' ? 'เงินสด' :
             transaction.paymentMethod === 'Credit Card' ? 'บัตรเครดิต' : 'โอนเงิน'}
          </span>
        </div>
      </div>

      <div className="text-center text-xs text-gray-500 border-t border-gray-300 pt-4">
        <p>ขอบคุณที่ใช้บริการ</p>
        <p>Thank you for your business</p>
      </div>
    </div>
  );
};

export default SalesReportPage;

