import { Text } from "@react-email/components";
import { EmailBase, estiloMudo, estiloTexto, type MarcaEmail } from "./base";

export function EmailConvite({
  marca,
  nome,
  link,
  responsavel,
  equipe,
}: {
  marca: MarcaEmail;
  nome: string;
  link: string;
  responsavel?: string | null;
  equipe?: boolean;
}) {
  return (
    <EmailBase
      marca={marca}
      previa={`Seu acesso ao portal da ${marca.nomeAgencia} está pronto.`}
      titulo={nome ? `${nome}, seu acesso está pronto` : "Seu acesso está pronto"}
      botao={{ texto: "Acessar o portal", href: link }}
    >
      {equipe ? (
        <Text style={estiloTexto}>
          Você foi convidado para a equipe da {marca.nomeAgencia} no portal. No primeiro acesso, você cria a sua senha.
        </Text>
      ) : (
        <>
          <Text style={estiloTexto}>
            É pelo portal que você acompanha o trabalho da {marca.nomeAgencia} na sua marca: contrato, briefing, conteúdos, agenda e
            financeiro, tudo em um lugar só.
          </Text>
          <Text style={estiloTexto}>
            No primeiro acesso, você passa por quatro etapas rápidas: contrato, briefing, liberação de acessos e a escolha do horário da
            primeira reunião. Dá para parar e voltar quando quiser.
          </Text>
          {responsavel && <Text style={estiloTexto}>Quem vai cuidar da sua marca: {responsavel}.</Text>}
        </>
      )}
      <Text style={estiloMudo}>O link vale por 7 dias e funciona uma vez. Se vencer, peça um novo para a agência.</Text>
    </EmailBase>
  );
}
