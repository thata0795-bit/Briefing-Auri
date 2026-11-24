import type { Metadata } from "next";
import { PaginaLegal } from "@/components/legal/pagina-legal";
import { TERMOS_VERSAO } from "@/lib/entrada";

export const metadata: Metadata = { title: "Política de privacidade" };

const DADOS = [
  ["Nome, e-mail e telefone de quem tem acesso", "Entrar no portal, receber avisos e lembretes."],
  ["Dados da empresa e do contrato", "Emitir o contrato, cobranças e notas."],
  ["Respostas do briefing", "Planejar a estratégia e os conteúdos da marca."],
  ["Arquivos enviados (logo, fotos, vídeos)", "Produzir os conteúdos."],
  ["Agenda de reuniões e captações", "Marcar e lembrar os compromissos."],
  ["Registro de aprovações e acessos", "Segurança e histórico do que foi combinado."],
];

export default function Privacidade() {
  return (
    <PaginaLegal titulo="Política de privacidade" versao={TERMOS_VERSAO}>
      <p>
        Esta política explica quais dados o portal guarda, para quê, e como você pode consultar, corrigir ou pedir a exclusão deles,
        conforme a Lei Geral de Proteção de Dados (Lei 13.709/2018).
      </p>
      <h2>Quem cuida dos seus dados</h2>
      <p>
        A agência que atende você é a controladora dos dados: é ela que decide como eles são usados no trabalho para a sua marca. O
        portal é a ferramenta que a agência usa para isso e trata os dados em nome dela.
      </p>
      <h2>Quais dados e para quê</h2>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead className="bg-soft text-xs text-muted uppercase">
            <tr>
              <th scope="col" className="px-3 py-2 font-medium">Dado</th>
              <th scope="col" className="px-3 py-2 font-medium">Para que usamos</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {DADOS.map(([d, f]) => (
              <tr key={d}>
                <td className="px-3 py-2">{d}</td>
                <td className="px-3 py-2">{f}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h2>O que não guardamos</h2>
      <ul>
        <li>Senhas das suas redes sociais. O acesso é sempre por convite dentro de cada plataforma.</li>
        <li>Número de cartão de crédito. Pagamentos são processados pela empresa de cobrança, que segue as regras do setor.</li>
      </ul>
      <h2>Com quem compartilhamos</h2>
      <p>
        Só com os serviços necessários para o portal funcionar: hospedagem e banco de dados, envio de e-mail, cobrança e assinatura
        eletrônica de contrato. Nenhum dado é vendido ou usado para publicidade.
      </p>
      <h2>Segurança</h2>
      <p>
        Os dados ficam em servidores com acesso restrito. Cada pessoa só vê o que é da própria conta, e arquivos são abertos por links
        temporários. Registramos quem fez cada aprovação, pagamento e acesso ao financeiro.
      </p>
      <h2>Por quanto tempo</h2>
      <p>
        Enquanto o contrato com a agência estiver ativo. Depois do fim do contrato, os dados são apagados no prazo combinado com a
        agência, exceto o que a lei obriga a manter (como documentos fiscais).
      </p>
      <h2>Seus direitos</h2>
      <p>
        Você pode pedir a qualquer momento uma cópia dos seus dados, a correção do que estiver errado ou a exclusão do que não for mais
        necessário. Fale com a agência que atende você.
      </p>
    </PaginaLegal>
  );
}
