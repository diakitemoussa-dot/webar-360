export class AudioManager {
  constructor() {
    this.ctx = null;
    this.enabled = false;
    this.usingFile = false;
    this.audioEl = null;
    this._nodes = null;
    this.fileUrl = 'assets/audio/ambient.mp3';
  }

  async hasAudioFile() {
    try {
      const res = await fetch(this.fileUrl, { method: 'HEAD' });
      return res.ok;
    } catch {
      return false;
    }
  }

  async toggle() {
    if (this.enabled) {
      this._stop();
      this.enabled = false;
      return false;
    }
    if (!this.ctx) {
      this.usingFile = await this.hasAudioFile();
      if (this.usingFile) this._initFile();
      else this._initSynth();
    }
    await this.ctx.resume();
    this._start();
    this.enabled = true;
    return true;
  }

  _initFile() {
    this.audioEl = new Audio(this.fileUrl);
    this.audioEl.loop = true;
    this.audioEl.crossOrigin = 'anonymous';
  }

  _initSynth() {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    this.ctx = new Ctx();

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

    this._nodes = { noise, lfo, master };
  }

  _start() {
    if (this.usingFile) {
      this.audioEl.play().catch(() => {});
    } else {
      this._nodes.noise.start();
      this._nodes.lfo.start();
      this._nodes.master.gain.linearRampToValueAtTime(
        0.9,
        this.ctx.currentTime + 1.5
      );
    }
  }

  _stop() {
    if (this.usingFile) {
      this.audioEl.pause();
    } else if (this.ctx) {
      this._nodes.master.gain.linearRampToValueAtTime(
        0,
        this.ctx.currentTime + 0.6
      );
      setTimeout(() => {
        try {
          this._nodes.noise.stop();
          this._nodes.lfo.stop();
        } catch {}
      }, 800);
      this.ctx.close();
      this.ctx = null;
      this._nodes = null;
    }
  }
}
