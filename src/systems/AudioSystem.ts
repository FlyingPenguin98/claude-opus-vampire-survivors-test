import type { MetaSettings } from '../state/MetaState';

/**
 * All sound is synthesized at runtime with the WebAudio API — there are no audio
 * files. SFX are short oscillator/noise bursts with envelopes; music is a simple
 * looping arpeggio. The context is created lazily and only started on a user gesture
 * (browser autoplay policy), via unlock().
 */
class Audio {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private musicGain!: GainNode;
  private sfxGain!: GainNode;
  private settings: MetaSettings = { master: 0.7, music: 0.45, sfx: 0.7, muted: false, showDamage: true, reducedMotion: false, haptics: true };
  private musicTimer?: number;
  private step = 0;
  private lastHit = 0;
  private hitVoices = 0;

  configure(settings: MetaSettings): void {
    this.settings = { ...settings };
    if (this.ctx) this.applyVolumes();
  }

  /** Resume/create the context on a user gesture and start music. */
  unlock(): void {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return;
    }
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    this.ctx = new Ctor();
    this.master = this.ctx.createGain();
    this.musicGain = this.ctx.createGain();
    this.sfxGain = this.ctx.createGain();
    this.musicGain.connect(this.master);
    this.sfxGain.connect(this.master);
    this.master.connect(this.ctx.destination);
    this.applyVolumes();
    this.startMusic();
  }

  /** Suspend audio when the app is backgrounded (saves CPU/battery, avoids desync). */
  suspend(): void {
    if (this.ctx && this.ctx.state === 'running') void this.ctx.suspend();
  }

  /** Resume audio when the app returns to the foreground. */
  resume(): void {
    if (this.ctx && this.ctx.state === 'suspended') void this.ctx.resume();
  }

  private applyVolumes(): void {
    if (!this.ctx) return;
    const m = this.settings.muted ? 0 : this.settings.master;
    this.master.gain.value = m;
    this.musicGain.gain.value = this.settings.music;
    this.sfxGain.gain.value = this.settings.sfx;
  }

  private blip(
    freq: number,
    dur: number,
    type: OscillatorType,
    dest: GainNode,
    vol: number,
    slideTo?: number
  ): void {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g);
    g.connect(dest);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  private noise(dur: number, vol: number, hp = 800): void {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const len = Math.floor(this.ctx.sampleRate * dur);
    const buffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = hp;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filter);
    filter.connect(g);
    g.connect(this.sfxGain);
    src.start(t);
    src.stop(t + dur + 0.02);
  }

  // --- SFX ---

  hit(): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    // Throttle the high-frequency hit sound so a swarm doesn't clip.
    if (now - this.lastHit < 0.04 || this.hitVoices > 6) return;
    this.lastHit = now;
    this.hitVoices++;
    setTimeout(() => (this.hitVoices = Math.max(0, this.hitVoices - 1)), 60);
    this.noise(0.05, 0.18, 1200);
  }

  kill(): void {
    this.blip(220, 0.12, 'square', this.sfxGain, 0.12, 90);
  }

  pickup(): void {
    this.blip(660, 0.07, 'triangle', this.sfxGain, 0.1, 880);
  }

  levelUp(): void {
    this.blip(523, 0.12, 'triangle', this.sfxGain, 0.18);
    setTimeout(() => this.blip(784, 0.16, 'triangle', this.sfxGain, 0.18), 90);
  }

  evolve(): void {
    [392, 523, 659, 880].forEach((f, i) =>
      setTimeout(() => this.blip(f, 0.18, 'sawtooth', this.sfxGain, 0.16), i * 80)
    );
  }

  bossSpawn(): void {
    this.blip(110, 0.6, 'sawtooth', this.sfxGain, 0.22, 70);
    this.noise(0.5, 0.12, 200);
  }

  hurt(): void {
    this.blip(180, 0.18, 'square', this.sfxGain, 0.2, 80);
  }

  death(): void {
    this.blip(300, 0.8, 'sawtooth', this.sfxGain, 0.25, 60);
  }

  chest(): void {
    this.blip(700, 0.1, 'triangle', this.sfxGain, 0.16, 1040);
    setTimeout(() => this.blip(1040, 0.12, 'triangle', this.sfxGain, 0.16), 70);
  }

  buy(): void {
    this.blip(880, 0.08, 'square', this.sfxGain, 0.14, 1180);
  }

  dash(): void {
    this.blip(520, 0.12, 'sawtooth', this.sfxGain, 0.1, 1100);
    this.noise(0.1, 0.06, 1600);
  }

  // --- Music: a slow minor arpeggio loop. ---

  private startMusic(): void {
    if (this.musicTimer) return;
    // A natural-minor-ish pattern (Hz). Two octaves, gentle.
    const pattern = [220, 261.6, 329.6, 392, 329.6, 261.6, 196, 261.6];
    const bass = [55, 55, 49, 49, 44, 44, 49, 55];
    this.musicTimer = window.setInterval(() => {
      if (!this.ctx || this.ctx.state !== 'running') return;
      const n = pattern[this.step % pattern.length];
      this.blip(n, 0.32, 'triangle', this.musicGain, 0.12);
      if (this.step % 2 === 0) {
        this.blip(bass[this.step % bass.length], 0.5, 'sine', this.musicGain, 0.16);
      }
      this.step++;
    }, 300);
  }
}

export const AudioSystem = new Audio();
