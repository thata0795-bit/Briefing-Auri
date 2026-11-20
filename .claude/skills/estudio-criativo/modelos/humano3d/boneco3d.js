// Boneco anatomico 3D (malha MakeHuman CC0, masculino) com esqueleto e poses por articulacao.
// Uso: Boneco.init(canvas, {cor, fundo}); Boneco.desenha({k, x, respira, giro}); Boneco.projeta('neck01') -> [x, y] em pixels.
(function () {
  var T = THREE, H = window.HUMANO;
  T.ColorManagement.legacyMode = false;
  var renderer, scene, camera, mesh, bones = {}, W, Hh, grupo;

  // posturas: rotacoes em radianos (x = flexao no plano sagital, z = lateral, y = rotacao)
  var GRAU = Math.PI / 180;
  var CURVADO = {
    'spine05': [-5, 0, 0], 'spine04': [3, 0, 0], 'spine03': [6, 0, 0], 'spine02': [9, 0, 0], 'spine01': [10, 0, 0],
    'neck01': [18, 0, 0], 'neck02': [8, 0, 0], 'neck03': [0, 0, 0], 'head': [-28, 0, 0],
    'clavicle.L': [0, 0, -6], 'clavicle.R': [0, 0, 6],
    'upperleg01.L': [4, 0, 0], 'upperleg01.R': [4, 0, 0], 'lowerleg01.L': [-9, 0, 0], 'lowerleg01.R': [-9, 0, 0],
    'foot.L': [4, 0, 0], 'foot.R': [4, 0, 0]
  };
  var ERETO = {
    'spine05': [0, 0, 0], 'spine04': [0, 0, 0], 'spine03': [0, 0, 0], 'spine02': [0, 0, 0], 'spine01': [0, 0, 0],
    'neck01': [0, 0, 0], 'neck02': [0, 0, 0], 'neck03': [0, 0, 0], 'head': [0, 0, 0],
    'clavicle.L': [0, 0, 0], 'clavicle.R': [0, 0, 0],
    'upperleg01.L': [0, 0, 0], 'upperleg01.R': [0, 0, 0], 'lowerleg01.L': [0, 0, 0], 'lowerleg01.R': [0, 0, 0],
    'foot.L': [0, 0, 0], 'foot.R': [0, 0, 0]
  };
  var ABRE = {upper: -50, lower: 4};

  function init(canvas, opt) {
    opt = opt || {};
    W = canvas.width; Hh = canvas.height;
    renderer = new T.WebGLRenderer({canvas: canvas, antialias: true, alpha: true, preserveDrawingBuffer: true});
    renderer.setPixelRatio(1); renderer.setSize(W, Hh, false);
    renderer.outputEncoding = T.sRGBEncoding; renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
    scene = new T.Scene();
    var alt = opt.alturaVisivel || 22;
    camera = new T.OrthographicCamera(-alt * W / Hh / 2, alt * W / Hh / 2, alt / 2, -alt / 2, 0.1, 200);
    if (opt.frente) { camera.position.set(0, opt.alvoY || 0.6, 60); } else { camera.position.set(-60, opt.alvoY || 0.6, opt.camZ || 0); }
    camera.lookAt(0, opt.alvoY || 0.6, opt.frente ? 0 : (opt.camZ || 0));

    // malha
    var g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(H.pos, 3));
    g.setIndex(H.tri);
    g.setAttribute('skinIndex', new T.Uint16BufferAttribute(H.si, 4));
    g.setAttribute('skinWeight', new T.Float32BufferAttribute(H.sw, 4));
    g.computeVertexNormals();
    var cores = [], pele = new T.Color(opt.cor || '#C9987C'), roupa = new T.Color(opt.roupa || '#3D2050');
    for (var vi = 0; vi < H.pos.length; vi += 3) {
      var x = H.pos[vi], y = H.pos[vi + 1];
      var c = (y < 3.05 && y > 0.15 && Math.abs(x) < 2.75) ? roupa : pele;
      cores.push(c.r, c.g, c.b);
    }
    g.setAttribute('color', new T.Float32BufferAttribute(cores, 3));
    var lista = [];
    H.ossos.forEach(function (o, i) {
      var b = new T.Bone(); b.name = o.nome;
      var pai = o.pai >= 0 ? H.ossos[o.pai].cabeca : [0, 0, 0];
      b.position.set(o.cabeca[0] - pai[0], o.cabeca[1] - pai[1], o.cabeca[2] - pai[2]);
      if (o.pai >= 0) lista[o.pai].add(b);
      lista.push(b); bones[o.nome] = b;
    });
    var mat = new T.MeshPhysicalMaterial({vertexColors: true, color: '#FFFFFF', roughness: 0.55, metalness: 0,
      clearcoat: 0.15, clearcoatRoughness: 0.6, sheen: 0.4, sheenColor: new T.Color('#F3D9CC'), sheenRoughness: 0.6});
    mesh = new T.SkinnedMesh(g, mat);
    mesh.add(lista[0]);
    mesh.bind(new T.Skeleton(lista));
    mesh.castShadow = true; mesh.receiveShadow = true;
    grupo = new T.Group(); grupo.add(mesh);
    // olhos
    var olhoMat = new T.MeshPhysicalMaterial({color: '#F4F1EE', roughness: 0.15, clearcoat: 1});
    var irisMat = new T.MeshStandardMaterial({color: '#4A3626', roughness: 0.3});
    ['L', 'R'].forEach(function (lado) {
      var o = H.olhos[lado], cabeca = bones['head'];
      var e = new T.Mesh(new T.SphereGeometry(o.raio * 0.98, 32, 24), olhoMat);
      var iris = new T.Mesh(new T.CircleGeometry(o.raio * 0.45, 32), irisMat);
      iris.position.z = o.raio * 0.97; e.add(iris);
      var hw = cabeca.getWorldPosition(new T.Vector3());
      e.position.set(o.centro[0] - hw.x, o.centro[1] - hw.y, o.centro[2] - hw.z - o.raio * 0.15);
      cabeca.add(e);
    });
    scene.add(grupo);

    // luz de estudio: principal quente, recorte lilas, preenchimento suave
    scene.add(new T.HemisphereLight('#FFF6F0', '#6E5878', 0.55));
    var key = new T.DirectionalLight('#FFF1E6', 2.2); key.position.set(-30, 30, 22); key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048); var sc = key.shadow.camera; sc.left = -14; sc.right = 14; sc.top = 14; sc.bottom = -14; sc.far = 120;
    key.shadow.bias = -0.0004; scene.add(key);
    var rim = new T.DirectionalLight(opt.recorte || '#B89BCB', 2.4); rim.position.set(20, 16, -26); scene.add(rim);
    var fill = new T.DirectionalLight('#E9DDF2', 0.7); fill.position.set(-20, -4, -18); scene.add(fill);
    // chao que so recebe sombra
    var chao = new T.Mesh(new T.PlaneGeometry(80, 80), new T.ShadowMaterial({opacity: 0.18, color: '#3D2050'}));
    chao.rotation.x = -Math.PI / 2; chao.position.y = minY(); chao.receiveShadow = true; scene.add(chao);
  }
  function minY() { var m = 1e9; for (var i = 1; i < H.pos.length; i += 3) m = Math.min(m, H.pos[i]); return m; }

  function aplica(k, respira, extra) {
    for (var n in bones) bones[n].rotation.set(0, 0, 0);
    for (var nome in CURVADO) {
      var b = bones[nome]; if (!b) continue;
      var a = CURVADO[nome], e = ERETO[nome];
      b.rotation.x = (a[0] + (e[0] - a[0]) * k) * GRAU;
      b.rotation.y = (a[1] + (e[1] - a[1]) * k) * GRAU;
      b.rotation.z = (a[2] + (e[2] - a[2]) * k) * GRAU;
    }
    bones['spine02'].rotation.x += (respira || 0) * GRAU;
    if (extra) for (var n2 in extra) { var bb = bones[n2]; bb.rotation.x += extra[n2][0] * GRAU; bb.rotation.y += extra[n2][1] * GRAU; bb.rotation.z += extra[n2][2] * GRAU; }
    // bracos: aponta cada segmento para a direcao desejada (em coordenadas do corpo)
    ['L', 'R'].forEach(function (s) {
      var sg = s === 'L' ? 1 : -1;
      var fu = 0.30 + (0.04 - 0.30) * k, fl = 0.42 + (0.12 - 0.42) * k;
      mira('upperarm01.' + s, 'lowerarm01.' + s, new T.Vector3(sg * 0.12, -1, fu));
      mira('lowerarm01.' + s, 'wrist.' + s, new T.Vector3(sg * 0.05, -1, fl));
    });
    // mantem os pes no chao: compensa o deslocamento vertical do tornozelo
    grupo.position.set(0, 0, 0); grupo.updateMatrixWorld(true);
    var tornozelo = bones['foot.R'].getWorldPosition(new T.Vector3());
    grupo.position.y = (H.ossos.find(function (o) { return o.nome === 'foot.R'; }).cabeca[1]) - tornozelo.y;
    grupo.position.z = -(tornozelo.z - H.ossos.find(function (o) { return o.nome === 'foot.R'; }).cabeca[2]);
  }

  function mira(nome, filho, alvo) {
    var b = bones[nome], c = bones[filho];
    grupo.updateMatrixWorld(true);
    var pb = b.getWorldPosition(new T.Vector3()), pc = c.getWorldPosition(new T.Vector3());
    var atual = pc.sub(pb).normalize(), desejado = alvo.clone().normalize();
    var q = new T.Quaternion().setFromUnitVectors(atual, desejado);
    var qw = b.getWorldQuaternion(new T.Quaternion());
    var nova = q.multiply(qw);
    var qp = b.parent.getWorldQuaternion(new T.Quaternion()).invert();
    b.quaternion.copy(qp.multiply(nova));
  }
  function desenha(p) {
    aplica(p.k || 0, p.respira || 0, p.extra);
    grupo.position.z += p.x || 0;
    grupo.rotation.y = (p.giro || 0) * GRAU;
    grupo.updateMatrixWorld(true);
    renderer.render(scene, camera);
  }
  function projeta(nome) {
    var v = bones[nome].getWorldPosition(new T.Vector3()).project(camera);
    return [(v.x + 1) / 2 * W, (1 - v.y) / 2 * Hh];
  }
  window.Boneco = {init: init, desenha: desenha, projeta: projeta, bones: bones};
})();
