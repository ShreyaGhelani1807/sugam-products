import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product, quantity = 1) => {
        const items = get().items;
        const existing = items.find((i) => i.id === product.id);
        if (existing) {
          set({ items: items.map((i) => i.id === product.id ? { ...i, quantity: i.quantity + quantity } : i) });
        } else {
          set({ items: [...items, { ...product, quantity }] });
        }
      },
      removeItem: (id) => set({ items: get().items.filter((i) => i.id !== id) }),
      updateQuantity: (id, quantity) => {
        if (quantity <= 0) return get().removeItem(id);
        set({ items: get().items.map((i) => i.id === id ? { ...i, quantity } : i) });
      },
      clearCart: () => set({ items: [] }),
      get total() {
        return get().items.reduce((sum, i) => sum + i.price * i.quantity, 0);
      },
      get count() {
        return get().items.reduce((sum, i) => sum + i.quantity, 0);
      },
    }),
    { name: 'cart-storage' }
  )
);
