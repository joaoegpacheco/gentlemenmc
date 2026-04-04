/**
 * Colunas da tabela public.membros (GET explícito na listagem/admin).
 * Alinhar com o schema do Supabase ao adicionar/remover colunas.
 */
export const MEMBROS_ADMIN_COLUMNS = [
  "id",
  "created_at",
  "user_id",
  "user_name",
  "user_email",
  "phone",
  "foto_url",
  "observacoes",
  "status",
  "case_type",
  "half_date",
  "cpf",
  "date_of_birth",
  "motorcycle",
  "motorcycle_license_plate",
  "emergency_telephone_number",
  "emergency_contact",
  "kinship_contact_emergency",
] as const;

export const MEMBROS_ADMIN_SELECT = MEMBROS_ADMIN_COLUMNS.join(", ");
