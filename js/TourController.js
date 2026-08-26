import * as THREE from 'three';
import { TOUR } from './tour-data.js';
import { headingBetween, lonForHeading, worldPosition } from './spatial.js';

const TRANSITION_MS = 2400;

const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function loadTexture(url) {
  return new Promise((resolve, reject) => {
    new THREE.TextureLoader().load(url, (t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 8;
      resolve(t);
    }, undefined, reject);
  });
}

export class TourController {
  constructor({ scene, camera, rig, audio, hotspotSystem, navLayer, hotspotLayer, mapDots, onTravelStart, onNodeChange }) {
    this.scene = scene;
    this.camera = camera;
    this.rig = rig;
    this.audio = audio;
    this.hotspotSystem = hotspotSystem;
    this.navLayer = navLayer;
    this.hotspotLayer = hotspotLayer;
    this.mapDots = mapDots;
    this.onTravelStart = onTravelStart;
    this.onNodeChange = onNodeChange;

    this.nodeById = new Map(TOUR.nodes.map((n) => [n.id, n]));
    this.nodes = TOUR.nodes;
    this.current = this.nodeById.get(TOUR.start);
    this.transitioning = false;
    this.textures = new Map();
    this.markers = [];
    this.history = [];
    this._tween = null;
    this._proj = new THREE.Vector3();

    const geo = new THREE.SphereGeometry(500, 64, 48);
    geo.scale(-1, 1, 1);
    this.skyA = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0x0b0f14 }));
    const geoB = geo.clone();
    geoB.scale(0.999, 0.999, 0.999);
    this.skyB = new THREE.Mesh(
      geoB,
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
    );
    scene.add(this.skyA);
    scene.add(this.skyB);

    this._buildMap();
  }

  async enterStart() {
    const node = this.current;
    const preview = await loadTexture(node.preview);
    if (this.current !== node) return;
    this.skyA.material.map = preview;
    this.skyA.material.color.set(0xffffff);
    this.skyA.material.needsUpdate = true;
    this.camera.position.set(...node.position);
    this.rig.lon = lonForHeading(0, node);
    this.hotspotSystem.setForNode(node);
    this._buildMarkers(node);
    this._updateMap();
    this.onNodeChange?.(node);
    this.audio.setNode(node.id);
    const full = await loadTexture(node.image);
    if (this.current === node && !this.transitioning) {
      this.skyA.material.map = full;
      this.skyA.material.needsUpdate = true;
    }
    this._cacheTexture(node.id, 'full', full);
    this._preloadNeighbors(node);
  }

  _cacheTexture(id, level, tex) {
    if (!this.textures.has(id)) this.textures.set(id, {});
    this.textures.get(id)[level] = tex;
  }

  _preloadNeighbors(node) {
    for (const link of node.links) {
      const n = this.nodeById.get(link.to);
      if (!this.textures.get(n.id)?.preview) {
        loadTexture(n.preview).then((t) => {
          this._cacheTexture(n.id, 'preview', t);
          this._disposeFar();
        }).catch(() => {});
      }
    }
  }

  _disposeFar() {
    const keep = new Set([this.current.id, ...this.current.links.map((l) => l.to)]);
    for (const [id, levels] of this.textures) {
      if (keep.has(id)) continue;
      for (const level of Object.keys(levels)) {
        levels[level].dispose();
        delete levels[level];
      }
    }
  }

  canGoBack() {
    return this.history.length > 0 && !this.transitioning;
  }

  goBack() {
    if (!this.canGoBack()) return;
    const targetId = this.history.pop();
    if (targetId === this.current.id) {
      this.goBack();
      return;
    }
    this.travel(targetId);
  }

  travel(targetId) {
    if (this.transitioning || targetId === this.current.id) return;
    const from = this.current;
    const to = this.nodeById.get(targetId);
    if (!to) return;

    this.transitioning = true;
    this.rig.locked = true;
    this.history.push(from.id);
    this.onTravelStart?.();
    this.hotspotLayer.classList.add('faded');
    this.navLayer.classList.add('faded');

    loadTexture(to.preview)
      .then((preview) => {
        if (!this.transitioning) return;
        this._cacheTexture(to.id, 'preview', preview);
        this._runTransition(from, to, preview);
      })
      .catch(() => {
        this.transitioning = false;
        this.rig.locked = false;
      });
  }

  _runTransition(from, to, preview) {
    this.skyB.material.map = preview;
    this.skyB.material.needsUpdate = true;

    const start = new THREE.Vector3(...from.position);
    const end = new THREE.Vector3(...to.position);
    const moveHeading = headingBetween(start, end);
    const lonTarget = lonForHeading(moveHeading, to);

    this.rig.targetFov = this.rig.baseFov * 0.88;
    const t0 = performance.now();

    this._tween = () => {
      const t = Math.min(1, (performance.now() - t0) / TRANSITION_MS);
      const e = easeInOut(t);
      this.camera.position.lerpVectors(start, end, e);
      this.skyB.material.opacity = THREE.MathUtils.clamp((t - 0.2) / 0.55, 0, 1);

      if (t >= 1) {
        this._finishTransition(to, lonTarget);
      }
    };
  }

  async _finishTransition(to, lonTarget) {
    this._tween = null;
    this.skyA.material.map = this.skyB.material.map;
    this.skyA.material.needsUpdate = true;
    this.skyB.material.map = null;
    this.skyB.material.opacity = 0;
    this.camera.position.set(...to.position);
    this.rig.targetFov = this.rig.baseFov;
    this.rig.faceLon(lonTarget);

    this.current = to;
    this.hotspotSystem.setForNode(to);
    this._buildMarkers(to);
    this._updateMap();
    this.onNodeChange?.(to);
    this.audio.setNode(to.id);
    this.transitioning = false;
    this.rig.locked = false;
    this.hotspotLayer.classList.remove('faded');
    this.navLayer.classList.remove('faded');

    loadTexture(to.image)
      .then((full) => {
        this._cacheTexture(to.id, 'full', full);
        if (this.current === to && !this.transitioning) {
          this.skyA.material.map = full;
          this.skyA.material.needsUpdate = true;
        }
        this._disposeFar();
      })
      .catch(() => {});
    this._preloadNeighbors(to);
  }

  _buildMarkers(node) {
    this.navLayer.querySelectorAll('.nav-marker').forEach((e) => e.remove());
    this.markers = [];
    for (const link of node.links) {
      const target = this.nodeById.get(link.to);
      const el = document.createElement('div');
      el.className = 'nav-marker';
      el.innerHTML = `<div class="nav-ring"><span>&#8593;</span></div><div class="nav-label">${link.label}</div>`;
      el.addEventListener('click', () => this.travel(link.to));
      this.navLayer.appendChild(el);
      this.markers.push({
        el,
        position: worldPosition(node, link.yaw, -14, 9),
        target
      });
    }
  }

  _buildMap() {
    this.mapDots.querySelectorAll('.map-dot').forEach((e) => e.remove());
    const xs = this.nodes.map((n) => n.position[0]);
    const zs = this.nodes.map((n) => n.position[2]);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minZ = Math.min(...zs), maxZ = Math.max(...zs);
    const spanX = Math.max(1e-6, maxX - minX);
    const spanZ = Math.max(1e-6, maxZ - minZ);
    const size = 110;
    this._mapScale = (n) => ({
      x: 10 + ((n.position[0] - minX) / spanX) * (size - 20),
      y: 10 + ((n.position[2] - minZ) / spanZ) * (size - 20)
    });
    for (const n of this.nodes) {
      const dot = document.createElement('button');
      dot.className = 'map-dot';
      dot.dataset.id = n.id;
      dot.title = n.name;
      const { x, y } = this._mapScale(n);
      dot.style.left = `${x}px`;
      dot.style.top = `${y}px`;
      dot.addEventListener('click', () => this.travel(n.id));
      this.mapDots.appendChild(dot);
    }
    this._updateMap();
  }

  _updateMap() {
    this.mapDots.querySelectorAll('.map-dot').forEach((dot) => {
      dot.classList.toggle('current', dot.dataset.id === this.current.id);
      const connected = this.current.links.some((l) => l.to === dot.dataset.id);
      dot.classList.toggle('connected', connected);
      dot.classList.toggle('far', !connected && dot.dataset.id !== this.current.id);
    });
  }

  update() {
    if (this._tween) this._tween();
    this.skyA.position.copy(this.camera.position);
    this.skyB.position.copy(this.camera.position);

    const cameraMatrix = this.camera.matrixWorldInverse;
    for (const m of this.markers) {
      this._proj.copy(m.position).applyMatrix4(cameraMatrix);
      if (this._proj.z > -1 || this.transitioning) {
        m.el.classList.add('hidden');
        continue;
      }
      this._proj.copy(m.position).project(this.camera);
      m.el.style.left = `${(this._proj.x * 0.5 + 0.5) * innerWidth}px`;
      m.el.style.top = `${(-this._proj.y * 0.5 + 0.5) * innerHeight}px`;
      m.el.classList.remove('hidden');
    }
  }
}
