import { useAnalyticsOverview, useAnalyticsMonthly, useAnalyticsProducts } from '../hooks/useAnalytics';
import { formatCurrency } from '../utils/formatters';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Spinner } from '../components/ui/spinner';

export default function AdminAnalyticsPage() {
  const { data: overview } = useAnalyticsOverview();
  const { data: monthly, isLoading: mLoading } = useAnalyticsMonthly();
  const { data: productStats, isLoading: pLoading } = useAnalyticsProducts();

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>

      {/* Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Orders', value: overview?.totalOrders ?? '—' },
          { label: 'Revenue (MTD)', value: overview ? formatCurrency(overview.revenueThisMonth) : '—' },
          { label: 'Revenue (YTD)', value: overview ? formatCurrency(overview.revenueThisYear) : '—' },
          { label: 'Active Suppliers', value: overview?.activeSuppliers ?? '—' },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white border rounded-xl p-5">
            <div className="text-sm text-gray-500 mb-1">{label}</div>
            <div className="text-2xl font-bold text-gray-900">{value}</div>
          </div>
        ))}
      </div>

      {/* Monthly Chart */}
      <div className="bg-white border rounded-xl p-6">
        <h2 className="font-semibold text-gray-900 mb-6">Monthly Revenue</h2>
        {mLoading ? <div className="flex justify-center py-12"><Spinner /></div> : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthly || []} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(val) => formatCurrency(val)} />
              <Bar dataKey="revenue" fill="#f97316" radius={[4, 4, 0, 0]} name="Revenue" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Product Stats */}
      <div className="bg-white border rounded-xl p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Product Performance</h2>
        {pLoading ? <div className="flex justify-center py-8"><Spinner /></div> : (
          <table className="w-full text-sm">
            <thead><tr className="border-b">
              {['Product', 'Units Sold', 'Revenue'].map((h) => (
                <th key={h} className="text-left py-2 text-xs font-semibold text-gray-500 uppercase">{h}</th>
              ))}
            </tr></thead>
            <tbody className="divide-y">
              {productStats?.length ? productStats.map((p) => (
                <tr key={p.productId}>
                  <td className="py-3 text-gray-900 font-medium">{p.name}</td>
                  <td className="py-3 text-gray-600">{p.totalQuantity} {p.unit || 'kg'}</td>
                  <td className="py-3 font-semibold text-orange-500">{formatCurrency(p.totalRevenue)}</td>
                </tr>
              )) : <tr><td colSpan={3} className="py-8 text-center text-gray-400">No data yet</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
