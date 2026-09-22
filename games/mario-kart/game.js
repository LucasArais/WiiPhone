import * as THREE from 'three';

// ---------- Track ----------

const TRACK_POINTS = [
  [0, -40], [35, -30], [55, 0], [35, 30], [0, 40],
  [-20, 15], [-10, 0], [-20, -15],
].map(([x, z]) => new THREE.Vector3(x, 0, z));

const curve = new THREE.CatmullRomCurve3(TRACK_POINTS, true, 'catmullrom', 0.5);
const SEGMENTS = 240;
const centerline = curve.getSpacedPoints(SEGMENTS); // length SEGMENTS+1, [0] == [SEGMENTS]
const HALF_WIDTH = 7;
const CURB_WIDTH = 1;

let trackLength = 0;
const cumulative = [0];
for (let i = 1; i <= SEGMENTS; i += 1) {
  trackLength += centerline[i].distanceTo(centerline[i - 1]);
  cumulative.push(trackLength);
}

function normalAt(i) {
  const a = centerline[i];
  const b = centerline[(i + 1) % SEGMENTS];
  const tangent = b.clone().sub(a).normalize();
  return new THREE.Vector3(-tangent.z, 0, tangent.x);
}

function buildRibbon(innerR, outerR, colorFn) {
  const positions = [];
  const colors = [];
  const indices = [];
  for (let i = 0; i <= SEGMENTS; i += 1) {
    const p = centerline[i];
    const n = normalAt(i % SEGMENTS);
    const inner = p.clone().addScaledVector(n, innerR);
    const outer = p.clone().addScaledVector(n, outerR);
    positions.push(inner.x, inner.y, inner.z, outer.x, outer.y, outer.z);
    const c = colorFn(i);
    colors.push(c.r, c.g, c.b, c.r, c.g, c.b);
  }
  for (let i = 0; i < SEGMENTS; i += 1) {
    const a = i * 2, b = i * 2 + 1, c = (i + 1) * 2, d = (i + 1) * 2 + 1;
    indices.push(a, b, c, b, d, c);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

const ROAD_COLOR = new THREE.Color('#3a3f52');
const CURB_A = new THREE.Color('#ff4d6d');
const CURB_B = new THREE.Color('#f4f5fb');

const road = new THREE.Mesh(
  buildRibbon(-HALF_WIDTH, HALF_WIDTH, () => ROAD_COLOR),
  new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 })
);

const curbOuter = new THREE.Mesh(
  buildRibbon(HALF_WIDTH, HALF_WIDTH + CURB_WIDTH, (i) => (Math.floor(i / 4) % 2 === 0 ? CURB_A : CURB_B)),
  new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 })
);

const curbInner = new THREE.Mesh(
  buildRibbon(-HALF_WIDTH - CURB_WIDTH, -HALF_WIDTH, (i) => (Math.floor(i / 4) % 2 === 0 ? CURB_B : CURB_A)),
  new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 })
);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(300, 300),
  new THREE.MeshStandardMaterial({ color: '#3aa35c', roughness: 1 })
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.05;

// ---------- Boost pads ----------

const PAD_TS = [0.08, 0.3, 0.55, 0.78];
function pointAtT(t) {
  const s = ((t % 1) + 1) % 1 * trackLength;
  let i = 0;
  while (i < SEGMENTS && cumulative[i + 1] < s) i += 1;
  const segStart = cumulative[i];
  const segLen = cumulative[i + 1] - segStart || 1;
  const local = (s - segStart) / segLen;
  const p = centerline[i].clone().lerp(centerline[i + 1], local);
  return { point: p, index: i };
}

const boostPads = PAD_TS.map((t) => {
  const { point, index } = pointAtT(t);
  const n = normalAt(index);
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(HALF_WIDTH * 1.7, 3),
    new THREE.MeshBasicMaterial({ color: '#ffd23f' })
  );
  mesh.rotation.x = -Math.PI / 2;
  const tangent = centerline[(index + 1) % SEGMENTS].clone().sub(centerline[index]).normalize();
  mesh.rotation.z = Math.atan2(tangent.x, tangent.z);
  mesh.position.copy(point).setY(0.02);
  return { mesh, point, cooldownUntil: 0 };
});

// ---------- Decor ----------

const decor = new THREE.Group();
for (let i = 0; i < 26; i += 1) {
  const idx = Math.floor((i / 26) * SEGMENTS);
  const p = centerline[idx];
  const n = normalAt(idx);
  const side = i % 2 === 0 ? 1 : -1;
  const offset = HALF_WIDTH + CURB_WIDTH + 4 + Math.random() * 3;
  const tree = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.25, 0.3, 1.6, 6),
    new THREE.MeshStandardMaterial({ color: '#7a5230' })
  );
  trunk.position.y = 0.8;
  const leaves = new THREE.Mesh(
    new THREE.ConeGeometry(1.3, 2.4, 7),
    new THREE.MeshStandardMaterial({ color: '#2e8b57' })
  );
  leaves.position.y = 2.4;
  tree.add(trunk, leaves);
  tree.position.copy(p).addScaledVector(n, side * offset);
  decor.add(tree);
}

