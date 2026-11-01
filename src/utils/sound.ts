export const NOTIFICATION_SOUNDS = [
  { id: 'bell', name: 'Lonceng Klasik' },
  { id: 'success', name: 'Alunan Sukses' },
  { id: 'chime', name: 'Chime Lembut' },
  { id: 'arcade', name: 'Arcade Win' },
  { id: 'focus', name: 'Fokus Ping' },
  { id: 'digital', name: 'Digital Beep' },
  { id: 'ambient', name: 'Ambient Echo' },
  { id: 'alert', name: 'Peringatan' },
  { id: 'bubble', name: 'Bubble Pop' },
  { id: 'marimba', name: 'Pukul Marimba' },
  { id: 'alarm_clock', name: 'Alarm Keras' },
  { id: 'siren', name: 'Siren Peringatan' },
  { id: 'attention', name: 'Atensi Penuh' }
];

let audioCtx: AudioContext | null = null;

const getAudioContext = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

const playSynthVoice = (
  ctx: AudioContext, type: OscillatorType, freq: number, start: number, duration: number, gainVal: number, bendFreq?: number,
  type2?: OscillatorType, detune?: number
) => {
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();

  osc.type = type;
  if (detune) osc.detune.value = detune;
  osc.frequency.setValueAtTime(freq, start);
  if (bendFreq) osc.frequency.exponentialRampToValueAtTime(bendFreq, start + duration);

  gainNode.gain.setValueAtTime(0, start);
  gainNode.gain.linearRampToValueAtTime(gainVal, start + 0.05);
  gainNode.gain.exponentialRampToValueAtTime(0.001, start + duration);

  osc.connect(gainNode);
  gainNode.connect(ctx.destination);

  osc.start(start);
  osc.stop(start + duration);
};

export const playNotificationSound = (soundId?: string, customRingtones?: { id: string; data: string }[]) => {
  try {
    if (!soundId) soundId = 'bell';

    // Check if it's a custom uploaded ringtone
    if (soundId.startsWith('custom_') && customRingtones) {
      const customMatch = customRingtones.find(r => r.id === soundId);
      if (customMatch && customMatch.data) {
        const audio = new Audio(customMatch.data);
        audio.play().catch(e => console.error("Could not play custom audio", e));
        return;
      }
    }

    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    switch (soundId) {
      case 'success':
        playSynthVoice(ctx, 'sine', 523.25, now, 0.2, 0.4);
        playSynthVoice(ctx, 'sine', 659.25, now + 0.15, 0.4, 0.4);
        break;
      case 'chime':
        playSynthVoice(ctx, 'triangle', 440, now, 0.5, 0.3);
        playSynthVoice(ctx, 'triangle', 554.37, now + 0.2, 0.5, 0.3);
        playSynthVoice(ctx, 'triangle', 659.25, now + 0.4, 0.8, 0.3);
        break;
      case 'arcade':
        playSynthVoice(ctx, 'square', 400, now, 0.1, 0.2, 800);
        playSynthVoice(ctx, 'square', 600, now + 0.1, 0.1, 0.2, 1200);
        playSynthVoice(ctx, 'square', 800, now + 0.2, 0.3, 0.2, 1600);
        break;
      case 'focus':
        playSynthVoice(ctx, 'sine', 880, now, 0.6, 0.3);
        playSynthVoice(ctx, 'sine', 880, now + 0.6, 0.6, 0.3);
        break;
      case 'digital':
        playSynthVoice(ctx, 'sawtooth', 1200, now, 0.1, 0.1);
        playSynthVoice(ctx, 'sawtooth', 1200, now + 0.1, 0.1, 0.1);
        break;
      case 'ambient':
        playSynthVoice(ctx, 'sine', 349.23, now, 2.0, 0.2);
        playSynthVoice(ctx, 'sine', 440.00, now, 2.0, 0.2);
        playSynthVoice(ctx, 'triangle', 523.25, now, 2.5, 0.2);
        break;
      case 'alert':
        playSynthVoice(ctx, 'square', 800, now, 0.2, 0.2);
        playSynthVoice(ctx, 'square', 600, now + 0.2, 0.3, 0.2);
        break;
      case 'bubble':
        playSynthVoice(ctx, 'sine', 300, now, 0.15, 0.4, 600);
        break;
      case 'marimba':
        playSynthVoice(ctx, 'triangle', 600, now, 0.3, 0.5);
        playSynthVoice(ctx, 'triangle', 800, now + 0.15, 0.4, 0.5);
        break;
      case 'alarm_clock': // Very loud and annoying, good for waking up/urgent
        for (let i = 0; i < 4; i++) {
          playSynthVoice(ctx, 'square', 900, now + (i * 0.25), 0.15, 0.7);
          playSynthVoice(ctx, 'sawtooth', 900, now + (i * 0.25), 0.15, 0.7, undefined, undefined, 10);
        }
        break;
      case 'siren':
        playSynthVoice(ctx, 'sawtooth', 600, now, 1.0, 0.5, 1200);
        playSynthVoice(ctx, 'sawtooth', 1200, now + 1.0, 1.0, 0.5, 600);
        break;
      case 'attention':
        playSynthVoice(ctx, 'square', 1046.50, now, 0.15, 0.6);
        playSynthVoice(ctx, 'square', 1046.50, now + 0.2, 0.15, 0.6);
        playSynthVoice(ctx, 'square', 1046.50, now + 0.4, 0.4, 0.6);
        break;
      case 'bell':
      default:
        playSynthVoice(ctx, 'sine', 800, now, 0.5, 0.5);
        break;
    }
  } catch (err) {
    console.error("Error playing synth sound:", err);
  }
};
