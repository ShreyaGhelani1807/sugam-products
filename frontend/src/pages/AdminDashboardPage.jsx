import { Link } from 'react-router-dom';
import { useAnalyticsOverview, useAnalyticsMonthly } from '../hooks/useAnalytics';
import { formatCurrency } from '../utils/formatters';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Spinner } from '../components/ui/spinner';
import { ShoppingCart, TrendingUp, Truck, Clock, Package } from 'lucide-react';

export default function AdminDashboardPage() {
  const { data: overview, isLoading: oLoading } = useAnalyticsOverview();
  const { data: monthly, isLoading: mLoading } = useAnalyticsMonthly();

  const kpis = [
    { label: 'Orders This Month', value: overview?.ordersThisMonth ?? '—', icon: ShoppingCart, color: 'orange', to: '/admin/orders' },
    { label: 'Revenue (MTD)', value: overview ? formatCurrency(overview.revenueThisMonth) : '—', icon: TrendingUp, color: 'green', to: '/admin/analytics' },
    { label: 'Revenue (YTD)', value: overview ? formatCurrency(overview.revenueThisYear) : '—', icon: TrendingUp, color: 'blue', to: '/admin/analytics' },
    { label: 'Pending Orders', value: overview?.pendingOrders ?? '—', icon: Clock, color: 'yellow', to: '/admin/orders' },
    { label: 'Active Suppliers', value: overview?.activeSuppliers ?? '—', icon: Truck, color: 'purple', to: '/admin/suppliers' },
    { label: 'Total Orders', value: overview?.totalOrders ?? '—', icon: Package, color: 'gray', to: '/admin/orders' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {/* KPI Cards */}
      {oLoading ? (
        <div className="flex justify-center py-10"><Spinner /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {kpis.map(({ label, value, icon: Icon, color, to }) => (
            <Link key={label} to={to} className="bg-white border rounded-xl p-5 hover:border-orange-200 hover:shadow-sm transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-500">{label}</span>
                <div className={`w-9 h-9 bg-${color}-50 rounded-lg flex items-center justify-center`}>
                  <Icon size={18} className={`text-${color}-500`} />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900">{value}</div>
            </Link>
          ))}
        </div>
      )}

      {/* Monthly Chart */}
      <div className="bg-white border rounded-xl p-6">
        <h2 className="font-semibold text-gray-900 mb-6">Monthly Revenue & Orders ({new Date().getFullYear()})</h2>
        {mLoading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : monthly?.length ? (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthly} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="revenue" orientation="left" tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="orders" orientation="right" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(val, name) => name === 'revenue' ? formatCurrency(val) : val} />
              <Bar yAxisId="revenue" dataKey="revenue" fill="#f97316" radius={[4, 4, 0, 0]} name="Revenue" />
              <Bar yAxisId="orders" dataKey="orders" fill="#fed7aa" radius={[4, 4, 0, 0]} name="Orders" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-12 text-gray-400">No data yet</div>
        )}
      </div>
    </div>
  );
}
