"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, ChartNoAxesColumn, Building2, CalendarClock, CalendarDays, CheckCheck, Compass, FileText, FolderOpen, Grid3x3, House, LogOut, Menu, MessageCircle, ShieldCheck, Users, UsersRound, Wallet, X } from "lucide-react";
import type { ItemMenu, NomeIcone } from "@/lib/menu";

const ICONES: Record<NomeIcone, typeof House> = {
  inicio: House,
  clientes: UsersRound,
  calendario: CalendarDays,
  aprovacoes: CheckCheck,
  feed: Grid3x3,
  mensagens: MessageCircle,
  estrategia: Compass,
  relatorios: ChartNoAxesColumn,
  documentos: FolderOpen,
  financeiro: Wallet,
  manual: BookOpen,
  agenda: CalendarClock,
  contratos: FileText,
  equipe: Users,
  seguranca: ShieldCheck,
  plataforma: Building2,
};

type Props = {
  itens: ItemMenu[];
  logo: string;
  nomeAgencia: string;
  nomeUsuario: string;
  rotuloPapel: string;
};

export function MenuLateral({ itens, logo, nomeAgencia, nomeUsuario, rotuloPapel }: Props) {
  const caminho = usePathname();
  const [aberto, setAberto] = useState(false);

  useEffect(() => setAberto(false), [caminho]);

  useEffect(() => {
    if (!aberto) return;
    const fechar = (e: KeyboardEvent) => e.key === "Escape" && setAberto(false);
    document.addEventListener("keydown", fechar);
    return () => document.removeEventListener("keydown", fechar);
  }, [aberto]);

  const conteudo = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-center bg-brown-mid px-6 py-8">
        <Image src={logo} alt={nomeAgencia} width={903} height={685} priority className="h-auto w-36" />
      </div>
      <nav aria-label="Menu principal" className="flex-1 overflow-y-auto px-3 py-6">
        <ul className="flex flex-col gap-1">
          {itens.map((item) => {
            const Icone = ICONES[item.icone];
            const ativo = caminho === item.href || caminho.startsWith(`${item.href}/`);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={ativo ? "page" : undefined}
                  className={`flex min-h-11 items-center gap-3 rounded-md px-3 text-sm transition-colors duration-200 ${
                    ativo ? "bg-brown text-bg" : "text-text hover:bg-soft"
                  }`}
                >
                  <Icone aria-hidden className={`size-4.5 ${ativo ? "text-gold-light" : "text-muted"}`} />
                  <span className="flex-1">{item.rotulo}</span>
                  {!!item.contador && (
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${ativo ? "bg-gold-light text-brown-dark" : "bg-st-fix text-bg"}`}>
                      {item.contador}
                      <span className="sr-only"> não lidas</span>
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="border-t border-line px-5 py-4">
        <p className="truncate text-sm font-medium text-text">{nomeUsuario}</p>
        <p className="text-xs text-muted">{rotuloPapel}</p>
        <form action="/auth/sair" method="post" className="mt-3">
          <button
            type="submit"
            className="inline-flex min-h-11 items-center gap-2 text-sm text-brown underline-offset-4 hover:underline"
          >
            <LogOut aria-hidden className="size-4" />
            Sair
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <>
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-bg/95 px-4 py-2 backdrop-blur lg:hidden">
        <button
          type="button"
          onClick={() => setAberto(true)}
          aria-expanded={aberto}
          aria-controls="menu-movel"
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-brown hover:bg-soft"
        >
          <Menu aria-hidden className="size-5" />
          <span className="sr-only">Abrir menu</span>
        </button>
        <span className="truncate font-serif text-lg text-brown-dark">{nomeAgencia}</span>
        <span className="min-w-11" aria-hidden />
      </div>

      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 border-r border-line bg-card lg:block">{conteudo}</aside>

      {aberto && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu" id="menu-movel">
          <button
            type="button"
            className="absolute inset-0 bg-brown-dark/40"
            onClick={() => setAberto(false)}
            aria-label="Fechar menu"
          />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-card shadow-xl">
            <button
              type="button"
              onClick={() => setAberto(false)}
              className="absolute top-2 right-2 z-10 inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-bg hover:bg-brown"
            >
              <X aria-hidden className="size-5" />
              <span className="sr-only">Fechar menu</span>
            </button>
            {conteudo}
          </div>
        </div>
      )}
    </>
  );
}
