function init() {

  const settings = {
    timeline: {
      el: document.querySelector('.timeline'),
      y: 0,
      timer: null
    },
    blocks: [],
  }

  const elements = {
    // audios: document.querySelectorAll('audio'),
    buttons: document.querySelectorAll('.btn'),
    sprites: document.querySelectorAll('.sprite'),
    tracks: document.querySelectorAll('.track'),

    playButton: document.querySelector('.play'),
  }

  const isNo = x => typeof x === 'number'
  const px = n => `${n}px`
  // const setPos = ({ el, x, y }) => Object.assign(el.style, { left: `${x}px`, top: `${y}px` })
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
      el: elements.sprites[0],
      x: 0,
      y: 0,
      frames: [0, 1, 2, 3, 3, 3, 3, 3, 3, 3, 3, 1, 0],
      frameCount: 0,
      timer: null,
      sound: 'ahh.wav'
    },
    {
      el: elements.sprites[1],
      x: 0,
      y: 0,
      frames: [0, 1, 2, 3, 3, 3, 1, 0],
      frameCount: 0,
      timer: null,
      sound: 'meow.wav'
    },
    {
      el: elements.sprites[2],
      x: 0,
      y: 0,
      frames: [0, 0, 0, 3, 3, 3, 3, 3, 2, 0],
      frameCount: 0,
      timer: null,
      sound: 'nooo.wav'
    },
    {
      el: elements.sprites[3],
      x: 0,
      y: 0,
      frames: [0, 1, 2, 3, 3, 1, 0],
      frameCount: 0,
      timer: null,
      sound: 'oh.wav'
    }
  ]

  const animateSprite = singer => {
    const { frames, frameCount } = singer
    if (frameCount < frames.length) {
      singer.x = frames[singer.frameCount] * -32
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
    audio.src = `./assets/${singer.sound}`
    clearTimeout(singer.timer)
    singer.frameCount = 0
    animateSprite(singer)
    audio.play()
  }

  elements.buttons.forEach((btn, i) => {
    btn.addEventListener('click', ()=> playSound(singers[i]))
  })


  window.addEventListener('keydown', e => {
    const index = 'qwer'.indexOf(e.key.toLowerCase())
    if (index > -1) playSound(singers[index])
  })

  elements.tracks.forEach((track, i) => {
    track.addEventListener('click', e => {
      // const { top: timelineTop, left: timelineLeft } = elements.timeline.getBoundingClientRect()
      const { top } = track.getBoundingClientRect()
      // console.log(timelineLeft - left )

      const block = {
        el: Object.assign(document.createElement('div'), { 
          className: 'block',
        }),
        // x: track.left,
        y: e.pageY - top - window.scrollY,
        singer: singers[i]
      }
      setPos(block)
      track.appendChild(block.el)
      settings.blocks.push(block)
      console.log(block, track)
    })
  })

  const playTracks = () => {
    settings.timeline.y -= 10
    setPos(settings.timeline)
    // console.log(settings.timeline)
    settings.blocks.forEach(block => {
      if (nearestN(block.y, 10) === (settings.timeline.y * -1)) {
        console.log('trigger')
        playSound(block.singer)
      }
    })
    if (settings.timeline.y > -400) {
      settings.timeline.timer = setTimeout(()=> {
        playTracks()
      }, 100)
    } else {
      settings.timeline.y = 0
      setPos(settings.timeline)
    }
  }

  elements.playButton.addEventListener('click', ()=> {
    playTracks()
  })

    
}

window.addEventListener('DOMContentLoaded', init)