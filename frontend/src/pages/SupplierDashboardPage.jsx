import { Link } from 'react-router-dom';
import { useSupplierOrders } from '../hooks/useOrders';
import { useAuthStore } from '../store/authStore';
import { formatCurrency, formatDate, statusColor, statusLabel } from '../utils/formatters';
import { Spinner } from '../components/ui/spinner';
import { Package, ChevronRight, CheckCircle, Truck, AlertCircle } from 'lucide-react';

export default function SupplierDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { data: orders, isLoading } = useSupplierOrders();

  const pending = orders?.filter((o) => ['PLACED', 'ASSIGNED', 'ACCEPTED'].includes(o.status)) || [];
  const dispatched = orders?.filter((o) => o.status === 'DISPATCHED') || [];
  const delivered = orders?.filter((o) => o.status === 'DELIVERED') || [];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Supplier Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome, {user?.name}</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Pending Orders', value: pending.length, icon: AlertCircle, color: 'orange' },
          { label: 'Dispatched', value: dispatched.length, icon: Truck, color: 'blue' },
          { label: 'Delivered', value: delivered.length, icon: CheckCircle, color: 'green' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white border rounded-xl p-5 flex items-center gap-4">
            <div className={`w-12 h-12 bg-${color}-50 rounded-xl flex items-center justify-center`}>
              <Icon className={`text-${color}-500`} size={22} />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{value}</div>
              <div className="text-sm text-gray-500">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Orders List */}
      <div className="bg-white border rounded-xl">
        <div className="p-5 border-b">
          <h2 className="font-semibold text-gray-900">All Assigned Orders</h2>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : !orders?.length ? (
          <div className="text-center py-16 text-gray-400">
            <Package className="mx-auto mb-3" size={40} />
            <p>No orders assigned yet</p>
          </div>
        ) : (
          <div className="divide-y">
            {orders.map((order) => (
              <Link key={order.id} to={`/supplier/orders/${order.id}`}
                className="flex items-center gap-4 p-5 hover:bg-gray-50 transition-colors group">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900">#{order.id.slice(-8).toUpperCase()}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(order.status)}`}>{statusLabel(order.status)}</span>
                  </div>
                  <p className="text-sm text-gray-500">
                    {order.customer?.name} · {order.shippingAddress?.city} · {formatDate(order.createdAt)}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-bold text-gray-900">{formatCurrency(order.totalAmount)}</div>
                  <ChevronRight className="text-gray-300 group-hover:text-orange-400 ml-auto mt-1" size={18} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
