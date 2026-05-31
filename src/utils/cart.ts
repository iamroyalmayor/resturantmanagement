import { CartItem, MenuItem } from '../data/menu';

export const CART_STORAGE_KEY = 'restaurantos-cart';

export const loadCart = (): CartItem[] => {
  if (typeof window === 'undefined') return [];
  const stored = window.localStorage.getItem(CART_STORAGE_KEY);
  if (!stored) return [];

  try {
    return JSON.parse(stored) as CartItem[];
  } catch {
    return [];
  }
};

export const saveCart = (cart: CartItem[]) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
};

export const getCartCount = (cart: CartItem[]) => cart.reduce((sum, item) => sum + item.quantity, 0);

export const getCartSubtotal = (cart: CartItem[]) => cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

export const addCartItem = (cart: CartItem[], item: MenuItem): CartItem[] => {
  const existing = cart.find((cartItem) => cartItem.id === item.id);
  if (existing) {
    return cart.map((cartItem) =>
      cartItem.id === item.id ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem,
    );
  }

  return [...cart, { ...item, quantity: 1 }];
};

export const updateCartItemQuantity = (cart: CartItem[], id: string, delta: number): CartItem[] =>
  cart
    .map((item) => (item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item))
    .filter((item) => item.quantity > 0);

export const removeCartItem = (cart: CartItem[], id: string): CartItem[] => cart.filter((item) => item.id !== id);
