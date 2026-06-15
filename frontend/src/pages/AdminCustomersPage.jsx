import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { formatDate, formatCurrency } from '../utils/formatters';
import { Spinner } from '../components/ui/spinner';

export default function AdminCustomersPage() {
  const { data: customers, isLoading } = useQuery({ queryKey: ['admin-customers'], queryFn: () => api.get('/api/admin/customers').then(r => r.data) });
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Customers</h1>
      <div className="bg-white border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>{['Name', 'Email', 'Phone', 'Orders', 'Total Spent', 'Joined'].map((h) => <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? <tr><td colSpan={6} className="text-center py-12"><Spinner className="mx-auto" /></td></tr>
              : customers?.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                  <td className="px-4 py-3 text-gray-500">{c.email}</td>
                  <td className="px-4 py-3 text-gray-500">{c.phone}</td>
                  <td className="px-4 py-3">{c._count?.orders ?? 0}</td>
                  <td className="px-4 py-3 font-semibold">{formatCurrency(c.totalSpent || 0)}</td>
                  <td className="px-4 py-3 text-gray-400">{formatDate(c.createdAt)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
