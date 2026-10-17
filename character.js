// 3D official in an ak-kalpak. API: createCharacter(container) -> { setLook, react, setEnding, reset, preview }
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
let seed = 7;
const rand = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

function canvasTex(w, h, draw, opts = {}) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  draw(g, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = opts.linear ? THREE.NoColorSpace : THREE.SRGBColorSpace;
  t.anisotropy = 4;
  if (opts.repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(opts.repeat[0], opts.repeat[1]); }
  return t;
}

function fabricTex() {
  return canvasTex(256, 256, (g, w, h) => {
    const id = g.createImageData(w, h);
    for (let i = 0; i < w * h; i++) {
      const x = i % w, y = (i / w) | 0;
      const tw = ((x + y) % 4 < 2) ? 0 : -16;
      const v = 222 + tw + (rand() - 0.5) * 24;
      id.data[i * 4] = v; id.data[i * 4 + 1] = v; id.data[i * 4 + 2] = v; id.data[i * 4 + 3] = 255;
    }
    g.putImageData(id, 0, 0);
    g.fillStyle = 'rgba(255,255,255,0.16)';
    for (let x = 8; x < w; x += 32) g.fillRect(x, 0, 1.5, h);
  }, { repeat: [4, 4] });
}

function feltTex(color) {
  return canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = color; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 2600; i++) {
      const v = 120 + rand() * 130 | 0;
      g.strokeStyle = `rgba(${v},${v},${v},0.35)`;
      g.lineWidth = 1;
      const x = rand() * w, y = rand() * h, a = rand() * 6.28, l = 3 + rand() * 7;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
    }
  }, { repeat: [3, 3] });
}

function spiral(g, cx, cy, r0, dir, turns) {
  g.beginPath();
  const n = 60;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const a = dir * t * turns * Math.PI * 2;
    const r = r0 * (1 - t * 0.88);
    const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
    if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
  }
  g.stroke();
}

function motif(g, cx, cy, s) {
  g.strokeStyle = '#f2c230'; g.fillStyle = '#f2c230'; g.lineCap = 'round'; g.lineWidth = Math.max(3, s * 0.11);
  spiral(g, cx - s * 0.95, cy, s * 0.62, 1, 1.35);
  spiral(g, cx + s * 0.95, cy, s * 0.62, -1, 1.35);
  g.beginPath(); g.moveTo(cx - s * 0.4, cy + s * 0.55); g.quadraticCurveTo(cx, cy + s * 0.15, cx + s * 0.4, cy + s * 0.55); g.stroke();
  g.beginPath(); g.moveTo(cx, cy - s * 0.5); g.lineTo(cx + s * 0.22, cy); g.lineTo(cx, cy + s * 0.5); g.lineTo(cx - s * 0.22, cy); g.closePath(); g.fill();
  g.fillStyle = '#ffffff';
  g.beginPath(); g.arc(cx, cy, s * 0.07, 0, 6.28); g.fill();
}

function bandTex() {
  return canvasTex(1024, 192, (g, w, h) => {
    g.fillStyle = '#0d0d10'; g.fillRect(0, 0, w, h);
    // zigzag border at the bottom and a thin rail at the top
    g.strokeStyle = '#f2c230'; g.lineWidth = 4; g.lineJoin = 'round';
    g.beginPath();
    for (let x = 0; x <= w; x += 16) { g.lineTo(x, h - 10 - ((x / 16) % 2) * 14); }
    g.stroke();
    g.strokeStyle = '#ffffff'; g.lineWidth = 2;
    g.beginPath();
    for (let x = 8; x <= w; x += 16) { g.lineTo(x, h - 30 - ((x / 16) % 2) * 8); }
    g.stroke();
    g.strokeStyle = '#f2c230'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(0, 14); g.lineTo(w, 14); g.stroke();
    // koshkar muiz motifs: front (u 0.5), back (0 and 1), sides smaller
    const cy = h * 0.46;
    motif(g, w * 0.5, cy, 52);
    motif(g, 0, cy, 52); motif(g, w, cy, 52);
    motif(g, w * 0.25, cy, 30); motif(g, w * 0.75, cy, 30);
    g.fillStyle = '#ffffff';
    for (const u of [0.375, 0.625, 0.125, 0.875]) { g.beginPath(); g.arc(w * u, cy, 7, 0, 6.28); g.fill(); }
  });
}

function tieTex() {
  return canvasTex(64, 256, (g, w, h) => {
    g.fillStyle = '#c4161c'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#f2c230'; g.lineWidth = 3;
    for (let y = -64; y < h + 64; y += 34) { g.beginPath(); g.moveTo(0, y + 64); g.lineTo(w, y); g.stroke(); }
    g.strokeStyle = 'rgba(0,0,0,0.12)'; g.lineWidth = 1;
    for (let y = 0; y < h; y += 3) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
  });
}

function blobTex(draw) {
  return canvasTex(256, 256, draw);
}

function radial(g, x, y, r, rgb, a) {
  const gr = g.createRadialGradient(x, y, 0, x, y, r);
  gr.addColorStop(0, `rgba(${rgb},${a})`); gr.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
}

const FACE_U = (x) => (x + 0.1) / 0.2;
const FACE_V = (y) => (y + 0.125) / 0.25;

// poses
const REST = {
  lean: 0, headX: 0, headY: 0, headZ: 0, shrug: 0, palmZ: 0.35, rootY: 0,
  lhx: 0.215, lhy: -0.31, lhz: 0.03, leo: 0.2, lcur: 0.35,
  rhx: -0.215, rhy: -0.31, rhz: 0.03, reo: 0.2, rcur: 0.35,
  smile: 0.12, open: 0, brow: 0, browAngle: 0, eye: 0.85, blush: 0, sweat: 0,
};
const KEYS = Object.keys(REST);
const arms = (x, y, z, eo, cur) => ({ lhx: x, lhy: y, lhz: z, leo: eo, lcur: cur, rhx: -x, rhy: y, rhz: z, reo: eo, rcur: cur });
const mk = (o) => Object.assign({}, REST, o);
const POSES = {
  neutral: mk({ headX: 0.02 }),
  tired: mk({ lean: 0.13, headX: 0.3, headZ: 0.05, shrug: -0.025, smile: -0.35, brow: -0.1, browAngle: -0.45, eye: 0.5, ...arms(0.2, -0.28, 0.07, 0.2, 0.2) }),
  proud: mk({ lean: -0.05, headX: -0.08, smile: 0.55, eye: 0.92, brow: 0.15, blush: 0.15, ...arms(0.29, -0.15, 0.02, 1.0, 0.5) }),
  nervous: mk({ lean: 0.05, headX: 0.1, smile: -0.15, brow: 0.55, browAngle: -0.55, eye: 1.15, sweat: 1, ...arms(0.07, -0.04, 0.2, 0.4, 0.5) }),
  cheer: mk({ smile: 0.85, open: 0.35, eye: 0.8, brow: 0.35, headX: -0.06, lean: -0.03, blush: 0.3, rhx: -0.3, rhy: 0.52, rhz: 0.2, reo: 0.5, rcur: 1 }),
  jump: mk({ smile: 1, open: 0.9, eye: 0.85, brow: 0.45, headX: -0.2, lean: -0.08, blush: 0.3, ...arms(0.38, 0.8, 0.05, 0.8, 0.2) }),
  pleased: mk({ smile: 0.95, eye: 0.62, blush: 0.7, brow: 0.15, headZ: 0.06, ...arms(0.2, -0.3, 0.05, 0.2, 0.3) }),
  wince: mk({ smile: -0.55, open: 0.15, eye: 0.28, brow: -0.35, browAngle: -0.65, headX: 0.1, lean: 0.1, shrug: 0.03, lhx: 0.05, lhy: 0.0, lhz: 0.17, lcur: 0.3 }),
  hurt: mk({ smile: -0.85, open: 0.85, eye: 1.25, brow: 0.5, browAngle: -0.7, sweat: 1, headX: 0.12, lean: 0.08, shrug: 0.04, ...arms(0.2, 0.43, 0.05, 1.2, 0.75) }),
  panic: mk({ smile: -1, open: 1, eye: 1.4, brow: 0.7, browAngle: -0.8, sweat: 1, headX: 0.15, lean: 0.12, shrug: 0.05, ...arms(0.2, 0.43, 0.05, 1.2, 0.8) }),
  collapse: mk({ lean: 0.3, headX: 0.45, headZ: 0.1, shrug: -0.04, smile: -0.7, brow: -0.4, browAngle: -0.8, eye: 0, rootY: -0.05, palmZ: -1, ...arms(0.09, 0.4, 0.19, 1.0, 0.25) }),
  win: mk({ smile: 1, open: 0.95, eye: 0.8, brow: 0.4, headX: -0.18, lean: -0.1, blush: 0.5, ...arms(0.38, 0.8, 0.05, 0.8, 0.2) }),
};

