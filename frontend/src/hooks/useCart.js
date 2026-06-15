import { useCartStore } from '../store/cartStore';

export function useCart() {
  const { items, addItem, removeItem, updateQuantity, clearCart } = useCartStore();
  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);
  return { items, addItem, removeItem, updateQuantity, clearCart, total, count };
}
