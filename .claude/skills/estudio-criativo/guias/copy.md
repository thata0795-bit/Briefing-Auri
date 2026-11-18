# Copy e tom de voz por projeto

## Identificar a voz (uma vez por projeto, e sempre que chegar material novo)
1. Junte amostras reais: legendas que o cliente aprovou ou escreveu, áudios transcritos, textos do site, respostas no WhatsApp. Mínimo 5, ideal 15.
2. Salve em `estudio/clientes/<slug>/amostras.txt`, separando os textos com uma linha `---`.
3. `python3 scripts/voz.py analisar <slug> estudio/clientes/<slug>/amostras.txt --gravar` mede ritmo, pessoa gramatical, emoji, exclamação, hashtags, aberturas, fechamentos e vocabulário.
4. Leia as amostras e preencha `voz.md` do cliente: quem fala, com quem, como soa (com exemplo real), palavras da casa, estruturas, exemplos aprovados. As métricas mostram o padrão; a leitura humana mostra a personalidade.
5. Atualize `voz` no `perfil.json` (tom, faz, evita, palavras_proibidas, cta_preferido). Quando a Thauana corrigir um texto, registre a correção em `voz.md` (Exemplos reprovados e por quê) para não repetir.

## Escrever
- Antes: `perfil.py resumo <slug>` e `voz.md`. Para o perfil pessoal da Thauana, siga também a skill `instagram-thauana` (pilares, gargalos, plano semanal).
- Regras fixas de todos os projetos:
  - Nunca travessão (—), nem traço curto (–) entre frases. Use vírgula, ponto, dois-pontos, parênteses ou quebra de linha.
  - Português direto, elegante e natural. Sem linguagem de IA, poética ou institucional. Sem clichê de marketing.
  - Texto que o cliente apresenta ao público dele: segunda pessoa (você, seu, sua).
  - Nada de fato, número, depoimento ou promessa inventados. Se faltar, deixe [colchete] para ela preencher e avise.
  - Primeira linha da legenda funciona sozinha (até ~125 caracteres).
  - Fechamento com ação específica, nunca "o que você acha?".
- Saúde: nada de promessa de cura, diagnóstico ou medo. Moda e beleza: concreto (tecido, caimento, ocasião, cuidado), não adjetivo vazio.
- Entregue completo: legenda, texto de cada slide/tela separado, 3 a 5 hashtags (ou o que o perfil pedir), objetivo do post.

## Revisar (obrigatório antes de entregar)
`python3 scripts/voz.py checar <slug> texto.txt --tipo legenda` (ou `-` para ler da entrada). Erros bloqueiam a entrega. Avisos pedem julgamento: se o desvio é intencional, mantenha e diga por quê em uma linha.
