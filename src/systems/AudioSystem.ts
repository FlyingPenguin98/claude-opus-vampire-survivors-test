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
  private trackName = 'calm';

  /**
   * Procedural music tracks: a long arpeggio melody (0 = rest) over a bass line,
   * with tempo + timbre. The melodies are 32 steps and the bass 16, so the two
   * phase against each other — the loop only fully repeats every ~64 steps
   * (≈15-20s), which reads far less repetitively than the old 8-step loop.
   */
  private readonly tracks: Record<
    string,
    { pattern: number[]; bass: number[]; stepMs: number; wave: OscillatorType }
  > = {
    calm: {
      pattern: [
        220, 0, 261.6, 329.6, 392, 0, 329.6, 261.6, 246.9, 0, 293.7, 349.2, 329.6, 0, 261.6, 0,
        196, 0, 246.9, 293.7, 329.6, 0, 392, 293.7, 261.6, 0, 329.6, 392, 440, 0, 392, 329.6,
      ],
      bass: [110, 0, 98, 0, 87.3, 0, 98, 0, 73.4, 0, 82.4, 0, 98, 0, 110, 0],
      stepMs: 300,
      wave: 'triangle',
    },
    eerie: {
      pattern: [
        174.6, 0, 207.7, 0, 233, 0, 207.7, 174.6, 155.6, 0, 196, 233, 207.7, 0, 174.6, 0,
        138.6, 0, 174.6, 207.7, 233, 0, 277.2, 233, 207.7, 0, 196, 174.6, 155.6, 0, 146.8, 0,
      ],
      bass: [87.3, 0, 82.4, 0, 77.8, 0, 82.4, 0, 69.3, 0, 73.4, 0, 82.4, 0, 87.3, 0],
      stepMs: 345,
      wave: 'triangle',
    },
    intense: {
      pattern: [
        262, 330, 392, 523, 440, 392, 330, 392, 523, 440, 392, 330, 294, 330, 392, 440,
        349, 440, 523, 659, 587, 523, 440, 523, 392, 440, 523, 392, 330, 392, 440, 523,
      ],
      bass: [65.4, 65.4, 73.4, 73.4, 87.3, 87.3, 73.4, 65.4, 98, 98, 87.3, 87.3, 73.4, 73.4, 65.4, 65.4],
      stepMs: 225,
      wave: 'triangle',
    },
    boss: {
      pattern: [
        233, 277, 233, 311, 247, 294, 233, 220, 311, 277, 233, 311, 349, 311, 277, 233,
        220, 261.6, 220, 293.7, 246.9, 277, 233, 220, 311, 349, 311, 277, 233, 220, 207.7, 233,
      ],
      bass: [43.6, 43.6, 46.2, 41.2, 38.9, 41.2, 43.6, 46.2, 49, 49, 46.2, 43.6, 41.2, 38.9, 41.2, 43.6],
      stepMs: 215,
      wave: 'sawtooth',
    },
  };

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
    this.scheduleMusic();
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

  /**
   * Impact sound, varied so weapons feel distinct: bigger hits read lower/punchier,
   * small rapid hits read as high ticks, elemental infusions have their own timbre,
   * and crits add a bright sparkle. Throttled so a swarm doesn't clip.
   */
  hit(damage = 10, element?: string, crit = false): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    if (now - this.lastHit < 0.035 || this.hitVoices > 7) return;
    this.lastHit = now;
    this.hitVoices++;
    setTimeout(() => (this.hitVoices = Math.max(0, this.hitVoices - 1)), 55);

    const base = Math.max(180, 900 - damage * 6);
    switch (element) {
      case 'frost':
        this.blip(base * 1.4, 0.09, 'triangle', this.sfxGain, 0.12, base * 1.05);
        break;
      case 'flame':
        this.noise(0.06, 0.14, 900);
        this.blip(base * 0.7, 0.08, 'sawtooth', this.sfxGain, 0.08, base * 0.5);
        break;
      case 'venom':
        this.blip(base * 0.6, 0.12, 'square', this.sfxGain, 0.1, base * 0.42);
        break;
      case 'shadow':
        this.blip(base * 0.5, 0.14, 'sawtooth', this.sfxGain, 0.1, base * 0.35);
        break;
      case 'holy':
        this.blip(base * 1.6, 0.08, 'triangle', this.sfxGain, 0.11, base * 2.0);
        break;
      default:
        this.noise(0.045, 0.14, Math.max(500, base + 200));
        if (damage >= 22) this.blip(base * 0.7, 0.1, 'square', this.sfxGain, 0.1, base * 0.45);
    }
    if (crit) this.blip(1400, 0.07, 'square', this.sfxGain, 0.12, 1900);
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

  // --- Music: per-context arpeggio loops (calm / eerie / intense / boss). ---

  /** Switch the looping background track (e.g. per stage, or to the boss theme). */
  setTrack(name: string): void {
    if (name === this.trackName || !this.tracks[name]) return;
    this.trackName = name;
    this.step = 0;
    if (this.ctx) this.scheduleMusic();
  }

  private scheduleMusic(): void {
    if (this.musicTimer) {
      clearInterval(this.musicTimer);
      this.musicTimer = undefined;
    }
    const t = this.tracks[this.trackName] ?? this.tracks.calm;
    this.musicTimer = window.setInterval(() => {
      if (!this.ctx || this.ctx.state !== 'running') return;
      const n = t.pattern[this.step % t.pattern.length];
      if (n > 0) this.blip(n, t.stepMs / 1000 + 0.02, t.wave, this.musicGain, 0.12);
      if (this.step % 2 === 0) {
        const b = t.bass[Math.floor(this.step / 2) % t.bass.length];
        if (b > 0) this.blip(b, 0.5, 'sine', this.musicGain, 0.16);
      }
      this.step++;
    }, t.stepMs);
  }
}

export const AudioSystem = new Audio();
