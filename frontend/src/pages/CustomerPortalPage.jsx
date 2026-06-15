import { Link } from 'react-router-dom';
import { useMyOrders } from '../hooks/useOrders';
import { useAuthStore } from '../store/authStore';
import { formatCurrency, formatDate, statusColor, statusLabel } from '../utils/formatters';
import { Spinner } from '../components/ui/spinner';
import { Package, ChevronRight } from 'lucide-react';

export default function CustomerPortalPage() {
  const user = useAuthStore((s) => s.user);
  const { data: orders, isLoading } = useMyOrders();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
        <p className="text-gray-500 mt-1">Welcome back, {user?.name}</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner className="h-10 w-10" /></div>
      ) : !orders?.length ? (
        <div className="text-center py-20">
          <Package className="text-gray-300 mx-auto mb-4" size={48} />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders yet</h3>
          <p className="text-gray-400 mb-6">Your orders will appear here once you place one.</p>
          <Link to="/products" className="inline-flex items-center gap-2 bg-orange-500 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-orange-600">
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link key={order.id} to={`/portal/orders/${order.id}`}
              className="bg-white border rounded-xl p-5 flex items-center gap-4 hover:border-orange-200 hover:shadow-sm transition-all group">
              <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Package className="text-orange-500" size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-gray-900">#{order.id.slice(-8).toUpperCase()}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(order.status)}`}>{statusLabel(order.status)}</span>
                </div>
                <div className="text-sm text-gray-500 mt-0.5">
                  {order.items?.length || 0} item(s) · {formatDate(order.createdAt)}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="font-bold text-gray-900">{formatCurrency(order.totalAmount)}</div>
                <ChevronRight className="text-gray-300 group-hover:text-orange-400 transition-colors ml-auto mt-1" size={18} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
