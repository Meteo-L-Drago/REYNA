export type UserRole = 'gastronom' | 'lieferant';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  company_name?: string;
  created_at: string;
  updated_at: string;
}

export interface SupplierProfile {
  id: string;
  user_id: string;
  company_name: string;
  address?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  supplier_id: string;
  name: string;
  description?: string;
  price: number;
  unit: string;
  category?: string;
  image_url?: string;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  product_id: string;
  product?: Product;
  quantity: number;
  supplier_id: string;
}

export type PaymentMethod = 'card' | 'invoice';

export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  gastronom_id: string;
  supplier_id: string;
  status: OrderStatus;
  payment_method: PaymentMethod;
  total_amount: number;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  product?: Product;
}
