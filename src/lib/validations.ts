/**
 * Validation schemas and utilities using Zod
 */
import { z } from 'zod';

// ============================================
// COMMON VALIDATIONS
// ============================================

export const emailSchema = z.string().email('Email inválido');

export const phoneSchema = z.string()
  .regex(/^\(\d{2}\)\s?\d{4,5}-?\d{4}$/, 'Telefone inválido. Use o formato (XX) XXXXX-XXXX');

export const cpfSchema = z.string()
  .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'CPF inválido. Use o formato XXX.XXX.XXX-XX')
  .refine((cpf) => validateCPF(cpf), 'CPF inválido');

export const positiveNumberSchema = z.number().positive('Deve ser um número positivo');

export const currencySchema = z.number().min(0, 'Valor não pode ser negativo');

// ============================================
// USER & MEMBER VALIDATIONS
// ============================================

export const createMemberSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: emailSchema.optional(),
  phone: phoneSchema.optional(),
  cpf: cpfSchema.optional(),
  credits: currencySchema.default(0),
  is_active: z.boolean().default(true),
}).refine(
  (data) => data.email || data.phone,
  { message: 'Email ou telefone é obrigatório', path: ['email'] }
);

export const updateMemberSchema = createMemberSchema.partial();

export const createUserSchema = z.object({
  email: emailSchema,
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  phone: phoneSchema.optional(),
  admin: z.boolean().default(false),
  manager: z.boolean().default(false),
  is_bar_user: z.boolean().default(false),
});

// ============================================
// PRODUCT & STOCK VALIDATIONS
// ============================================

export const createProductSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  description: z.string().optional(),
  category: z.enum(['bebida', 'comida', 'merchandise', 'outro']),
  price: positiveNumberSchema,
  cost: currencySchema.optional(),
  barcode: z.string().optional(),
  is_active: z.boolean().default(true),
  min_quantity: z.number().int().min(0).default(0),
  quantity: z.number().int().min(0).default(0),
});

export const updateProductSchema = createProductSchema.partial();

export const stockMovementSchema = z.object({
  product_id: z.string().uuid('ID de produto inválido'),
  type: z.enum(['entrada', 'saida', 'ajuste', 'perda', 'transferencia']),
  quantity: z.number().int().positive('Quantidade deve ser positiva'),
  reason: z.string().optional(),
  reference_id: z.string().optional(),
});

// ============================================
// COMANDA VALIDATIONS
// ============================================

export const createComandaSchema = z.object({
  member_id: z.string().uuid().optional(),
  guest_name: z.string().min(2).optional(),
  notes: z.string().optional(),
}).refine(
  (data) => data.member_id || data.guest_name,
  { message: 'Membro ou nome do convidado é obrigatório', path: ['member_id'] }
);

export const addComandaItemSchema = z.object({
  product_id: z.string().uuid('ID de produto inválido'),
  quantity: z.number().int().positive('Quantidade deve ser positiva'),
  unit_price: positiveNumberSchema.optional(),
  discount: currencySchema.default(0),
  notes: z.string().optional(),
});

export const closeComandaSchema = z.object({
  payment_method: z.enum(['credito', 'debito', 'dinheiro', 'pix', 'transferencia', 'cortesia']),
  discount: currencySchema.default(0),
  notes: z.string().optional(),
});

// ============================================
// PAYMENT VALIDATIONS
// ============================================

export const createPaymentSchema = z.object({
  reference_type: z.enum(['comanda', 'divida', 'mensalidade', 'credito']),
  reference_id: z.string().uuid(),
  member_id: z.string().uuid().optional(),
  amount: positiveNumberSchema,
  method: z.enum(['credito', 'debito', 'dinheiro', 'pix', 'transferencia', 'cortesia']),
});

// ============================================
// CREDIT VALIDATIONS
// ============================================

export const addCreditSchema = z.object({
  member_id: z.string().uuid('ID de membro inválido'),
  amount: positiveNumberSchema,
  description: z.string().optional(),
});

