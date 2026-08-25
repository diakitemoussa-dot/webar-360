export class AudioManager {
  constructor() {
    this.ctx = null;
    this.enabled = false;
    this.synthNodes = null;
    this.nodeAudio = null;
    this.currentNodeId = null;
  }

  async toggle() {
    if (this.enabled) {
      this._pauseAll();
      this.enabled = false;
      return false;
    }
    if (!this.ctx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new Ctx();
    }
    await this.ctx.resume();
    this.enabled = true;
    if (this.nodeAudio) {
      this.nodeAudio.play().catch(() => {});
      this._fadeEl(this.nodeAudio, 0, 0.8, 1000);
    } else {
      this._startSynth();
    }
    return true;
  }

  async setNode(id) {
    this.currentNodeId = id;
    if (!this.enabled) return;

    let el = null;
    const url = `assets/audio/${id}.mp3`;
    try {
      const head = await fetch(url, { method: 'HEAD' });
      if (head.ok) {
        el = new Audio(url);
        el.loop = true;
        el.volume = 0;
      }
    } catch {}

    if (this.nodeAudio && this.nodeAudio !== el) {
      const old = this.nodeAudio;
      this.nodeAudio = null;
      this._fadeEl(old, old.volume, 0, 700).then(() => old.pause());
    }

    if (el) {
      this.nodeAudio = el;
      el.play().catch(() => {});
      this._fadeEl(el, 0, 0.8, 1500);
      this._stopSynth(700);
    } else if (!this.synthNodes) {
      this._startSynth();
    }
  }

  _pauseAll() {
    if (this.nodeAudio) this.nodeAudio.pause();
    if (this.synthNodes) {
      this.synthNodes.master.gain.linearRampToValueAtTime(
        0,
        this.ctx.currentTime + 0.4
      );
    }
  }

  _fadeEl(el, from, to, dur) {
    return new Promise((resolve) => {
      const t0 = performance.now();
      const step = () => {
        const t = Math.min(1, (performance.now() - t0) / dur);
        el.volume = Math.max(0, Math.min(1, from + (to - from) * t));
        if (t < 1) requestAnimationFrame(step);
        else resolve();
      };
      step();
    });
  }

  _startSynth() {
    if (!this.ctx || this.synthNodes) return;
    const length = this.ctx.sampleRate * 4;
    const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.2;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const wind = this.ctx.createBiquadFilter();
    wind.type = 'lowpass';
    wind.frequency.value = 380;
    wind.Q.value = 0.6;

    const windGain = this.ctx.createGain();
    windGain.gain.value = 0.35;

    const lfo = this.ctx.createOscillator();
    lfo.frequency.value = 0.08;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 0.16;
    lfo.connect(lfoGain).connect(windGain.gain);

    const air = this.ctx.createBiquadFilter();
    air.type = 'bandpass';
    air.frequency.value = 1600;
    air.Q.value = 0.4;
    const airGain = this.ctx.createGain();
    airGain.gain.value = 0.02;

    const master = this.ctx.createGain();
    master.gain.value = 0;

    noise.connect(wind).connect(windGain).connect(master);
    noise.connect(air).connect(airGain).connect(master);
    master.connect(this.ctx.destination);

    noise.start();
    lfo.start();
    master.gain.linearRampToValueAtTime(0.9, this.ctx.currentTime + 1.5);

    this.synthNodes = { noise, lfo, master };
  }

  _stopSynth(fadeMs = 600) {
    if (!this.synthNodes) return;
    const { noise, lfo, master } = this.synthNodes;
    this.synthNodes = null;
    master.gain.linearRampToValueAtTime(0, this.ctx.currentTime + fadeMs / 1000);
    setTimeout(() => {
      try {
        noise.stop();
        lfo.stop();
      } catch {}
    }, fadeMs + 300);
  }
}
