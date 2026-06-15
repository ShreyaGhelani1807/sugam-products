import { Link } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import { formatCurrency } from '../utils/formatters';
import { Button } from '../components/ui/button';
import { Trash2, Plus, Minus, ShoppingCart, ArrowRight } from 'lucide-react';

export default function CartPage() {
  const { items, removeItem, updateQuantity, total } = useCart();

  if (items.length === 0) return (
    <div className="max-w-lg mx-auto px-4 py-32 text-center">
      <ShoppingCart className="text-gray-300 mx-auto mb-6" size={64} />
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
      <p className="text-gray-500 mb-8">Add some products to get started.</p>
      <Link to="/products"><Button size="lg">Browse Products</Button></Link>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div key={item.id} className="bg-white border rounded-xl p-4 flex gap-4 items-center">
              <div className="w-16 h-16 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                {item.imageUrl ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" /> : <span className="text-2xl">🍊</span>}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">{item.name}</h3>
                <p className="text-sm text-gray-500">{formatCurrency(item.price)} per {item.unit || 'kg'}</p>
              </div>
              <div className="flex items-center border rounded-lg">
                <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="px-2 py-1.5 hover:bg-gray-50 rounded-l-lg"><Minus size={14} /></button>
                <span className="px-3 py-1.5 font-medium text-sm min-w-[2.5rem] text-center">{item.quantity}</span>
                <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="px-2 py-1.5 hover:bg-gray-50 rounded-r-lg"><Plus size={14} /></button>
              </div>
              <div className="text-right min-w-[6rem]">
                <div className="font-bold text-gray-900">{formatCurrency(item.price * item.quantity)}</div>
              </div>
              <button onClick={() => removeItem(item.id)} className="text-gray-300 hover:text-red-500 transition-colors p-1"><Trash2 size={18} /></button>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="bg-white border rounded-xl p-6 h-fit sticky top-20">
          <h2 className="font-bold text-gray-900 text-lg mb-4">Order Summary</h2>
          <div className="space-y-2 text-sm mb-4">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between text-gray-600">
                <span className="truncate mr-2">{item.name} × {item.quantity}</span>
                <span className="flex-shrink-0">{formatCurrency(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="border-t pt-4 mb-6">
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span className="text-orange-500">{formatCurrency(total)}</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">*Shipping calculated at checkout</p>
          </div>
          <Link to="/checkout">
            <Button className="w-full gap-2" size="lg">Proceed to Checkout <ArrowRight size={16} /></Button>
          </Link>
          <Link to="/products" className="block text-center text-sm text-gray-400 hover:text-orange-500 mt-4">Continue Shopping</Link>
        </div>
      </div>
    </div>
  );
}
