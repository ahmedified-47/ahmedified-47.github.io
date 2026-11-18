const root = document.documentElement;
const canvas = document.getElementById("hero-canvas");
const reducedQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

if (reducedQuery.matches) root.classList.add("reduced-motion");

function markNoWebGL() {
  root.classList.add("no-webgl");
}

function rand(seed) {
  let value = seed >>> 0;
  return function () {
    value = (value + 0x6d2b79f5) >>> 0;
    let t = Math.imul(value ^ (value >>> 15), 1 | value);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

async function boot() {
  if (!canvas || reducedQuery.matches) return;

  let THREE;
  try {
    THREE = await import("three");
  } catch (error) {
    markNoWebGL();
    return;
  }

  const narrow = window.matchMedia("(max-width: 760px)").matches;
  const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true,
    antialias: !narrow,
    powerPreference: "high-performance",
  });

  if (!renderer.getContext()) {
    markNoWebGL();
    renderer.dispose();
    return;
  }

  root.classList.add("webgl");
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x07060d, 9, 22);

  const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 40);
  camera.position.set(0, 0.15, 8.4);

  scene.add(new THREE.AmbientLight(0xc9d4ff, 0.7));

  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(4, 5, 6);
  scene.add(key);

  const pink = new THREE.PointLight(0xff4d8d, 28, 24, 2);
  pink.position.set(-4.5, 1.4, 3);
  scene.add(pink);

  const cyan = new THREE.PointLight(0x3de0ff, 24, 24, 2);
  cyan.position.set(4.2, -1.6, 2.4);
  scene.add(cyan);

  const group = new THREE.Group();
  scene.add(group);

  const palette = [0x8b6cff, 0xff4d8d, 0x3de0ff, 0xe7e2ff];
  const geometries = [
    new THREE.IcosahedronGeometry(0.92, 0),
    new THREE.OctahedronGeometry(0.72, 0),
    new THREE.TorusGeometry(0.66, 0.16, 18, 42),
    new THREE.TetrahedronGeometry(0.78, 0),
    new THREE.BoxGeometry(0.78, 0.78, 0.78),
    new THREE.DodecahedronGeometry(0.58, 0),
    new THREE.TorusGeometry(1.35, 0.03, 12, 80),
    new THREE.IcosahedronGeometry(0.42, 0),
  ];

  const layout = [
    { i: 0, x: -2.5, y: 0.7, z: -0.6, wire: false },
    { i: 1, x: 2.7, y: 0.55, z: -0.4, wire: true },
    { i: 2, x: 1.7, y: 1.55, z: -1.6, wire: false },
    { i: 3, x: -1.8, y: 1.35, z: -1.2, wire: true },
    { i: 4, x: 3.15, y: 1.05, z: -2.3, wire: false },
    { i: 5, x: -3.25, y: 1.45, z: -1.4, wire: true },
    { i: 6, x: 0.35, y: 0.85, z: -1.3, wire: false },
    { i: 7, x: -0.4, y: 2.15, z: -2.4, wire: true },
  ];

  const count = narrow ? 5 : layout.length;
  const meshes = [];
  const random = rand(47);

  for (let n = 0; n < count; n += 1) {
    const item = layout[n];
    const color = palette[n % palette.length];
    const material = item.wire
      ? new THREE.MeshBasicMaterial({
          color: color,
          wireframe: true,
          transparent: true,
          opacity: 0.9,
        })
      : new THREE.MeshStandardMaterial({
          color: color,
          metalness: 0.52,
          roughness: 0.2,
          emissive: color,
          emissiveIntensity: 0.28,
          transparent: true,
          opacity: 0.94,
        });
    const mesh = new THREE.Mesh(geometries[item.i], material);
    mesh.position.set(item.x, item.y, item.z);
    if (narrow && item.i === 6) {
      mesh.scale.setScalar(0.62);
      mesh.position.x = 1.9;
      mesh.position.y = 1.7;
    }
    mesh.rotation.set(random() * Math.PI, random() * Math.PI, random() * Math.PI);
    mesh.userData = {
      y: item.y,
      phase: random() * Math.PI * 2,
      spin: 0.002 + random() * 0.004,
    };
    group.add(mesh);
    meshes.push(mesh);
  }

  const particleCount = narrow ? 180 : 520;
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);
  const color = new THREE.Color();
  const particleRandom = rand(19);
  for (let i = 0; i < particleCount; i += 1) {
    const radius = 3.2 + particleRandom() * 8;
    const theta = particleRandom() * Math.PI * 2;
    const phi = Math.acos(2 * particleRandom() - 1);
    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) * 0.62;
    positions[i * 3 + 2] = radius * Math.cos(phi);
    color.setHex(palette[i % palette.length]);
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }

  const pointsGeo = new THREE.BufferGeometry();
  pointsGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  pointsGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  const points = new THREE.Points(
    pointsGeo,
    new THREE.PointsMaterial({
      size: narrow ? 0.045 : 0.032,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      sizeAttenuation: true,
    })
  );
  scene.add(points);

  const pointer = { x: 0, y: 0 };
  let scroll = window.scrollY || 0;
  let running = true;
  let frame = 0;

  function resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, narrow ? 1.5 : 1.75);
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(width, height, false);
    camera.aspect = width / Math.max(height, 1);
    camera.updateProjectionMatrix();
  }

  function render(time) {
    const t = time * 0.001;
    const swayX = pointer.y * 0.35;
    const swayY = pointer.x * 0.45;
    group.rotation.x += (swayX - group.rotation.x) * 0.045;
    group.rotation.y += (swayY - group.rotation.y) * 0.045;
    group.position.y = 0.35 - Math.min(scroll / 900, 1.6);
    points.rotation.y = t * 0.035 + pointer.x * 0.15;
    points.rotation.x = pointer.y * 0.08;
    camera.position.z = 8.4 + Math.min(scroll / 700, 2.2);
    camera.position.x += (pointer.x * 0.35 - camera.position.x) * 0.04;

    meshes.forEach(function (mesh) {
      mesh.position.y = mesh.userData.y + Math.sin(t * 0.7 + mesh.userData.phase) * 0.22;
      mesh.rotation.y += mesh.userData.spin;
      mesh.rotation.x += mesh.userData.spin * 0.65;
    });

    const fade = Math.min(scroll / (window.innerHeight * 0.85), 1);
    canvas.style.opacity = String(1 - fade);
    renderer.render(scene, camera);
  }

  function loop(time) {
    if (!running) {
      frame = 0;
      return;
    }
    frame = window.requestAnimationFrame(loop);
    render(time);
  }

  function start() {
    if (running && frame) return;
    running = true;
    frame = window.requestAnimationFrame(loop);
  }

  function stop() {
    running = false;
    if (frame) window.cancelAnimationFrame(frame);
    frame = 0;
  }

  window.addEventListener(
    "pointermove",
    function (event) {
      pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.y = (event.clientY / window.innerHeight) * 2 - 1;
    },
    { passive: true }
  );

  window.addEventListener(
    "scroll",
    function () {
      scroll = window.scrollY || 0;
      if (scroll > window.innerHeight * 0.95) stop();
      else if (!document.hidden) start();
    },
    { passive: true }
  );

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) stop();
    else if (scroll <= window.innerHeight) start();
  });

  window.addEventListener("resize", resize);
  if (window.visualViewport) window.visualViewport.addEventListener("resize", resize);

  canvas.addEventListener(
    "webglcontextlost",
    function (event) {
      event.preventDefault();
      stop();
      markNoWebGL();
    },
    false
  );

  resize();
  render(0);
  start();
}

boot();
