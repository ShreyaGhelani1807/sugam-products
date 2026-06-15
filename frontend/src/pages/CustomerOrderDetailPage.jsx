import { useParams, Link } from 'react-router-dom';
import { useOrderDetail } from '../hooks/useOrders';
import { formatCurrency, formatDate, formatDateTime, statusColor, statusLabel } from '../utils/formatters';
import { Spinner } from '../components/ui/spinner';
import { ArrowLeft, Package, MapPin, CheckCircle } from 'lucide-react';

const STATUS_STEPS = ['PLACED', 'ASSIGNED', 'ACCEPTED', 'DISPATCHED', 'DELIVERED'];

export default function CustomerOrderDetailPage() {
  const { id } = useParams();
  const { data: order, isLoading } = useOrderDetail(id);

  if (isLoading) return <div className="flex justify-center py-32"><Spinner className="h-12 w-12" /></div>;
  if (!order) return <div className="text-center py-32 text-gray-400">Order not found.</div>;

  const currentStep = STATUS_STEPS.indexOf(order.status);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link to="/portal" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-orange-500 mb-6">
        <ArrowLeft size={16} /> Back to My Orders
      </Link>
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Order #{order.id.slice(-8).toUpperCase()}</h1>
          <p className="text-sm text-gray-500 mt-1">Placed on {formatDateTime(order.createdAt)}</p>
        </div>
        <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${statusColor(order.status)}`}>{statusLabel(order.status)}</span>
      </div>

      {/* Status Tracker */}
      <div className="bg-white border rounded-xl p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-6">Order Progress</h2>
        <div className="flex items-center gap-0">
          {STATUS_STEPS.map((s, i) => (
            <div key={s} className="flex items-center flex-1 last:flex-none">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${i <= currentStep ? 'bg-orange-500' : 'bg-gray-200'}`}>
                {i < currentStep ? <CheckCircle size={16} className="text-white" /> : <span className="text-white text-xs font-bold">{i + 1}</span>}
              </div>
              <div className="flex-1 mx-1 h-1 bg-gray-200 last:hidden">
                <div className={`h-full bg-orange-500 transition-all ${i < currentStep ? 'w-full' : 'w-0'}`} />
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-3 text-xs text-gray-500">
          {STATUS_STEPS.map((s) => <span key={s} className="text-center w-8">{statusLabel(s).split(' ')[0]}</span>)}
        </div>
      </div>

      {/* Items */}
      <div className="bg-white border rounded-xl p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">Items Ordered</h2>
        <div className="space-y-3">
          {order.items?.map((item) => (
            <div key={item.id} className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center text-xl flex-shrink-0">🍊</div>
              <div className="flex-1">
                <span className="font-medium text-gray-900 text-sm">{item.product?.name || 'Product'}</span>
                <p className="text-xs text-gray-400">Qty: {item.quantity} × {formatCurrency(item.unitPrice)}</p>
              </div>
              <span className="font-semibold text-gray-900 text-sm">{formatCurrency(item.quantity * item.unitPrice)}</span>
            </div>
          ))}
        </div>
        <div className="border-t pt-3 mt-4 flex justify-between font-bold">
          <span>Total</span>
          <span className="text-orange-500">{formatCurrency(order.totalAmount)}</span>
        </div>
      </div>

      {/* Shipping */}
      <div className="bg-white border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-3">
          <MapPin size={16} className="text-orange-500" />
          <h2 className="font-semibold text-gray-900">Shipping Address</h2>
        </div>
        <p className="text-gray-600 text-sm">
          {order.shippingAddress?.line1}, {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}
        </p>
      </div>
    </div>
  );
}
