function init() {

  const inputs = {
    oscillatorType: document.querySelector('#oscillator-type'),
    note: document.querySelector('#note'),
    octave: document.querySelector('#octave'),
  }
  const elements = {
    singersWrapper: document.querySelector('.singers-wrapper'),
    timeline: {
      el: document.querySelector('.timeline'),
      y: 0,
      h: 400,
      timer: null
    },
    oscillator: null,
    // playBtn: document.querySelector('.play'),
    // snareBtn: document.querySelector('.snare'),
    btns: document.querySelectorAll('.btn'),
    indicator: document.querySelector('.indicator'),
  }

  const settings = {
    blocks: [],
    oscillatorTypes: [
      'sine',
      'triangle',
      'square',
      'sawtooth',
    ],
    notes: ['c', 'c#', 'd', 'd#', 'e', 'f', 'f#', 'g', 'g#', 'a', 'a#', 'b'],
    oscillatorType: 'sine',
    note: 'c',
    octave: 5,
  }

  const isNo = x => typeof x === 'number'
  const px = n => `${n}px`
  const setStyles = ({ el, x, y, w, h, d }) => {
    const m = d || 1
    if (isNo(w)) el.style.width = px(w * m)
    if (isNo(h)) el.style.height = px(h * m)
    el.style.transform = `translate(${x ? px(x) : 0}, ${y ? px(y) : 0})`
  }
  const nearestN = (n, denom) => n === 0 ? 0 : (n - 1) + Math.abs(((n - 1) % denom) - denom)
  const setPos = ({ el, x, y }) => Object.assign(el.style, { left: `${x}px`, top: `${y}px` })

  const getFrequency = (note, octave) => {
    const num = settings.notes.indexOf(note)
    const freq = 440 * Math.pow(2, (octave * 12 + num - 57) / 12)
    return +freq.toFixed(4)
  }


  const ctx = new AudioContext()
  const filterNode = new BiquadFilterNode(ctx, { //TODO can't work out how to apply this properly
    type: 'lowpass',
    frequency: 1000,
    // Q: 100,
  })
  console.log(filterNode)
  const gainNode = ctx.createGain()
  const buffer = ctx.createBuffer(1, ctx.sampleRate * 1, ctx.sampleRate)

  const channelData = buffer.getChannelData(0)
  new Array(buffer.length).fill('').forEach((_, i) => {
    channelData[i] = Math.random() * 2 - 1
  })
  
  const keys = settings.notes.map(key => {
    return  {
      note: Object.assign(document.createElement('div'), 
        { 
          className: 'note',
          innerHTML: `
          <div class="sprite-container">
            <div class="sprite singer"></div>
          </div>
          <button>${key}</button>`
        }),
      x: 0,
      y: 0,
      frames: [0, 1, 2, 4, 4, 4, 5, 0],
      frameCount: 0,
      timer: null,
      key,
      track: Object.assign(document.createElement('div'), 
        { className: 'track' }),  
    }
  })

  const animateSprite = singer => {
    const { frames, frameCount } = singer
    if (frameCount < frames.length) {
      singer.x = frames[singer.frameCount] * -40
      setStyles(singer)
      singer.timer = setTimeout(()=> {
        singer.frameCount += 1
        animateSprite(singer)
      }, 100)
    } else {
      singer.frameCount = 0
    }
  }

  const removeBlock = block => {
    block.key.track.removeChild(block.el)
    settings.blocks = settings.blocks.filter(b => b !== block)
    // updateQueryParam()
  }

  keys.forEach(key => {
    key.el = key.note.childNodes[1].childNodes[1]
    key.btn = key.note.childNodes[3]
    elements.singersWrapper.appendChild(key.note)
    elements.timeline.el.appendChild(key.track)

    key.track.addEventListener('click', e => {
      if (e.target.classList[0] === 'block') return

      const { top } = key.track.getBoundingClientRect()
      const block = {
        el: Object.assign(document.createElement('div'), { 
          className: `block ${key.key}`,
          innerHTML: `${key.key}`,
        }),
        y: nearestN(e.pageY - top - window.scrollY, 20) - 20,
        key,
      }
      setPos(block)
      key.track.appendChild(block.el)
      settings.blocks.push(block)
      // updateQueryParam()

      block.el.addEventListener('click', ()=> removeBlock(block))
      // console.log(block, track)
    })

    key.btn.addEventListener('click', ()=> playKey(key))
  })

  const snare = () => {
    const whiteNoiseSrc = ctx.createBufferSource()
    whiteNoiseSrc.buffer = buffer
    whiteNoiseSrc.connect(filterNode)
    filterNode.connect(gainNode)
    gainNode.gain.setValueAtTime(0.5, 0)
    gainNode.connect(ctx.destination)
    whiteNoiseSrc.start()
    whiteNoiseSrc.stop(ctx.currentTime + 0.5)
  }



  const playSound = () => {
    elements.oscillator = ctx.createOscillator()
    const { note, octave } = settings
    elements.oscillator.type = settings.oscillatorType
    elements.oscillator.frequency.value = getFrequency(note, octave)

    gainNode.gain.setValueAtTime(1, 0)
    // gainNode.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 1)

    elements.oscillator.connect(filterNode)
    filterNode.connect(gainNode)
    gainNode.connect(ctx.destination)
    elements.oscillator.start(0)
    elements.oscillator.stop(ctx.currentTime + 0.5)
  }

  const playKey = note => {
    animateSprite(note)
    // const ctx = new AudioContext()
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.type = settings.oscillatorType
    oscillator.frequency.value = getFrequency(note.key, settings.octave)

    gainNode.gain.setValueAtTime(0.5, 0)

    // const clipPlayTime = 0
    // const clipLength = 3
    // gainNode.gain.setValueAtTime(0.01, clipPlayTime)
    // gainNode.gain.exponentialRampToValueAtTime(1, clipPlayTime + 0.001)
    // // end of clip
    // gainNode.gain.setValueAtTime(1, clipPlayTime + clipLength - 0.001)
    // gainNode.gain.exponentialRampToValueAtTime(0.01, clipPlayTime + clipLength)
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1)

    oscillator.connect(gainNode)
    // filterNode.connect(gainNode)
    gainNode.connect(ctx.destination)
    oscillator.start(0)
    oscillator.stop(ctx.currentTime + 0.5)
  }


  const playTracks = playOn => {
    if (!playOn) {
      elements.timeline.y = 0
      setPos(elements.timeline)
      clearTimeout(elements.timeline.timer)
      if (!settings.blocks.length) return
    }
    // console.log(settings.blocks)
    settings.blocks.forEach(block => {
      if (block.y === (elements.timeline.y * -1)) playKey(block.key)
    })
    elements.timeline.y -= 10
    setPos(elements.timeline)
    if (elements.timeline.y > (-1 * elements.timeline.h)) {
      elements.timeline.timer = setTimeout(()=> {
        control.playTracks(true)
      }, 200)
    } else {
      elements.timeline.y = 0
      setPos(elements.timeline)
    }
  }

  const control = {
    playSound,
    snare,
    playTracks,
    delete: () => {
      keys.forEach(key => key.track.innerHTML = '')
      settings.blocks = []
      // updateQueryParam()
    },
  }
  
  elements.btns.forEach(btn => {
    btn.addEventListener('click', e => {
      control[e.target.dataset.control]()
    })
  })



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


}

window.addEventListener('DOMContentLoaded', init)