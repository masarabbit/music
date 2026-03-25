window.addEventListener('DOMContentLoaded', () => {

  // TODO add ways to control attack, delay, sustain, release
  // TODO add ways to control envelope - looks like this needs to apply to every buffer in a sample

  const sampleRate =  44100

  // TODO need to check which ones are relevant to envelopes, and perhaps research a bit more about envelopes and 
  // other ways they are coded in other libraries
  const settings = {
    attack: 0,
    sustain: 0,
    release: 0.1,
    shape: 0,
    shapeCurve: 1,
    slide: 0, 
    deltaSlide: 0, 
    pitchJump: 0, 
    pitchJumpTime: 0, 
    repeatTime: 0, 
    noise: 0,
    modulation: 0,
    bitCrush: 0,
    delay: 0,
    sustainVolume: 1,
    decay: 0,
    tremolo: 0,
    filter: 0
  }

  const notes = ['c','c#','d','d#','e','f','f#','g','g#','a','a#','b']

  // const getSpeed = bpm => ((60 / bpm) * 1000) / 6


  const ctx = new AudioContext()
  
  //* SETUP ----------------------------------------------------------

  // Master dynamics chain to prevent clipping
  const masterGain = ctx.createGain()
  // masterGain.gain.value = 0.8 // Headroom for multiple sounds
  
  const masterCompressor = ctx.createDynamicsCompressor()
  // masterCompressor.threshold.value = -10
  // masterCompressor.knee.value = 10
  // masterCompressor.ratio.value = 4
  // masterCompressor.attack.value = 0.003
  // masterCompressor.release.value = 0.25
  
  masterGain.connect(masterCompressor)
  masterCompressor.connect(ctx.destination)

  const calculateEnvelope = () => {
    const { sampleIndex, attack, decay, sustain, release, delay, length, sustainVolume } = settings
      if (sampleIndex < attack) {
          // Attack phase
          return sampleIndex / attack
      } else if (sampleIndex < attack + decay) {
          // Decay phase
          return 1 - ((sampleIndex - attack) / decay) * (1 - sustainVolume)
      } else if (sampleIndex < attack + decay + sustain) {
          // Sustain phase
          return sustainVolume
      } else if (sampleIndex < length - delay) {
          // Release phase
          return (length - sampleIndex - delay) / release * sustainVolume;
      } else {
          // Post release
          return 0
      }
  }


  class SlideInput {
    constructor(props) {
      const param = props?.param || 'attack'
      Object.assign(this, {
        param,
        el: Object.assign(document.createElement('div'), {
          className: 'slider',
          innerHTML: `
            <label for=${param}>${param}</label>
            <input type="range" step="${props.step || 1}" min="${props?.min || 0}" max="${props?.max || 100}" id="${param}">
            <input type="text" id="${param}-text">
          `
        }),
        ...props,
      })
      document.body.append(this.el)
      this.slider = this.el.querySelector('input[type="range"]')
      this.textInput = this.el.querySelector('input[type="text"]')
      ;[this.slider, this.textInput].forEach(input => input.value = this.default || 1)
      this.slider.addEventListener('input', e => {
        settings[param] = e.target.value
        this.textInput.value = e.target.value
      })
      this.textInput.addEventListener('input', e => {
        // add validation to limit to min and max
        settings[param] = e.target.value
        this.slider.value = e.target.value
      })
    }
  }

  class SoundKey {
    constructor(props) {
      Object.assign(this, {
        octave: 5,
        note: 'c',
        type: 'triangle',
        ...props,
      })
      this.btn = Object.assign(document.createElement('button'), {
        innerHTML: `${this.note} ${this.octave}`
      })
      this.btn.addEventListener('click', ()=> this.play())
      document.body.append(this.btn)
    }
    get frequency() {
      const num = notes.indexOf(this.note)
      const freq = 440 * Math.pow(2, (this.octave * 12 + num - 57) / 12)
      return +freq.toFixed(4)
    }
    get targetVolume() {
      return {
        sine: 0.3,
        triangle: 0.3,
        square: 0.15,
        sawtooth: 0.15,
      }[this.type]
    }
    // play() {
    //   const oscillator = ctx.createOscillator()
    //   const gainNode = ctx.createGain()

    //   oscillator.type = this.type
    //   oscillator.frequency.value = this.frequency

    //   // Attack envelope to prevent clicks/pops
    //   const now = ctx.currentTime
    //   gainNode.gain.setValueAtTime(0, now)
    //   gainNode.gain.linearRampToValueAtTime(this.targetVolume, now + 0.01) // 10ms attack
    //   gainNode.gain.exponentialRampToValueAtTime(0.00001, now + 1.5) // TODO this bit can be extended to make the notes hang longer

    //   oscillator.connect(gainNode)
    //   gainNode.connect(masterGain) // Route through master gain instead of directly to destination
    //   oscillator.start(now)
    //   oscillator.stop(now + 0.5)
    // }
    // play2() {
    //     const oscillator = ctx.createOscillator()
    //     const gainNode = ctx.createGain()

    //     oscillator.type = this.type
    //     oscillator.frequency.value = this.frequency

    //     // Attack envelope to prevent clicks/pops
    //     const now = ctx.currentTime

    //     const { attack, decay, sustain, release, delay } = settings
    //     const length = Math.floor(attack + decay + sustain + release + delay)
    //     const buffer = ctx.createBuffer(1, length, sampleRate)
    //     const source = ctx.createBufferSource()
    //     buffer.getChannelData(0).set(channel)
    // }
    play() {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = this.type;
      oscillator.frequency.value = this.frequency;

      const now = ctx.currentTime;
      
      // Destructure settings for easier access
      // Note: Ensure your Sliders provide values in seconds for time params
      const { attack, decay, sustainVolume, release } = settings;
      const peakVolume = this.targetVolume;

      // 1. Start at 0
      gainNode.gain.setValueAtTime(0, now);

      // 2. Attack: Ramp up to peak volume
      gainNode.gain.linearRampToValueAtTime(peakVolume, now + parseFloat(attack));

      // 3. Decay: Ramp down to the sustain level
      // Use exponentialRamp for a more natural sound, but value cannot be 0
      const sustainLevel = peakVolume * parseFloat(sustainVolume);
      gainNode.gain.exponentialRampToValueAtTime(Math.max(sustainLevel, 0.0001), now + parseFloat(attack) + parseFloat(decay));

      // 4. Release: Trigger the end of the sound
      // For a simple 'click' trigger, we schedule the release relative to a fixed duration
      const holdTime = 0.5; // How long the note stays held before releasing
      const releaseStart = now + parseFloat(attack) + parseFloat(decay) + holdTime;
      
      gainNode.gain.setValueAtTime(sustainLevel, releaseStart);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, releaseStart + parseFloat(release));

      // Connections
      oscillator.connect(gainNode);
      gainNode.connect(masterGain);
      
      oscillator.start(now);
      // Stop the oscillator after the entire envelope has finished
      oscillator.stop(releaseStart + parseFloat(release) + 0.1);
    }
  }

  new SoundKey()

  Object.keys(settings).forEach(setting => {
      new SlideInput({
        param: setting,
        min: 0,
        max: 1,
        default: 0.1,
        step: 0.01
      })
  })
})
