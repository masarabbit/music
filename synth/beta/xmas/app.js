//@ts-checkOFF

function init() {
  //TODO add envelope?

  // TODO bpm is probably correct but needs checking


  const inputs = {
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
  const getSpeed = bpm => (1 / bpm) * 10000

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
    gainNode.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 1.5) 

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
    elements.playBtn.classList.remove('active')
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
      settings[input] = ['snare', 'loop'].includes(input)
        ? e.target.checked
        : e.target.value
    })
  })

  const query = '#3690#170#no-loop#3.e.5.t-9.e.5.t-15.e.5.t-27.e.5.t-33.e.5.t-39.e.5.t-111.f.5.t-123.e.5.t-129.e.5.t-189.e.5.t-195.e.5.t-201.e.5.t-90.f.5.t-96.f.5.t-102.f.5.t-51.e.5.t-57.g.5.t-63.c.5.t-69.d.5.t-75.e.5.t-117.e.5.t-138.e.5.t-144.d.5.t-150.d.5.t-156.c.5.t-162.d.5.t-174.g.5.t-213.e.5.t-219.e.5.t-225.e.5.t-237.e.5.t-243.g.5.t-249.c.5.t-255.d.5.t-261.e.5.t-276.f.5.t-282.f.5.t-288.f.5.t-297.f.5.t-303.e.5.t-309.e.5.t-315.e.5.t-321.g.5.t-327.g.5.t-333.f.5.t-339.d.5.t-345.c.5.t-3.e.3.w-9.e.3.w-15.e.3.w-18.g.3.w-21.a.3.w-27.e.3.w-33.e.3.w-39.e.3.w-42.g.3.w-51.e.3.w-57.g.3.w-63.c.3.w-69.d.3.w-75.e.3.w-96.f.3.w-102.f.3.w-105.a.3.w-111.f.3.w-117.e.3.w-123.e.3.w-129.e.3.w-138.e.3.w-144.d.3.w-150.d.3.w-156.c.3.w-162.d.3.w-165.e.3.w-168.f$.3.w-174.g.3.w-177.a.3.w-180.b.3.w-189.e.3.w-195.e.3.w-201.e.3.w-204.f.3.w-207.g.3.w-213.e.3.w-219.e.3.w-225.e.3.w-237.e.3.w-243.g.3.w-249.c.3.w-255.d.3.w-261.e.3.w-264.f.3.w-267.g.3.w-276.f.3.w-282.f.3.w-288.f.3.w-297.f.3.w-303.e.3.w-309.e.3.w-315.e.3.w-321.g.3.w-327.g.3.w-333.f.3.w-339.d.3.w-345.c.3.w-45.b.3.w-78.g.3.w-81.a.3.w-84.b.3.w-87.a.3.w-90.g.3.w-93.f.3.w-270.a.3.w-273.g.3.w-210.a.3.w-18.f.4.q-21.a.4.q-24.b.4.q-42.f.4.q-45.a.4.q-48.b.4.q-78.g.4.q-81.a.4.q-84.b.4.q-93.f.4.q-96.f.4.q-99.f.4.q-102.f.4.q-105.f.4.q-108.f.4.q-111.f.4.q-117.e.4.q-120.e.4.q-129.e.4.q-132.e.4.q-144.d.4.q-147.d.4.q-150.d.4.q-153.d.4.q-156.c.4.q-162.d.4.q-165.d.4.q-168.d.4.q-171.d.4.q-174.g.4.q-177.a.4.q-180.b.4.q-204.f.4.q-207.a.4.q-210.b.4.q-228.f.4.q-231.a.4.q-234.c.5.q-237.e.4.q-243.g.4.q-249.c.4.q-255.d.4.q-261.e.4.q-264.f.4.q-267.g.4.q-270.a.4.q-273.g.4.q-276.f.4.q-279.f.4.q-288.f.4.q-291.f.4.q-294.f.4.q-303.e.4.q-306.e.4.q-315.e.4.q-321.g.4.q-327.g.4.q-333.g.4.q-339.d.4.q-345.c.5.q-114.f.4.q-318.e.4.q-189.e.4.q-63.c.4.s-90.f.4.q-87.g.4.q-117.e.5.s-120.e.5.s-126.e.5.s-132.e.5.s-144.d.5.s-147.d.5.s-153.d.5.s-159.d.5.s-213.c.5.s-216.d.5.s-219.e.5.s-222.e.5.s-225.e.5.s-42.a.5.s-45.a.5.s-48.c.5.s-51.e.5.s-57.g.5.s-69.c.5.s-75.e.5.s-78.e.5.s-84.e.5.s-87.e.5.s-93.f.5.s-99.f.5.s-102.f.5.s-108.f.5.s-165.d.5.s-171.d.5.s-174.d.5.s-192.e.4.q-201.e.4.q-183.e.5.s-309.f.4.q-312.g.4.q-357.c.6.s'
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
  
  // Adjust width to consider scrollbar width
  setStyles({ el: elements.singersWrapper, w: elements.timeline.el.offsetWidth })

  elements.dialogue.addEventListener('click', control.resume)

}

window.addEventListener('DOMContentLoaded', init)