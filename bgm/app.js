//@ts-checkOFF

function init() {

  const inputs = {
    octave: document.querySelector('#octave'),
    bpm: document.querySelector('#bpm'),
    oscType: document.querySelector('#osc-type'),
  }

  const elements = {
    // wrapper: document.querySelector('.wrapper'),
    soundPalette: document.querySelector('.sound-palette'),
    oscillator: null,
    playBtn: document.querySelector('.play'),
    btns: document.querySelectorAll('.btn'),
  }

  const settings = {
    blocks: [],
    oscTypes: [
      'sawtooth',
      'triangle',
      'square',
      'sine',
      // 'snare'
    ],
    volumes: {
      sine: 0.7,
      triangle: 0.7,
      square: 0.2,
      sawtooth: 0.2,
    },
    oscKey: {
      w: 'sawtooth',
      t: 'triangle',
      q: 'square',
      s: 'sine',
      n: 'snare',
      sawtooth: 'w',
      triangle: 't',
      square: 'q',
      sine: 's',
      snare: 'n'
    },
    notes: ['c', 'c#', 'd', 'd#', 'e', 'f', 'f#', 'g', 'g#', 'a', 'a#', 'b'],
    oscType: 'sawtooth',
    note: 'c',
    octave: 5,
    loop: true,
    bpm: 100,
    timer: null,
    time: 0,
    endTime: 5,
  }

  const isNo = x => typeof x === 'number'
  // const px = n => `${n}px`
  // const setStyles = ({ el, x, y, w, h, d }) => {
  //   const m = d || 1
  //   if (isNo(w)) el.style.width = px(w * m)
  //   if (isNo(h)) el.style.height = px(h * m)
  //   el.style.transform = `translate(${x ? px(x) : 0}, ${y ? px(y) : 0})`
  // }
  const nearestN = (n, denom) => n === 0 ? 0 : (n - 1) + Math.abs(((n - 1) % denom) - denom)
  // const setPos = ({ el, x, y }) => Object.assign(el.style, { left: `${x}px`, top: `${y}px` })
  const getFrequency = (note, octave) => {
    const num = settings.notes.indexOf(note)
    const freq = 440 * Math.pow(2, (octave * 12 + num - 57) / 12)
    return +freq.toFixed(4)
  }
  const getSpeed = bpm => (60 / bpm) * 1000

  const ctx = new AudioContext()
  const filterNode = new BiquadFilterNode(ctx, { //TODO can't work out how to apply this properly
    type: 'lowpass',
    frequency: 1000,
  })
  // console.log(filterNode)
  const gainNode = ctx.createGain()
  const buffer = ctx.createBuffer(1, ctx.sampleRate * 1, ctx.sampleRate)

  const channelData = buffer.getChannelData(0)
  new Array(buffer.length).fill('').forEach((_, i) => {
    channelData[i] = Math.random() * 2 - 1
  })


  const snare = () => {
    const whiteNoiseSrc = ctx.createBufferSource()
    whiteNoiseSrc.buffer = buffer
    whiteNoiseSrc.connect(filterNode)
    filterNode.connect(gainNode)
    whiteNoiseSrc.connect(gainNode)
    gainNode.gain.setValueAtTime(0.1, 0)
    gainNode.connect(ctx.destination)
    whiteNoiseSrc.start()
    whiteNoiseSrc.stop(ctx.currentTime + 0.2)
  }

  

  const playBlock = block => {
    if (block.snare) {
      control.snare()
      return
    }
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.type = block.oscType || settings.oscType
    oscillator.frequency.value = getFrequency(block.note, block.octave || settings.octave) - (block.offset || 0)

    gainNode.gain.setValueAtTime(settings.volumes[oscillator.type], 0)
    gainNode.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + (block.length || 1.5))

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)
    oscillator.start(0)
    oscillator.stop(ctx.currentTime + 1.5)
  }

  const stop = () => {
    settings.time = 0
    clearTimeout(settings.timer)
    settings.timer = null
  }


  const playTracks = playOn => {
    if (!playOn) {
      stop()
      if (!settings.blocks.length) return
    }
    settings.blocks.forEach(block => {
      if (block.time === settings.time) playBlock(block)
    })
    settings.time += 1
    if (settings.time <= settings.endTime) {
      settings.timer = setTimeout(()=> {
        playTracks(true)
      }, getSpeed(settings.bpm))
    } else {
      stop()
      if (settings.loop) {
        playTracks()
      }
    }
  }

  const control = {
    snare,
    playTracks: () => {
      if (settings.timer) return
      playTracks()
    },
    stop,
    resume: () => {
      elements.wrapper.classList.remove('pause')
    },
    increase: e => {
      const key = e.target.dataset.setting
      const no = +e.target.dataset.no
      settings[key] += no
      inputs[key].value = settings[key]
    },
    decrease: e => {
      const key = e.target.dataset.setting
      const no = +e.target.dataset.no
      settings[key] -= no
      inputs[key].value = settings[key]
    },
    loop: () => {
      settings.loop = !settings.loop
      elements.loopBtn.classList[settings.loop ? 'add' : 'remove']('active')
    }
  }
  
  elements.btns.forEach(btn => {
    btn.addEventListener('click', e => {
      control[e.target.dataset.control](e)
    })
  })
  


  Object.keys(inputs).forEach(input => {
    inputs[input].addEventListener('change', e => {
      settings[input] = e.target.value
    })
  })

  // const sawtooths = [
  //   { note: 'c', octave: 2, length: 8, time: 2, },
  //   { note: 'd', octave: 2, length: 8, time: 4, },
  //   { note: 'e', octave: 2, length: 8, time: 6, },  
  //   { note: 'f', octave: 2, length: 8, time: 8, },
  // ]

  // const triangles = [
  //   { note: 'e', octave: 5, length: 50, time: 1 },
  //   { note: 'f', octave: 5, length: 10, time: 2 },
  //   { note: 'd', octave: 5, length: 10, time: 3 },
  //   { note: 'g', octave: 5, length: 700, time: 4 },
  //   { note: 'a', octave: 5, length: 1300, time: 6 },
  // ]

  const sawtooths = [
    { note: 'c', octave: 4, length: 20, time: 1, },
    { note: 'b', octave: 4, length: 20, time: 2, },
    { note: 'g', octave: 4, length: 20, time: 3, },  
    { note: 'c', octave: 4, length: 10, time: 4, },
    { note: 'b', octave: 4, length: 10, time: 5, },
    { note: 'a', octave: 4, length: 10, time: 6, },  
    { note: 'c', octave: 4, length: 20, time: 9, },
    { note: 'b', octave: 4, length: 20, time: 10, },
    { note: 'g', octave: 4, length: 20, time: 11, }, 
    { note: 'b', octave: 4, length: 10, time: 12, },  
    { note: 'g', octave: 5, length: 10, time: 13, },
    { note: 'f', octave: 5, length: 10, time: 14, }, 
    { note: 'e', octave: 5, length: 10, time: 15, },  
    // { note: 'f', octave: 2, length: 8, time: 8, },
  ]

  const triangles = [
    { note: 'e', octave: 5, length: 3, time: 1 },
    { note: 'f', octave: 5, length: 3, time: 3 },
    { note: 'a', octave: 5, length: 3, time: 6 },
    { note: 'c', octave: 5, length: 10, time: 10 },
  //   { note: 'd', octave: 5, length: 10, time: 3 },
  //   { note: 'g', octave: 5, length: 700, time: 4 },
  //   { note: 'a', octave: 5, length: 1300, time: 6 },
  ]

  
  settings.blocks = [
    ...triangles.map(note => {
      note.oscType = 'triangle'
      return note
    }),
    ...[...sawtooths].map(note => {
      note.oscType = 'square'
      note.octave -= 1
      note.length = 3
      return note
    }),
    // ...sawtooths.map(note => {
    //   note.oscType = 'sawtooth'
    //   return note
    // })
  ]

  settings.endTime = [...settings.blocks.sort((a, b) => b.time - a.time)][0].time
  // console.log(settings.endTime)

  const allBlocks = [2, 3, 4, 5].map(octave => {
      return settings.notes.map(note => {
        return {
          el: Object.assign(document.createElement('button'), { 
            className: `sound-button ${note.includes('#') ? 'sharp' : ''}`,
            innerHTML: `${note}`,
          }),
          octave, 
          note, 
          length: 10,
        }
      })
    }).flat(1)


  allBlocks.forEach(sound => {
    elements.soundPalette.append(sound.el)
    sound.el.addEventListener('click', ()=> {
      playBlock(sound)
      settings.note = sound.note
    })
  })
  
  inputs.oscType.innerHTML = settings.oscTypes.map(type => {
    return `<option value="${type}">${type}</option>`
  })

}

window.addEventListener('DOMContentLoaded', init)



// const sawtooths = [
//   {
//     note: 'c',
//     octave: 3,
//     length: 8,
//     time: 4,
//   },
//   {
//     note: 'd',
//     octave: 3,
//     length: 8,
//     time: 8,
//   },
//   {
//     note: 'e',
//     octave: 3,
//     length: 8,
//     time: 10,
//   },  
//   {
//     note: 'f',
//     octave: 3,
//     length: 8,
//     time: 12,
//   },
// ]

// const triangles = [
//   {
//     note: 'e',
//     octave: 4,
//     length: 25,
//     time: 1,
//   },
//   {
//     note: 'f',
//     octave: 4,
//     length: 5,
//     time: 2,
//   },
//   {
//     note: 'd',
//     octave: 4,
//     length: 5,
//     time: 3,
//   },
//   {
//     note: 'f',
//     octave: 4,
//     length: 5,
//     time: 4,
//   },
//   {
//     note: 'e',
//     octave: 4,
//     length: 5,
//     time: 5,
//   },
//   {
//     note: 'g',
//     octave: 4,
//     length: 350,
//     time: 8,
//   },
//   {
//     note: 'a',
//     octave: 4,
//     length: 700,
//     time: 10,
//   },
// ]