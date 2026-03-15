export default class Intro {
  constructor(onComplete) {
    this.onComplete = onComplete
    this._el = document.getElementById('intro')
    this._terminal = document.getElementById('intro-terminal')
    this._bar = document.getElementById('intro-bar-fill')
    this._btn = document.getElementById('intro-btn')
    this._lines = [
      '> initializing erick.siller v2.0.25...',
      '> loading typescript.runtime............ OK',
      '> loading python.ml_pipeline............ OK',
      '> loading go.distributed_core........... OK',
      '> loading llm.agent_framework........... OK',
      '> loading react.three_renderer.......... OK',
      '> loading human.profile................. OK',
      '> calibrating navigation.systems........ OK',
      '> scanning planetary.objects............ 6 FOUND',
      '> welcome to deep space.',
      ''
    ]
    this._lineIndex = 0
    this._charIndex = 0
    this._text = ''
    this._interval = null
    this._start()
  }

  _start() {
    this._interval = setInterval(() => this._type(), 28)
  }

  _type() {
    if (this._lineIndex >= this._lines.length) {
      clearInterval(this._interval)
      this._bar.style.width = '100%'
      setTimeout(() => {
        this._btn.style.display = 'block'
        this._btn.addEventListener('click', () => this._complete(), { once: true })
      }, 400)
      return
    }

    const line = this._lines[this._lineIndex]

    if (this._charIndex < line.length) {
      this._text += line[this._charIndex]
      this._charIndex++
    } else {
      this._text += '\n'
      this._lineIndex++
      this._charIndex = 0
      const progress = (this._lineIndex / this._lines.length) * 100
      this._bar.style.width = progress + '%'
    }

    this._terminal.textContent = this._text
  }

  _complete() {
    this._el.classList.add('hidden')
    document.getElementById('hud').classList.add('visible')
    setTimeout(() => {
      this._el.style.display = 'none'
      this.onComplete?.()
    }, 1000)
  }
}
