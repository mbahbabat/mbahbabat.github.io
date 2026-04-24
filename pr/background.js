import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

// --- setup scene, camera, renderer with futuristic transparency ---
const container = document.getElementById('canvas-container');
const canvas = document.getElementById('futuristicCanvas');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x010318); // deep cosmic
scene.fog = new THREE.FogExp2(0x010318, 0.008); // subtle fog for depth

// camera: perspective with nice framing
const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
camera.position.set(3, 1.5, 5);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ canvas, alpha: false, antialias: true });
renderer.setSize(container.clientWidth, container.clientHeight, false);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.toneMapping = THREE.ReinhardToneMapping;
renderer.toneMappingExposure = 1.2;

// --- post processing bloom (futuristic glow) ---
const renderScene = new RenderPass(scene, camera);
const bloomPass = new UnrealBloomPass(new THREE.Vector2(container.clientWidth, container.clientHeight), 1.2, 0.3, 0.85);
bloomPass.threshold = 0.1;
bloomPass.strength = 0.9;
bloomPass.radius = 0.8;
const effectComposer = new EffectComposer(renderer);
effectComposer.addPass(renderScene);
effectComposer.addPass(bloomPass);

// --- controls with smooth futuristic interaction ---
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.autoRotate = true;
controls.autoRotateSpeed = 1.2;
controls.enableZoom = true;
controls.enablePan = false;
controls.zoomSpeed = 1.0;
controls.rotateSpeed = 1.2;
controls.target.set(0, 0.2, 0);

// --- LIGHTS: create ethereal neon ambience ---
// ambient cool light
const ambientLight = new THREE.AmbientLight(0x111122);
scene.add(ambientLight);
// main directional light (white/cyan)
const mainLight = new THREE.DirectionalLight(0xccffff, 0.9);
mainLight.position.set(2, 3, 4);
scene.add(mainLight);
// fill with pinkish back rim
const rimLight = new THREE.PointLight(0xff44aa, 0.5);
rimLight.position.set(-1.5, 1, -2.5);
scene.add(rimLight);
// central dynamic point light (pulsing)
const coreLight = new THREE.PointLight(0x33aaff, 1.2, 12);
coreLight.position.set(0, 0.2, 0);
scene.add(coreLight);

// additional fill lights with color shifts
const colorLight = new THREE.PointLight(0x2aff9e, 0.6);
colorLight.position.set(1.2, 1.5, 1.8);
scene.add(colorLight);

// starfield background particle system (deep field)
const starGeometry = new THREE.BufferGeometry();
const starCount = 1800;
const starPositions = new Float32Array(starCount * 3);
for (let i = 0; i < starCount; i++) {
  starPositions[i*3] = (Math.random() - 0.5) * 200;
  starPositions[i*3+1] = (Math.random() - 0.5) * 100;
  starPositions[i*3+2] = (Math.random() - 0.5) * 80 - 40;
}
starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.08, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending });
const stars = new THREE.Points(starGeometry, starMaterial);
scene.add(stars);

// --- MAIN CENTRAL OBJECT: Futuristic Geometric Core (Icosahedron with wireframe + inner glow) ---
const geometryCore = new THREE.IcosahedronGeometry(0.95, 0);
const materialCore = new THREE.MeshStandardMaterial({
  color: 0x2a6eff,
  emissive: 0x1155cc,
  emissiveIntensity: 0.65,
  metalness: 0.85,
  roughness: 0.28,
  flatShading: false,
  transparent: true,
  opacity: 0.92
});
const coreMesh = new THREE.Mesh(geometryCore, materialCore);
coreMesh.castShadow = true;
coreMesh.receiveShadow = false;
scene.add(coreMesh);

// outer wireframe shell (futuristic lattice)
const wireframeMat = new THREE.MeshBasicMaterial({ color: 0x4effff, wireframe: true, transparent: true, opacity: 0.35 });
const outerWire = new THREE.Mesh(new THREE.IcosahedronGeometry(1.08, 0), wireframeMat);
scene.add(outerWire);

// inner energy ring - torus knot (symbolic)
const knotGeo = new THREE.TorusKnotGeometry(1.22, 0.09, 180, 24, 3, 4);
const knotMat = new THREE.MeshStandardMaterial({ color: 0x00e0ff, emissive: 0x0088aa, emissiveIntensity: 0.9, metalness: 0.9, roughness: 0.2 });
const knotRing = new THREE.Mesh(knotGeo, knotMat);
scene.add(knotRing);

