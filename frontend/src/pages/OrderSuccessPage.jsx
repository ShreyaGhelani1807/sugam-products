import { useLocation, Link } from 'react-router-dom';
import { CheckCircle, Package, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { formatCurrency, formatDateTime } from '../utils/formatters';

export default function OrderSuccessPage() {
  const { state } = useLocation();
  const order = state?.order;

  return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <div className="bg-green-50 border border-green-200 rounded-2xl p-8 mb-6">
        <CheckCircle className="text-green-500 mx-auto mb-4" size={64} />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Placed Successfully!</h1>
        <p className="text-gray-500 mb-4">
          Thank you for your order. You'll receive an email confirmation shortly.
        </p>
        {order && (
          <div className="bg-white rounded-xl border p-4 text-left space-y-2 text-sm mt-4">
            <div className="flex justify-between">
              <span className="text-gray-500">Order ID</span>
              <span className="font-mono font-semibold text-gray-900">#{order.id.slice(-8).toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Total</span>
              <span className="font-semibold text-orange-500">{formatCurrency(order.totalAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Status</span>
              <span className="font-medium text-blue-600">Order Placed</span>
            </div>
            {order.createdAt && (
              <div className="flex justify-between">
                <span className="text-gray-500">Placed At</span>
                <span>{formatDateTime(order.createdAt)}</span>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="space-y-3">
        <Link to="/portal"><Button className="w-full gap-2">Track Your Order <ArrowRight size={16} /></Button></Link>
        <Link to="/products"><Button variant="outline" className="w-full">Continue Shopping</Button></Link>
      </div>
    </div>
  );
}
