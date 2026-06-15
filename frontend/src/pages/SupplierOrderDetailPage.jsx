import { useParams, Link } from 'react-router-dom';
import { useOrderDetail, useUpdateOrderStatus } from '../hooks/useOrders';
import { formatCurrency, formatDateTime, statusColor, statusLabel } from '../utils/formatters';
import { Spinner } from '../components/ui/spinner';
import { Button } from '../components/ui/button';
import { toast } from '../components/ui/toast';
import { ArrowLeft, MapPin, User } from 'lucide-react';

const NEXT_STATUS = { ASSIGNED: { next: 'ACCEPTED', label: 'Accept Order' }, ACCEPTED: { next: 'DISPATCHED', label: 'Mark as Dispatched' }, DISPATCHED: { next: 'DELIVERED', label: 'Mark as Delivered' } };

export default function SupplierOrderDetailPage() {
  const { id } = useParams();
  const { data: order, isLoading } = useOrderDetail(id);
  const updateStatus = useUpdateOrderStatus();

  const handleStatusUpdate = async (status) => {
    try {
      await updateStatus.mutateAsync({ id, status });
      toast(`Order marked as ${statusLabel(status)}`);
    } catch {
      toast('Failed to update status', 'error');
    }
  };

  if (isLoading) return <div className="flex justify-center py-32"><Spinner className="h-12 w-12" /></div>;
  if (!order) return <div className="text-center py-32 text-gray-400">Order not found.</div>;

  const next = NEXT_STATUS[order.status];

  return (
    <div className="max-w-2xl">
      <Link to="/supplier" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-orange-500 mb-6">
        <ArrowLeft size={16} /> Back to Dashboard
      </Link>

      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Order #{order.id.slice(-8).toUpperCase()}</h1>
          <p className="text-sm text-gray-500 mt-1">{formatDateTime(order.createdAt)}</p>
        </div>
        <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${statusColor(order.status)}`}>{statusLabel(order.status)}</span>
      </div>

      {/* Customer Info */}
      <div className="bg-white border rounded-xl p-5 mb-4">
        <div className="flex items-center gap-2 mb-3"><User size={16} className="text-orange-500" /><h2 className="font-semibold">Customer</h2></div>
        <p className="text-gray-900 font-medium">{order.customer?.name}</p>
        <p className="text-gray-500 text-sm">{order.customer?.email} · {order.customer?.phone}</p>
      </div>

      {/* Shipping */}
      <div className="bg-white border rounded-xl p-5 mb-4">
        <div className="flex items-center gap-2 mb-3"><MapPin size={16} className="text-orange-500" /><h2 className="font-semibold">Delivery Address</h2></div>
        <p className="text-gray-700 text-sm">{order.shippingAddress?.line1}, {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}</p>
        {order.shippingAddress?.phone && <p className="text-gray-500 text-sm mt-1">📞 {order.shippingAddress.phone}</p>}
      </div>

      {/* Items */}
      <div className="bg-white border rounded-xl p-5 mb-6">
        <h2 className="font-semibold mb-4">Order Items</h2>
        <div className="space-y-3">
          {order.items?.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-gray-700">{item.product?.name} × {item.quantity} {item.product?.unit || 'kg'}</span>
              <span className="font-medium">{formatCurrency(item.quantity * item.unitPrice)}</span>
            </div>
          ))}
        </div>
        <div className="border-t pt-3 mt-3 flex justify-between font-bold">
          <span>Total</span><span className="text-orange-500">{formatCurrency(order.totalAmount)}</span>
        </div>
      </div>

      {/* Action */}
      {next && (
        <Button className="w-full" size="lg" onClick={() => handleStatusUpdate(next.next)} disabled={updateStatus.isPending}>
          {updateStatus.isPending ? 'Updating...' : next.label}
        </Button>
      )}
      {order.status === 'DELIVERED' && (
        <div className="text-center text-green-600 font-medium py-4 bg-green-50 rounded-xl border border-green-200">
          ✅ Order delivered successfully!
        </div>
      )}
    </div>
  );
}
