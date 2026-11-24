import type { Sessao } from "@/lib/sessao";

export type ItemMenu = { href: string; rotulo: string; icone: NomeIcone; contador?: number };
export type NomeIcone =
  | "inicio"
  | "clientes"
  | "calendario"
  | "aprovacoes"
  | "mensagens"
  | "estrategia"
  | "feed"
  | "documentos"
  | "financeiro"
  | "agenda"
  | "equipe"
  | "contratos"
  | "manual"
  | "seguranca"
  | "plataforma";

/** Menu por perfil. Financeiro só para admin e cliente; configurações só para admin. */
export function montarMenu(sessao: Sessao, naoLidas = 0): ItemMenu[] {
  const { papel } = sessao.perfil;
  const agencia = papel !== "cliente";
  const itens: ItemMenu[] = [{ href: "/inicio", rotulo: "Início", icone: "inicio" }];
  if (agencia) itens.push({ href: "/clientes", rotulo: "Clientes", icone: "clientes" });
  itens.push(
    { href: "/calendario", rotulo: "Calendário", icone: "calendario" },
    { href: "/aprovacoes", rotulo: "Aprovações", icone: "aprovacoes" },
    { href: "/mensagens", rotulo: agencia ? "Mensagens" : "Chat com a agência", icone: "mensagens", contador: naoLidas },
    { href: "/estrategia", rotulo: "Estratégia e reuniões", icone: "estrategia" },
    { href: "/feed", rotulo: "Prévia do feed", icone: "feed" },
    { href: "/documentos", rotulo: "Documentos", icone: "documentos" },
  );
  if (papel !== "equipe") itens.push({ href: "/financeiro", rotulo: "Financeiro", icone: "financeiro" });
  if (agencia) itens.push({ href: "/agenda/horarios", rotulo: "Horários livres", icone: "agenda" });
  if (papel === "admin") {
    itens.push(
      { href: "/equipe", rotulo: "Equipe", icone: "equipe" },
      { href: "/configuracoes/contratos", rotulo: "Modelos de contrato", icone: "contratos" },
      { href: "/configuracoes/manual", rotulo: "Manual da parceria", icone: "manual" },
    );
  }
  if (agencia) itens.push({ href: "/conta/seguranca", rotulo: "Segurança", icone: "seguranca" });
  if (sessao.donoPlataforma) itens.push({ href: "/plataforma", rotulo: "Plataforma", icone: "plataforma" });
  return itens;
}
