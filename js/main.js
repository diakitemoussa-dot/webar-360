import * as THREE from 'three';
import { CameraRig } from './CameraRig.js';
import { GyroControls } from './GyroControls.js';
import { TouchControls } from './TouchControls.js';
import { HotspotSystem } from './HotspotSystem.js';
import { AudioManager } from './AudioManager.js';
import { GuideSystem } from './GuideSystem.js';
import { TourController } from './TourController.js';

const app = document.getElementById('app');
const motionPrompt = document.getElementById('motionPrompt');
const hotspotLayer = document.getElementById('hotspotLayer');
const navLayer = document.getElementById('navLayer');
const nodeLabel = document.getElementById('nodeLabel');

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: 'high-performance'
});
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
app.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(78, innerWidth / innerHeight, 0.1, 1100);

const rig = new CameraRig(camera);
const gyro = new GyroControls(rig);
new TouchControls(renderer.domElement, rig);
const audio = new AudioManager();
const guide = new GuideSystem(scene);

const hotspotSystem = new HotspotSystem(hotspotLayer, camera, openHotspotPanel);

const tour = new TourController({
  scene,
  camera,
  rig,
  audio,
  hotspotSystem,
  navLayer,
  hotspotLayer,
  mapDots: document.getElementById('mapDots'),
  onTravelStart: () => {
    panel.classList.remove('open');
    aboutPanel.classList.remove('open');
    stopNarration();
  }
});

tour.enterStart().then(() => {
  nodeLabel.textContent = tour.current.name;
});

const _updateMapLabel = tour._updateMap.bind(tour);
tour._updateMap = function () {
  _updateMapLabel();
  nodeLabel.textContent = this.current.name;
};

const panel = document.getElementById('hotspotPanel');
const panelTitle = document.getElementById('panelTitle');
const panelText = document.getElementById('panelText');
const panelImage = document.getElementById('panelImage');
const narrationBtn = document.getElementById('narrationBtn');
let narration = null;

document.getElementById('panelClose').addEventListener('click', () => {
  panel.classList.remove('open');
  stopNarration();
});

function stopNarration() {
  if (narration) {
    narration.pause();
    narration = null;
  }
  narrationBtn.hidden = true;
  narrationBtn.classList.remove('playing');
}

narrationBtn.addEventListener('click', () => {
  if (!narration) return;
  if (narration.paused) {
    narration.play();
    narrationBtn.classList.add('playing');
    narrationBtn.querySelector('span').textContent = 'Pause';
  } else {
    narration.pause();
    narrationBtn.classList.remove('playing');
    narrationBtn.querySelector('span').textContent = 'Listen';
  }
});

async function openHotspotPanel(data) {
  panelTitle.textContent = data.title;
  panelText.textContent = data.text;
  panelImage.src = data.image;
  panel.classList.add('open');
  stopNarration();

  const url = `assets/audio/${data.id}.mp3`;
  try {
    const head = await fetch(url, { method: 'HEAD' });
    if (head.ok) {
      stopNarration();
      narration = new Audio(url);
      narration.addEventListener('ended', () => {
        narrationBtn.classList.remove('playing');
        narrationBtn.querySelector('span').textContent = 'Listen';
      });
      narrationBtn.hidden = false;
    }
  } catch {}
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

const mapToggle = document.getElementById('mapToggle');
const mapPanel = document.getElementById('mapPanel');
mapToggle.addEventListener('click', () => {
  mapPanel.hidden = !mapPanel.hidden;
});

guide.autodetect();

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
  tour.update();
  hotspotSystem.update();
  renderer.render(scene, camera);
});
