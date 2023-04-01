import Api from '../api.mjs';
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
      transition: width 0.1s ease-out;
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
      let percentage = ++this.counter / steps;
      if (percentage > 1) percentage = 1;
      this.filler.style.width = `${percentage * 100}%`;
    }, 1);

    this.intervalId = window.setInterval(() => {
      if (this.counter >= steps) {
        window.clearInterval(this.intervalId);
        this.intervalId = 0;
      }
      let percentage = ++this.counter / steps;
      if (percentage > 1) percentage = 1;
      this.filler.style.width = `${percentage * 100}%`;
    }, interval);
  }

  runWithApi() {
    if (this.intervalId > 0) {
      window.clearInterval(this.intervalId);
      this.intervalId = 0;
    }

    this.root.style.display = '';
    this.filler.style.transitionDuration = `0.5s`;

    this.intervalId = window.setInterval(() => {
      Api.instance.getProgress().then((progress) => {
        if (progress === null) {
          window.clearInterval(this.intervalId);
          this.intervalId = 0;
          return;
        }
        this.filler.style.width = `${progress * 100}%`;
      });
    }, 2000);
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
