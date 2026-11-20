# Boneco humano 3D (masculino, realista, articulado)

- `humano.js`: malha masculina gerada da base do MakeHuman (CC0, uso comercial livre): 13.380 vértices, 163 ossos, rosto completo.
  Regerar ou mudar o corpo: `python3 -I build_humano.py <makehuman/data> humano.js` (ajuste os pesos dos alvos no script:
  músculo, altura, proporção). Fonte: github.com/makehumancommunity/makehuman, pasta makehuman/data.
- `boneco3d.js`: renderiza com three.js 0.149 (`npm i three@0.149.0`), material de pele, bermuda na cor da marca, luz de estúdio
  com recorte lilás, sombra. API: `Boneco.init(canvas, {alvoY, alturaVisivel, cor, roupa, recorte, frente})`,
  `Boneco.desenha({k, x, respira, giro, extra})` (k: 0 postura curvada, 1 postura ereta), `Boneco.projeta('neck02')` para
  posicionar marcações em pixels (ossos úteis: neck02 cervical, spine04 lombar, lowerleg01.R joelho, foot.R tornozelo).
- Grave com `anima.mjs` (já habilita WebGL). Exemplo completo: estudio/clientes/flaviane-sa/projetos/pilates-homens/reel.html.
