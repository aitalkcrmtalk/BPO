import type { Database, PapelPerfil, StatusAssinatura } from "./database";

export type Empresa = Database["public"]["Tables"]["empresas"]["Row"];
export type Perfil = Database["public"]["Tables"]["perfis"]["Row"];
export type Assinatura = Database["public"]["Tables"]["assinaturas"]["Row"];
export type Cliente = Database["public"]["Tables"]["clientes"]["Row"];
export type Documento = Database["public"]["Tables"]["documentos"]["Row"];
export type Modulo = Database["public"]["Tables"]["modulos"]["Row"];

export interface EmpresaContext {
  empresa: Empresa | null;
  perfil: Perfil | null;
  papel: PapelPerfil | string | null;
  assinatura: Assinatura | null;
  modulosAtivos: Modulo[];
  isSuperAdmin: boolean;
  subscriptionStatus: StatusAssinatura | string | null;
}

// Alias legado — algumas telas ainda referenciam este nome.
export type TenantContext = EmpresaContext;