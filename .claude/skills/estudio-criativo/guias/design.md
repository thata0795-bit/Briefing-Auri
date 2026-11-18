# Design fiel às referências (posts, carrosséis, stories, capas, logos)

A peça tem que parecer feita pela mesma mão das referências que o cliente aprovou. Gosto pessoal, tendência e "deixar mais bonito" ficam fora. Se a referência é minimalista e bege, a peça é minimalista e bege, mesmo que um gradiente vibrante pareça mais chamativo.

## Antes de desenhar
1. `python3 scripts/perfil.py resumo <slug>`: paleta, fontes, regras, proibições.
2. Referências: imagens em `estudio/clientes/<slug>/referencias/` ou enviadas na conversa (salve lá). Rode:
   `python3 scripts/referencias.py analisar estudio/clientes/<slug>/referencias --saida estudio/clientes/<slug>/referencias/ficha`
   e leia o `ficha.png` (Read) e a leitura objetiva (luz, saturação, temperatura, contraste, respiro, paleta medida).
3. Olhe cada referência (Read) e anote a **gramática visual** em `estudio/clientes/<slug>/referencias/gramatica.md` se ainda não existir:
   - Grid e margens (margem em % da largura, alinhamento à esquerda, centro ou assimétrico).
   - Hierarquia: tamanho do título em relação à largura, quantos níveis de texto, caixa alta ou não, tracking.
   - Tipografia: serifa ou sans, peso, itálico, contraste entre título e corpo, onde entra a fonte de acento.
   - Uso de foto: sangrada, recortada, com moldura, filtro, proporção na página.
   - Elementos gráficos: linhas finas, números grandes, selos, texturas, sombras. O que nunca aparece.
   - Proporção de cor: quanto é fundo, quanto é texto, quanto é acento (ex.: 80/15/5).
   - Densidade: quantas palavras por peça, quanto espaço vazio.
4. Se não há referência nenhuma e o cliente não tem identidade, pergunte uma vez se ela quer mandar referências ou se você parte do briefing. Se ela mandar seguir, use o briefing e diga isso na entrega.

## Construir
- Copie `modelos/peca-base.html` para a pasta do trabalho e escreva a peça em HTML/CSS usando só as variáveis de marca (`var(--bg)`, `var(--acc)`, `var(--fonte-titulo)`...). Cor fora do perfil só se estiver na paleta medida das referências.
- Uma `.pagina` por slide ou peça (`data-nome` define o arquivo). Tamanhos: feed 1080x1350, quadrado 1080x1080, story e capa de Reels 1080x1920 (texto dentro da área central de 1080x1350, longe dos 250 px de cima e de baixo).
- Carrossel: mesmo grid, margens e tamanhos em todas as páginas; só o conteúdo muda. Slide 1 é o gancho; o último resume e pede uma ação.
- Interações JS, se houver em algum HTML, com addEventListener, nunca handler inline.
- Renderize: `node scripts/render.mjs peca.html --saida export --cliente <slug>` (acrescente `--pdf nome.pdf` para PDF; `--escala 2` para impressão). Se aparecer "AVISO fontes", corrija antes de seguir.

## Conferir fidelidade (obrigatório)
1. `python3 scripts/referencias.py comparar estudio/clientes/<slug>/referencias/ficha.json export/*.png --saida export/conferencia`
2. Leia cada `comparacao_*.jpg` (Read). Nota abaixo de 80 ou cor fora da paleta: ajuste e renderize de novo. Corrija pelo desvio apontado (ex.: "luminosidade: baixar para perto de 62" significa fundo mais escuro ou foto maior).
3. Confira a gramática visual à mão: margem, hierarquia, tipografia e densidade iguais às referências. A métrica mede cor e luz; o olho mede composição.
4. Leia todo texto da peça com `voz.py checar` (copy também é marca).
5. Entregue os PNG com SendUserFile e o texto de cada slide separado (ela finaliza no Canva). Diga em uma linha o que foi seguido da referência e qualquer desvio intencional.

## Logo
- Pesquisa primeiro: segmento, concorrentes (para fugir deles), adjetivos do briefing, referências.
- Desenhe em SVG à mão (`<svg class="logo-svg" data-nome="logo-positivo">`), com 3 rotas diferentes de conceito (tipográfica, símbolo + tipografia, monograma/selo). Nada de clip-art, ícone óbvio do segmento (tesoura para salão, dente para dentista) ou gradiente sem motivo.
- Cada rota em prancha 2000x2000 com: versão principal, versão reduzida (favicon/perfil 110 px), positivo e negativo, e aplicação simulada (post e capa de destaque).
- Exporte: `node scripts/render.mjs logo.html --saida logo --cliente <slug>` e, para PNG sem fundo, `--transparente`. O SVG sai junto.
- Confirmada a rota, grave o arquivo em `estudio/clientes/<slug>/logo/` e rode `perfil.py logo-cores <slug> logo/logo.png` para fechar a paleta.

## Proibido
- Inventar estética que não está nas referências.
- Formas geométricas decorativas sem função, cara de flyer, mockup genérico.
- Texto com travessão.
- Usar a identidade da Auri (oliva, areia, Cormorant) em cliente que não seja a Auri.
