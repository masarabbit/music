//@ts-checkOFF

function init() {

  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let oscillator = null;
  // const playButton = document.querySelector(".play-button");

  const gainNode = audioCtx.createGain()

  const notes = ['c', 'c#', 'd', 'd#', 'e', 'f', 'f#', 'g', 'g#', 'a', 'a#', 'b']

  const getFrequency = (note, octave) => {
    const num = notes.indexOf(note)
    const freq = 440 * Math.pow(2, (octave * 12 + num - 57) / 12)
    return +freq.toFixed(4)
  }

  const playNote = (button, note) => {
    if (oscillator === null) {
      button.innerHTML = `⏸ ${note}`;
      oscillator = audioCtx.createOscillator();
      oscillator.type = 'square';

      gainNode.gain.setValueAtTime(0.3, 0)
      gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 1.5)

      oscillator.frequency.setValueAtTime(getFrequency(note, 5), audioCtx.currentTime); // value in hertz
    
      gainNode.connect(audioCtx.destination)
      oscillator.connect(gainNode)

      // oscillator.connect(audioCtx.destination);

      // oscillator.onended = ()=> {
      //   oscillator.disconnect(audioCtx.destination);
      //   oscillator = null
      // }


      oscillator.start();
  } else {
      button.innerHTML = `▶️ ${note}`;
      oscillator.stop();
      gainNode.disconnect(audioCtx.destination);
      oscillator = null
    }
  }
  
  const body =  document.querySelector('body')
  notes.forEach(note => {
    const button = document.createElement('button')
    button.innerHTML = note
    button.addEventListener('click', ()=> playNote(button, note))
    body.append(button)
  })



  }

window.addEventListener('DOMContentLoaded', init)