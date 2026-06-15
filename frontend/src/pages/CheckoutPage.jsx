import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';
import { formatCurrency } from '../utils/formatters';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from '../components/ui/toast';
import AuthModal from '../features/auth/AuthModal';
import api from '../lib/api';
import { MapPin, CreditCard, Lock } from 'lucide-react';

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState('address');
  const [authOpen, setAuthOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState({ line1: '', city: '', state: '', pincode: '', phone: '' });
  // Holds the created order across retries so a failed verification does not
  // spawn a second Razorpay order (and a second charge).
  const [pendingOrder, setPendingOrder] = useState(null);

  const handleAddressChange = (e) => setAddress((a) => ({ ...a, [e.target.name]: e.target.value }));

  const handleAddressNext = (e) => {
    e.preventDefault();
    if (!isAuthenticated) { setAuthOpen(true); return; }
    setStep('payment');
  };

  const handlePayment = async () => {
    setLoading(true);
    try {
      // Reuse the already-created order on a retry so we never open a second
      // Razorpay order for the same cart (avoids any double-charge window).
      let order = pendingOrder;
      if (!order) {
        const { data } = await api.post('/api/orders/checkout', {
          items: items.map((i) => ({ productId: i.id, quantity: i.quantity, unitPrice: i.price })),
          shippingAddress: address,
          total,
        });
        order = { razorpayOrder: data.razorpayOrder, internalOrderId: data.internalOrderId };
        setPendingOrder(order);
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.razorpayOrder.amount,
        currency: 'INR',
        name: 'Sugam Products',
        description: 'Product Order',
        order_id: order.razorpayOrder.id,
        handler: async (response) => {
          try {
            const { data: orderData } = await api.post('/api/orders/verify-payment', {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              internalOrderId: order.internalOrderId,
            });
            setPendingOrder(null);
            clearCart();
            navigate('/order-success', { state: { order: orderData.order } });
          } catch {
            toast('Payment received — finalizing your order. If this persists, contact support; do not pay again.', 'error');
          }
        },
        prefill: { name: user?.name, email: user?.email, contact: address.phone || user?.phone },
        theme: { color: '#f97316' },
      };

      if (window.Razorpay) {
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        toast('Razorpay not loaded. Please refresh.', 'error');
      }
    } catch (err) {
      toast(err.response?.data?.error || 'Checkout failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

      {/* Steps */}
      <div className="flex items-center gap-3 mb-10">
        {['address', 'payment'].map((s, i) => (
          <div key={s} className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step === s || (s === 'address' && step === 'payment') ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-400'}`}>{i + 1}</div>
            <span className={`text-sm font-medium ${step === s ? 'text-orange-500' : 'text-gray-400'}`}>{s === 'address' ? 'Shipping Address' : 'Payment'}</span>
            {i < 1 && <div className="h-px w-8 bg-gray-200" />}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left */}
        <div className="lg:col-span-2">
          {step === 'address' && (
            <div className="bg-white border rounded-xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <MapPin className="text-orange-500" size={20} />
                <h2 className="text-lg font-semibold">Shipping Address</h2>
              </div>
              <form onSubmit={handleAddressNext} className="space-y-4">
                <div className="space-y-1">
                  <Label>Address Line</Label>
                  <Input name="line1" value={address.line1} onChange={handleAddressChange} placeholder="House / Plot No., Street, Area" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1"><Label>City</Label><Input name="city" value={address.city} onChange={handleAddressChange} placeholder="City" required /></div>
                  <div className="space-y-1"><Label>State</Label><Input name="state" value={address.state} onChange={handleAddressChange} placeholder="State" required /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1"><Label>Pincode</Label><Input name="pincode" value={address.pincode} onChange={handleAddressChange} placeholder="400001" required /></div>
                  <div className="space-y-1"><Label>Phone</Label><Input name="phone" value={address.phone} onChange={handleAddressChange} placeholder="+91 98765 43210" required /></div>
                </div>
                {!isAuthenticated && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700 flex items-center gap-2">
                    <Lock size={14} />You'll need to sign in before payment.
                  </div>
                )}
                <Button type="submit" className="w-full" size="lg">
                  {isAuthenticated ? 'Continue to Payment' : 'Sign In & Continue'}
                </Button>
              </form>
            </div>
          )}

          {step === 'payment' && (
            <div className="bg-white border rounded-xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <CreditCard className="text-orange-500" size={20} />
                <h2 className="text-lg font-semibold">Payment</h2>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 mb-6 text-sm">
                <p className="font-medium text-gray-700 mb-2">Delivering to:</p>
                <p className="text-gray-500">{address.line1}, {address.city}, {address.state} - {address.pincode}</p>
              </div>
              <div className="border border-dashed border-orange-300 bg-orange-50 rounded-lg p-4 mb-6 text-sm text-orange-700">
                <p className="font-medium mb-1">Secure Payment via Razorpay</p>
                <p className="text-xs">UPI, Cards, Net Banking, Wallets — all supported</p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep('address')} className="flex-1">Back</Button>
                <Button onClick={handlePayment} className="flex-1" size="lg" disabled={loading}>
                  {loading ? 'Processing...' : `Pay ${formatCurrency(total)}`}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Order Summary */}
        <div className="bg-white border rounded-xl p-6 h-fit">
          <h2 className="font-bold text-gray-900 mb-4">Order Summary</h2>
          <div className="space-y-3 text-sm mb-4">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between">
                <span className="text-gray-600 truncate mr-2">{item.name} × {item.quantity}</span>
                <span className="font-medium flex-shrink-0">{formatCurrency(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="border-t pt-3">
            <div className="flex justify-between font-bold text-base">
              <span>Total</span><span className="text-orange-500">{formatCurrency(total)}</span>
            </div>
          </div>
        </div>
      </div>

      <AuthModal open={authOpen} onClose={() => { setAuthOpen(false); if (isAuthenticated) setStep('payment'); }} />
    </div>
  );
}
