import Dialog from './dialog.mjs';

const html = /*html*/ `
<div class="confirm-dialog dialog-overlay">
  <div class="dialog">
    <span data-span-message>The whole prompt will be clear. Are you sure?</span>
    <div class="buttons">
      <button type="button" data-btn-yes>YES</button>
      <button type="button" data-btn-no>NO</button>
    </div>
  </div>
</div>
`;

const css = /*css*/ `
.confirm-dialog [data-span-message] {
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
`;

export default class ConfirmDialog extends Dialog {
  /** @type {ConfirmDialog} */
  static _instance;

  static get instance() {
    return ConfirmDialog._instance;
  }

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

  constructor(/** @type {HTMLElement} */ root) {
    super(root, html, css, true);
    ConfirmDialog._instance = this;

    this.message = this.root.querySelector('[data-span-message]');
    this.yesButton = this.root.querySelector('[data-btn-yes]');
    this.noButton = this.root.querySelector('[data-btn-no]');

    this.yesButton.addEventListener('click', () => {
      if (this._onYes) this._onYes();
      this.hide();
    });

    this.noButton.addEventListener('click', () => {
      if (this._onNo) this._onNo();
      this.hide();
    });

    this._onOverlayClick = () => {
      this.noButton.click();
    };
  }

  /**
   * @param {string} message
   * @param {() => void} onYes
   * @param {() => void} onNo
   */
  show(message, onYes, onNo) {
    this._show();

    this.message.innerText = message;
    this._onYes = onYes;
    this._onNo = onNo;
  }

  hide() {
    this._hide();
  }
}
