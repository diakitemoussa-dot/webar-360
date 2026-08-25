import * as THREE from 'three';
import { PanoramaSystem } from './PanoramaSystem.js';
import { CameraRig } from './CameraRig.js';
import { GyroControls } from './GyroControls.js';
import { TouchControls } from './TouchControls.js';
import { HotspotSystem } from './HotspotSystem.js';
import { AudioManager } from './AudioManager.js';
import { GuideSystem } from './GuideSystem.js';

const app = document.getElementById('app');
const motionPrompt = document.getElementById('motionPrompt');

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: 'high-performance'
});
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
app.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  78,
  innerWidth / innerHeight,
  0.1,
  1100
);

const rig = new CameraRig(camera);
const gyro = new GyroControls(rig);
new TouchControls(renderer.domElement, rig);

const panorama = new PanoramaSystem(
  scene,
  renderer.capabilities.getMaxAnisotropy()
);

const hotspotSystem = new HotspotSystem(
  document.getElementById('hotspotLayer'),
  camera,
  openHotspotPanel
);

const audio = new AudioManager();
const guide = new GuideSystem(scene);

panorama
  .load('assets/panorama-preview.jpg')
  .then(() => panorama.load('assets/panorama.jpg'))
  .catch(() => panorama.load('assets/panorama.jpg'));

guide.autodetect();

const panel = document.getElementById('hotspotPanel');
const panelTitle = document.getElementById('panelTitle');
const panelText = document.getElementById('panelText');
document.getElementById('panelClose').addEventListener('click', () => {
  panel.classList.remove('open');
});

function openHotspotPanel(data) {
  panelTitle.textContent = data.title;
  panelText.textContent = data.text;
  panel.classList.add('open');
  if (audio.ctx) audio.ctx.resume();
}

const aboutPanel = document.getElementById('aboutPanel');
document.getElementById('infoBtn').addEventListener('click', () => {
  aboutPanel.classList.toggle('open');
});
document.getElementById('aboutClose').addEventListener('click', () => {
  aboutPanel.classList.remove('open');
});

document.getElementById('recenterBtn').addEventListener('click', () => {
  rig.recenter();
});

const soundBtn = document.getElementById('soundBtn');
soundBtn.addEventListener('click', async () => {
  const on = await audio.toggle();
  soundBtn.classList.toggle('off', !on);
});

document.getElementById('backBtn').addEventListener('click', () => {
  if (history.length > 1) history.back();
});

let motionRequested = false;
motionPrompt.addEventListener('click', tryEnableMotion);

async function tryEnableMotion() {
  if (motionRequested) return;
  motionRequested = true;
  const ok = await gyro.enable();
  motionPrompt.hidden = true;
  if (!ok) {
    console.info('Gyroscope unavailable, using touch controls.');
  }
}

const needsPermission =
  typeof DeviceOrientationEvent !== 'undefined' &&
  typeof DeviceOrientationEvent.requestPermission === 'function';

if (needsPermission) {
  motionPrompt.hidden = false;
} else {
  gyro.attach();
  setTimeout(() => {
    if (!gyro.available) console.info('No gyroscope data, touch controls active.');
  }, 1000);
}

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

const clock = new THREE.Clock();

renderer.setAnimationLoop(() => {
  const dt = clock.getDelta();
  rig.update(dt);
  guide.update(dt);
  hotspotSystem.update();
  renderer.render(scene, camera);
});