// ---------- Karts ----------

function createKart(bodyColor, helmetColor) {
  const group = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(1.6, 0.5, 2.6),
    new THREE.MeshStandardMaterial({ color: bodyColor })
  );
  body.position.y = 0.45;
  group.add(body);

  const nose = new THREE.Mesh(
    new THREE.ConeGeometry(0.6, 1, 4),
    new THREE.MeshStandardMaterial({ color: bodyColor })
  );
  nose.rotation.x = Math.PI / 2;
  nose.rotation.y = Math.PI / 4;
  nose.position.set(0, 0.45, -1.6);
  group.add(nose);

  const driver = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.35, 0.5, 4, 8),
    new THREE.MeshStandardMaterial({ color: '#f4d7b5' })
  );
  driver.position.set(0, 1.05, 0.2);
  group.add(driver);

  const helmet = new THREE.Mesh(
    new THREE.SphereGeometry(0.32, 12, 12),
    new THREE.MeshStandardMaterial({ color: helmetColor })
  );
  helmet.position.set(0, 1.5, 0.2);
  group.add(helmet);

  const wheelGeo = new THREE.CylinderGeometry(0.34, 0.34, 0.32, 12);
  const wheelMat = new THREE.MeshStandardMaterial({ color: '#181818' });
  const wheelOffsets = [
    [-0.9, 0.34, 1.0], [0.9, 0.34, 1.0],
    [-0.9, 0.34, -1.0], [0.9, 0.34, -1.0],
  ];
  for (const [x, y, z] of wheelOffsets) {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(x, y, z);
    group.add(wheel);
  }

  return group;
}

// ---------- Racers ----------

const RACER_DEFS = [
  { name: 'You', body: '#ff4d6d', helmet: '#ffffff', isPlayer: true },
  { name: 'CPU 1', body: '#4dd6ff', helmet: '#0f1220', isPlayer: false },
  { name: 'CPU 2', body: '#4dffa6', helmet: '#0f1220', isPlayer: false },
  { name: 'CPU 3', body: '#ffd23f', helmet: '#0f1220', isPlayer: false },
];

const MAX_SPEED = 26;
const BOOST_SPEED = 40;
const ACCEL = 14;
const TURN_RATE = 2.4;

function makeRacer(def, startIndex) {
  const mesh = createKart(def.body, def.helmet);
  const startPoint = centerline[startIndex];
  const nextPoint = centerline[(startIndex + 1) % SEGMENTS];
  mesh.position.copy(startPoint);
  const heading = Math.atan2(
    nextPoint.x - startPoint.x,
    nextPoint.z - startPoint.z
  );
  mesh.rotation.y = heading;

  return {
    def,
    mesh,
    heading,
    speed: 0,
    steerInput: 0,
    searchIndex: startIndex,
    lap: 0,
    s: cumulative[startIndex],
    lastS: cumulative[startIndex],
    boostUntil: 0,
    finished: false,
    finishOrder: 0,
    cpuT: startIndex / SEGMENTS,
  };
}

const racers = RACER_DEFS.map((def, i) => makeRacer(def, (i * 6) % SEGMENTS));
const player = racers[0];

// ---------- Scene setup ----------

const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const scene = new THREE.Scene();
scene.background = new THREE.Color('#7ec8ff');
scene.fog = new THREE.Fog('#7ec8ff', 60, 220);

const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 500);

scene.add(ground, road, curbOuter, curbInner, decor);
for (const pad of boostPads) scene.add(pad.mesh);
for (const racer of racers) scene.add(racer.mesh);

const sun = new THREE.DirectionalLight('#ffffff', 2.2);
sun.position.set(60, 90, 40);
scene.add(sun, new THREE.AmbientLight('#ffffff', 0.65));

function resize() {
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

// ---------- Input ----------

let phoneConnected = false;
const waitingEl = document.getElementById('waiting');
const proto = location.protocol === 'https:' ? 'wss' : 'ws';
const ws = new WebSocket(`${proto}://${location.host}/ws?role=display`);
ws.addEventListener('message', (event) => {
  const msg = JSON.parse(event.data);
  if (msg.type === 'input' && msg.player === 1) {
    if (!phoneConnected) {
      phoneConnected = true;
      waitingEl.classList.add('hidden');
    }
    player.steerInput = THREE.MathUtils.clamp(msg.steer, -1, 1);
  }
});

const keys = { left: false, right: false };
window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = true;
  if (e.key === 'ArrowRight' || e.key === 'd') keys.right = true;
});
window.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = false;
  if (e.key === 'ArrowRight' || e.key === 'd') keys.right = false;
});

// ---------- Race state ----------

const LAPS = 3;
let raceOver = false;
let finishCount = 0;
const finishEl = document.getElementById('finish');
const finishPlaceEl = document.getElementById('finish-place');
document.getElementById('restart').addEventListener('click', () => location.reload());

