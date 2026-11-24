import { obterSessao } from "@/lib/sessao";
import { montarMenu } from "@/lib/menu";
import { estiloDaMarca, logoDaMarca } from "@/lib/marca";
import { ROTULO_FUNCAO, ROTULO_PAPEL } from "@/lib/tipos";
import { MenuLateral } from "@/components/painel/menu-lateral";

export default async function LayoutPainel({ children }: { children: React.ReactNode }) {
  const sessao = await obterSessao();
  const { perfil, agencia } = sessao;
  const { logo } = logoDaMarca(agencia.marca);
  const rotuloPapel = perfil.funcao ? ROTULO_FUNCAO[perfil.funcao] : ROTULO_PAPEL[perfil.papel];

  return (
    <div style={estiloDaMarca(agencia.marca)} className="min-h-dvh bg-bg lg:flex">
      <a
        href="#conteudo"
        className="sr-only z-50 rounded-md bg-brown px-4 py-2 text-bg focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Pular para o conteúdo
      </a>
      <MenuLateral
        itens={montarMenu(sessao)}
        logo={logo}
        nomeAgencia={agencia.nome}
        nomeUsuario={perfil.nome || perfil.email}
        rotuloPapel={rotuloPapel}
      />
      <main id="conteudo" className="min-w-0 flex-1 px-4 py-8 sm:px-8 lg:px-12 lg:py-12">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>
    </div>
  );
}
