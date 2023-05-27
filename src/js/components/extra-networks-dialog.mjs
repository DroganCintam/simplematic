import Api from '../api.mjs';
import AppConfig from '../types/app-config.mjs';
import Component from './component.mjs';

const overlayBgOff = 'hsla(0, 0%, 0%, 0)';
const overlayBgOn = 'hsla(0, 0%, 0%, 0.7)';

const html = /*html*/ `
<div class="extra-networks-dialog">
  <div class="dialog">
    <div class="small-buttons">
      <button data-btn-refresh type="button" class="icon-button" title="Refresh lists">
        <img src="/img/rotate-solid.svg">
      </button>
      <button data-btn-close type="button" class="icon-button" title="Close">
        <img src="/img/xmark-solid.svg">
      </button>
    </div>
    <input data-chk-lora type="radio" id="chk-lora" name="extra-network-tab" checked>
    <input data-chk-ti type="radio" id="chk-ti" name="extra-network-tab">
    <div class="tab-buttons">
      <div class="tab-button">
        <label for="chk-lora">LORA</label>
      </div>
      <div class="tab-button">
        <label for="chk-ti">Textual Inversion</label>
      </div>
    </div>
    <div class="tab-pages">
      <div data-lora-list class="tab-page">
        <div class="list">
        </div>
      </div>
      <div data-ti-list class="tab-page">
        <div class="list">
        </div>
      </div>
    </div>
  </div>
</div>
`;

const css = /*css*/ `
.extra-networks-dialog {
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

.extra-networks-dialog .dialog {
  width: 40ch;
  max-width: calc(100vw - 2rem);
  background-color: hsla(0, 0%, 0%, 0.5);
  color: hsl(0, 0%, 100%);
  border: 1px solid hsla(0, 0%, 100%, 0.5);
  border-radius: 0.5rem;
  display: flex;
  flex-flow: column nowrap;
  transition: opacity 0.2s ease-out;
  position: relative;
}

.extra-networks-dialog .small-buttons {
  position: absolute;
  right: 0;
  top: 0;
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
}

.extra-networks-dialog .tab-buttons {
  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-start;
  align-items: flex-end;
  padding: 0.5rem 0 0 0.5rem;
  gap: 0.25rem;
}

.extra-networks-dialog .tab-button {
  display: flex;
  flex-flow: row nowrap;
}

.extra-networks-dialog input[type='radio'] {
  display: none;
}

.extra-networks-dialog .tab-button label {
  border: 1px solid hsla(0, 0%, 100%, 0.5);
  border-bottom: none;
  border-radius: 0.5rem 0.5rem 0 0;
  padding: 0.5rem;
  position: relative;
}

.extra-networks-dialog [data-chk-lora]:not(:checked) ~ .tab-buttons .tab-button label[for='chk-lora'],
.extra-networks-dialog [data-chk-ti]:not(:checked) ~ .tab-buttons .tab-button label[for='chk-ti'] {
  background-color: hsl(0, 0%, 0%);
}

.extra-networks-dialog [data-chk-lora]:checked ~ .tab-buttons .tab-button label[for='chk-lora'],
.extra-networks-dialog [data-chk-ti]:checked ~ .tab-buttons .tab-button label[for='chk-ti'] {
  background-color: hsl(0, 0%, 15%);
}

.extra-networks-dialog [data-chk-lora]:checked ~ .tab-buttons .tab-button label[for='chk-lora']::after,
.extra-networks-dialog [data-chk-ti]:checked ~ .tab-buttons .tab-button label[for='chk-ti']::after {
  content: '';
  position: absolute;
  width: 100%;
  height: 2px;
  left: 0;
  bottom: -1px;
  display: block;
  background-color: hsl(0, 0%, 15%);
}

@supports not (-webkit-touch-callout: none) {
  .extra-networks-dialog [data-chk-lora]:not(:checked) ~ .tab-buttons .tab-button label[for='chk-lora']:hover,
  .extra-networks-dialog [data-chk-ti]:not(:checked) ~ .tab-buttons .tab-button label[for='chk-ti']:hover {
    background-color: hsl(0, 0%, 15%);
  }
}

.extra-networks-dialog .tab-page {
  border-top: 1px solid hsla(0, 0%, 100%, 0.5);
  padding: 0.5rem;
  min-height: 20rem;
  max-height: 70vh;
  background-color: hsl(0, 0%, 15%);
  overflow-y: scroll;
}

.extra-networks-dialog .tab-page .list {
  display: flex;
  flex-flow: row wrap;
  justify-content: space-evenly;
  align-items: center;
  gap: 0.5rem;
}

.extra-networks-dialog .tab-page .list .item {
  border: 1px solid hsla(0, 0%, 100%, 0.5);
  border-radius: 0.5rem;
  background-color: hsl(0, 0%, 10%);
  color: hsl(0, 0%, 100%);
  padding: 0.5rem;
  cursor: pointer;
}

@supports not (-webkit-touch-callout: none) {
  .extra-networks-dialog .tab-page .list .item:hover {
    background-color: hsl(0, 0%, 20%);
  }
}

.extra-networks-dialog [data-chk-lora]:checked ~ .tab-pages [data-lora-list],
.extra-networks-dialog [data-chk-ti]:checked ~ .tab-pages [data-ti-list] {
  display: block;
}

.extra-networks-dialog [data-chk-lora]:not(:checked) ~ .tab-pages [data-lora-list],
.extra-networks-dialog [data-chk-ti]:not(:checked) ~ .tab-pages [data-ti-list] {
  display: none;
}
`;

