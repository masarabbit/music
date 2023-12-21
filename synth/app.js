//@ts-checkOFF

function init() {
  // TODO adjust timelineWrapper height based on screenSize

  //TODO add envelope?
  //TODO add pause / stop
  //TODO update how tunes are saved? save as json instead of param? Or maybe swap _ and .

  const inputs = {
    oscType: document.querySelector('#oscillator-type'),
    note: document.querySelector('#note'),
    octave: document.querySelector('#octave'),
    // snare: document.querySelector('#snare'),
    speed: document.querySelector('#speed'),
    loop: document.querySelector('#loop'),
    blocks: document.querySelector('#blocks'),
  }
  const elements = {
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
    soundPalettes: document.querySelectorAll('.sound-palette'),
  }

  const settings = {
    blocks: [],
    oscTypes: [
      'sine',
      'triangle',
      'square',
      'sawtooth',
    ],
    volumes: {
      sine: 0.7,
      triangle: 0.7,
      square: 0.2,
      sawtooth: 0.2,
    },
    oscKey: {
      s: 'sine',
      t: 'triangle',
      q: 'square',
      w: 'sawtooth',
      sine: 's',
      triangle: 't',
      square: 'q',
      sawtooth: 'w'
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
    oscType: 'sine',
    note: 'c',
    octave: 5,
    snare: false,
    loop: false,
    speed: 50
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
  })
  // console.log(filterNode)
  const gainNode = ctx.createGain()
  const buffer = ctx.createBuffer(1, ctx.sampleRate * 1, ctx.sampleRate)

  const channelData = buffer.getChannelData(0)
  new Array(buffer.length).fill('').forEach((_, i) => {
    channelData[i] = Math.random() * 2 - 1
  })
  
  const keys = Array(4).fill('').map((_, i) => {
    return  {
      note: Object.assign(document.createElement('div'), 
        { 
          className: 'note',
          innerHTML: `
          <div class="sprite-container">
            <div class="sprite singer"></div>
          </div>`
        }),
      x: 0,
      y: 0,
      frameCount: 0,
      timer: null,
      id: i,
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
      }, settings.speed / 2)
    } else {
      singer.frameCount = 0
    }
  }

  const removeBlock = block => {
    block.key.track.removeChild(block.el)
    settings.blocks = settings.blocks.filter(b => b !== block)
    updateQueryParam()
  }

  keys.forEach(key => {
    key.el = key.note.childNodes[1].childNodes[1]
    elements.singersWrapper.appendChild(key.note)
    elements.timeline.el.appendChild(key.track)

    key.track.addEventListener('click', e => {
      if (e.target.classList[0] === 'block') return
      const { note, octave, oscType, snare } = settings
      const { top } = key.track.getBoundingClientRect()
      const block = snare 
        ? {
          el: Object.assign(document.createElement('div'), { 
            className: 'block',
            innerHTML: 'snare',
          }),
          key,
          snare
        }
        : {
          el: Object.assign(document.createElement('div'), { 
            className: 'block',
            innerHTML: `
            <p>${note} ${octave}</p>
            <p>${oscType}</p>
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
    whiteNoiseSrc.stop(ctx.currentTime + 0.3)
  }

  const updateQueryParam = () => {
    window.location = `#${elements.timeline.h}#${settings.speed}#${settings.loop ? 'loop' : 'no-loop'}${settings.blocks.length ? '#' : ''}${settings.blocks.map(b => {
      if (!b) return
      const sound = b.snare 
        ? 'sn'
        : `${b.note.replace('#','$')}.${b.octave}.${settings.oscKey[b.oscType]}`
      return `${b.y / 10}.${sound}.${b.key.id}`
    }).join('-')}`

    inputs.blocks.value = JSON.stringify(settings.blocks, undefined, 1)
  }


  const playBlock = (block, offset) => {
    if (block.key) {
      animateSprite(block.key, block.frames)
    }
    if (block.snare) {
      control.snare()
      return
    }
    const ctx = new AudioContext()
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


  const playTracks = playOn => {
    if (!playOn) {
      elements.timeline.y = 0
      elements.timeline.el.parentNode.scrollTop = 0
      scrollPos(elements.timeline)
      clearTimeout(elements.timeline.timer)
      if (!settings.blocks.length) return
    }
    settings.blocks.forEach(block => {
      if (block.y === (elements.timeline.y)) playBlock(block)
    })
    elements.timeline.y += 10
    scrollPos(elements.timeline)
    if (elements.timeline.y <= (elements.timeline.h)) {
      elements.timeline.timer = setTimeout(()=> {
        control.playTracks(true)
      }, settings.speed)
    } else {
      elements.timeline.y = 0
      scrollPos(elements.timeline)
      if (settings.loop) {
        control.playTracks()
      }
    }
  }

  const control = {
    snare,
    playTracks,
    delete: () => {
      keys.forEach(key => key.track.innerHTML = '')
      settings.blocks = []
      updateQueryParam()
    },
    extend: () => {
      elements.timeline.h += 90
      setStyles(elements.timeline)
      updateQueryParam()
    },
    shorten: () => {
      elements.timeline.h -= 90
      setStyles(elements.timeline)
      updateQueryParam()
    }
  }
  
  elements.btns.forEach(btn => {
    btn.addEventListener('click', e => {
      control[e.target.dataset.control]()
    })
  })



  const updateIndicator = () => {
    elements.indicator.innerHTML = Object.keys(inputs).map(input => input !== 'blocks' && settings[input]).join(' | ')
  }

  inputs.oscType.innerHTML = settings.oscTypes.map(type => {
    return `<option value="${type}">${type}</option>`
  })
  inputs.note.innerHTML = settings.notes.map(note => {
    return `<option value="${note}">${note}</option>`
  })

  inputs.oscType.addEventListener('change', e => {
    settings.oscType = +e.target.value
    updateIndicator()
  })

  Object.keys(inputs).forEach(input => {
    inputs[input].addEventListener('change', e => {
      settings[input] = ['snare', 'loop'].includes(input)
        ? e.target.checked
        : e.target.value
      updateIndicator()
    })
  })

  const query = window.location.hash
  const queryArray = query.split('#')
  if (queryArray.length > 2) {
    elements.timeline.h = +queryArray[1]
    settings.speed = +queryArray[2]
    inputs.speed.value = +queryArray[2]
    settings.loop = queryArray[3] === 'loop'
    inputs.loop.checked = queryArray[3] === 'loop'
    const blocks = queryArray[4].split('-')

    setStyles(elements.timeline)
    if (blocks.length) {
      settings.blocks = blocks.map(block => {
        const blockArr = block.split('.')
        const snare = blockArr[1] === 'sn'
        const y = +blockArr[0] * 10
        
        if (snare) {
          return {
            el: Object.assign(document.createElement('div'), { 
              className: 'block',
              innerHTML: 'snare',
            }),
            snare,
            key: keys[+blockArr[2]],
            y
          }
        }
        const note = blockArr[1].replace('$','#')
        const octave = blockArr[2]
        const oscType = settings.oscKey[blockArr[3]]
        return {
          el: Object.assign(document.createElement('div'), { 
            className: 'block',
            innerHTML: `
          <p>${note} ${octave}</p>
          <p>${oscType}</p>
          `,
          }),
          note,
          octave,
          oscType,
          key: keys[+blockArr[4]],
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
        className: `sound-button ${note.includes('#') ? 'sharp' : ''}`,
        innerHTML: `${note}`,
      }),
      note, 
    }
  })


  allBlocks.forEach(sound => {
    elements.soundPalettes[0].append(sound.el)
    sound.el.addEventListener('click', ()=> {
      playBlock(sound)
      // ;['note', 'octave', 'oscType'].forEach(key => {
      //   inputs[key].value = sound[key]
      //   settings[key] = sound[key]
      // })
    })
  })


}

window.addEventListener('DOMContentLoaded', init)