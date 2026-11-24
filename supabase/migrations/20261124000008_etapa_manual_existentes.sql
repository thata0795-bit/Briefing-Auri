-- Clientes que já existiam ganham a etapa do manual. Quem já concluiu a entrada
-- fica com ela concluída; quem está no meio, com ela a fazer.
insert into public.etapas_entrada (cliente_id, agencia_id, etapa, status, concluido_em)
select c.id, c.agencia_id, 'manual',
       case when c.entrada_concluida_em is not null then 'concluido'::public.status_item else 'a_fazer'::public.status_item end,
       c.entrada_concluida_em
from public.clientes c
on conflict (cliente_id, etapa) do nothing;

-- Manual da parceria de exemplo para as agências que ainda não têm texto.
update public.agencias
   set manual_parceria = $manual$## Comunicação
- O chat do portal é o canal oficial com a agência. Respondemos em dias úteis, das 9h às 18h, em até 1 dia útil.
- Assuntos urgentes no dia de uma captação podem ser tratados por telefone com o responsável.

## Prazos e aprovações
- Os conteúdos do mês ficam disponíveis para aprovação com pelo menos 3 dias de antecedência.
- Pedimos a resposta em até 48 horas. Sem resposta, o post é reprogramado para não sair sem a sua aprovação.

## Materiais e captações
- Fotos, vídeos e informações para campanhas devem chegar com 5 dias úteis de antecedência.
- Captações são marcadas no portal e você recebe o lembrete dois dias antes.

## Escopo
- O que está incluso no plano aparece no seu contrato.
- Pedidos fora do pacote são feitos pelo portal e recebem prazo e orçamento antes de começar.$manual$
 where manual_parceria is null;
