// Tipos alinhados ao schema pt-BR real do Supabase.
// Todas as colunas de status/papel são text (sem enums no banco).

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type PapelPerfil = "usuario" | "admin";
export type PapelPlataforma = "super_admin";
export type StatusAssinatura = "ativa" | "trial" | "atrasada" | "cancelada" | "incompleta";
export type StatusDocumento = "pendente" | "processando" | "processado" | "erro";

export interface Database {
  public: {
    Tables: {
      empresas: {
        Row: {
          id: string;
          nome: string;
          razao_social: string | null;
          cnpj: string | null;
          ativo: boolean;
          criado_em: string;
          atualizado_em: string;
        };
        Insert: {
          id?: string;
          nome: string;
          razao_social?: string | null;
          cnpj?: string | null;
          ativo?: boolean;
          criado_em?: string;
          atualizado_em?: string;
        };
        Update: Partial<Database["public"]["Tables"]["empresas"]["Insert"]>;
      };
      perfis: {
        Row: {
          id: string;
          usuario_id: string;
          empresa_id: string;
          nome: string;
          email: string;
          papel: PapelPerfil | string;
          criado_em: string;
        };
        Insert: {
          id?: string;
          usuario_id: string;
          empresa_id: string;
          nome: string;
          email: string;
          papel?: PapelPerfil | string;
          criado_em?: string;
        };
        Update: Partial<Database["public"]["Tables"]["perfis"]["Insert"]>;
      };
      user_roles: {
        Row: {
          id: string;
          user_id: string;
          role: PapelPlataforma | string;
          created_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          role: PapelPlataforma | string;
          created_at?: string;
          created_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["user_roles"]["Insert"]>;
      };
      clientes: {
        Row: {
          id: string;
          empresa_id: string;
          nome: string;
          cnpj: string | null;
          url_pasta_drive: string | null;
          criado_em: string;
          atualizado_em: string;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          nome: string;
          cnpj?: string | null;
          url_pasta_drive?: string | null;
          criado_em?: string;
          atualizado_em?: string;
        };
        Update: Partial<Database["public"]["Tables"]["clientes"]["Insert"]>;
      };
      documentos: {
        Row: {
          id: string;
          empresa_id: string;
          cliente_id: string | null;
          titulo: string;
          status: StatusDocumento | string;
          metadados: Json;
          url_arquivo: string | null;
          criado_em: string;
          tipo: string;
          valor: number | null;
          data_emissao: string | null;
          data_vencimento: string | null;
          emissor_documento: string | null;
          observacoes: string | null;
          atualizado_em: string;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          cliente_id?: string | null;
          titulo: string;
          status?: StatusDocumento | string;
          metadados?: Json;
          url_arquivo?: string | null;
          criado_em?: string;
          tipo?: string;
          valor?: number | null;
          data_emissao?: string | null;
          data_vencimento?: string | null;
          emissor_documento?: string | null;
          observacoes?: string | null;
          atualizado_em?: string;
        };
        Update: Partial<Database["public"]["Tables"]["documentos"]["Insert"]>;
      };
      modulos: {
        Row: {
          id: string;
          chave: string;
          nome: string;
          ativo: boolean;
          criado_em: string;
        };
        Insert: {
          id?: string;
          chave: string;
          nome: string;
          ativo?: boolean;
          criado_em?: string;
        };
        Update: Partial<Database["public"]["Tables"]["modulos"]["Insert"]>;
      };
      assinaturas: {
        Row: {
          id: string;
          empresa_id: string;
          plano: string;
          status: StatusAssinatura | string;
          valor_base: number;
          criado_em: string;
          atualizado_em: string;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          plano: string;
          status?: StatusAssinatura | string;
          valor_base?: number;
          criado_em?: string;
          atualizado_em?: string;
        };
        Update: Partial<Database["public"]["Tables"]["assinaturas"]["Insert"]>;
      };
      itens_assinatura: {
        Row: {
          id: string;
          assinatura_id: string;
          modulo_id: string;
          ativo: boolean;
        };
        Insert: {
          id?: string;
          assinatura_id: string;
          modulo_id: string;
          ativo?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["itens_assinatura"]["Insert"]>;
      };
      usuarios_clientes: {
        Row: {
          id: string;
          perfil_id: string;
          cliente_id: string;
        };
        Insert: {
          id?: string;
          perfil_id: string;
          cliente_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["usuarios_clientes"]["Insert"]>;
      };
    };
    Views: Record<string, never>;
    Functions: {
      has_platform_role: { Args: { _user_id: string; _role: string }; Returns: boolean };
      get_empresa_do_usuario: { Args: { _user_id: string }; Returns: string };
    };
    Enums: Record<string, never>;
  };
}