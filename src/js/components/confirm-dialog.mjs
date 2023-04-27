import Component from './component.mjs';

const overlayBgOff = 'hsla(0, 0%, 0%, 0)';
const overlayBgOn = 'hsla(0, 0%, 0%, 0.7)';

const html = /*html*/ `
<div class="confirm-dialog">
  <div class="dialog">
    <span class="message">The whole prompt will be clear. Are you sure?</span>
    <div class="buttons">
      <button type="button" class="btn-yes">YES</button>
      <button type="button" class="btn-no">NO</button>
    </div>
  </div>

  <style>
    .confirm-dialog {
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

    .confirm-dialog .dialog {
      width: 40ch;
      max-width: calc(100vw - 2rem);
      background-color: hsla(0, 0%, 0%, 0.8);
      color: hsl(0, 0%, 100%);
      border: 1px solid hsla(0, 0%, 100%, 0.5);
      border-radius: 0.5rem;
      display: flex;
      flex-flow: column nowrap;
      transition: opacity 0.2s ease-out;
    }

    .confirm-dialog .message {
      padding: 1rem;
      text-align: center;
    }

    .confirm-dialog .buttons {
      display: flex;
      flex-flow: row nowrap;
      justify-content: center;
      align-items: center;
    }

    .confirm-dialog .buttons button {
      flex-grow: 1;
      border: 1px solid hsla(0, 0%, 100%, 0.5);
      border-bottom: none;
      background: hsla(0, 0%, 100%, 0.1);
      color: hsl(0, 0%, 100%);
    }

    @supports not (-webkit-touch-callout: none) {
      .confirm-dialog .buttons button:hover {
        background-color: hsla(0, 0%, 100%, 0.2);
      }
    }

    .confirm-dialog .buttons button:first-child {
      border-left: none;
    }

    .confirm-dialog .buttons button:last-child {
      border-right: none;
    }
  </style>
</div>
`;

export default class ConfirmDialog extends Component {
  /** @type {ConfirmDialog} */
  static _instance;

  static get instance() {
    return ConfirmDialog._instance;
  }

  /** @type {HTMLElement} */
  overlay;

  /** @type {HTMLElement} */
  dialog;

  /** @type {HTMLSpanElement} */
  message;

  /** @type {HTMLButtonElement} */
  yesButton;
  /** @type {HTMLButtonElement} */
  noButton;

  /** @type {() => void} */
  _onYes;
  /** @type {() => void} */
  _onNo;

  /** @type {number | null} */
  hidingTimeoutId = null;

  isShowing = false;

  constructor(/** @type {HTMLElement} */ root) {
    super(root, html, true);
    ConfirmDialog._instance = this;

    this.overlay = this.root;
    this.dialog = this.root.querySelector('.dialog');
    this.message = this.root.querySelector('.message');
    this.yesButton = this.root.querySelector('.btn-yes');
    this.noButton = this.root.querySelector('.btn-no');

    this.overlay.style.display = 'none';
    this.overlay.style.backgroundColor = overlayBgOff;
    this.dialog.style.opacity = '0';

    this.yesButton.addEventListener('click', () => {
      if (this._onYes) this._onYes();
      this.hide();
    });

    this.noButton.addEventListener('click', () => {
      if (this._onNo) this._onNo();
      this.hide();
    });

    this.overlay.addEventListener('click', () => {
      this.noButton.click();
    });
  }

  /**
   * @param {string} message
   * @param {() => void} onYes
   * @param {() => void} onNo
   */
  show(message, onYes, onNo) {
    if (this.hidingTimeoutId) {
      clearTimeout(this.hidingTimeoutId);
      this.hidingTimeoutId = null;
    }

    this.message.innerText = message;
    this._onYes = onYes;
    this._onNo = onNo;

    this.overlay.style.display = '';
    this.overlay.style.backgroundColor = overlayBgOn;
    this.dialog.style.opacity = '1';

    this.isShowing = true;
  }

  hide() {
    this.overlay.style.backgroundColor = overlayBgOff;
    this.dialog.style.opacity = '0';
    this.hidingTimeoutId = setTimeout(() => {
      this.overlay.style.display = 'none';
    }, 200);

    this.isShowing = false;
  }
}
