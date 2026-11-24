import type { Sessao } from "@/lib/sessao";

export type ItemMenu = { href: string; rotulo: string; icone: NomeIcone };
export type NomeIcone = "inicio" | "clientes" | "calendario" | "aprovacoes" | "feed" | "agenda" | "equipe" | "contratos" | "seguranca" | "plataforma";

/** Menu por perfil. Os módulos das próximas fases entram aqui conforme ficam prontos. */
export function montarMenu(sessao: Sessao): ItemMenu[] {
  const { papel } = sessao.perfil;
  const itens: ItemMenu[] = [{ href: "/inicio", rotulo: "Início", icone: "inicio" }];
  if (papel === "admin" || papel === "equipe") itens.push({ href: "/clientes", rotulo: "Clientes", icone: "clientes" });
  itens.push({ href: "/calendario", rotulo: "Calendário", icone: "calendario" });
  itens.push({ href: "/aprovacoes", rotulo: "Aprovações", icone: "aprovacoes" });
  itens.push({ href: "/feed", rotulo: "Prévia do feed", icone: "feed" });
  if (papel === "admin" || papel === "equipe") itens.push({ href: "/agenda/horarios", rotulo: "Horários livres", icone: "agenda" });
  if (papel === "admin") itens.push({ href: "/equipe", rotulo: "Equipe", icone: "equipe" });
  if (papel === "admin") itens.push({ href: "/configuracoes/contratos", rotulo: "Modelos de contrato", icone: "contratos" });
  if (papel !== "cliente") itens.push({ href: "/conta/seguranca", rotulo: "Segurança", icone: "seguranca" });
  if (sessao.donoPlataforma) itens.push({ href: "/plataforma", rotulo: "Plataforma", icone: "plataforma" });
  return itens;
}
