class AudioService {
  private audioCtx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    const saved = localStorage.getItem('app_sound_muted');
    this.isMuted = saved === 'true';
  }

  public toggleMute() {
    this.isMuted = !this.isMuted;
    localStorage.setItem('app_sound_muted', String(this.isMuted));
    return this.isMuted;
  }
  
  public getMuted() {
      return this.isMuted;
  }

  private init() {
    if (!this.audioCtx && typeof window !== 'undefined') {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
  }

  public playAmbientClick() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.audioCtx) return;
      
      const t = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      // Premium click: soft, glassy, quick tap
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, t);
      osc.frequency.exponentialRampToValueAtTime(800, t + 0.05);

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.03, t + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(t);
      osc.stop(t + 0.05);
    } catch (e) {
      console.error('Audio play error', e);
    }
  }

  public playAmbientSuccess() {
      if (this.isMuted) return;
      try {
        this.init();
        if (!this.audioCtx) return;
        const t = this.audioCtx.currentTime;
        
        const playTone = (freq: number, startTime: number, duration: number, volume: number = 0.03) => {
            const osc = this.audioCtx!.createOscillator();
            const gain = this.audioCtx!.createGain();
            
            // Using sine for a softer, premium bell-like sound
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, startTime);
            
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(volume, startTime + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
            
            osc.connect(gain);
            gain.connect(this.audioCtx!.destination);
            
            osc.start(startTime);
            osc.stop(startTime + duration);
        };
        
        // E Major Arpeggio (Bright, positive, calm)
        playTone(659.25, t, 0.4, 0.04);       // E5
        playTone(830.61, t + 0.08, 0.5, 0.04); // G#5
        playTone(987.77, t + 0.16, 0.7, 0.04); // B5
        
        // Subtle shimmer on top
        playTone(1318.51, t + 0.16, 0.8, 0.015); // E6
      } catch(e) {
          console.error(e);
      }
  }

  public playPartnerPing() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.audioCtx) return;
      const t = this.audioCtx.currentTime;

      const playTone = (freq: number, startTime: number, duration: number, volume: number = 0.04) => {
        const osc = this.audioCtx!.createOscillator();
        const gain = this.audioCtx!.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(volume, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        osc.connect(gain);
        gain.connect(this.audioCtx!.destination);
        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      // Gentle double heart-beat chime (C6 -> G6)
      playTone(1046.50, t, 0.2, 0.05);
      playTone(1567.98, t + 0.12, 0.35, 0.06);
    } catch (e) {
      console.error(e);
    }
  }

  public playLovePing() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.audioCtx) return;
      const t = this.audioCtx.currentTime;

      const playTone = (freq: number, startTime: number, duration: number, volume: number = 0.05) => {
        const osc = this.audioCtx!.createOscillator();
        const gain = this.audioCtx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(volume, startTime + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        osc.connect(gain);
        gain.connect(this.audioCtx!.destination);
        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      // Romantic harp chime (C5 -> E5 -> G5 -> C6)
      playTone(523.25, t, 0.35, 0.04);
      playTone(659.25, t + 0.08, 0.35, 0.045);
      playTone(783.99, t + 0.16, 0.4, 0.05);
      playTone(1046.50, t + 0.24, 0.6, 0.05);
    } catch (e) {
      console.error(e);
    }
  }

  public playSosAlert() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.audioCtx) return;
      const t = this.audioCtx.currentTime;

      const playTone = (freq: number, startTime: number, duration: number) => {
        const osc = this.audioCtx!.createOscillator();
        const gain = this.audioCtx!.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.07, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        osc.connect(gain);
        gain.connect(this.audioCtx!.destination);
        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      // Urgent double beep alarm
      playTone(880, t, 0.18);
      playTone(880, t + 0.22, 0.22);
      playTone(1174.66, t + 0.46, 0.3);
    } catch (e) {
      console.error(e);
    }
  }
}

export const audioService = new AudioService();
