import * as THREE from 'three';

export const HOTSPOTS = [
  {
    id: 'cliff',
    title: 'THE CLIFF',
    text: 'The Bandiagara escarpment rises up to 500 metres above the plain. For centuries its rock shelters and caves have served as burial sites and sanctuaries. The Tellem built their dwellings in its walls long before the Dogon arrived, and the cliff remains the spiritual guardian of the whole region.',
    image: 'assets/hotspots/cliff.jpg',
    yaw: 10,
    pitch: 6
  },
  {
    id: 'houses',
    title: 'THE HOUSES',
    text: 'Built from banco — a mix of earth, straw and shea butter — these rectangular houses stay cool by day and warm at night. Walls must be replastered after every rainy season, a task that brings the whole family together. Low doors and small openings protect the family and its belongings.',
    image: 'assets/hotspots/houses.jpg',
    yaw: 28,
    pitch: -6
  },
  {
    id: 'granaries',
    title: 'THE GRANARIES',
    text: 'Each family owns several granaries: one for millet, one for onions, others for personal belongings. The conical thatched roofs and sealed doors protect the harvest from rain, rodents and intruders. The shape has become a symbol of Dogon architecture.',
    image: 'assets/hotspots/granaries.jpg',
    yaw: -115,
    pitch: -2
  },
  {
    id: 'roofs',
    title: 'THE THATCHED ROOFS',
    text: 'Roofed with millet straw bundled in thick layers, the pointed roofs shed the heavy rains of the season. The same technique covers the toguna — the shaded meeting place of the village elders, kept low on purpose so discussions stay calm.',
    image: 'assets/hotspots/roofs.jpg',
    yaw: 110,
    pitch: -2
  },
  {
    id: 'life',
    title: 'VILLAGE LIFE',
    text: 'Life unfolds on the sandy square: children playing, women pounding millet, weavers and smiths at work. Markets, masked dances and village councils all take place here, in the heart of daily Dogon life.',
    image: 'assets/hotspots/life.jpg',
    yaw: -55,
    pitch: -13
  }
];

export class HotspotSystem {
  constructor(layer, camera, onSelect) {
    this.layer = layer;
    this.camera = camera;
    this.radius = 60;
    this.items = [];

    for (const data of HOTSPOTS) {
      const el = document.createElement('div');
      el.className = 'hotspot hidden';
      el.innerHTML = `<div class="dot"></div><div class="label">${data.title}</div>`;
      el.addEventListener('click', () => onSelect(data));
      layer.appendChild(el);

      const d = THREE.MathUtils.degToRad(data.yaw);
      const p = THREE.MathUtils.degToRad(data.pitch);
      const position = new THREE.Vector3(
        -Math.cos(d) * Math.cos(p),
        Math.sin(p),
        -Math.sin(d) * Math.cos(p)
      ).multiplyScalar(this.radius);

      this.items.push({ data, el, position });
    }

    this._v = new THREE.Vector3();
  }

  update() {
    const cameraMatrix = this.camera.matrixWorldInverse;
    for (const item of this.items) {
      this._v.copy(item.position).applyMatrix4(cameraMatrix);
      if (this._v.z > -1) {
        item.el.classList.add('hidden');
        continue;
      }
      this._v.copy(item.position).project(this.camera);
      const x = (this._v.x * 0.5 + 0.5) * innerWidth;
      const y = (-this._v.y * 0.5 + 0.5) * innerHeight;
      item.el.style.left = `${x}px`;
      item.el.style.top = `${y}px`;
      item.el.classList.remove('hidden');
    }
  }
}