// floating particles around core (dynamic point cloud)
const particleCount = 3200;
const particleGeo = new THREE.BufferGeometry();
const particlePositions = new Float32Array(particleCount * 3);
const particleColors = new Float32Array(particleCount * 3);
for (let i = 0; i < particleCount; i++) {
  // spherical distribution with radius between 1.5 and 2.6
  const radius = 1.6 + Math.random() * 1.2;
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  const x = radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.sin(phi) * Math.sin(theta) * 0.9; // slight flattening
  const z = radius * Math.cos(phi);
  particlePositions[i*3] = x;
  particlePositions[i*3+1] = y + 0.1;
  particlePositions[i*3+2] = z;
  
  // colors: cyan, magenta, electric blue, soft gold
  const colorChoice = Math.random();
  if (colorChoice < 0.6) {
    particleColors[i*3] = 0.2 + Math.random()*0.5;   // R
    particleColors[i*3+1] = 0.6 + Math.random()*0.4; // G
    particleColors[i*3+2] = 1.0;                    // B
  } else if (colorChoice < 0.85) {
    particleColors[i*3] = 0.9;
    particleColors[i*3+1] = 0.2 + Math.random()*0.5;
    particleColors[i*3+2] = 0.9;
  } else {
    particleColors[i*3] = 1.0;
    particleColors[i*3+1] = 0.7;
    particleColors[i*3+2] = 0.3;
  }
}
particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
particleGeo.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));
const particleMat = new THREE.PointsMaterial({ size: 0.045, vertexColors: true, blending: THREE.AdditiveBlending, transparent: true, opacity: 0.8 });
const particleField = new THREE.Points(particleGeo, particleMat);
scene.add(particleField);

// additional floating orbs / glowing sparks (secondary)
const sparkCount = 800;
const sparkGeo = new THREE.BufferGeometry();
const sparkPos = new Float32Array(sparkCount * 3);
for (let i = 0; i < sparkCount; i++) {
  const rad = 2.2 + Math.random() * 1.3;
  const theta2 = Math.random() * Math.PI * 2;
  const phi2 = Math.acos(2 * Math.random() - 1);
  sparkPos[i*3] = rad * Math.sin(phi2) * Math.cos(theta2);
  sparkPos[i*3+1] = rad * Math.sin(phi2) * Math.sin(theta2) * 0.7;
  sparkPos[i*3+2] = rad * Math.cos(phi2);
}
sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPos, 3));
const sparkMat = new THREE.PointsMaterial({ color: 0xff77cc, size: 0.022, blending: THREE.AdditiveBlending });
const sparkField = new THREE.Points(sparkGeo, sparkMat);
scene.add(sparkField);

// -- elegant rotating rings (orbital) --
const ringGeo = new THREE.TorusGeometry(1.45, 0.035, 128, 300);
const ringMat = new THREE.MeshStandardMaterial({ color: 0x3cbcff, emissive: 0x0088aa, emissiveIntensity: 0.5 });
const ring1 = new THREE.Mesh(ringGeo, ringMat);
ring1.rotation.x = Math.PI / 2;
ring1.rotation.z = 0.3;
scene.add(ring1);

const ringGeo2 = new THREE.TorusGeometry(1.65, 0.025, 128, 300);
const ringMat2 = new THREE.MeshStandardMaterial({ color: 0xff66cc, emissive: 0x551133, emissiveIntensity: 0.4 });
const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
ring2.rotation.y = 0.8;
ring2.rotation.x = 1.2;
scene.add(ring2);

const ringGeo3 = new THREE.TorusGeometry(1.85, 0.02, 128, 400);
const ringMat3 = new THREE.MeshStandardMaterial({ color: 0x88ffaa, emissive: 0x226633, emissiveIntensity: 0.3 });
const ring3 = new THREE.Mesh(ringGeo3, ringMat3);
ring3.rotation.z = 1.4;
ring3.rotation.x = 0.9;
scene.add(ring3);

// --- FLOATING GLOW SPHERES (tiny satellites) ---
const glowGroup = [];
const satCount = 16;
for (let i = 0; i < satCount; i++) {
  const sphereGeo = new THREE.SphereGeometry(0.065, 16, 16);
  const sphereMat = new THREE.MeshStandardMaterial({ color: 0xffaa55, emissive: 0xff4422, emissiveIntensity: 0.8 });
  const sat = new THREE.Mesh(sphereGeo, sphereMat);
  scene.add(sat);
  glowGroup.push(sat);
}

// dynamic data: store angles and radii
const satData = [];
for (let i = 0; i < satCount; i++) {
  satData.push({
    radius: 1.9 + Math.random() * 0.8,
    speed: 0.5 + Math.random() * 0.7,
    angleY: Math.random() * Math.PI * 2,
    angleX: Math.random() * Math.PI * 2,
    yOffset: (Math.random() - 0.5) * 1.2
  });
}