function nearestOnTrack(position, hintIndex) {
  let bestIndex = hintIndex;
  let bestDist = Infinity;
  for (let d = -18; d <= 18; d += 1) {
    const i = ((hintIndex + d) % SEGMENTS + SEGMENTS) % SEGMENTS;
    const dist = position.distanceToSquared(centerline[i]);
    if (dist < bestDist) {
      bestDist = dist;
      bestIndex = i;
    }
  }
  return bestIndex;
}

function updatePlayer(dt) {
  if (raceOver || player.finished) return;

  const steer = phoneConnected ? player.steerInput : (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
  const boosted = performance.now() < player.boostUntil;
  const targetSpeed = boosted ? BOOST_SPEED : MAX_SPEED;
  player.speed = THREE.MathUtils.damp(player.speed, targetSpeed, 1.4, dt);

  const speedFactor = player.speed / MAX_SPEED;
  player.heading += steer * TURN_RATE * speedFactor * dt;

  const forward = new THREE.Vector3(Math.sin(player.heading), 0, Math.cos(player.heading));
  player.mesh.position.addScaledVector(forward, player.speed * dt);
  player.mesh.rotation.y = player.heading;

  player.searchIndex = nearestOnTrack(player.mesh.position, player.searchIndex);
  const center = centerline[player.searchIndex];
  const n = normalAt(player.searchIndex);
  const lateral = player.mesh.position.clone().sub(center).dot(n);
  if (Math.abs(lateral) > HALF_WIDTH + CURB_WIDTH) {
    const clampedLateral = Math.sign(lateral) * (HALF_WIDTH + CURB_WIDTH);
    player.mesh.position.copy(center).addScaledVector(n, clampedLateral);
    player.speed *= 0.9;
  }

  for (const pad of boostPads) {
    if (performance.now() < pad.cooldownUntil) continue;
    if (player.mesh.position.distanceTo(pad.point) < 4) {
      player.boostUntil = performance.now() + 1200;
      pad.cooldownUntil = performance.now() + 1800;
    }
  }

  advanceProgress(player);
}

function updateCpu(racer, dt) {
  if (raceOver || racer.finished) return;
  const speed = (0.16 + racers.indexOf(racer) * 0.012) * (0.94 + Math.random() * 0.12);
  racer.cpuT = (racer.cpuT + speed * dt / 10) % 1;
  const { point, index } = pointAtT(racer.cpuT);
  const tangent = centerline[(index + 1) % SEGMENTS].clone().sub(centerline[index]).normalize();
  racer.mesh.position.copy(point);
  racer.mesh.rotation.y = Math.atan2(tangent.x, tangent.z);
  racer.searchIndex = index;
  racer.s = cumulative[index];
  advanceProgress(racer, racer.cpuT);
}

function advanceProgress(racer, tOverride) {
  const t = tOverride !== undefined ? tOverride : cumulative[racer.searchIndex] / trackLength;
  if (racer.lastS > 0.8 && t < 0.2) {
    racer.lap += 1;
    if (racer.lap >= LAPS && !racer.finished) {
      racer.finished = true;
      finishCount += 1;
      racer.finishOrder = finishCount;
      if (racer.def.isPlayer) showFinish(racer.finishOrder);
      if (finishCount >= racers.length) raceOver = true;
    }
  }
  racer.lastS = t;
}

function showFinish(place) {
  raceOver = raceOver || place === 1;
  const labels = { 1: '1st', 2: '2nd', 3: '3rd', 4: '4th' };
  finishPlaceEl.textContent = `You finished ${labels[place] || `${place}th`}!`;
  finishEl.classList.remove('hidden');
}

function updateCamera(dt) {
  const forward = new THREE.Vector3(Math.sin(player.heading), 0, Math.cos(player.heading));
  const desired = player.mesh.position.clone()
    .addScaledVector(forward, -8)
    .add(new THREE.Vector3(0, 4.2, 0));
  camera.position.lerp(desired, 1 - Math.pow(0.001, dt));
  const lookAt = player.mesh.position.clone().addScaledVector(forward, 6).add(new THREE.Vector3(0, 1, 0));
  camera.lookAt(lookAt);
}

function updateHud() {
  document.getElementById('lap').textContent = `Lap ${Math.min(player.lap + 1, LAPS)} / ${LAPS}`;
  const ranked = [...racers].sort((a, b) => {
    const progA = a.lap * trackLength + cumulative[a.searchIndex];
    const progB = b.lap * trackLength + cumulative[b.searchIndex];
    return progB - progA;
  });
  const place = ranked.indexOf(player) + 1;
  const labels = { 1: '1st', 2: '2nd', 3: '3rd', 4: '4th' };
  document.getElementById('rank').textContent = `${labels[place] || place} / ${racers.length}`;
  document.getElementById('speed-fill').style.width = `${Math.min(100, (player.speed / BOOST_SPEED) * 100)}%`;
}

// ---------- Loop ----------

let last = performance.now();
function tick(now) {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;

  updatePlayer(dt);
  for (let i = 1; i < racers.length; i += 1) updateCpu(racers[i], dt);
  updateCamera(dt);
  updateHud();

  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
