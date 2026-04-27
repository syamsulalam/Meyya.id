import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type CartItem = {
  product_id: number;
  product_name: string;
  color: string;
  size: string;
  quantity: number;
  price: number;
  image_url: string;
};

interface AppState {
  cart: CartItem[];
  wishlist: number[];
  user: { id: string; role: 'customer' | 'admin'; name?: string; email?: string } | null;
  addToCart: (item: CartItem) => void;
  decreaseQuantity: (index: number) => void;
  removeFromCart: (index: number) => void;
  clearCart: () => void;
  toggleWishlist: (product_id: number) => void;
  login: (role: 'customer' | 'admin') => void;
  logout: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      cart: [],
      wishlist: [],
      user: null,
      addToCart: (item) =>
        set((state) => {
          const existingIndex = state.cart.findIndex(
            (c) => c.product_id === item.product_id && c.color === item.color && c.size === item.size
          );
          if (existingIndex >= 0) {
            const newCart = [...state.cart];
            newCart[existingIndex].quantity += item.quantity;
            return { cart: newCart };
          }
          return { cart: [...state.cart, item] };
        }),
      decreaseQuantity: (index) =>
        set((state) => {
          const newCart = [...state.cart];
          if (newCart[index].quantity > 1) {
            newCart[index].quantity -= 1;
          } else {
            newCart.splice(index, 1);
          }
          return { cart: newCart };
        }),
      removeFromCart: (index) =>
        set((state) => ({
          cart: state.cart.filter((_, i) => i !== index),
        })),
      clearCart: () => set({ cart: [] }),
      toggleWishlist: (id) =>
        set((state) => ({
          wishlist: state.wishlist.includes(id)
            ? state.wishlist.filter((wId) => wId !== id)
            : [...state.wishlist, id],
        })),
      login: (role) => set({ user: { id: 'user-123', role, name: 'Guest User', email: 'guest@example.com' } }),
      logout: () => set({ user: null }),
    }),
    {
      name: 'meyya-storage',
    }
  )
);
