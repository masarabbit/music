function init() {

  const button = document.querySelector('button')
  const input = document.querySelector('input')
  const select = document.querySelector('select')

  const synth = window.speechSynthesis

  let voices

  button.addEventListener('click', ()=> {
    const utterThis = new SpeechSynthesisUtterance(input.value)
    if (voices.length){
      const selectedOption =
      select.selectedOptions[0].getAttribute("data-name")
    for (const voice of voices) {
      if (voice.name === selectedOption) {
        utterThis.voice = voice
      }
    }
  }
    utterThis.pitch = 300
    // utterThis.rate = rate.value
    synth.speak(utterThis)
  })

  function populateVoiceList() {
    voices = synth.getVoices()
  
    for (const voice of voices) {
      const option = document.createElement("option")
      option.textContent = `${voice.name} (${voice.lang})`
  
      if (voice.default) {
        option.textContent += " — DEFAULT"
      }
  
      option.setAttribute("data-lang", voice.lang)
      option.setAttribute("data-name", voice.name)
      select.appendChild(option)
    }
  }

  populateVoiceList()



}

window.addEventListener('DOMContentLoaded', init)