import StylePool from '../style-pool.mjs';
import Component from './component.mjs';

const overlayBgOff = 'hsla(0, 0%, 0%, 0)';
const overlayBgOn = 'hsla(0, 0%, 0%, 0.7)';

const baseCss = /*css*/ `
.dialog-overlay {
  left: 0;
  top: 0;
  width: 100vw;
  height: 100vh;
  position: fixed;
  display: flex;
  flex-flow: row nowrap;
  justify-content: center;
  align-items: center;
  background-color: ${overlayBgOff};
  z-index: 9999;
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
  transition: background-color 0.2s ease-out;
}

.dialog-overlay .dialog {
  width: 40ch;
  max-width: calc(100vw - 2rem);
  background-color: hsla(0, 0%, 0%, 0.8);
  color: hsl(0, 0%, 100%);
  border: 1px solid hsla(0, 0%, 100%, 0.5);
  border-radius: 0.5rem;
  display: flex;
  flex-flow: column nowrap;
  transition: opacity 0.2s ease-out;
  position: relative;
}
`;

export default class Dialog extends Component {
  /** @type {HTMLElement} */
  overlay;
  /** @type {HTMLElement} */
  dialog;

  /** @type {number | null} */
  hidingTimeoutId = null;
  isShowing = false;

  /** @type {(() => void) | null} */
  _onOverlayClick = null;

  constructor(parent, html, css) {
    StylePool.instance.addStyles('$dialog', baseCss);
    super(parent, html, css, true);

    this.overlay = this.root;
    this.dialog = this.root.querySelector('.dialog');

    this.overlay.style.display = 'none';
    this.overlay.style.backgroundColor = overlayBgOff;
    this.dialog.style.opacity = '0';

    this.overlay.addEventListener('click', (e) => {
      if (e.target !== this.overlay) return;
      if (this._onOverlayClick) {
        this._onOverlayClick();
      }
    });
  }

  _show() {
    if (this.hidingTimeoutId) {
      clearTimeout(this.hidingTimeoutId);
      this.hidingTimeoutId = null;
    }

    this.overlay.style.display = '';
    this.overlay.style.backgroundColor = overlayBgOn;
    this.dialog.style.opacity = '1';

    this.isShowing = true;
  }

  _hide() {
    this.overlay.style.backgroundColor = overlayBgOff;
    this.dialog.style.opacity = '0';
    this.hidingTimeoutId = setTimeout(() => {
      this.overlay.style.display = 'none';
    }, 200);

    this.isShowing = false;
  }
}
