"""Monta um homem a partir da base CC0 do MakeHuman e exporta para three.js (window.HUMANO)."""
import json, sys
from pathlib import Path
import numpy as np

D = Path(sys.argv[1])          # .../makehuman/data
OUT = Path(sys.argv[2])
verts, faces = [], []
grupo = None
for l in open(D / '3dobjs/base.obj'):
    if l.startswith('v '):
        verts.append([float(x) for x in l.split()[1:4]])
    elif l.startswith('g '):
        grupo = l.split()[1].strip()
    elif l.startswith('f ') and grupo == 'body':
        faces.append([int(p.split('/')[0]) - 1 for p in l.split()[1:]])
V = np.array(verts)
def alvo(rel, w):
    for l in open(D / 'targets' / rel):
        if l.startswith('#') or not l.strip(): continue
        p = l.split(); V[int(p[0])] += w * np.array([float(x) for x in p[1:4]])
alvo('macrodetails/caucasian-male-young.target', 1.0)
alvo('macrodetails/universal-male-young-averagemuscle-averageweight.target', 0.6)
alvo('macrodetails/universal-male-young-maxmuscle-averageweight.target', 0.4)
alvo('macrodetails/height/male-young-averagemuscle-averageweight-maxheight.target', 0.25)
alvo('macrodetails/proportions/male-young-averagemuscle-averageweight-idealproportions.target', 0.6)

sk = json.load(open(D / 'rigs/default.mhskel'))
J = {k: V[v].mean(0) for k, v in sk['joints'].items()}
nomes = list(sk['bones'])
# ordena pais antes de filhos
ordem, vistos = [], set()
def visita(n):
    if n in vistos: return
    p = sk['bones'][n]['parent']
    if p: visita(p)
    vistos.add(n); ordem.append(n)
for n in nomes: visita(n)
idx = {n: i for i, n in enumerate(ordem)}
ossos = [dict(nome=n, pai=(idx[sk['bones'][n]['parent']] if sk['bones'][n]['parent'] else -1),
              cabeca=J[sk['bones'][n]['head']].round(4).tolist(), cauda=J[sk['bones'][n]['tail']].round(4).tolist()) for n in ordem]

usados = sorted({i for f in faces for i in f})
remap = {o: i for i, o in enumerate(usados)}
tris = []
for f in faces:
    f = [remap[i] for i in f]
    tris += [f[0], f[1], f[2]] + ([f[0], f[2], f[3]] if len(f) == 4 else [])
pesos = {}
for osso, lst in json.load(open(D / 'rigs/default_weights.mhw'))['weights'].items():
    for v, w in lst:
        if v in remap: pesos.setdefault(remap[v], []).append((w, idx[osso]))
si, sw = [], []
for i in range(len(usados)):
    l = sorted(pesos.get(i, [(1.0, idx['root'])]), reverse=True)[:4]
    t = sum(w for w, _ in l) or 1
    l += [(0.0, 0)] * (4 - len(l))
    si += [b for _, b in l]; sw += [round(w / t, 4) for w, _ in l]
olhos = {}
for lado, grp in (('L', 'helper-l-eye'), ('R', 'helper-r-eye')):
    ids, g = set(), None
    for l in open(D / '3dobjs/base.obj'):
        if l.startswith('g '): g = l.split()[1].strip()
        elif l.startswith('f ') and g == grp: ids.update(int(p.split('/')[0]) - 1 for p in l.split()[1:])
    P = V[sorted(ids)]; c = P.mean(0); r = float(np.abs(P - c).max(0).mean())
    olhos[lado] = dict(centro=c.round(4).tolist(), raio=round(r, 4))
dados = dict(pos=V[usados].round(4).ravel().tolist(), tri=tris, si=si, sw=sw, ossos=ossos, olhos=olhos)
OUT.write_text('window.HUMANO=' + json.dumps(dados, separators=(',', ':')) + ';')
print('vertices', len(usados), 'triangulos', len(tris) // 3, 'ossos', len(ossos), 'altura', round(V[usados][:, 1].max() - V[usados][:, 1].min(), 2),
      'frente(z) nariz', round(V[usados][:, 2].max(), 2), olhos)
