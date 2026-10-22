//@ts-checkOFF

function playGuitarStroke() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();

  // 1. Distortion & Amp Cabinet Setup
  const distortion = audioCtx.createWaveShaper();
  distortion.curve = makeDistortionCurve(45); // Warm overdrive
  distortion.oversample = '4x';

  const cabFilter = audioCtx.createBiquadFilter();
  cabFilter.type = 'lowpass';
  cabFilter.frequency.setValueAtTime(3500, audioCtx.currentTime);
  cabFilter.Q.setValueAtTime(1.5, audioCtx.currentTime);

  const masterGain = audioCtx.createGain();
  masterGain.gain.setValueAtTime(0.35, audioCtx.currentTime);

  distortion.connect(cabFilter);
  cabFilter.connect(masterGain);
  masterGain.connect(audioCtx.destination);

  // 2. A Power Chord Frequencies (A2, E3, A3, E4)
  // Staggering the 'delay' creates the physical pick-sweep across strings (~10-15ms apart)
  const stroke = [
    { freq: 110.00, delay: 0.0 },   // A2 (Lowest string)
    { freq: 164.81, delay: 0.012 }, // E3
    { freq: 220.00, delay: 0.025 }, // A3
    { freq: 329.63, delay: 0.040 }  // E4 (Highest string of the chord)
  ];

  const now = audioCtx.currentTime;

  stroke.forEach(note => {
    const startTime = now + note.delay;
    const duration = 1.0;

    // Sawtooth wave provides the raw harmonic spectrum of a string
    const osc = audioCtx.createOscillator();
    osc.type = 'sawtooth';

    // --- PHYSICS TRICK 1: String Chirp (Pitch Drop) ---
    // Guitar strings start slightly sharp on impact and instantly settle
    osc.frequency.setValueAtTime(note.freq * 1.04, startTime);
    osc.frequency.exponentialRampToValueAtTime(note.freq, startTime + 0.06);

    // --- PHYSICS TRICK 2: Dynamic Harmonic Filter ---
    // High-frequency harmonics decay much faster than the body of the note
    const noteFilter = audioCtx.createBiquadFilter();
    noteFilter.type = 'lowpass';
    noteFilter.frequency.setValueAtTime(6000, startTime); // Bright pick attack
    noteFilter.frequency.exponentialRampToValueAtTime(900, startTime + 0.25); // Settles into warm woody body

    // 3. Gain Envelope (Sharp pick strike + natural string decay)
    const noteGain = audioCtx.createGain();
    noteGain.gain.setValueAtTime(0, startTime);
    noteGain.gain.linearRampToValueAtTime(1, startTime + 0.008); // Instant pick snap
    noteGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration); // Long tail ring-out

    // Connect node chain
    osc.connect(noteFilter);
    noteFilter.connect(noteGain);
    noteGain.connect(distortion);

    osc.start(startTime);
    osc.stop(startTime + duration);
  });
}

// Distortion curve generator helper
function makeDistortionCurve(amount) {
  const k = typeof amount === 'number' ? amount : 50;
  const n_samples = 44100;
  const curve = new Float32Array(n_samples);
  const deg = Math.PI / 180;
  for (let i = 0; i < n_samples; ++i) {
    const x = (i * 2) / n_samples - 1;
    curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
  }
  return curve;
}

window.addEventListener('DOMContentLoaded', ()=> {
  document.querySelector('button').addEventListener('click', playGuitarStroke)
})