export const transferCreditSchema = z.object({
  from_member_id: z.string().uuid('ID de membro origem inválido'),
  to_member_id: z.string().uuid('ID de membro destino inválido'),
  amount: positiveNumberSchema,
  description: z.string().optional(),
}).refine(
  (data) => data.from_member_id !== data.to_member_id,
  { message: 'Não é possível transferir crédito para o mesmo membro', path: ['to_member_id'] }
);

// ============================================
// FILTER & PAGINATION VALIDATIONS
// ============================================

export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  page_size: z.number().int().positive().max(100).default(20),
  sort_by: z.string().optional(),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

export const dateRangeSchema = z.object({
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional(),
}).refine(
  (data) => {
    if (data.date_from && data.date_to) {
      return new Date(data.date_from) <= new Date(data.date_to);
    }
    return true;
  },
  { message: 'Data inicial deve ser anterior à data final', path: ['date_to'] }
);

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Validates Brazilian CPF
 */
export function validateCPF(cpf: string): boolean {
  // Remove formatting
  cpf = cpf.replace(/[^\d]/g, '');
  
  if (cpf.length !== 11) return false;
  
  // Check for known invalid CPFs
  if (/^(\d)\1{10}$/.test(cpf)) return false;
  
  // Validate first digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i)) * (10 - i);
  }
  let digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(cpf.charAt(9))) return false;
  
  // Validate second digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i)) * (11 - i);
  }
  digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(cpf.charAt(10))) return false;
  
  return true;
}

/**
 * Sanitizes HTML input to prevent XSS
 */
export function sanitizeHtml(input: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  return input.replace(/[&<>"'/]/g, (char) => map[char]);
}

/**
 * Sanitizes user input (removes dangerous characters)
 */
export function sanitizeInput(input: string): string {
  // Remove null bytes and control characters
  return input.replace(/[\x00-\x1F\x7F]/g, '').trim();
}

/**
 * Validates and formats phone number
 */
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11) {
    return `(${digits.substring(0, 2)}) ${digits.substring(2, 7)}-${digits.substring(7)}`;
  } else if (digits.length === 10) {
    return `(${digits.substring(0, 2)}) ${digits.substring(2, 6)}-${digits.substring(6)}`;
  }
  return phone;
}

/**
 * Validates and formats CPF
 */
export function formatCPF(cpf: string): string {
  const digits = cpf.replace(/\D/g, '');
  if (digits.length === 11) {
    return `${digits.substring(0, 3)}.${digits.substring(3, 6)}.${digits.substring(6, 9)}-${digits.substring(9)}`;
  }
  return cpf;
}

/**
 * Validates file upload
 */
export function validateFile(
  file: File,
  options: {
    maxSize?: number; // in bytes
    allowedTypes?: string[];
  } = {}
): { valid: boolean; error?: string } {
  const { maxSize = 5 * 1024 * 1024, allowedTypes = ['image/jpeg', 'image/png', 'image/webp'] } = options;
  
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `Arquivo muito grande. Tamanho máximo: ${(maxSize / 1024 / 1024).toFixed(1)}MB`,
    };
  }
  
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Tipo de arquivo não permitido. Tipos aceitos: ${allowedTypes.join(', ')}`,
    };
  }
  
  return { valid: true };
}

// ============================================
// TYPE EXPORTS
// ============================================

export type CreateMemberInput = z.infer<typeof createMemberSchema>;
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type StockMovementInput = z.infer<typeof stockMovementSchema>;
export type CreateComandaInput = z.infer<typeof createComandaSchema>;
export type AddComandaItemInput = z.infer<typeof addComandaItemSchema>;
export type CloseComandaInput = z.infer<typeof closeComandaSchema>;
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type AddCreditInput = z.infer<typeof addCreditSchema>;
export type TransferCreditInput = z.infer<typeof transferCreditSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type DateRangeInput = z.infer<typeof dateRangeSchema>;

