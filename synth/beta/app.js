//@ts-checkOFF

function init() {
  //TODO add envelope?

  // TODO bpm is probably correct but needs checking


  const inputs = {
    octave: document.querySelector('#octave'),
    bpm: document.querySelector('#bpm'),
  }
  const elements = {
    wrapper: document.querySelector('.wrapper'),
    singersWrapper: document.querySelector('.singers-wrapper'),
    timeline: {
      el: document.querySelector('.timeline'),
      y: 0,
      h: 420,
      timer: null
    },
    oscillator: null,
    btns: document.querySelectorAll('.btn'),
    indicator: document.querySelector('.indicator'),
    soundPalette: document.querySelector('.sound-palette'),
    oscTypeBtnWrapper: document.querySelector('.osc-type-btn-wrapper'),
    oscTypeBtns: [],
    playBtn: document.querySelector('.play'),
    stopBtn: document.querySelector('.stop'),
    loopBtn: document.querySelector('.loop'),
    dialogue: document.querySelector('.dialogue'),
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
    frames: {
      c: [0, 1, 2, 4, 4, 5, 0],
      d: [0, 1, 2, 6, 6, 6, 0],
      e: [0, 1, 6, 6, 6, 6, 0],
      f: [0, 1, 2, 3, 3, 3, 1, 0],
      g: [0, 1, 2, 4, 4, 5, 0],
      a: [0, 1, 2, 3, 3, 3, 1, 0],
      b: [0, 1, 6, 6, 6, 6, 0],
    },
    oscType: 'triangle',
    note: 'c',
    octave: 5,
    loop: false,
    bpm: 50
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
  // const oldSpeed = bpm => (1 / bpm) * 10000
  const getSpeed = bpm => ((60 / bpm) * 1000) / 6

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
  
  const keys = settings.oscTypes.map(type => {
    return  {
      singer: Object.assign(document.createElement('div'), 
        { 
          className: 'singer',
          innerHTML: `
          <div class="sprite-container">
            <div class="sprite ${type}"></div>
          </div>`
        }),
      x: 0,
      y: 0,
      frameCount: 0,
      timer: null,
      id: type,
      track: Object.assign(document.createElement('div'), 
        { className: 'track' }),  
    }
  })

  const animateSprite = (singer, frames) => {
    const { frameCount } = singer
    if (frameCount < frames.length) {
      singer.x = frames[singer.frameCount] * -40
      setStyles(singer)
      singer.timer = setTimeout(()=> {
        singer.frameCount += 1
        animateSprite(singer, frames)
      }, getSpeed(settings.bpm) / 2)
    } else {
      singer.frameCount = 0
    }
  }

  const removeBlock = block => {
    block.key.track.removeChild(block.el)
    settings.blocks = settings.blocks.filter(b => b !== block)
    updateQueryParam()
  }

  const activateOscType = key => {
    ;[key.track, key.singer].forEach(el => el.classList[key.id === settings.oscType ? 'add' : 'remove']('active'))
  }

  keys.forEach(key => {
    key.el = key.singer.childNodes[1].childNodes[1]
    elements.singersWrapper.appendChild(key.singer)
    elements.timeline.el.appendChild(key.track)
    activateOscType(key)
    key.track.addEventListener('click', e => {
      if (e.target.classList[0] === 'block') return
      const { note, octave, oscType } = settings
      const { top } = key.track.getBoundingClientRect()
      const snare = key.id === 'snare'
      const block = snare 
        ? {
          el: Object.assign(document.createElement('div'), { 
            className: 'block snare',
            innerHTML: 'snare',
          }),
          key,
          snare
        }
        : {
          el: Object.assign(document.createElement('div'), { 
            className: `block ${note.replace('#', '')}`,
            innerHTML: `
            <p>${note} ${octave}</p>
            `,
          }),
          note,
          octave,
          oscType,
          key,
          snare
        }
      block.y = nearestN(e.pageY - top - window.scrollY, 30) - 30
      block.frames = snare 
        ? [0, 1, 6, 6, 6, 6, 0]
        : settings.frames[note[0]]
      setPos(block)
      key.track.appendChild(block.el)
      settings.blocks.push(block)
      updateQueryParam()
      block.el.addEventListener('click', ()=> removeBlock(block))
    })
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

  const updateQueryParam = () => {
    window.location = `#${elements.timeline.h}#${settings.bpm}#${settings.loop ? 'loop' : 'no-loop'}${settings.blocks.length ? '#' : ''}${settings.blocks.map(b => {
      if (!b) return
      const sound = b.snare 
        ? 'sn'
        : `${b.note.replace('#','$')}.${b.octave}.${settings.oscKey[b.oscType]}`
      return `${b.y / 10}.${sound}`
    }).join('-')}`
  }
  
  // const mainGainNode = ctx.createGain()

  const playBlock = (block, offset) => {
    if (block.key) {
      animateSprite(block.key, block.frames)
    }
    if (block.snare) {
      control.snare()
      return
    }
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.type = block.oscType || settings.oscType
    oscillator.frequency.value = getFrequency(block.note, block.octave || settings.octave) - (offset || 0)

    gainNode.gain.setValueAtTime(settings.volumes[oscillator.type], 0)
    gainNode.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 1.5) // TODO this bit can be extended to make the notes hang longer

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)
    oscillator.start(0)
    oscillator.stop(ctx.currentTime + 0.5)
  }

  const scrollPos = ({ el, y }) => {
    el.y > el.parentNode.offsetHeight
      ? el.parentNode.scrollTop = y
      : setPos({ el, y: y * -1 })
  }

  const stop = () => {
    elements.timeline.y = 0
    elements.timeline.el.parentNode.scrollTop = 0
    scrollPos(elements.timeline)
    clearTimeout(elements.timeline.timer)
    elements.timeline.timer = null
    ;[elements.wrapper, elements.playBtn].forEach(el => el.classList.remove('active'))
  }


  const playTracks = playOn => {
    if (!playOn) {
      stop()
      if (!settings.blocks.length) return
    }
    elements.playBtn.classList.add('active')
    settings.blocks.forEach(block => {
      if (block.y === elements.timeline.y) playBlock(block)
    })
    elements.timeline.y += 10
    scrollPos(elements.timeline)
    if (elements.timeline.y <= elements.timeline.h) {
      elements.wrapper.classList.add('active')
      elements.timeline.timer = setTimeout(()=> {
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
      if (elements.timeline.timer) return
      setTimeout(()=> {
        playTracks()
      }, 300)
    },
    stop,
    deleteCheck: () => {
      elements.wrapper.classList.add('pause')
    },
    delete: () => {
      elements.wrapper.classList.remove('pause')
      keys.forEach(key => key.track.innerHTML = '')
      settings.blocks = []
      updateQueryParam()
    },
    resume: () => {
      elements.wrapper.classList.remove('pause')
    },
    extend: () => {
      elements.timeline.h += 30
      setStyles(elements.timeline)
      updateQueryParam()
    },
    shorten: () => {
      elements.timeline.h -= 30
      setStyles(elements.timeline)
      updateQueryParam()
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
  
  settings.oscTypes.forEach(type => {
    const btn = Object.assign(document.createElement('button'), { 
      className: `text-btn border-right ${type === settings.oscType ? 'active' : ''}`,
      innerHTML: `${type}`,
    })
    btn.addEventListener('click', ()=> {
      settings.oscType = type
      keys.forEach(key => {
      activateOscType(key)
      })
      elements.oscTypeBtns.forEach(btn => {
        btn.classList[btn.innerHTML === type ? 'add' : 'remove']('active')
      })
    })
    elements.oscTypeBtns.push(btn)
    elements.oscTypeBtnWrapper.append(btn)
  })


  // const updateIndicator = () => {
  //   elements.indicator.innerHTML = Object.keys(inputs).map(input => input !== 'blocks' && settings[input]).join(' | ')
  // }

  Object.keys(inputs).forEach(input => {
    inputs[input].addEventListener('change', e => {
      settings[input] = ['snare', 'loop'].includes(input)
        ? e.target.checked
        // : input === 'bpm'
        // ? e.target.value
        : e.target.value
      // updateIndicator()
    })
  })

  const query = window.location.hash
  const queryArray = query.split('#')
  if (queryArray.length > 4) {
    elements.timeline.h = +queryArray[1]
    settings.bpm = +queryArray[2]
    inputs.bpm.value = +queryArray[2]
    settings.loop = queryArray[3] === 'loop'
    const blocks = queryArray[4].split('-')

    if (settings.loop) elements.loopBtn.classList.add('active')

    setStyles(elements.timeline)
    if (blocks.length) {
      settings.blocks = blocks.map(block => {
        const blockArr = block.split('.')
        const snare = blockArr[1] === 'sn'
        const y = +blockArr[0] * 10
        
        if (snare) {
          return {
            el: Object.assign(document.createElement('div'), { 
              className: 'block snare',
              innerHTML: 'snare',
            }),
            snare,
            key: keys.find(key => key.id === 'snare'),
            y
          }
        }
        const note = blockArr[1].replace('$','#')
        const octave = blockArr[2]
        const oscType = settings.oscKey[blockArr[3]]
        return {
          el: Object.assign(document.createElement('div'), { 
            className: `block ${note.replace('#','')}`,
            innerHTML: `
          <p>${note} ${octave}</p>
          `,
          }),
          note,
          octave,
          oscType,
          key: keys.find(key => key.id === oscType),
          snare,
          y,
        }
      })
      settings.blocks.forEach(block => {
        block.frames = block.snare 
          ? [0, 1, 6, 6, 6, 6, 0]
          : settings.frames[block.note[0]]
        setPos(block)
        block.key.track.appendChild(block.el)
        block.el.addEventListener('click', ()=> removeBlock(block))
      })
    } 
  }

  const allBlocks = settings.notes.map(note => {
    return {
      el: Object.assign(document.createElement('button'), { 
        className: `sound-button border-right ${note.replace('#','')} ${note.includes('#') ? 'sharp' : ''}`,
        innerHTML: `${note}`,
      }),
      note, 
    }
  })


  allBlocks.forEach(sound => {
    elements.soundPalette.append(sound.el)
    sound.el.addEventListener('click', ()=> {
      playBlock(sound)
      settings.note = sound.note
      animateSprite(
        keys.find(key => key.id === settings.oscType), 
        settings.frames[sound.note.replace('#','')]
      )
    })
  })
  
  // Adjust width to consider scrollbar width
  ;[elements.singersWrapper, elements.oscTypeBtnWrapper].forEach(el => {
    setStyles({ el, w: elements.timeline.el.offsetWidth })
  })

  elements.dialogue.addEventListener('click', control.resume)

}

window.addEventListener('DOMContentLoaded', init)