import Component from './component.mjs';

const html = /*html*/ `
<div class="progress">
  <div class="filler"></div>
  <style>
    .progress {
      position: absolute;
      left: 0;
      bottom: 0;
      width: 100%;
      height: 4px;
    }

    .progress .filler {
      background-color: hsl(35 67% 30%);
      width: 0;
      height: 100%;
      transition: width 0.1s linear;
    }
  </style>
</div>
`;

export default class Progress extends Component {
  /** @type {HTMLElement} */
  filler;

  counter = 0;
  intervalId = 0;

  /**
   * @param {HTMLElement} parent
   * @param {boolean} replacing
   */
  constructor(parent, replacing) {
    super(parent, html, replacing);
    this.filler = this.root.querySelector('.filler');
  }

  /**
   * @param {number} steps
   */
  run(steps, interval) {
    if (this.intervalId > 0) {
      window.clearInterval(this.intervalId);
      this.intervalId = 0;
    }

    this.root.style.display = '';
    this.filler.style.transitionDuration = `${interval / 1000}s`;

    this.counter = 0;
    window.setTimeout(() => {
      this.filler.style.width = `${(++this.counter / steps) * 100}%`;
    }, 1);

    this.intervalId = window.setInterval(() => {
      this.filler.style.width = `${(++this.counter / steps) * 100}%`;
      if (this.counter == steps) {
        window.clearInterval(this.intervalId);
        this.intervalId = 0;
      }
    }, interval);
  }

  hide() {
    if (this.intervalId) {
      window.clearInterval(this.intervalId);
      this.intervalId = 0;
    }

    this.root.style.display = 'none';
    this.filler.style.transitionDuration = '0s';
    this.filler.style.width = '0';
  }
}
