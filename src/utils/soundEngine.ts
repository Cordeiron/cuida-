class SoundEngine {
  private ctx: AudioContext | null = null;
  private muted = false;

  public setMuted(value: boolean): void {
    this.muted = value;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  private getContext(): AudioContext | null {
    if (this.muted || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  private tone(
    freq: number,
    duration: number,
    type: OscillatorType = 'sine',
    gainLevel = 0.12,
    delay = 0,
    slideTo?: number
  ): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slideTo !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(40, slideTo), now + duration);
    }

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(gainLevel, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  public playClick(): void {
    this.tone(520, 0.07, 'triangle', 0.1, 0, 740);
  }

  public playPet(): void {
    this.tone(587, 0.09, 'sine', 0.09, 0, 880);
    this.tone(880, 0.1, 'sine', 0.07, 0.07, 1046);
  }

  public playPop(): void {
    // WhatsApp-like cheerful double bubble pop
    this.tone(660, 0.07, 'sine', 0.1, 0, 880);
    this.tone(920, 0.08, 'sine', 0.09, 0.065, 1180);
  }

  public playAlert(kind: string): void {
    if (kind === 'cat') {
      this.tone(680, 0.14, 'triangle', 0.12, 0, 920);
      this.tone(900, 0.18, 'triangle', 0.1, 0.12, 540);
    } else if (kind === 'dog') {
      this.tone(240, 0.11, 'sawtooth', 0.08, 0, 170);
      this.tone(260, 0.12, 'sawtooth', 0.08, 0.14, 150);
    } else if (kind === 'falling') {
      this.tone(880, 0.35, 'sine', 0.13, 0, 210);
    } else if (kind === 'ufo') {
      this.tone(420, 0.15, 'sine', 0.1, 0, 680);
      this.tone(680, 0.15, 'sine', 0.1, 0.15, 420);
    } else if (kind === 'chicken') {
      this.tone(520, 0.08, 'square', 0.06, 0, 720);
      this.tone(560, 0.08, 'square', 0.06, 0.1, 760);
      this.tone(520, 0.1, 'square', 0.06, 0.2, 420);
    } else {
      this.tone(480, 0.1, 'triangle', 0.11, 0, 640);
      this.tone(640, 0.12, 'triangle', 0.1, 0.1, 760);
    }
  }

  public playSuccess(): void {
    this.tone(523.25, 0.09, 'triangle', 0.12, 0);
    this.tone(659.25, 0.09, 'triangle', 0.12, 0.07);
    this.tone(783.99, 0.16, 'triangle', 0.13, 0.14);
  }

  public playDamage(): void {
    this.tone(220, 0.16, 'sawtooth', 0.12, 0, 95);
    this.tone(150, 0.2, 'square', 0.08, 0.05, 70);
  }

  public playCrack(): void {
    this.tone(310, 0.06, 'square', 0.15, 0, 120);
    this.tone(180, 0.18, 'sawtooth', 0.14, 0.05, 65);
  }

  public playTragic(): void {
    // Comedic sad trombone
    this.tone(311.13, 0.25, 'sawtooth', 0.09, 0);
    this.tone(293.66, 0.25, 'sawtooth', 0.09, 0.28);
    this.tone(277.18, 0.25, 'sawtooth', 0.09, 0.56);
    this.tone(261.63, 0.65, 'sawtooth', 0.1, 0.84, 220);
  }

  public playVictory(): void {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((n, idx) => {
      this.tone(n, idx === 3 ? 0.35 : 0.12, 'triangle', 0.13, idx * 0.1);
    });
  }
}

export const soundEngine = new SoundEngine();
