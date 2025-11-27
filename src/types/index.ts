/**
 * Core shared types and interfaces for the GentlemenMC application
 */

// ============================================
// USER & AUTHENTICATION TYPES
// ============================================

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar_url?: string;
  admin: boolean;
  manager: boolean;
  is_bar_user: boolean;
  created_at: string;
  updated_at?: string;
}

export interface UserRole {
  admin: boolean;
  manager: boolean;
  bar_user: boolean;
}

export interface AuthSession {
  user: User;
  access_token: string;
  refresh_token?: string;
  expires_at: number;
}

// ============================================
// MEMBER TYPES
// ============================================

export interface Member {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  cpf?: string;
  avatar_url?: string;
  credits: number;
  is_active: boolean;
  joined_at: string;
  updated_at?: string;
}

// ============================================
// STOCK & PRODUCT TYPES
// ============================================

export interface Product {
  id: string;
  name: string;
  description?: string;
  category: ProductCategory;
  price: number;
  cost?: number;
  barcode?: string;
  image_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export type ProductCategory = 'bebida' | 'comida' | 'merchandise' | 'outro';

export interface StockItem {
  id: string;
  product_id: string;
  product?: Product;
  quantity: number;
  min_quantity: number;
  max_quantity?: number;
  location?: string;
  last_restock_at?: string;
  updated_at: string;
}

export interface StockMovement {
  id: string;
  product_id: string;
  product?: Product;
  type: StockMovementType;
  quantity: number;
  previous_quantity: number;
  new_quantity: number;
  reason?: string;
  reference_id?: string; // comanda_id, purchase_id, etc
  performed_by: string;
  performed_at: string;
}

export type StockMovementType = 'entrada' | 'saida' | 'ajuste' | 'perda' | 'transferencia';

// ============================================
// COMANDA (ORDER) TYPES
// ============================================

export interface Comanda {
  id: string;
  member_id?: string;
  member?: Member;
  guest_name?: string;
  status: ComandaStatus;
  items: ComandaItem[];
  subtotal: number;
  discount: number;
  total: number;
  payment_method?: PaymentMethod;
  payment_link?: string;
  notes?: string;
  opened_at: string;
  closed_at?: string;
  paid_at?: string;
  created_by: string;
  updated_at?: string;
}

export type ComandaStatus = 'aberta' | 'fechada' | 'paga' | 'cancelada';

export interface ComandaItem {
  id: string;
  comanda_id: string;
  product_id: string;
  product?: Product;
  quantity: number;
  unit_price: number;
  subtotal: number;
  discount: number;
  total: number;
  notes?: string;
  added_at: string;
}

// ============================================
// PAYMENT TYPES
// ============================================

export type PaymentMethod = 'credito' | 'debito' | 'dinheiro' | 'pix' | 'transferencia' | 'cortesia';

export interface Payment {
  id: string;
  reference_type: 'comanda' | 'divida' | 'mensalidade' | 'credito';
  reference_id: string;
  member_id?: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  gateway?: string;
  gateway_transaction_id?: string;
  gateway_response?: Record<string, any>;
  paid_at?: string;
  created_at: string;
  updated_at?: string;
}

export type PaymentStatus = 'pendente' | 'processando' | 'aprovado' | 'recusado' | 'cancelado' | 'estornado';

// ============================================
// DEBT TYPES
// ============================================

export interface Debt {
  id: string;
  member_id: string;
  member?: Member;
  comanda_id?: string;
  comanda?: Comanda;
  amount: number;
  paid_amount: number;
  remaining_amount: number;
  status: DebtStatus;
  due_date?: string;
  payment_link?: string;
  notes?: string;
  created_at: string;
  paid_at?: string;
  updated_at?: string;
}

export type DebtStatus = 'pendente' | 'parcial' | 'paga' | 'cancelada' | 'vencida';

// ============================================
// CREDIT TYPES
// ============================================

export interface CreditTransaction {
  id: string;
  member_id: string;
  member?: Member;
  type: CreditTransactionType;
  amount: number;
  previous_balance: number;
  new_balance: number;
  reference_type?: string;
  reference_id?: string;
  description?: string;
  performed_by?: string;
  created_at: string;
}

export type CreditTransactionType = 'adicao' | 'uso' | 'estorno' | 'transferencia' | 'cashback' | 'ajuste';

// ============================================
// ANALYTICS & REPORTING TYPES
// ============================================

export interface DashboardMetrics {
  period: {
    start: string;
    end: string;
  };
  revenue: {
    total: number;
    by_payment_method: Record<PaymentMethod, number>;
    trend: number; // percentage change from previous period
  };
  sales: {
    total_orders: number;
    total_items: number;
    average_ticket: number;
    trend: number;
  };
  stock: {
    low_stock_items: number;
    total_value: number;
    top_selling: Array<{
      product: Product;
      quantity_sold: number;
      revenue: number;
    }>;
  };
  debts: {
    total_amount: number;
    total_count: number;
    overdue_amount: number;
    overdue_count: number;
  };
  members: {
    total_active: number;
    new_this_period: number;
    total_credits: number;
  };
}

// ============================================
// PAGINATION & FILTERING TYPES
// ============================================

export interface PaginationParams {
  page: number;
  page_size: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    page_size: number;
    total_count: number;
    total_pages: number;
    has_next: boolean;
    has_previous: boolean;
  };
}

export interface FilterParams {
  search?: string;
  date_from?: string;
  date_to?: string;
  status?: string | string[];
  category?: string | string[];
  [key: string]: any;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  field?: string;
}

// ============================================
// UI STATE TYPES
// ============================================

export interface LoadingState {
  isLoading: boolean;
  message?: string;
}

export interface ErrorState {
  hasError: boolean;
  message?: string;
  code?: string;
  details?: Record<string, any>;
}

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

// ============================================
// FORM TYPES
// ============================================

export interface FormField<T = any> {
  name: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'tel' | 'date' | 'select' | 'checkbox' | 'textarea';
  value: T;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: RegExp;
    custom?: (value: T) => boolean | string;
  };
  options?: Array<{ label: string; value: any }>;
}

export interface FormState<T = any> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  isValid: boolean;
}

// ============================================
// NOTIFICATION TYPES (extending existing)
// ============================================

export interface NotificationTemplate {
  id: string;
  name: string;
  type: string;
  subject?: string;
  message: string;
  variables: string[];
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

// ============================================
// SETTINGS & CONFIGURATION TYPES
// ============================================

export interface AppSettings {
  business: {
    name: string;
    logo_url?: string;
    primary_color?: string;
    secondary_color?: string;
  };
  features: {
    notifications_enabled: boolean;
    whatsapp_enabled: boolean;
    pix_enabled: boolean;
    credits_enabled: boolean;
  };
  limits: {
    max_comanda_items: number;
    max_credit_per_member: number;
    low_stock_threshold: number;
  };
  notifications: {
    low_stock_alert: boolean;
    payment_reminders: boolean;
    new_member_welcome: boolean;
  };
}

// ============================================
// UTILITY TYPES
// ============================================

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type ID = string | number;

// Make all properties optional recursively
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Pick specific properties and make them required
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

