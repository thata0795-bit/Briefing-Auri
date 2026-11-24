import type { Metadata } from "next";
import { PaginaLegal } from "@/components/legal/pagina-legal";
import { TERMOS_VERSAO } from "@/lib/entrada";

export const metadata: Metadata = { title: "Termos de uso" };

export default function Termos() {
  return (
    <PaginaLegal titulo="Termos de uso" versao={TERMOS_VERSAO}>
      <p>
        Estes termos valem para o uso do portal do cliente, a ferramenta que a sua agência de marketing usa para organizar o trabalho
        feito para a sua marca. Ao entrar, você concorda com as regras abaixo.
      </p>
      <h2>Para que serve o portal</h2>
      <p>
        Acompanhar contrato, briefing, conteúdos, roteiros, agenda, tarefas, arquivos, financeiro e pedidos extras. As condições
        comerciais do serviço (valores, prazos, entregas) estão no contrato assinado com a agência, não nestes termos.
      </p>
      <h2>Seu acesso</h2>
      <ul>
        <li>O acesso é pessoal. Não compartilhe os links de entrada que chegam no seu e-mail.</li>
        <li>Se outra pessoa da sua empresa precisa entrar, peça para a agência criar um acesso para ela.</li>
        <li>Avise a agência se perceber qualquer uso estranho da sua conta.</li>
      </ul>
      <h2>O que você envia</h2>
      <p>
        Você garante que tem direito de uso sobre as imagens, vídeos, logos e textos que envia pelo portal, e autoriza a agência a
        usá-los no trabalho para a sua marca, conforme o contrato.
      </p>
      <h2>Aprovações</h2>
      <p>Aprovações e pedidos de ajuste feitos no portal ficam registrados com data, hora e quem fez, e valem como resposta oficial.</p>
      <h2>Disponibilidade</h2>
      <p>
        Trabalhamos para o portal ficar sempre no ar, mas pode haver pausas para manutenção. Nada do que está no portal se perde nessas
        pausas.
      </p>
      <h2>Mudanças</h2>
      <p>Se estes termos mudarem, você verá a nova versão e precisará aceitar de novo no próximo acesso.</p>
    </PaginaLegal>
  );
}
