import React, { createContext, useContext, useState } from 'react';
import { Product } from '../types';

export interface CartItem {
  product_id: string;
  product: Product;
  quantity: number;
  supplier_id: string;
}

type CartState = Record<string, CartItem[]>;

interface CartContextType {
  cart: Record<string, CartItem[]>;
  addToCart: (product: Product, quantity: number, supplierId: string) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  totalBySupplier: (supplierId: string) => number;
  total: () => number;
  clearCart: () => void;
  itemCount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartState>({});

  function addToCart(product: Product, quantity: number, supplierId: string) {
    if (quantity < 1) return;
    setCart((prev) => {
      const supplierCart = prev[supplierId] ?? [];
      const existing = supplierCart.find((i) => i.product_id === product.id);
      let newSupplierCart: CartItem[];
      if (existing) {
        newSupplierCart = supplierCart.map((i) =>
          i.product_id === product.id
            ? { ...i, quantity: i.quantity + quantity }
            : i
        );
      } else {
        newSupplierCart = [
          ...supplierCart,
          { product_id: product.id, product, quantity, supplier_id: supplierId },
        ];
      }
      return { ...prev, [supplierId]: newSupplierCart };
    });
  }

  function removeFromCart(productId: string) {
    setCart((prev) => {
      const next: CartState = {};
      for (const [sid, items] of Object.entries(prev)) {
        const filtered = items.filter((i) => i.product_id !== productId);
        if (filtered.length > 0) next[sid] = filtered;
      }
      return next;
    });
  }

  function updateQuantity(productId: string, quantity: number) {
    if (quantity < 1) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) => {
      const next: CartState = {};
      for (const [sid, items] of Object.entries(prev)) {
        next[sid] = items.map((i) =>
          i.product_id === productId ? { ...i, quantity } : i
        ).filter((i) => i.quantity > 0);
        if (next[sid].length === 0) delete next[sid];
      }
      return next;
    });
  }

  function totalBySupplier(supplierId: string): number {
    const items = cart[supplierId] ?? [];
    return items.reduce((sum, i) => sum + (i.product.price * i.quantity), 0);
  }

  function total(): number {
    return Object.keys(cart).reduce((sum, sid) => sum + totalBySupplier(sid), 0);
  }

  function clearCart() {
    setCart({});
  }

  function itemCount(): number {
    return Object.values(cart).flat().reduce((n, i) => n + i.quantity, 0);
  }

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        totalBySupplier,
        total,
        clearCart,
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
