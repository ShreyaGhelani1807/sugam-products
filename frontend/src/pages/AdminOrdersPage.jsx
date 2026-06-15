import { useState } from 'react';
import { useAdminOrders } from '../hooks/useOrders';
import { formatCurrency, formatDate, statusColor, statusLabel } from '../utils/formatters';
import { Spinner } from '../components/ui/spinner';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { Search } from 'lucide-react';

export default function AdminOrdersPage() {
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const { data: orders, isLoading } = useAdminOrders({ status: status || undefined, search: search || undefined });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Order Management</h1>
      <div className="flex gap-4 mb-6 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <Input placeholder="Search customer or order ID..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
        </div>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-44">
          <option value="">All Statuses</option>
          {['PLACED', 'ASSIGNED', 'ACCEPTED', 'DISPATCHED', 'DELIVERED'].map((s) => (
            <option key={s} value={s}>{statusLabel(s)}</option>
          ))}
        </Select>
      </div>

      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Order ID', 'Customer', 'Supplier', 'Amount', 'Status', 'Date'].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <tr><td colSpan={6} className="text-center py-16"><Spinner className="mx-auto" /></td></tr>
              ) : !orders?.length ? (
                <tr><td colSpan={6} className="text-center py-16 text-gray-400">No orders found</td></tr>
              ) : orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono font-medium text-gray-900">#{order.id.slice(-8).toUpperCase()}</td>
                  <td className="px-4 py-3 text-gray-700">{order.customer?.name || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{order.supplier?.businessName || <span className="text-amber-500">Unassigned</span>}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900">{formatCurrency(order.totalAmount)}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(order.status)}`}>{statusLabel(order.status)}</span></td>
                  <td className="px-4 py-3 text-gray-400">{formatDate(order.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