function blend(list) {
  const out = {};
  let tw = 0;
  for (const [, w] of list) tw += w;
  for (const k of KEYS) {
    let v = 0;
    for (const [p, w] of list) v += p[k] * w;
    out[k] = v / tw;
  }
  return out;
}

// main
export function createCharacter(container) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const canvas = renderer.domElement;
  Object.assign(canvas.style, { position: 'absolute', inset: '0', width: '100%', height: '100%', zIndex: '2', pointerEvents: 'none', transition: 'filter 0.8s ease' });
  container.appendChild(canvas);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.55;

  const camera = new THREE.PerspectiveCamera(29, 1, 0.1, 20);
  const CAM_TARGET = new THREE.Vector3(0, 0.37, 0);

  const hemi = new THREE.HemisphereLight(0xfff1dd, 0x3c4a60, 0.5);
  scene.add(hemi);
  const key = new THREE.DirectionalLight(0xffe2bf, 2.6);
  key.position.set(1.1, 1.7, 2.1);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -0.6; key.shadow.camera.right = 0.6; key.shadow.camera.top = 1; key.shadow.camera.bottom = -0.6;
  key.shadow.camera.near = 0.5; key.shadow.camera.far = 5;
  key.shadow.bias = -0.0004; key.shadow.normalBias = 0.006; key.shadow.radius = 5;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x58c4d8, 2.4);
  rim.position.set(-1.4, 1.2, -1.6);
  scene.add(rim);
  const rim2 = new THREE.DirectionalLight(0x58c4d8, 1.1);
  rim2.position.set(1.6, 0.8, -1.4);
  scene.add(rim2);

  // materials
  const fabric = fabricTex();
  const jacketMat = new THREE.MeshStandardMaterial({ color: 0x27324d, map: fabric, bumpMap: fabric, bumpScale: 0.6, roughness: 0.8, metalness: 0.0, side: THREE.DoubleSide });
  const lapelMat = new THREE.MeshStandardMaterial({ color: 0x2f3b5a, map: fabric, roughness: 0.45, metalness: 0.05, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2 });
  const shirtMat = new THREE.MeshStandardMaterial({ color: 0xf3f1ec, roughness: 0.7, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -1 });
  const collarMat = new THREE.MeshStandardMaterial({ color: 0xf6f4ef, roughness: 0.7, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -4 });
  const tieMat = new THREE.MeshStandardMaterial({ color: 0xffffff, map: tieTex(), roughness: 0.4, metalness: 0.05, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -5 });
  const knotMat = new THREE.MeshStandardMaterial({ color: 0xc4161c, roughness: 0.45 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xf2c230, roughness: 0.25, metalness: 0.9, emissive: 0xffb300, emissiveIntensity: 0 });
  const skinBase = new THREE.Color('#d9a283');
  const skinMat = new THREE.MeshStandardMaterial({ color: skinBase.clone(), roughness: 0.62 });
  const headMat = new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.6 });
  const scleraMat = new THREE.MeshStandardMaterial({ color: 0xf4f0ea, roughness: 0.25 });
  const irisMat = new THREE.MeshStandardMaterial({ color: 0x5a3a22, roughness: 0.3 });
  const pupilMat = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.2 });
  const hiMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const browMat = new THREE.MeshStandardMaterial({ color: 0x15100d, roughness: 0.9 });
  const lipMat = new THREE.MeshStandardMaterial({ color: 0xb2605c, roughness: 0.45 });
  const mouthMat = new THREE.MeshStandardMaterial({ color: 0x2a0709, roughness: 0.8, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -1 });
  const teethMat = new THREE.MeshStandardMaterial({ color: 0xf4f1e8, roughness: 0.35, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2 });
  const tongueMat = new THREE.MeshStandardMaterial({ color: 0xc2576a, roughness: 0.5, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2 });
  const feltTexture = feltTex('#f0ece4');
  const feltMat = new THREE.MeshStandardMaterial({ color: 0xfaf8f2, map: feltTexture, bumpMap: feltTexture, bumpScale: 1.2, roughness: 0.96, side: THREE.DoubleSide });
  const bandMat = new THREE.MeshStandardMaterial({ color: 0xffffff, map: bandTex(), roughness: 0.85, side: THREE.DoubleSide });
  const pipeMat = new THREE.MeshStandardMaterial({ color: 0xf2c230, roughness: 0.35, metalness: 0.6 });
  const tealMat = new THREE.MeshStandardMaterial({ color: 0x66f0e6, emissive: 0x20d6c8, emissiveIntensity: 0, roughness: 0.3, transparent: true });
  const sweatMat = new THREE.MeshStandardMaterial({ color: 0xa9dcff, roughness: 0.1, transparent: true, opacity: 0.85, emissive: 0x3a6a90, emissiveIntensity: 0.4 });
  const buttonMat = new THREE.MeshStandardMaterial({ color: 0x14161c, roughness: 0.3, metalness: 0.4 });

  // hierarchy
  const rootG = new THREE.Group();
  scene.add(rootG);
  const spine = new THREE.Group();
  spine.position.y = -0.45;
  rootG.add(spine);
  const bodyG = new THREE.Group();
  bodyG.position.y = 0.45;
  spine.add(bodyG);

  // torso
  const profile = new THREE.SplineCurve([
    [0.17, -0.75], [0.178, -0.4], [0.182, -0.1], [0.19, 0.05], [0.205, 0.13], [0.207, 0.18], [0.185, 0.225], [0.14, 0.25], [0.085, 0.265], [0.056, 0.278], [0.052, 0.295],
  ].map(([r, y]) => new THREE.Vector2(r, y))).getPoints(90);
  const rAt = (y) => {
    if (y <= profile[0].y) return profile[0].x;
    for (let i = 1; i < profile.length; i++) {
      if (profile[i].y >= y) { const a = profile[i - 1], b = profile[i]; return lerp(a.x, b.x, (y - a.y) / Math.max(1e-6, b.y - a.y)); }
    }
    return profile[profile.length - 1].x;
  };
  const ZS = 0.58;
  const torsoZ = (x, y) => { const r = rAt(y); return ZS * Math.sqrt(Math.max(0, r * r - x * x)); };
  const torso = new THREE.Mesh(new THREE.LatheGeometry(profile, 56), jacketMat);
  torso.scale.z = ZS;
  torso.receiveShadow = true; torso.castShadow = true;
  bodyG.add(torso);
  // dirt overlay for the torso
  const dirtTex = blobTex((g, w, h) => {
    for (let i = 0; i < 40; i++) radial(g, rand() * w, rand() * h, 8 + rand() * 26, '70,55,40', 0.35 + rand() * 0.4);
  });
  const dirtMat = new THREE.MeshStandardMaterial({ map: dirtTex, transparent: true, opacity: 0, depthWrite: false, roughness: 1, polygonOffset: true, polygonOffsetFactor: -1, side: THREE.DoubleSide });
  const dirt = new THREE.Mesh(torso.geometry, dirtMat);
  dirt.scale.set(1.004, 1, ZS * 1.004);
  bodyG.add(dirt);

  function patch(c, nu, nv, off, mat, uvFn) {
    // c = [p00, p10, p01, p11] corners in (x,y); hugs the torso surface
    const pos = [], uv = [], idx = [];
    for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
      const u = i / nu, v = j / nv;
      const x = lerp(lerp(c[0][0], c[1][0], u), lerp(c[2][0], c[3][0], u), v);
      const y = lerp(lerp(c[0][1], c[1][1], u), lerp(c[2][1], c[3][1], u), v);
      pos.push(x, y, torsoZ(x, y) + off + (uvFn ? uvFn(u, v) : 0));
      uv.push(u, 1 - v);
    }
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
      const a = j * (nu + 1) + i, b = a + 1, d = a + nu + 1, e = d + 1;
      idx.push(a, d, b, b, d, e);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx); g.computeVertexNormals();
    const m = new THREE.Mesh(g, mat);
    m.receiveShadow = true;
    return m;
  }

  // shirt V, lapels, collar, tie
  const yTop = 0.262, yBot = -0.2;
  const shirt = patch([[-0.055, yTop], [0.055, yTop], [-0.012, yBot], [0.012, yBot]], 6, 14, 0.004, shirtMat);
  bodyG.add(shirt);
  function lapelPatch(side) {
    const nu = 8, nv = 24, pos = [], idx = [];
    for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
      const u = i / nu, v = j / nv;
      const y = lerp(yTop + 0.012, yBot, v);
      const xin = lerp(0.052, 0.012, v);
      const xout = v < 0.35 ? lerp(0.082, 0.155, v / 0.35) : lerp(0.155, 0.03, (v - 0.35) / 0.65);
      const x = lerp(xin, Math.max(xin + 0.004, xout), u);
      pos.push(side * x, y, torsoZ(x, y) + 0.009 + 0.006 * Math.sin(u * 3.14) * (1 - v * 0.5));
    }
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
      const a = j * (nu + 1) + i, b = a + 1, d = a + nu + 1, e = d + 1;
      idx.push(a, d, b, b, d, e);
    }
    const g = new THREE.BufferGeometry();
    const uvs = []; for (let k = 0; k < pos.length / 3; k++) uvs.push(pos[k * 3] * 3, pos[k * 3 + 1] * 3);
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    g.setIndex(idx); g.computeVertexNormals();
    const m = new THREE.Mesh(g, lapelMat); m.receiveShadow = true; m.castShadow = true;
    return m;
  }
  bodyG.add(lapelPatch(1), lapelPatch(-1));
  bodyG.add(patch([[0.01, 0.289], [0.088, 0.272], [0.03, 0.228], [0.03, 0.228]], 6, 6, 0.013, collarMat));
  bodyG.add(patch([[-0.01, 0.289], [-0.088, 0.272], [-0.03, 0.228], [-0.03, 0.228]], 6, 6, 0.013, collarMat));
  const collarRing = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.011, 8, 28), collarMat);
  collarRing.rotation.x = Math.PI / 2; collarRing.position.set(0, 0.272, -0.006);
  bodyG.add(collarRing);

  const tieG = new THREE.Group();
  const tieBlade = (() => {
    const nu = 6, nv = 30, pos = [], uv = [], idx = [];
    for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
      const u = i / nu, v = j / nv;
      const y = lerp(0.236, -0.3, v);
      let w = 0.014 + 0.0175 * Math.min(1, v / 0.4);
      if (v > 0.9) w *= (1 - v) / 0.1;
      const x = (u - 0.5) * 2 * w;
      pos.push(x, y, torsoZ(x, y) + 0.016 + (1 - (2 * u - 1) ** 2) * 0.004);
      uv.push(u, 1 - v);
    }
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
      const a = j * (nu + 1) + i, b = a + 1, d = a + nu + 1, e = d + 1;
      idx.push(a, d, b, b, d, e);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx); g.computeVertexNormals();
    return new THREE.Mesh(g, tieMat);
  })();
  tieG.add(tieBlade);
  const knot = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), knotMat);
  knot.scale.set(0.02, 0.016, 0.013);
  knot.position.set(0, 0.243, torsoZ(0, 0.243) + 0.02);
  tieG.add(knot);
  tieG.position.y = 0;
  bodyG.add(tieG);

  const pin = new THREE.Group();
  const pinBall = new THREE.Mesh(new THREE.SphereGeometry(0.009, 16, 12), goldMat);
  pin.add(pinBall);
  const glowTex = canvasTex(64, 64, (g) => radial(g, 32, 32, 32, '255,200,80', 1));
  const pinGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0 }));
  pinGlow.scale.set(0.06, 0.06, 1);
  pin.add(pinGlow);
  pin.position.set(0.118, 0.09, torsoZ(0.118, 0.09) + 0.024);
  bodyG.add(pin);
  for (const y of [-0.3, -0.43]) {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.011, 12, 10), buttonMat);
    b.scale.z = 0.5; b.position.set(0, y, torsoZ(0, y) + 0.004);
    bodyG.add(b);
  }

  // neck
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.046, 0.13, 20), skinMat);
  neck.position.set(0, 0.28, 0.004);
  neck.receiveShadow = true;
  bodyG.add(neck);

  // head
  const headPivot = new THREE.Group();
  headPivot.position.set(0, 0.285, 0.008);
  headPivot.scale.setScalar(1.3);
  bodyG.add(headPivot);
  const headC = new THREE.Group();
  headC.position.y = 0.13;
  headPivot.add(headC);

  const RX = 0.078, RY = 0.108, RZ = 0.092;
  let hg = new THREE.SphereGeometry(1, 56, 44);
  hg.deleteAttribute('uv'); hg.deleteAttribute('normal');
  hg = mergeVertices(hg, 1e-4);
  {
    const p = hg.attributes.position;
    const col = new Float32Array(p.count * 3);
    const hair = new THREE.Color('#0d0b0b'), sk = new THREE.Color('#d9a283'), tmp = new THREE.Color();
    for (let i = 0; i < p.count; i++) {
      let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const ux = x, uy = y, uz = z;
      const jaw = sstep(0.05, -0.95, uy);
      x *= 1 - 0.24 * jaw;
      z *= 1 - 0.1 * jaw * jaw;
      x *= 1 + 0.06 * Math.exp(-(((uy + 0.05) / 0.28) ** 2));
      if (uz > 0) {
        z += 0.05 * Math.exp(-(((uy - 0.32) / 0.1) ** 2)) * sstep(0.2, 0.9, uz);
        z -= 0.06 * sstep(0.45, 0.95, uy) * uz;
        z += 0.1 * Math.exp(-(((uy + 0.9) / 0.14) ** 2)) * uz;
      } else {
        z *= 1.1;
      }
      if (uy < 0) y *= 1.04;
      p.setXYZ(i, x * RX, y * RY, z * RZ);
      const t = clamp(0.64 - 0.5 * sstep(0.7, -0.15, uz) - 0.7 * sstep(-0.3, -0.85, uz), -0.5, 0.7);
      const hairAmt = sstep(t - 0.05, t + 0.07, uy) * (Math.abs(ux) > 0.82 ? sstep(-0.1, 0.2, uy) : 1);
      tmp.copy(sk).lerp(hair, hairAmt);
      const jawShade = 1 - 0.1 * jaw;
      col[i * 3] = tmp.r * jawShade; col[i * 3 + 1] = tmp.g * jawShade; col[i * 3 + 2] = tmp.b * jawShade;
    }
    hg.setAttribute('color', new THREE.BufferAttribute(col, 3));
    hg.computeVertexNormals();
  }
  const headMesh = new THREE.Mesh(hg, headMat);
  headMesh.castShadow = true; headMesh.receiveShadow = true;
  headC.add(headMesh);
  headMesh.updateMatrixWorld(true);

  // face surface sampler
  const GXN = 41, GYN = 51;
  const zgrid = new Float32Array(GXN * GYN);
  {
    const ray = new THREE.Raycaster();
    const o = new THREE.Vector3(), d = new THREE.Vector3(0, 0, -1);
    const tmpHead = new THREE.Group(); // raycast in head mesh space
    const m = new THREE.Mesh(hg, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }));
    tmpHead.add(m); tmpHead.updateMatrixWorld(true);
    for (let j = 0; j < GYN; j++) for (let i = 0; i < GXN; i++) {
      o.set(-0.1 + (i / (GXN - 1)) * 0.2, -0.125 + (j / (GYN - 1)) * 0.25, 1);
      ray.set(o, d);
      const hit = ray.intersectObject(m, false);
      zgrid[j * GXN + i] = hit.length ? hit[0].point.z : -0.02;
    }
  }
  const Zs = (x, y) => {
    const fx = clamp((x + 0.1) / 0.2, 0, 1) * (GXN - 1), fy = clamp((y + 0.125) / 0.25, 0, 1) * (GYN - 1);
    const i = Math.min(GXN - 2, fx | 0), j = Math.min(GYN - 2, fy | 0), tx = fx - i, ty = fy - j;
    const a = zgrid[j * GXN + i], b = zgrid[j * GXN + i + 1], c = zgrid[(j + 1) * GXN + i], e = zgrid[(j + 1) * GXN + i + 1];
    return lerp(lerp(a, b, tx), lerp(c, e, tx), ty);
  };
  const ZA = new THREE.Vector3(0, 0, 1), nTmp = new THREE.Vector3();
  function place(obj, x, y, off = 0, yaw = true) {
    const e = 0.004;
    const dzx = yaw ? (Zs(x + e, y) - Zs(x - e, y)) / (2 * e) : 0;
    const dzy = (Zs(x, y + e) - Zs(x, y - e)) / (2 * e);
    nTmp.set(-dzx, -dzy, 1).normalize();
    obj.position.set(x, y, Zs(x, y));
    obj.position.addScaledVector(nTmp, off);
    obj.quaternion.setFromUnitVectors(ZA, nTmp);
  }
  const face = new THREE.Group();
  headC.add(face);

  // overlays (stubble, eye bags, blush)
  function overlayMesh(tex) {
    const g = hg.clone();
    const p = g.attributes.position, uvs = new Float32Array(p.count * 2);
    for (let i = 0; i < p.count; i++) { uvs[i * 2] = FACE_U(p.getX(i)); uvs[i * 2 + 1] = FACE_V(p.getY(i)); }
    g.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ map: tex, transparent: true, opacity: 0, depthWrite: false, roughness: 0.8, polygonOffset: true, polygonOffsetFactor: -2 }));
    m.scale.setScalar(1.004);
    headC.add(m);
    return m;
  }
  const stubbleTex = blobTex((g, w, h) => {
    for (let i = 0; i < 4200; i++) {
      const u = 0.18 + rand() * 0.64, y = -0.115 + rand() * 0.095;
      const hw = 0.052 * (1 - sstep(-0.02, -0.12, y) * 0.55);
      const x = (rand() * 2 - 1) * hw;
      if (Math.abs(x) < 0.03 && y > -0.075 && y < -0.045) continue;
      const px = FACE_U(x) * w, py = (1 - FACE_V(y)) * h;
      g.fillStyle = `rgba(40,30,28,${0.25 + rand() * 0.5})`;
      g.fillRect(px, py, 1.5, 1.5);
    }
    for (let i = 0; i < 40; i++) radial(g, FACE_U((rand() * 2 - 1) * 0.05) * w, (1 - FACE_V(-0.1 + rand() * 0.04)) * h, 14, '60,50,50', 0.12);
  });
  const bagsTex = blobTex((g, w, h) => {
    for (const s of [-1, 1]) {
      g.save(); g.translate(FACE_U(s * 0.034) * w, (1 - FACE_V(-0.013)) * h); g.scale(1.9, 0.8);
      radial(g, 0, 0, 20, '70,36,60', 0.55); g.restore();
    }
  });
  const blushTex = blobTex((g, w, h) => {
    for (const s of [-1, 1]) radial(g, FACE_U(s * 0.05) * w, (1 - FACE_V(-0.03)) * h, 26, '236,92,98', 0.75);
  });
  const ovStubble = overlayMesh(stubbleTex), ovBags = overlayMesh(bagsTex), ovBlush = overlayMesh(blushTex);

  // ears
  for (const s of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), skinMat);
    ear.scale.set(0.007, 0.022, 0.015);
    ear.position.set(s * 0.0765, -0.004, -0.012);
    ear.rotation.y = s * 0.3;
    ear.castShadow = true;
    headC.add(ear);
    const inner = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 10), new THREE.MeshStandardMaterial({ color: 0xa96d58, roughness: 0.8 }));
    inner.scale.set(0.003, 0.014, 0.009);
    inner.position.set(s * 0.0805, -0.004, -0.008);
    inner.rotation.y = s * 0.3;
    headC.add(inner);
  }

  // nose
  {
    const bridge = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), skinMat);
    bridge.scale.set(0.0095, 0.026, 0.011);
    place(bridge, 0, -0.01, 0.003);
    bridge.rotation.x = -0.4;
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.0125, 16, 12), skinMat);
    place(tip, 0, -0.03, 0.012);
    face.add(bridge, tip);
    for (const s of [-1, 1]) {
      const ala = new THREE.Mesh(new THREE.SphereGeometry(0.0085, 12, 10), skinMat);
      place(ala, s * 0.0125, -0.031, 0.002);
      const nos = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 8), new THREE.MeshStandardMaterial({ color: 0x3a1c18, roughness: 0.9 }));
      nos.scale.set(0.0042, 0.0022, 0.004);
      place(nos, s * 0.0072, -0.038, 0.011);
      nos.rotation.x = 0.6;
      face.add(ala, nos);
    }
  }

  // eyes
  const eyes = [];
  const lidGeoU = new THREE.SphereGeometry(0.0182, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2);
  const lidGeoL = new THREE.SphereGeometry(0.0178, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2);
  lidGeoL.rotateX(Math.PI);
  for (const s of [-1, 1]) {
    const sock = new THREE.Group();
    place(sock, s * 0.034, 0.006, -0.0055, false);
    face.add(sock);
    const ball = new THREE.Group();
    sock.add(ball);
    const R = 0.0165;
    ball.add(new THREE.Mesh(new THREE.SphereGeometry(R, 28, 20), scleraMat));
    const irisGeo = new THREE.SphereGeometry(R * 1.004, 24, 10, 0, Math.PI * 2, 0, 0.46); irisGeo.rotateX(Math.PI / 2);
    const pupGeo = new THREE.SphereGeometry(R * 1.008, 20, 8, 0, Math.PI * 2, 0, 0.2); pupGeo.rotateX(Math.PI / 2);
    ball.add(new THREE.Mesh(irisGeo, irisMat), new THREE.Mesh(pupGeo, pupilMat));
    const hi = new THREE.Mesh(new THREE.SphereGeometry(0.0025, 8, 6), hiMat);
    hi.position.set(0.0045, 0.0048, R * 1.0);
    ball.add(hi);
    const hi2 = new THREE.Mesh(new THREE.SphereGeometry(0.0012, 8, 6), hiMat);
    hi2.position.set(-0.004, -0.004, R * 1.0);
    ball.add(hi2);
    const lidU = new THREE.Mesh(lidGeoU, skinMat);
    const lidL = new THREE.Mesh(lidGeoL, skinMat);
    lidU.castShadow = true;
    sock.add(lidU, lidL);
    eyes.push({ sock, ball, lidU, lidL, s });
  }

  // eyebrows
  const browShape = new THREE.Shape();
  browShape.moveTo(-0.024, -0.005);
  browShape.bezierCurveTo(-0.026, 0.004, -0.014, 0.0085, 0.0, 0.0085);
  browShape.bezierCurveTo(0.014, 0.0085, 0.024, 0.006, 0.03, 0.0);
  browShape.bezierCurveTo(0.022, 0.0035, 0.012, 0.0, 0.0, -0.0035);
  browShape.bezierCurveTo(-0.012, -0.0055, -0.02, -0.0065, -0.024, -0.005);
  const browGeo = new THREE.ExtrudeGeometry(browShape, { depth: 0.003, bevelEnabled: true, bevelThickness: 0.0016, bevelSize: 0.0012, bevelSegments: 2, curveSegments: 10 });
  const brows = [];
  for (const s of [-1, 1]) {
    const piv = new THREE.Group();
    const rot = new THREE.Group();
    const m = new THREE.Mesh(browGeo, browMat);
    m.scale.x = s > 0 ? 1 : -1;
    m.castShadow = true;
    rot.add(m); piv.add(rot); face.add(piv);
    brows.push({ piv, rot, s });
  }

  // mouth
  const mouthG = new THREE.Group();
  face.add(mouthG);
  let mouthMeshes = [];
  let lastMouth = { smile: 99, open: 99 };
  function strip(top, bot, mat, z) {
    const pos = [], idx = [];
    for (let i = 0; i < top.length; i++) { pos.push(top[i][0], top[i][1], top[i][2] + z, bot[i][0], bot[i][1], bot[i][2] + z); }
    for (let i = 0; i < top.length - 1; i++) { const a = i * 2, b = a + 1, c = a + 2, d = a + 3; idx.push(a, b, c, c, b, d); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx); g.computeVertexNormals();
    return new THREE.Mesh(g, mat);
  }
  function buildMouth(smile, open) {
    for (const m of mouthMeshes) { mouthG.remove(m); m.geometry.dispose(); }
    mouthMeshes = [];
    const y0 = -0.063, w = 0.026 + Math.max(0, smile) * 0.008 - open * 0.003 - Math.max(0, -smile) * 0.002;
    const c = smile * 0.014;
    const N = 15;
    const line = (t) => y0 + c * t * t + (smile > 0 ? -smile * 0.003 * (1 - t * t) : 0);
    const upper = [], lower = [], lineP = [];
    for (let i = 0; i < N; i++) {
      const t = (i / (N - 1)) * 2 - 1, x = t * w, edge = 1 - t * t;
      const yl = line(t);
      const yU = yl + open * 0.004 * edge;
      const yL = yl - open * 0.028 * Math.pow(edge, 0.7) - (smile < 0 && open < 0.1 ? 0 : 0);
      const pz = (y) => Zs(x, y);
      upper.push([x, yU, pz(yU) + 0.002 + 0.003 * edge]);
      lower.push([x, yL, pz(yL) + 0.002 + 0.0035 * edge]);
      lineP.push([x, yl, pz(yl)]);
    }
    const mk3 = (arr, dy, rad, dz) => {
      const pts = arr.map((p) => new THREE.Vector3(p[0], p[1] + dy, p[2] + dz));
      const g = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 32, rad, 7, false);
      const m = new THREE.Mesh(g, lipMat); m.castShadow = false;
      return m;
    };
    mouthMeshes.push(mk3(upper, 0.0034, 0.0039, 0.0), mk3(lower, -0.0042, 0.0049, 0.0));
    if (open > 0.04) {
      const topEdge = upper.map((p) => [p[0], p[1] - 0.0004, Zs(p[0], p[1]) + 0.0012]);
      const botEdge = lower.map((p) => [p[0], p[1] + 0.0004, Zs(p[0], p[1]) + 0.0012]);
      mouthMeshes.push(strip(topEdge, botEdge, mouthMat, 0));
      const th = topEdge.map((p, i) => { const gap = p[1] - botEdge[i][1]; return [p[0], p[1] - Math.min(0.0095, gap * 0.7), p[2] + 0.0006]; });
      mouthMeshes.push(strip(topEdge.map((p) => [p[0], p[1], p[2] + 0.0006]), th, teethMat, 0));
      if (open > 0.3) {
        const tg = botEdge.map((p, i) => { const gap = topEdge[i][1] - p[1]; return [p[0] * 0.8, p[1] + gap * 0.5, p[2] + 0.0008]; });
        mouthMeshes.push(strip(botEdge.map((p) => [p[0] * 0.8, p[1], p[2] + 0.0008]), tg, tongueMat, 0));
      }
    }
    for (const m of mouthMeshes) mouthG.add(m);
    lastMouth = { smile, open };
  }
  buildMouth(0.1, 0);

  // sweat drop
  const sweatG = new THREE.Group();
  {
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.0055, 12, 10), sweatMat);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.0048, 0.012, 12), sweatMat);
    cone.position.y = 0.0085;
    sweatG.add(bulb, cone);
    face.add(sweatG);
  }

  // kalpak
  const hatG = new THREE.Group();
  hatG.position.set(0, 0.052, -0.004);
  hatG.rotation.x = -0.09;
  headC.add(hatG);
  const HRX = 0.083, HRZ = 0.099;
  {
    // crown with 4 panels
    const NA = 72, NH = 28, pos = [], idx = [];
    const H = 0.24;
    for (let j = 0; j <= NH; j++) {
      const t = j / NH;
      const R = (1 - 0.1 * t) * Math.pow(Math.max(0, 1 - Math.pow(t, 3.6)), 0.42);
      for (let i = 0; i <= NA; i++) {
        const a = (i / NA) * Math.PI * 2;
        let d = Math.abs(((a - Math.PI / 4) % (Math.PI / 2) + Math.PI / 2) % (Math.PI / 2));
        d = Math.min(d, Math.PI / 2 - d);
        const groove = 1 - 0.07 * Math.exp(-((d / 0.07) ** 2)) * (0.4 + 0.6 * t);
        const bulge = 1 + 0.05 * Math.sin(Math.min(1, t * 1.6) * Math.PI);
        pos.push(Math.sin(a) * HRX * R * groove * bulge, t * H * (1 + 0.0 * R), Math.cos(a) * HRZ * R * groove * bulge);
      }
    }
    for (let j = 0; j < NH; j++) for (let i = 0; i < NA; i++) {
      const a = j * (NA + 1) + i, b = a + 1, c = a + NA + 1, d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    const uvs = []; for (let k = 0; k < pos.length / 3; k++) uvs.push(pos[k * 3] * 8, pos[k * 3 + 1] * 8);
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    g.setIndex(idx); g.computeVertexNormals();
    const crown = new THREE.Mesh(g, feltMat);
    crown.castShadow = true; crown.receiveShadow = true;
    hatG.add(crown);

    // band: taller at front and back, lower at the sides, flared outward
    const BN = 90, BV = 8, bp = [], bu = [], bi = [];
    const bandH = (th) => 0.036 + 0.05 * Math.pow(Math.abs(Math.cos(th)), 1.6);
    for (let j = 0; j <= BV; j++) {
      const v = j / BV;
      for (let i = 0; i <= BN; i++) {
        const u = i / BN, th = (u - 0.5) * Math.PI * 2;
        const fl = 1.0 + 0.2 * Math.pow(v, 1.5);
        bp.push(Math.sin(th) * (HRX + 0.004) * fl, v * bandH(th) - 0.004, Math.cos(th) * (HRZ + 0.004) * fl);
        bu.push(u, v);
      }
    }
    for (let j = 0; j < BV; j++) for (let i = 0; i < BN; i++) {
      const a = j * (BN + 1) + i, b = a + 1, c = a + BN + 1, d = c + 1;
      bi.push(a, b, c, b, d, c);
    }
    const bg = new THREE.BufferGeometry();
    bg.setAttribute('position', new THREE.Float32BufferAttribute(bp, 3));
    bg.setAttribute('uv', new THREE.Float32BufferAttribute(bu, 2));
    bg.setIndex(bi); bg.computeVertexNormals();
    const band = new THREE.Mesh(bg, bandMat);
    band.castShadow = true; band.receiveShadow = true;
    hatG.add(band);
    // piping on the top edge
    const pp = [];
    for (let i = 0; i < 64; i++) {
      const th = (i / 64) * Math.PI * 2 - Math.PI;
      const fl = 1.2;
      pp.push(new THREE.Vector3(Math.sin(th) * (HRX + 0.004) * fl, bandH(th) - 0.004, Math.cos(th) * (HRZ + 0.004) * fl));
    }
    hatG.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pp, true), 120, 0.0032, 6, true), pipeMat));
    const pq = [];
    for (let i = 0; i < 48; i++) { const th = (i / 48) * Math.PI * 2; pq.push(new THREE.Vector3(Math.sin(th) * (HRX + 0.004), -0.004, Math.cos(th) * (HRZ + 0.004))); }
    hatG.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pq, true), 100, 0.0026, 6, true), pipeMat));
  }
  // tassel
  const tasselG = new THREE.Group();
  tasselG.position.set(0, 0.24, 0);
  hatG.add(tasselG);
  {
    const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.0018, 0.0018, 0.028, 6), pipeMat);
    cord.position.y = -0.014;
    const tuft = new THREE.Mesh(new THREE.ConeGeometry(0.0085, 0.036, 12), pipeMat);
    tuft.rotation.x = Math.PI; tuft.position.y = -0.04;
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.005, 10, 8), pipeMat);
    tasselG.add(cord, tuft, cap);
    const base = new THREE.Mesh(new THREE.SphereGeometry(0.006, 10, 8), pipeMat);
    base.position.y = 0.0;
    tasselG.add(base);
  }

  // tech: earpiece
  const ear = new THREE.Mesh(new THREE.CapsuleGeometry(0.0045, 0.012, 4, 8), tealMat);
  ear.position.set(0.0835, -0.004, 0.0); ear.rotation.z = 0.1;
  headC.add(ear);

  // arms + hands
  const A = 0.28, B = 0.26;
  const segGeo = (rt, rb) => { const g = new THREE.CylinderGeometry(rt, rb, 1, 20, 1); g.translate(0, -0.5, 0); return g; };
  const DOWN = new THREE.Vector3(0, -1, 0);
  const capsuleGeo = (r, l) => new THREE.CapsuleGeometry(r, Math.max(0.001, l - 2 * r), 4, 8);
  function setSeg(m, a, b) {
    const d = nTmp.copy(b).sub(a);
    const len = d.length();
    m.position.copy(a);
    m.quaternion.setFromUnitVectors(DOWN, d.divideScalar(Math.max(len, 1e-5)));
    m.scale.set(1, len, 1);
  }
  function makeHand(side) {
    const g = new THREE.Group();
    const palm = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), skinMat);
    palm.scale.set(0.036, 0.046, 0.017); palm.position.y = -0.044; palm.castShadow = true;
    g.add(palm);
    const fingers = [];
    const xs = [-0.0215, -0.0072, 0.0072, 0.0215], ls = [0.036, 0.04, 0.038, 0.03];
    xs.forEach((x, k) => {
      const l = ls[k], segs = [0.46, 0.3, 0.24].map((f) => l * f * 1.0 + 0.012);
      const k1 = new THREE.Group(); k1.position.set(x, -0.083, 0);
      const s1 = new THREE.Mesh(capsuleGeo(0.0073, segs[0]), skinMat); s1.position.y = -segs[0] / 2 + 0.004; s1.castShadow = true;
      const k2 = new THREE.Group(); k2.position.y = -segs[0] + 0.004;
      const s2 = new THREE.Mesh(capsuleGeo(0.0068, segs[1]), skinMat); s2.position.y = -segs[1] / 2 + 0.003;
      const k3 = new THREE.Group(); k3.position.y = -segs[1] + 0.003;
      const s3 = new THREE.Mesh(capsuleGeo(0.0062, segs[2]), skinMat); s3.position.y = -segs[2] / 2 + 0.002;
      k1.add(s1, k2); k2.add(s2, k3); k3.add(s3); g.add(k1);
      fingers.push([k1, k2, k3]);
    });
    const t1 = new THREE.Group(); t1.position.set(side * 0.03, -0.03, 0.006); t1.rotation.z = side * 0.55;
    const ts1 = new THREE.Mesh(capsuleGeo(0.0088, 0.04), skinMat); ts1.position.y = -0.017;
    const t2 = new THREE.Group(); t2.position.y = -0.034;
    const ts2 = new THREE.Mesh(capsuleGeo(0.0078, 0.034), skinMat); ts2.position.y = -0.015;
    t1.add(ts1, t2); t2.add(ts2); g.add(t1);
    return { g, fingers, thumb: [t1, t2], side };
  }
  const armParts = [1, -1].map((side) => {
    const upper = new THREE.Mesh(segGeo(0.047, 0.04), jacketMat);
    const fore = new THREE.Mesh(segGeo(0.04, 0.033), jacketMat);
    const cuff = new THREE.Mesh(segGeo(0.0345, 0.0345), shirtMat);
    const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.056, 20, 16), jacketMat);
    const elbow = new THREE.Mesh(new THREE.SphereGeometry(0.041, 16, 12), jacketMat);
    const hand = makeHand(side);
    upper.castShadow = fore.castShadow = shoulder.castShadow = true;
    bodyG.add(upper, fore, cuff, shoulder, elbow, hand.g);
    return { side, upper, fore, cuff, shoulder, elbow, hand };
  });
  // wrist device on the left arm
  const wristDev = new THREE.Mesh(new THREE.TorusGeometry(0.0375, 0.0045, 8, 24), tealMat);
  bodyG.add(wristDev);

  // particles
  const NP = 90;
  const pPos = new Float32Array(NP * 3), pCol = new Float32Array(NP * 3), pLife = new Float32Array(NP), pVel = new Float32Array(NP * 3);
  for (let i = 0; i < NP; i++) pLife[i] = rand();
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  pGeo.setAttribute('color', new THREE.BufferAttribute(pCol, 3));
  const sparkTex = canvasTex(64, 64, (g) => radial(g, 32, 32, 32, '255,255,255', 1));
  const sparks = new THREE.Points(pGeo, new THREE.PointsMaterial({ size: 0.07, map: sparkTex, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  sparks.frustumCulled = false;
  rootG.add(sparks);
  function respawn(i) {
    pPos[i * 3] = (rand() - 0.5) * 0.9; pPos[i * 3 + 1] = -0.2 + rand() * 0.9; pPos[i * 3 + 2] = -0.1 + rand() * 0.4;
    pVel[i * 3] = (rand() - 0.5) * 0.03; pVel[i * 3 + 1] = 0.05 + rand() * 0.1; pVel[i * 3 + 2] = (rand() - 0.5) * 0.03;
    pLife[i] = 0;
  }
  for (let i = 0; i < NP; i++) { respawn(i); pLife[i] = rand(); }

  // state
  const cur = Object.assign({}, POSES.neutral);
  const look = { P: 62, ratio: 1, tech: 30, nature: 60, energy: 60 };
  const lookT = Object.assign({}, look);
  let ending = null, forced = null;
  let reaction = null; // { pose, t, big, good }
  let time = 0, blinkT = 2.5, blinkP = -1;
  const ptr = { x: 0, y: 0, tx: 0, ty: 0 };
  let tassel = { a: 0, av: 0, b: 0, bv: 0 }, lastHat = new THREE.Vector3(), lastHatV = new THREE.Vector3();
  let bounce = 0, smoothNerv = 0, smoothQ = 0.5;

  const onMove = (e) => {
    const r = container.getBoundingClientRect();
    if (!r.width) return;
    ptr.tx = clamp(((e.clientX - r.left) / r.width) * 2 - 1, -1.4, 1.4);
    ptr.ty = clamp(((e.clientY - r.top) / r.height) * 2 - 1, -1.4, 1.4);
  };
  window.addEventListener('pointermove', onMove, { passive: true });

  function resize() {
    const w = Math.max(1, container.clientWidth), h = Math.max(1, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const t = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const dist = Math.max(0.53 / t, 0.52 / (t * camera.aspect));
    camera.position.set(0, CAM_TARGET.y + 0.02, dist);
    camera.lookAt(CAM_TARGET);
    camera.updateProjectionMatrix();
  }
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(container);

  // per frame
  const S = new THREE.Vector3(), T = new THREE.Vector3(), E = new THREE.Vector3(), W = new THREE.Vector3();
  const dir = new THREE.Vector3(), pole = new THREE.Vector3(), perp = new THREE.Vector3(), fdir = new THREE.Vector3();
  const bx = new THREE.Vector3(), by = new THREE.Vector3(), bz = new THREE.Vector3(), mtx = new THREE.Matrix4();
  const cA = new THREE.Color(), cB = new THREE.Color();

  function solveArm(part, tx, ty, tz, eo, curl, jx, jy) {
    const side = part.side;
    S.set(side * 0.2, 0.17 + cur.shrug, 0);
    T.set(tx + jx, ty + jy, tz);
    dir.copy(T).sub(S);
    const L = clamp(dir.length(), 0.14, A + B - 0.004);
    dir.normalize();
    T.copy(S).addScaledVector(dir, L);
    const cosA = clamp((A * A + L * L - B * B) / (2 * A * L), -1, 1), sinA = Math.sqrt(1 - cosA * cosA);
    pole.set(side * (0.35 + 0.9 * eo), -0.5, -0.55);
    perp.copy(pole).addScaledVector(dir, -pole.dot(dir));
    if (perp.lengthSq() < 1e-6) perp.set(side, 0, 0);
    perp.normalize();
    E.copy(S).addScaledVector(dir, A * cosA).addScaledVector(perp, A * sinA);
    W.copy(T);
    setSeg(part.upper, S, E);
    fdir.copy(W).sub(E).normalize();
    setSeg(part.fore, E, W);
    const c0 = nTmp.copy(W).addScaledVector(fdir, -0.034);
    setSeg(part.cuff, c0, W);
    part.shoulder.position.copy(S);
    part.elbow.position.copy(E);
    // hand basis: fingers along fdir, palm facing inward
    by.copy(fdir).negate();
    bz.set(-side * 0.8, 0, cur.palmZ);
    bz.addScaledVector(by, -bz.dot(by));
    if (bz.lengthSq() < 1e-5) bz.set(0, 0, 1);
    bz.normalize();
    bx.crossVectors(by, bz).normalize();
    mtx.makeBasis(bx, by, bz);
    part.hand.g.quaternion.setFromRotationMatrix(mtx);
    part.hand.g.position.copy(W);
    for (const f of part.hand.fingers) {
      f[0].rotation.x = -curl * 1.45; f[1].rotation.x = -curl * 1.55; f[2].rotation.x = -curl * 1.1;
    }
    part.hand.thumb[0].rotation.x = -curl * 0.5; part.hand.thumb[1].rotation.x = -curl * 0.9;
  }

  const pause = () => document.hidden;
  let lastT = performance.now(), running = true;
  document.addEventListener('visibilitychange', () => { lastT = performance.now(); });

  function frame(now) {
    if (!running) return;
    requestAnimationFrame(frame);
    if (pause()) { lastT = now; return; }
    const dt = clamp((now - lastT) / 1000, 0, 0.05);
    lastT = now;
    update(dt);
    renderer.render(scene, camera);
  }

  function update(dt) {
    time += dt;
    // smooth look
    const kl = 1 - Math.exp(-dt * 3);
    for (const k in look) look[k] += (lookT[k] - look[k]) * kl;
    const P = look.P;
    const q = sstep(24, 82, P);
    smoothQ = q;
    const nerv = (forced === 'nervous' || forced === 'panic') ? 1 : clamp(1 - look.ratio / 0.25, 0, 1);
    smoothNerv += (nerv - smoothNerv) * (1 - Math.exp(-dt * 4));

    // baseline target pose
    let target;
    if (forced) {
      target = POSES[forced];
    } else if (ending === 'win') {
      target = POSES.win;
    } else if (ending === 'lose') {
      target = POSES.collapse;
    } else {
      const wT = sstep(54, 32, P) * 1, wP = sstep(60, 82, P);
      const wN = smoothNerv * 0.9;
      const base = blend([[POSES.neutral, Math.max(0.0001, 1 - wT - wP)], [POSES.tired, wT], [POSES.proud, wP]]);
      target = blend([[base, 1 - wN], [POSES.nervous, wN]]);
      if (reaction) {
        reaction.t += dt;
        const a = 0.14, h = 0.6, r = 0.55, t = reaction.t;
        const env = t < a ? t / a : t < a + h ? 1 : Math.max(0, 1 - (t - a - h) / r);
        reaction.env = env;
        if (t > a + h + r) reaction = null;
        else target = blend([[target, 1 - env], [reaction.pose, env]]);
      }
    }
    if (forced || ending) { if (reaction) reaction = null; }
    const k = 1 - Math.exp(-dt * (reaction ? 11 : 6.5));
    for (const key of KEYS) cur[key] += (target[key] - cur[key]) * k;

    // idle layers
    const breath = Math.sin(time * 1.9);
    blinkT -= dt;
    if (blinkT <= 0 && blinkP < 0) { blinkP = 0; blinkT = 2.2 + rand() * 3.5; }
    let blink = 1;
    if (blinkP >= 0) { blinkP += dt / 0.16; blink = Math.abs(1 - blinkP * 2) ; if (blinkP >= 1) { blinkP = -1; blink = 1; } }
    ptr.x += (ptr.tx - ptr.x) * (1 - Math.exp(-dt * 6)); ptr.y += (ptr.ty - ptr.y) * (1 - Math.exp(-dt * 6));
    const gazeAmt = ending === 'lose' || forced === 'collapse' ? 0.1 : 1;
    const gx = ptr.x * gazeAmt, gy = ptr.y * gazeAmt;

    // bounce
    let bTarget = 0;
    if (ending === 'win' || forced === 'win') bTarget = Math.abs(Math.sin(time * 4.6)) * 0.055;
    else if (reaction && reaction.good) bTarget = Math.abs(Math.sin(reaction.t * Math.PI * (reaction.big ? 2.6 : 2.2))) * (reaction.big ? 0.07 : 0.018) * (reaction.env || 0);
    bounce += (bTarget - bounce) * (1 - Math.exp(-dt * 22));

    let shakeY = 0, jitter = 0;
    if (reaction && !reaction.good && reaction.big) shakeY = Math.sin(reaction.t * 17) * 0.14 * (reaction.env || 0);
    if (forced === 'hurt' || forced === 'panic') shakeY = Math.sin(time * 17) * 0.12;
    jitter = smoothNerv;
    const fid = Math.sin(time * 9.3) * 0.012 * jitter, fid2 = Math.cos(time * 7.7) * 0.01 * jitter;

    rootG.position.y = cur.rootY + bounce;
    spine.rotation.x = cur.lean + breath * 0.004;
    bodyG.scale.set(1 + breath * 0.003, 1 + breath * 0.004, 1 + breath * 0.006);
    headPivot.rotation.x = cur.headX + Math.sin(time * 0.7) * 0.012 + gy * 0.07 + (smoothNerv * Math.sin(time * 11) * 0.01);
    headPivot.rotation.y = cur.headY + gx * 0.2 + Math.sin(time * 0.5) * 0.03 + shakeY + smoothNerv * Math.sin(time * 6.2) * 0.04;
    headPivot.rotation.z = cur.headZ + Math.sin(time * 0.35) * 0.012;

    // arms
    solveArm(armParts[0], cur.lhx, cur.lhy, cur.lhz, cur.leo, cur.lcur, fid, fid2);
    const lw = W.clone();
    wristDev.position.copy(lw).addScaledVector(fdir, -0.012);
    wristDev.quaternion.setFromUnitVectors(ZA, fdir);
    solveArm(armParts[1], cur.rhx, cur.rhy, cur.rhz, cur.reo, cur.rcur, -fid2, fid);

    // face
    const eyeOpen = clamp(cur.eye, 0, 1.5) * blink;
    for (const e of eyes) {
      const o = eyeOpen;
      e.lidU.rotation.x = lerp(1.2, -0.5, clamp(o / 1.4, 0, 1));
      const squint = sstep(0.75, 0.2, cur.eye) * 0.5 + Math.max(0, cur.smile) * 0.28;
      e.lidL.rotation.x = lerp(0.75, 0.05, clamp(squint + (1 - clamp(o / 0.7, 0, 1)) * 0.5, 0, 1));
      e.ball.rotation.y = clamp(gx, -1, 1) * 0.28;
      e.ball.rotation.x = clamp(gy, -1, 1) * 0.2 - 0.05;
    }
    for (const b of brows) {
      const x = b.s * 0.033;
      place(b.piv, x, 0.034 + cur.brow * 0.011 + (cur.browAngle < 0 ? -cur.browAngle * 0.003 : 0), 0.002);
      b.rot.rotation.z = b.s * cur.browAngle * 0.5 + (b.s > 0 ? 1 : -1) * (cur.brow > 0 ? cur.brow * -0.02 : 0);
      b.rot.position.x = -b.s * 0.003 * (cur.browAngle > 0 ? 1 : 0);
    }
    if (Math.abs(lastMouth.smile - cur.smile) > 0.006 || Math.abs(lastMouth.open - cur.open) > 0.006) buildMouth(cur.smile, cur.open);
    // sweat
    sweatG.visible = cur.sweat > 0.05;
    if (sweatG.visible) {
      const ph = (time * 0.45) % 1;
      place(sweatG, 0.058, 0.045 - ph * 0.05, 0.003);
      sweatG.scale.setScalar(cur.sweat * (0.7 + 0.5 * Math.sin(Math.min(1, ph * 3) * 1.5)));
      sweatMat.opacity = 0.85 * (1 - sstep(0.7, 1, ph));
    }

    // appearance from P and stats
    const dust = Math.max(sstep(45, 12, look.nature), sstep(40, 8, look.energy)) * 0.45;
    cA.set(0x58524a).lerp(cB.set(0x27324d), sstep(25, 62, P)).lerp(cB.set(0x14224a), sstep(62, 84, P));
    cA.lerp(cB.set(0x7a7468), dust * 0.6);
    jacketMat.color.copy(cA);
    lapelMat.color.copy(cA).multiplyScalar(1.25);
    dirtMat.opacity = (1 - q) * 0.85;
    jacketMat.bumpScale = lerp(1.6, 0.5, q);
    tieMat.color.setRGB(lerp(0.62, 1.12, q), lerp(0.5, 1.0, q), lerp(0.48, 1.0, q));
    knotMat.color.set(0x6e3a32).lerp(cB.set(0xc4161c), q);
    const loosen = sstep(52, 26, P);
    tieG.position.set(0, -loosen * 0.045, 0.0);
    tieG.rotation.z = loosen * 0.16; tieG.rotation.y = 0;
    tieG.scale.y = 1 - loosen * 0.18;
    feltMat.color.set(0xb4a894).lerp(cB.set(0xfffaf0), sstep(25, 80, P));
    feltMat.color.lerp(cB.set(0x9a8f80), dust);
    bandMat.color.setScalar(lerp(0.45, 1.25, q));
    pipeMat.color.set(0x8a7a50).lerp(cB.set(0xf6c935), q);
    const tier2 = sstep(60, 68, P), tier3 = sstep(74, 80, P);
    pin.scale.setScalar(0.001 + tier2);
    goldMat.emissiveIntensity = tier3 * (0.7 + 0.3 * Math.sin(time * 3));
    pinGlow.material.opacity = tier3 * (0.7 + 0.3 * Math.sin(time * 3));
    skinMat.color.setRGB(lerp(0.82, 1.04, q), lerp(0.83, 1.0, q), lerp(0.9, 0.97, q)).multiply(skinBase);
    headMat.color.setRGB(lerp(0.82, 1.04, q), lerp(0.83, 1.0, q), lerp(0.9, 0.97, q));
    cA.setRGB(1, 1, 1);
    if (dust > 0) { skinMat.color.lerp(cB.set(0x9a8c80), dust * 0.35); headMat.color.lerp(cB.set(0xaaa49c), dust * 0.35); }
    ovStubble.material.opacity = lerp(0.95, 0.12, q);
    ovBags.material.opacity = clamp(lerp(0.95, 0.05, q) + smoothNerv * 0.3, 0, 1);
    ovBlush.material.opacity = clamp(q * 0.3 + cur.blush, 0, 1);
    scleraMat.color.set(0xe9c8c0).lerp(cB.set(0xf6f2ec), sstep(20, 60, P));
    const techA = sstep(55, 78, look.tech);
    tealMat.emissiveIntensity = techA * (1.2 + 0.4 * Math.sin(time * 4));
    tealMat.opacity = techA;
    ear.visible = wristDev.visible = techA > 0.02;

    // lights follow mood
    const rimGold = new THREE.Color(0xffc34a), rimTeal = new THREE.Color(0x58c4d8), rimRed = new THREE.Color(0xff5a2a);
    cA.copy(rimTeal).lerp(rimGold, tier3 * 0.9 + tier2 * 0.2);
    const crisis = 1 - sstep(0.0, 0.3, look.ratio);
    cA.lerp(rimRed, crisis);
    rim.color.copy(cA); rim2.color.copy(cA);
    rim.intensity = 2.2 + tier3 * 1.4 + crisis * 0.8;
    rim2.intensity = 1.0 + tier3 * 1.0;
    key.intensity = lerp(2.0, 2.8, q);
    hemi.intensity = lerp(0.4, 0.55, q);
    if (ending === 'win') { rim.color.set(0xffc34a); rim.intensity = 4; key.intensity = 3; }
    canvas.style.filter = ending === 'lose' ? 'saturate(0.3) brightness(0.82)' : '';

    // tassel pendulum
    hatG.updateWorldMatrix(true, false);
    tasselG.getWorldPosition(E);
    const hv = E.clone().sub(lastHat).divideScalar(Math.max(dt, 1e-3));
    const acc = hv.clone().sub(lastHatV).divideScalar(Math.max(dt, 1e-3));
    lastHat.copy(E); lastHatV.copy(hv);
    const ax = clamp(acc.x, -40, 40), az = clamp(acc.z, -40, 40);
    tassel.av += (-90 * tassel.a - 7 * tassel.av - ax * 0.35) * dt;
    tassel.a += tassel.av * dt;
    tassel.bv += (-90 * tassel.b - 7 * tassel.bv + az * 0.35) * dt;
    tassel.b += tassel.bv * dt;
    tassel.a = clamp(tassel.a, -1, 1); tassel.b = clamp(tassel.b, -1, 1);
    tasselG.rotation.z = tassel.a + Math.sin(time * 1.3) * 0.03;
    tasselG.rotation.x = tassel.b;

    // sparkles
    const spInt = ending === 'win' || forced === 'win' ? 1 : tier3 * 0.55;
    sparks.visible = spInt > 0.02;
    if (sparks.visible) {
      const gold = [1, 0.78, 0.25];
      const active = Math.floor(NP * spInt);
      for (let i = 0; i < NP; i++) {
        pLife[i] += dt * 0.35;
        if (pLife[i] > 1) respawn(i);
        pPos[i * 3] += pVel[i * 3] * dt; pPos[i * 3 + 1] += pVel[i * 3 + 1] * dt; pPos[i * 3 + 2] += pVel[i * 3 + 2] * dt;
        const f = i < active ? Math.sin(pLife[i] * Math.PI) * (0.6 + 0.4 * Math.sin(time * 8 + i)) : 0;
        pCol[i * 3] = gold[0] * f; pCol[i * 3 + 1] = gold[1] * f; pCol[i * 3 + 2] = gold[2] * f;
      }
      pGeo.attributes.position.needsUpdate = true; pGeo.attributes.color.needsUpdate = true;
    }
  }
  update(0.016);
  for (const key2 of KEYS) cur[key2] = cur[key2];
  requestAnimationFrame(frame);

  // API
  return {
    setLook(Pv, ratio, stats) {
      if (typeof Pv === 'number') lookT.P = clamp(Pv, 0, 100);
      if (typeof ratio === 'number') lookT.ratio = clamp(ratio, 0, 1);
      if (stats) {
        if (typeof stats.tech === 'number') lookT.tech = stats.tech;
        if (typeof stats.nature === 'number') lookT.nature = stats.nature;
        if (typeof stats.energy === 'number') lookT.energy = stats.energy;
      }
    },
    react(good, magnitude) {
      if (ending || forced) return;
      const big = magnitude >= 8;
      reaction = { good: !!good, big, t: 0, env: 0, pose: good ? (big ? POSES.jump : POSES.cheer) : (big ? POSES.hurt : POSES.wince) };
      if (good && !big && rand() < 0.5) {
        // alternate fist pump hand
        const p = Object.assign({}, POSES.cheer);
        p.lhx = -POSES.cheer.rhx; p.lhy = POSES.cheer.rhy; p.lhz = POSES.cheer.rhz; p.leo = POSES.cheer.reo; p.lcur = 1;
        p.rhx = POSES.neutral.rhx; p.rhy = POSES.neutral.rhy; p.rhz = POSES.neutral.rhz; p.reo = 0.2; p.rcur = 0.35;
        reaction.pose = p;
      }
    },
    setEnding(kind) { ending = kind === 'win' || kind === 'lose' ? kind : null; forced = null; reaction = null; },
    reset() {
      ending = null; forced = null; reaction = null;
      Object.assign(lookT, { P: 62, ratio: 1, tech: 30, nature: 60, energy: 60 });
      Object.assign(look, lookT);
      Object.assign(cur, POSES.neutral);
    },
    preview(name) { forced = POSES[name] ? name : null; if (forced) { ending = null; reaction = null; } },
    dispose() { running = false; ro.disconnect(); window.removeEventListener('pointermove', onMove); renderer.dispose(); canvas.remove(); },
  };
}
