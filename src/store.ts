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

export interface ColorDefinition {
  name: string;
  hex: string;
}

export interface SavedAddress {
  id: string;
  label: string;
  icon: string;
  recipientName: string;
  phone: string;
  street: string;
  province_code?: string;
  province_name?: string;
  regency_code?: string;
  regency_name?: string;
  district_code?: string;
  district_name?: string;
  village_code?: string;
  village_name?: string;
}

interface AppState {
  cart: CartItem[];
  wishlist: number[];
  user: { id: string; role: 'customer' | 'admin'; name?: string; email?: string } | null;
  globalColors: ColorDefinition[];
  savedAddresses: SavedAddress[];
  addGlobalColor: (color: ColorDefinition) => void;
  addToCart: (item: CartItem) => void;
  decreaseQuantity: (index: number) => void;
  removeFromCart: (index: number) => void;
  clearCart: () => void;
  toggleWishlist: (product_id: number) => void;
  login: (role: 'customer' | 'admin') => void;
  logout: () => void;
  addSavedAddress: (address: Omit<SavedAddress, 'id'>) => void;
  removeSavedAddress: (id: string) => void;
  updateSavedAddress: (id: string, address: Partial<SavedAddress>) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      cart: [],
      wishlist: [],
      user: null,
      savedAddresses: [],
      globalColors: [
        { name: 'Hitam', hex: '#000000' },
        { name: 'Nude', hex: '#E3C2B0' },
        { name: 'Sage', hex: '#8A9A86' },
        { name: 'Putih', hex: '#FFFFFF' },
        { name: 'Navy', hex: '#000080' },
      ],
      savedAddress: [],
      addSavedAddress: (address) => set((state) => ({
        savedAddresses: [...state.savedAddresses, { ...address, id: Math.random().toString(36).substr(2, 9) }]
      })),
      removeSavedAddress: (id) => set((state) => ({
        savedAddresses: state.savedAddresses.filter(a => a.id !== id)
      })),
      updateSavedAddress: (id, address) => set((state) => ({
        savedAddresses: state.savedAddresses.map(a => a.id === id ? { ...a, ...address } : a)
      })),
      addGlobalColor: (color) =>
        set((state) => ({
          globalColors: [...state.globalColors, color]
        })),
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
