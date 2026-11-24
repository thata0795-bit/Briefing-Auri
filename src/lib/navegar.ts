/**
 * Navegação depois de concluir uma ação no servidor (convite, etapa da entrada).
 * Carrega a próxima tela inteira: no Next 15.5, router.push logo após uma
 * server action às vezes não troca de tela. Ver DECISOES.md.
 */
export function navegarDepoisDeSalvar(destino: string) {
  if (!destino.startsWith("/") || destino.startsWith("//")) return;
  window.location.assign(destino);
}
