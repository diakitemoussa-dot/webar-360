import * as THREE from 'three';

export class GuideSystem {
  constructor(scene) {
    this.scene = scene;
    this.model = null;
    this.mixer = null;
    this.ready = false;
  }

  async autodetect(url = 'assets/guide/model.glb') {
    try {
      const head = await fetch(url, { method: 'HEAD' });
      if (!head.ok) return false;
      const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
      const gltf = await new GLTFLoader().loadAsync(url);
      this.model = gltf.scene;
      this.model.position.set(0, 0, -25);
      const box = new THREE.Box3().setFromObject(this.model);
      const height = box.max.y - box.min.y;
      if (height > 0) this.model.scale.setScalar(1.8 / height);
      this.scene.add(this.model);
      if (gltf.animations && gltf.animations.length) {
        this.mixer = new THREE.AnimationMixer(this.model);
        this.mixer.clipAction(gltf.animations[0]).play();
      }
      this.ready = true;
      return true;
    } catch {
      return false;
    }
  }

  playAnimation(index = 0) {
    if (!this.mixer || !this.model) return;
    const clips = this.mixer.getRoot().animations;
    if (clips && clips[index]) {
      this.mixer.stopAllAction();
      this.mixer.clipAction(clips[index]).play();
    }
  }

  update(dt) {
    if (this.mixer) this.mixer.update(dt);
  }
}
