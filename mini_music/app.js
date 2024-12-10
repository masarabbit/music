//@ts-checkOFF

function init() {
  // const notes =
  //   '0.d.4.t-6.e.4.t-12.d.4.t-18.e.4.t-24.d.4.t-0.c.5.q-12.c.5.q-6.g.5.q-18.g.5.q-24.a.5.q-27.a.5.q-30.a.5.q-36.b.5.q-39.a.5.q-42.g.5.q-36.d.4.t-42.e.4.t-30.g.4.t-48.d.4.t-54.e.4.t-60.d.4.t-66.g.4.t-48.c.5.q-57.g.5.q-72.d.4.t-78.e.4.t-84.d.4.t-90.e.4.t-51.c.5.q-54.g.5.q-60.c.5.q-63.c.5.q-66.g.5.q-69.g.5.q-75.a.5.q-78.a.5.q-81.a.5.q-87.b.5.q-90.a.5.q-93.g.5.q-96.d.4.t-102.g.4.t-99.a.5.w-102.a.5.w-105.a.5.w-111.b.5.w-114.a.5.w-117.g.5.w-108.d.4.t-114.e.4.t-120.d.4.t-126.e.4.t-132.d.4.t-138.g.4.t-123.a.4.q-126.a.4.q-129.a.4.q-138.a.4.q-141.g.4.q-135.b.4.q'.split(
  //     '-',
  //   )
  // const notes = '0.c$.4.w-3.d$.4.w-6.f$.4.w-12.g$.4.w-18.f$.4.w-12.g$.5.t-18.f$.5.t-24.c$.4.q-27.d$.4.q-30.f$.4.q-30.f$.5.s'.split('-')
  // const notes = '0.c.5.w-6.d.5.w-12.f.5.w-66.f.5.w-69.e.5.w-72.g.5.w-75.a.5.w-78.e.5.w-81.f.5.w-0.d.4.t-6.g.4.t-12.c.4.t-18.g.4.t-24.d.4.t-30.g.4.t-36.c.4.t-42.g.4.t-48.d.4.t-54.g.4.t-60.c.4.t-66.g.4.t-72.d.4.t-78.g.4.t-84.c.4.t-90.g.4.t-60.d.5.w-48.c.5.w-24.c.5.w-30.d.5.w-36.g.5.w-18.d.5.q-42.d.5.q-54.e.5.w-66.f.5.q-69.e.5.q-72.g.5.q-75.a.5.q-78.e.5.q-81.f.5.q-84.f.5.q-96.d.4.t-102.g.4.t-108.c.4.t-114.g.4.t-90.f.5.w-93.e.5.w-96.g.5.w-99.a.5.w-102.e.5.w-105.f.5.w-114.f.5.q-117.e.5.q-120.g.5.q-123.a.5.q-126.e.5.q-129.f.5.q-132.f.5.q-120.d.4.t-126.g.4.t-132.c.4.t-138.g.4.t-15.d.5.q-39.d.5.q-63.f.5.q-108.f.5.w-144.d.4.t-150.g.4.t-156.c.4.t-162.g.4.t-150.e.6.w-153.f.6.w-156.f.6.w-138.f.6.w-141.e.6.w-144.g.6.w-147.a.6.w'.split(
  //   '-',
  // )

  const notes = '6.c.5.t-18.g.5.t-30.c.5.t-42.g.5.t-54.d.5.t-66.a.5.t-78.d.5.t-90.a.5.t-6.a.4.q-9.a.4.q-18.b.4.q-30.g.4.q-33.g.4.q-42.a.4.q-54.a.4.q-60.b.4.q-66.e.5.q-72.g.5.q-78.e.5.q-84.d.5.q-24.g.6.w-21.f.6.w-27.b.6.w-36.d.6.w-39.e.6.w-42.f.6.w-45.g.6.w-57.f.6.w-60.g.6.w-63.b.6.w-66.e.6.w-69.g.6.w-72.f.6.w-75.g.6.w-78.a.6.w-84.b.6.w-93.g.6.w-90.a.6.w'.split('-')

  const getFrequency = (note, octave) => {
    const num = [
      'c',
      'c#',
      'd',
      'd#',
      'e',
      'f',
      'f#',
      'g',
      'g#',
      'a',
      'a#',
      'b',
    ].indexOf(note)
    const freq = 440 * Math.pow(2, (octave * 12 + num - 57) / 12)
    return +freq.toFixed(4)
  }
  const getSpeed = bpm => ((60 / bpm) * 1000) / 2
  const settings = {
    bpm: 100,
    loop: true,
    musicLength: 1440 / 30,
  }
  const ctx = new AudioContext()
  let timeline = 0
  let timer

  const editedNotes = notes
    .map(n => {
      const blockArr = n.split('.')
      const y = (+blockArr[0] * 10) / 30
      return `${y}.${blockArr[1].replace('$', '#')}.${blockArr[2]}.${
        blockArr[3]
      }`
    })
    .join('-')

  console.log('editedNotes', editedNotes)

  const unpackedMusic = editedNotes.split('-').map(block => {
    const blockArr = block.split('.')
    const y = +blockArr[0]
    const note = blockArr[1]
    const octave = blockArr[2]
    const oscType = {
      w: 'sawtooth',
      t: 'triangle',
      q: 'square',
      s: 'sine',
    }[blockArr[3]]
    return {
      note,
      octave,
      oscType,
      y,
    }
  })

  console.log(unpackedMusic)

  const stop = () => {
    timeline = 0
    clearTimeout(timer)
    timer = null
  }

  const playBlock = block => {
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()
    oscillator.type = block.oscType
    oscillator.frequency.value = getFrequency(block.note, block.octave)

    gainNode.gain.setValueAtTime(
      {
        sine: 0.5,
        triangle: 0.4,
        square: 0.2,
        sawtooth: 0.2,
      }[oscillator.type],
      0,
    )
    gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.5) 
    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)
    oscillator.start(0)
    oscillator.stop(ctx.currentTime + 1)
  }

  const playTracks = playOn => {
    if (!playOn) stop()
    unpackedMusic.forEach(block => {
      if (block.y === timeline) playBlock(block)
    })
    timeline++
    if (timeline <= settings.musicLength) {
      timer = setTimeout(() => {
        playTracks(true)
      }, getSpeed(settings.bpm))
    } else {
      stop()
      if (settings.loop) {
        playTracks()
      }
    }
  }

  document.querySelector('button').addEventListener('click', () => {
    if (!timeline) {
      playTracks()
    } else {
      stop()
    }
  })
}

window.addEventListener('DOMContentLoaded', init)
