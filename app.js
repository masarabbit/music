function init() {

  // TODO adjust track height

  const settings = {
    timeline: {
      el: document.querySelector('.timeline'),
      y: 0,
      h: 400,
      timer: null
    },
    blocks: [],
    singersWrapper: document.querySelector('.singers-wrapper'),
    btns: document.querySelectorAll('.btn'),
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

  const singers = [
    { 
      sound: 'do',
      frames: [0, 1, 2, 4, 4, 5, 0] 
    },
    { 
      sound: 're',
      frames: [0, 1, 2, 6, 6, 6, 0]
    },
    { 
      sound: 'mi',
      frames: [0, 1, 6, 6, 6, 6, 0] 
    },
    { 
      sound: 'fa',
      frames: [0, 1, 2, 3, 3, 3, 1, 0]  
    },
    { 
      sound: 'so',
      frames: [0, 1, 2, 4, 4, 5, 0] 
    },
    { 
      sound: 'ra',
      frames: [0, 1, 2, 3, 3, 3, 1, 0]  
    },
    { 
      sound: 'ti',
      frames: [0, 1, 6, 6, 6, 6, 0] 
    },
    { 
      sound: 'do_',
      frames: [0, 1, 2, 4, 4, 4, 5, 0] 
    },
  ].map(singer => {
    const { sound } = singer
    return  {
      note: Object.assign(document.createElement('div'), 
        { 
          className: 'note',
          innerHTML: `
          <div class="sprite-container">
            <div class="re sprite singer"></div>
          </div>
          <button class="btn">${sound.replace('_','')}</button>
          <audio src="./assets/${sound}.wav" preload="auto">`
        }),
      x: 0,
      y: 0,
      frames: singer.frames || [0, 1, 2, 3, 3, 3, 1, 0],
      frameCount: 0,
      timer: null,
      sound,
      track: Object.assign(document.createElement('div'), 
        { className: 'track' }),
    }
  })

  const removeBlock = block => {
    block.singer.track.removeChild(block.el)
    settings.blocks = settings.blocks.filter(b => b !== block)
    updateQueryParam()
  }

  singers.forEach(singer => {
    singer.el = singer.note.childNodes[1].childNodes[1]
    singer.btns = singer.note.childNodes[3]
    settings.singersWrapper.appendChild(singer.note)
    settings.timeline.el.appendChild(singer.track)

    singer.track.addEventListener('click', e => {
      if (e.target.classList[0] === 'block') return

      const { top } = singer.track.getBoundingClientRect()
      const block = {
        el: Object.assign(document.createElement('div'), { 
          className: `block ${singer.sound.replace('_', '')}`,
        }),
        y: nearestN(e.pageY - top - window.scrollY, 20) - 20,
        singer: singer
      }
      setPos(block)
      singer.track.appendChild(block.el)
      settings.blocks.push(block)
      updateQueryParam()

      block.el.addEventListener('click', ()=> removeBlock(block))
      // console.log(block, track)
    })
    singer.btns.addEventListener('click', ()=> playSound(singer))
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

  const playSound = singer => {
    const audio = document.createElement('audio')
    audio.src = `./assets/${singer.sound}.wav`
    clearTimeout(singer.timer)
    singer.frameCount = 0
    animateSprite(singer)
    audio.play()
  }


  window.addEventListener('keydown', e => {
    const index = 'qwertyui'.indexOf(e.key.toLowerCase())
    if (index > -1) playSound(singers[index])
  })
  
  const control = {
    playTracks: playOn => {
      if (!playOn) {
        settings.timeline.y = 0
        setPos(settings.timeline)
        clearTimeout(settings.timeline.timer)
        if (!settings.blocks.length) return
      }
      // console.log(settings.blocks)
      settings.blocks.forEach(block => {
        if (block.y === (settings.timeline.y * -1)) playSound(block.singer)
      })
      settings.timeline.y -= 10
      setPos(settings.timeline)
      if (settings.timeline.y > (-1 * settings.timeline.h)) {
        settings.timeline.timer = setTimeout(()=> {
          control.playTracks(true)
        }, 200)
      } else {
        settings.timeline.y = 0
        setPos(settings.timeline)
      }
    },
    delete: () => {
      singers.forEach(singer => singer.track.innerHTML = '')
      settings.blocks = []
      updateQueryParam()
    },
    extend: () => {
      settings.timeline.h += 100
      setStyles(settings.timeline)
      updateQueryParam()
    },
    shorten: () => {
      settings.timeline.h -= 100
      setStyles(settings.timeline)
      updateQueryParam()
    }
  }


  const updateQueryParam = () => {
    window.location = `#${settings.timeline.h}${settings.blocks.length ? '#' : ''}${settings.blocks.map(b => b && `${b.y / 10}${b.singer.sound}`).join('.')}`
  }

  const query = window.location.hash
  const queryArray = query.split('#')
  console.log(queryArray)
  if (queryArray.length > 2) {
    const blocks = queryArray[2].split('.')
    settings.timeline.h = +queryArray[1]
    setStyles(settings.timeline)
    console.log(queryArray)
    if (blocks.length) {
      settings.blocks = blocks.map(block => {
        const sound = block.split('').filter(x => x * 0 !== 0).join('')
        const time = block.split('').filter(x => x * 0 === 0).join('') || 1
        return {
          el: Object.assign(document.createElement('div'), { 
            className: `block ${sound.replace('_', '')}`,
          }),
          y: +time * 10,
          singer: singers.find(singer => singer.sound === sound)
        }
      })
      settings.blocks.forEach(block => {
        setPos(block)
        block.singer.track.appendChild(block.el)
        block.el.addEventListener('click', ()=> removeBlock(block))
      })
    } 
  }

  settings.btns.forEach(btn => btn.addEventListener('click', e => {
    control[e.target.dataset.control]()
  }))
}

window.addEventListener('DOMContentLoaded', init)