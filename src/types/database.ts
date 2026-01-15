/**
 * Database schema types matching Supabase tables
 * Auto-generated types should be placed here
 */

// ============================================
// RAW DATABASE TYPES
// ============================================

export interface DbUser {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  avatar_url: string | null;
  admin: boolean;
  manager: boolean;
  is_bar_user: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface DbMember {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  cpf: string | null;
  avatar_url: string | null;
  credits: number;
  is_active: boolean;
  joined_at: string;
  updated_at: string | null;
}

export interface DbProduct {
  id: string;
  name: string;
  description: string | null;
  category: string;
  price: number;
  cost: number | null;
  barcode: string | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface DbStockItem {
  id: string;
  product_id: string;
  quantity: number;
  min_quantity: number;
  max_quantity: number | null;
  location: string | null;
  last_restock_at: string | null;
  updated_at: string;
}

export interface DbComanda {
  id: string;
  member_id: string | null;
  guest_name: string | null;
  status: string;
  subtotal: number;
  discount: number;
  total: number;
  payment_method: string | null;
  payment_link: string | null;
  notes: string | null;
  opened_at: string;
  closed_at: string | null;
  paid_at: string | null;
  created_by: string;
  updated_at: string | null;
}

export interface DbComandaItem {
  id: string;
  comanda_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  discount: number;
  total: number;
  notes: string | null;
  added_at: string;
}

// ============================================
// DATABASE QUERY HELPERS
// ============================================

export type OrderBy<T> = {
  [K in keyof T]?: 'asc' | 'desc';
};

export interface QueryOptions<T> {
  select?: (keyof T)[];
  where?: Partial<T>;
  orderBy?: OrderBy<T>;
  limit?: number;
  offset?: number;
}

// ============================================
// TABLE NAMES (for type-safe queries)
// ============================================

export const TABLE_NAMES = {
  USERS: 'users',
  MEMBERS: 'members',
  PRODUCTS: 'products',
  STOCK_ITEMS: 'stock_items',
  STOCK_MOVEMENTS: 'stock_movements',
  COMANDAS: 'comandas',
  COMANDA_ITEMS: 'comanda_items',
  DEBTS: 'debts',
  CREDIT_TRANSACTIONS: 'credit_transactions',
  PAYMENTS: 'payments',
  NOTIFICATIONS: 'notifications',
  NOTIFICATION_TEMPLATES: 'notification_templates',
} as const;

export type TableName = typeof TABLE_NAMES[keyof typeof TABLE_NAMES];