// --- subtle ground reflective disc (invisible but adds shimmer) ---
const floorGlowGeo = new THREE.CircleGeometry(2.6, 32);
const floorMat = new THREE.MeshStandardMaterial({ color: 0x0a3366, emissive: 0x004466, transparent: true, opacity: 0.2, side: THREE.DoubleSide });
const glowDisc = new THREE.Mesh(floorGlowGeo, floorMat);
glowDisc.rotation.x = -Math.PI / 2;
glowDisc.position.y = -0.9;
scene.add(glowDisc);

// --- animation variables for dynamic lights and rotation ---
let time = 0;

// --- adaptive resizing ---
window.addEventListener('resize', onWindowResize, false);
function onWindowResize() {
  const width = container.clientWidth;
  const height = container.clientHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  effectComposer.setSize(width, height);
  renderer.setSize(width, height, false);
}

// --- auto-rotate toggle on user interaction ---
let autoRotateFlag = true;
controls.autoRotate = true;
controls.addEventListener('start', () => {
  if (autoRotateFlag) {
    controls.autoRotate = false;
    autoRotateFlag = false;
    clearTimeout(window._rotateTimeout);
    window._rotateTimeout = setTimeout(() => {
      if (!controls.autoRotate && !autoRotateFlag) {
        controls.autoRotate = true;
        autoRotateFlag = true;
      }
    }, 4000);
  }
});

// --- beautiful clock animation & pulsating effects ---
function animate() {
  requestAnimationFrame(animate);
  time += 0.012;
  
  // core pulsation and color shift
  const intensity = 0.85 + Math.sin(time * 2.5) * 0.3;
  coreLight.intensity = 0.9 + Math.sin(time * 2.8) * 0.4;
  coreLight.color.setHSL(0.55 + Math.sin(time * 0.9) * 0.05, 1.0, 0.6);
  materialCore.emissiveIntensity = 0.6 + Math.sin(time * 3) * 0.25;
  
  // rotate central elements
  coreMesh.rotation.y = time * 0.3;
  coreMesh.rotation.x = Math.sin(time * 0.5) * 0.2;
  outerWire.rotation.y = time * 0.25;
  outerWire.rotation.x = time * 0.15;
  knotRing.rotation.x = time * 0.5;
  knotRing.rotation.z = time * 0.7;
  knotRing.rotation.y = time * 0.4;
  
  // rings rotation
  ring1.rotation.z += 0.005;
  ring1.rotation.y += 0.003;
  ring2.rotation.x += 0.004;
  ring2.rotation.z += 0.006;
  ring3.rotation.y += 0.007;
  ring3.rotation.x += 0.003;
  
  // particle field dynamic undulation
  const positions = particleGeo.attributes.position.array;
  for (let i = 0; i < particleCount; i++) {
    // slight wave motion based on original radius direction (not heavy)
    const ix = i * 3, iy = i * 3 + 1, iz = i * 3 + 2;
    const origX = particlePositions[ix];
    const origZ = particlePositions[iz];
    const wave = Math.sin(time * 1.5 + origX * 1.2) * 0.008;
    positions[ix] = origX + wave * Math.cos(time * 0.9);
    positions[iz] = origZ + Math.sin(time * 1.2 + origZ) * 0.005;
    positions[iy] = particlePositions[iy] + Math.sin(time * 1.8 + origX) * 0.003;
  }
  particleGeo.attributes.position.needsUpdate = true;
  
  // animate satellite spheres
  for (let i = 0; i < satCount; i++) {
    const data = satData[i];
    data.angleY += 0.01 * data.speed;
    data.angleX += 0.007 * data.speed;
    const x = Math.cos(data.angleY) * data.radius;
    const z = Math.sin(data.angleY) * data.radius;
    const y = Math.sin(data.angleX) * 0.8 + data.yOffset * 0.5;
    glowGroup[i].position.set(x, y + 0.2, z);
    // pulsate size slightly
    const scale = 0.9 + Math.sin(time * 5 + i) * 0.3;
    glowGroup[i].scale.set(scale, scale, scale);
  }
  
  // starfield slow rotation
  stars.rotation.y += 0.0005;
  stars.rotation.x += 0.0003;
  
  // sparkField rotate slowly
  sparkField.rotation.y = time * 0.1;
  sparkField.rotation.x = Math.sin(time * 0.2) * 0.2;
  
  // color light drift
  colorLight.intensity = 0.5 + Math.sin(time) * 0.3;
  rimLight.intensity = 0.4 + Math.cos(time * 1.2) * 0.2;
  
  // update controls and render via effect composer
  controls.update(); // handles autoRotate if flag true
  effectComposer.render();
}

// initial call
animate();

// handle container resize once more to be safe
setTimeout(() => onWindowResize(), 100);
