import * as THREE from 'three';

export class PanoramaSystem {
  constructor(scene, maxAnisotropy) {
    this.scene = scene;
    this.maxAnisotropy = maxAnisotropy;
    const geometry = new THREE.SphereGeometry(500, 64, 48);
    geometry.scale(-1, 1, 1);
    this.mesh = new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({ color: 0x0b0f14 })
    );
    scene.add(this.mesh);
  }

  load(url) {
    return new Promise((resolve, reject) => {
      new THREE.TextureLoader().load(
        url,
        (texture) => {
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.anisotropy = Math.min(8, this.maxAnisotropy);
          this.mesh.material.map = texture;
          this.mesh.material.color.set(0xffffff);
          this.mesh.material.needsUpdate = true;
          resolve(texture);
        },
        undefined,
        reject
      );
    });
  }
}
