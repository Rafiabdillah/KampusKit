// Procedural Soundscape Generator via Web Audio API
// 100% offline, zero network requests, lightweight, zero lag

let audioCtx: AudioContext | null = null;
let currentNodes: { stop: () => void } | null = null;

const getContext = (): AudioContext => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

export type SoundscapeType = 'NONE' | 'ALPHA_WAVES' | 'RAIN' | 'WHITE_NOISE';

export const stopAmbientSoundscape = () => {
  if (currentNodes) {
    try {
      currentNodes.stop();
    } catch {
      // ignore
    }
    currentNodes = null;
  }
};

export const playAmbientSoundscape = (type: SoundscapeType, volume: number = 0.15) => {
  stopAmbientSoundscape();
  if (type === 'NONE') return;

  const ctx = getContext();
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(volume, ctx.currentTime);
  masterGain.connect(ctx.destination);

  if (type === 'ALPHA_WAVES') {
    // 432 Hz carrier + 10 Hz binaural beat for deep cognitive concentration & flow state
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const merger = ctx.createChannelMerger(2);

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(432, ctx.currentTime); // Carrier

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(442, ctx.currentTime); // 10Hz Alpha difference

    const g1 = ctx.createGain();
    const g2 = ctx.createGain();
    g1.gain.value = 0.5;
    g2.gain.value = 0.5;

    osc1.connect(g1);
    osc2.connect(g2);

    g1.connect(merger, 0, 0); // Left channel
    g2.connect(merger, 0, 1); // Right channel

    merger.connect(masterGain);

    osc1.start();
    osc2.start();

    currentNodes = {
      stop: () => {
        osc1.stop();
        osc2.stop();
        osc1.disconnect();
        osc2.disconnect();
        masterGain.disconnect();
      }
    };
  } else if (type === 'RAIN') {
    // Brown / pink noise shaped through a low-pass resonance filter simulating gentle rainfall
    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + 0.02 * white) / 1.02; // Brown noise approximation
      lastOut = output[i];
      output[i] *= 3.5;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(900, ctx.currentTime);
    filter.Q.setValueAtTime(1.2, ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(masterGain);
    whiteNoise.start();

    currentNodes = {
      stop: () => {
        whiteNoise.stop();
        whiteNoise.disconnect();
        filter.disconnect();
        masterGain.disconnect();
      }
    };
  } else if (type === 'WHITE_NOISE') {
    // Pure focus white noise masking background speech
    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, ctx.currentTime);
    filter.Q.setValueAtTime(0.7, ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(masterGain);
    whiteNoise.start();

    currentNodes = {
      stop: () => {
        whiteNoise.stop();
        whiteNoise.disconnect();
        filter.disconnect();
        masterGain.disconnect();
      }
    };
  }
};
