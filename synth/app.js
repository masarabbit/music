function init() {

  const inputs = {
    oscillatorType: document.querySelector('#oscillator-type'),
    note: document.querySelector('#note'),
    octave: document.querySelector('#octave'),
  }
  const elements = {
    oscillator: null,
    playBtn: document.querySelector('.play'),
    indicator: document.querySelector('.indicator'),
  }

  const settings = {
    oscillatorTypes: [
      'sine',
      'triangle',
      'square',
      'sawtooth',
      // 'custom' // this apparently can't be set
    ],
    notes: ['c', 'c#', 'd', 'd#', 'e', 'f', 'f#', 'g', 'g#', 'a', 'a#', 'b'],
    oscillatorType: 'sine',
    note: 'c',
    octave: 5,
  }

  const getFrequency = (note, octave) => {
    const num = settings.notes.indexOf(note)
    const freq = 440 * Math.pow(2, (octave * 12 + num - 57) / 12)
    return +freq.toFixed(4)
  }

  const ctx = new AudioContext()
  const filterNode = new BiquadFilterNode(ctx, { //TODO can't work out how to apply this properly
    type: 'highpass',
    frequency: 1000,
    Q: 100,
  })
  // filterNode.frequency.value = 100


  const playsound = () => {

    elements.oscillator = ctx.createOscillator()
    const { note, octave } = settings

    elements.oscillator.type = settings.oscillatorType
    elements.oscillator.frequency.value = getFrequency(note, octave)

    //Create volume and set duration
    const gainNode = ctx.createGain()
    // gainNode.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 1)
    // gainNode.gain.setValueAtTime(0.05, 0)


    filterNode.connect(gainNode)
    // filterNode.connect(ctx.destination)
    // console.log(filterNode)

    //Connect our audiosource(oscillator) with the volume
    //Connect inputgain with the output (Speakers)
    elements.oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)
    elements.oscillator.start()
    elements.oscillator.stop(ctx.currentTime + 0.5)

    // console.log('test', elements.o)
  }

  const updateIndicator = () => {
    elements.indicator.innerHTML = Object.keys(inputs).map(input => settings[input]).join(' | ')
  }

  inputs.oscillatorType.innerHTML = settings.oscillatorTypes.map(type => {
    return `<option value="${type}">${type}</option>`
  })
  inputs.note.innerHTML = settings.notes.map(note => {
    return `<option value="${note}">${note}</option>`
  })

  inputs.oscillatorType.addEventListener('change', e => {
    settings.oscillatorType = +e.target.value
    updateIndicator()
  })

  Object.keys(inputs).forEach(input => {
    inputs[input].addEventListener('change', e => {
      settings[input] = e.target.value
      updateIndicator()
    })
  })

  elements.playBtn.addEventListener('click', ()=> {
    playsound()
  })

}

window.addEventListener('DOMContentLoaded', init)