export default class ExtraNetworksDialog extends Component {
  /** @type {ExtraNetworksDialog} */
  static _instance;

  static get instance() {
    return ExtraNetworksDialog._instance;
  }

  /** @type {HTMLElement} */
  overlay;

  /** @type {HTMLElement} */
  dialog;

  /** @type {HTMLButtonElement} */
  closeButton;
  /** @type {HTMLButtonElement} */
  refreshButton;

  /** @type {HTMLDivElement} */
  loraList;

  /** @type {HTMLDivElement} */
  tiList;

  /** @type {number | null} */
  hidingTimeoutId = null;

  hasFilledLists = false;
  isShowing = false;
  isLoading = false;

  /** @type {(lora: string) => void} */
  onSelectLORA;
  /** @type {(ti: string) => void} */
  onSelectTI;

  /**
   * @param {HTMLElement} parent
   */
  constructor(parent) {
    super(parent, html, css, true);
    ExtraNetworksDialog._instance = this;

    this.overlay = this.root;
    this.dialog = this.root.querySelector('.dialog');
    this.closeButton = this.root.querySelector('[data-btn-close]');
    this.refreshButton = this.root.querySelector('[data-btn-refresh]');

    this.loraList = this.root.querySelector('[data-lora-list]');
    this.tiList = this.root.querySelector('[data-ti-list]');

    this.overlay.style.display = 'none';
    this.overlay.style.backgroundColor = overlayBgOff;
    this.dialog.style.opacity = '0';

    this.overlay.addEventListener('click', (e) => {
      if (e.target !== this.overlay) return;
      this.hide();
    });

    this.closeButton.addEventListener('click', () => {
      this.hide();
    });

    this.refreshButton.addEventListener('click', async () => {
      this.setLoading(true);
      try {
        const hasRefreshedLORAs = await Api.instance.refreshLORAs();
        if (hasRefreshedLORAs) {
          this._refillLORAs();
        }
        const hasRefreshedTIs = await Api.instance.refreshTIs();
        if (hasRefreshedTIs) {
          this._refillTIs();
        }
      } finally {
        this.setLoading(false);
      }
    });
  }

  /**
   * @param {(lora: string) => void} onSelectLORA
   * @param {(ti: string) => void} onSelectTI
   */
  show(onSelectLORA, onSelectTI) {
    if (this.hidingTimeoutId) {
      clearTimeout(this.hidingTimeoutId);
      this.hidingTimeoutId = null;
    }

    this.overlay.style.display = '';
    this.overlay.style.backgroundColor = overlayBgOn;
    this.dialog.style.opacity = '1';

    this.isShowing = true;

    this.onSelectLORA = onSelectLORA;
    this.onSelectTI = onSelectTI;

    if (!this.hasFilledLists) {
      this._refillLORAs();
      this._refillTIs();
      this.hasFilledLists = true;
    }
  }

  hide() {
    if (this.isLoading) return;

    this.overlay.style.backgroundColor = overlayBgOff;
    this.dialog.style.opacity = '0';
    this.hidingTimeoutId = setTimeout(() => {
      this.overlay.style.display = 'none';
    }, 200);

    this.isShowing = false;
  }

  setLoading(isLoading) {
    this.refreshButton.disabled = isLoading;
    this.closeButton.disabled = isLoading;
    this.isLoading = isLoading;
  }

  _refillLORAs() {
    const container = this.loraList.querySelector('.list');
    container.innerHTML = '';
    const itemHtml = /*html*/ `<button class="item"></button>`;
    AppConfig.instance.loraList.forEach((lora) => {
      const item = Component.fromHTML(itemHtml);
      item.innerText = lora;
      container.appendChild(item);
      item.addEventListener('click', () => {
        if (this.isLoading) return;
        this.onSelectLORA(lora);
        this.hide();
      });
    });
  }

  _refillTIs() {
    const container = this.tiList.querySelector('.list');
    container.innerHTML = '';
    const itemHtml = /*html*/ `<button class="item"></button>`;
    AppConfig.instance.tiList.forEach((ti) => {
      const item = Component.fromHTML(itemHtml);
      item.innerText = ti;
      container.appendChild(item);
      item.addEventListener('click', () => {
        if (this.isLoading) return;
        this.onSelectTI(ti);
        this.hide();
      });
    });
  }
}
