// ============================================
// TIPOS TYPESCRIPT — PROJETO-BPO (FINAL)
// ============================================

// ============================================
// LEGACY / COMPAT (mantido para código existente)
// ============================================

// Tipo Database permissivo para compatibilidade com o client Supabase.
// Substituir por tipos gerados (`supabase gen types`) quando disponível.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Database = any;

// Aliases legados referenciados por src/types/index.ts
export type PapelPerfil = 'super_admin' | 'admin' | 'usuario';
export type StatusAssinatura = 'ativa' | 'cancelada' | 'expirada' | 'suspensa';

// ============================================
// ENUMS
// ============================================

export enum PapelEnum {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  USUARIO = 'usuario',
}

export enum PlanoEnum {
  BASICO = 'Básico',
  PROFISSIONAL = 'Profissional',
  ENTERPRISE = 'Enterprise',
}

export enum StatusAssinaturaEnum {
  ATIVA = 'ativa',
  CANCELADA = 'cancelada',
  EXPIRADA = 'expirada',
  SUSPENSA = 'suspensa',
}

export enum StatusDocumentoEnum {
  EM_PROCESSAMENTO = 'em_processamento',
  CONCLUIDO = 'concluido',
  ERRO = 'erro',
  REJEITADO = 'rejeitado',
}

export enum StorageTipoEnum {
  GOOGLE_DRIVE = 'google_drive',
  ONEDRIVE = 'onedrive',
  DROPBOX = 'dropbox',
  S3 = 's3',
  AZURE_BLOB = 'azure_blob',
}

// ============================================
// TIPOS DE TABELAS
// ============================================

export interface Empresa {
  id: string;
  nome: string;
  razao_social?: string;
  cnpj?: string;
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
}

export interface Assinatura {
  id: string;
  empresa_id: string;
  plano: PlanoEnum;
  status: StatusAssinaturaEnum;
  valor_base: number;
  data_inicio?: string;
  data_fim?: string;
  periodo_meses?: number;
  renovacao_automatica?: boolean;
  criado_em: string;
  atualizado_em: string;
}

export interface ItensAssinatura {
  id: string;
  assinatura_id: string;
  modulo_id: string;
  valor: number;
  ativo: boolean;
}

export interface Cliente {
  id: string;
  empresa_id: string;
  nome: string;
  cnpj?: string;
  ativo: boolean;
  url_pasta_drive?: string;
  storage_tipo: StorageTipoEnum;
  storage_config?: Record<string, any>;
  storage_webhook_url?: string;
  criado_em: string;
  atualizado_em: string;
}

export interface Documento {
  id: string;
  empresa_id: string;
  cliente_id?: string;
  titulo: string;
  status: StatusDocumentoEnum;
  tipo?: string;
  valor?: number;
  data_emissao?: string;
  data_vencimento?: string;
  emissor_documento?: string;
  observacoes?: string;
  url_arquivo?: string;
  ativo: boolean;
  metadados?: Record<string, any>;
  criado_em: string;
  atualizado_em?: string;
}

export interface Perfil {
  id: string;
  usuario_id: string;
  empresa_id: string;
  nome: string;
  email: string;
  papel: PapelEnum;
  criado_em: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  created_by?: string;
}

export interface UsuariosClientes {
  id: string;
  perfil_id: string;
  cliente_id: string;
}

export interface Modulo {
  id: string;
  chave: string;
  nome: string;
  ativo: boolean;
  criado_em: string;
}

export interface Evento {
  id: string;
  empresa_id: string;
  tabela: string;
  operacao: 'INSERT' | 'UPDATE' | 'DELETE';
  registro_id: string;
  dados_antes?: Record<string, any>;
  dados_depois?: Record<string, any>;
  usuario_id?: string;
  criado_em: string;
}

// ============================================
// TIPOS DE RESPOSTA DE RPC
// ============================================

export interface CriarClienteResponse {
  cliente_id: string;
  status: string;
  mensagem: string;
}

export interface ProcessarDocumentoResponse {
  documento_id: string;
  status: StatusDocumentoEnum;
  mensagem: string;
}

export interface InativarEmpresaResponse {
  empresa_id: string;
  clientes_inativados: number;
  documentos_inativados: number;
  assinaturas_inativadas: number;
  status: string;
}

export interface AgregacaoFinanceiraResponse {
  total_documentos: number;
  total_valor: number;
  por_status: Array<{
    status: string;
    quantidade: number;
    valor_total: number;
  }>;
  por_tipo: Array<{
    tipo: string;
    quantidade: number;
    valor_total: number;
  }>;
  mrr_estimado: number;
  documentos_30d: number;
}

// ============================================
// TIPOS DE CONTEXTO DE USUÁRIO
// ============================================

export interface UsuarioContexto {
  user_id: string;
  email: string;
  empresa_id: string;
  papel: PapelEnum;
  nome: string;
  is_super_admin: boolean;
}

// ============================================
// TIPOS DE PERMISSÃO
// ============================================

export interface PermissaoMatriz {
  papel: PapelEnum;
  tabela: string;
  acoes: {
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
  };
}

// ============================================
// TIPOS DE WEBHOOK n8n
// ============================================

export interface WebhookDocumentoPayload {
  cliente_id: string;
  empresa_id: string;
  arquivo_nome: string;
  arquivo_url: string;
  arquivo_tipo: string;
  storage_tipo: StorageTipoEnum;
}

export interface WebhookExtrairDadosPayload {
  documento_id: string;
  arquivo_url: string;
  arquivo_tipo: string;
  storage_tipo: StorageTipoEnum;
}

export interface WebhookAtualizarDocumentoPayload {
  documento_id: string;
  status: StatusDocumentoEnum;
  metadados: Record<string, any>;
  erro?: string;
}