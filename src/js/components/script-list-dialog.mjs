import Api from '../api.mjs';
import AppConfig from '../types/app-config.mjs';
import Component from './component.mjs';
import Dialog from './dialog.mjs';

const html = /*html*/ `
<div class="script-list-dialog dialog-overlay">
  <div class="dialog">
    <div class="small-buttons">
      <button data-btn-refresh type="button" class="icon-button" title="Refresh lists">
        <img src="/img/rotate-solid.svg">
      </button>
      <button data-btn-close type="button" class="icon-button" title="Close">
        <img src="/img/xmark-solid.svg">
      </button>
    </div>
    <input data-chk-txt2img type="radio" id="chk-txt2img" name="extra-network-tab" checked>
    <input data-chk-img2img type="radio" id="chk-img2img" name="extra-network-tab">
    <div class="tab-buttons">
      <div class="tab-button">
        <label for="chk-txt2img">Txt2Img</label>
      </div>
      <div class="tab-button">
        <label for="chk-img2img">Img2Img</label>
      </div>
    </div>
    <div class="tab-pages">
      <div data-txt2img-list class="tab-page">
        <div class="list">
        </div>
      </div>
      <div data-img2img-list class="tab-page">
        <div class="list">
        </div>
      </div>
    </div>
  </div>
</div>
`;

const css = /*css*/ `
.script-list-dialog .small-buttons {
  position: absolute;
  right: 0;
  top: 0;
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
}

.script-list-dialog .tab-buttons {
  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-start;
  align-items: flex-end;
  padding: 0.5rem 0 0 0.5rem;
  gap: 0.25rem;
}

.script-list-dialog .tab-button {
  display: flex;
  flex-flow: row nowrap;
}

.script-list-dialog input[type='radio'] {
  display: none;
}

.script-list-dialog .tab-button label {
  border: 1px solid hsla(0, 0%, 100%, 0.5);
  border-bottom: none;
  border-radius: 0.5rem 0.5rem 0 0;
  padding: 0.5rem;
  position: relative;
}

.script-list-dialog [data-chk-txt2img]:not(:checked) ~ .tab-buttons .tab-button label[for='chk-txt2img'],
.script-list-dialog [data-chk-img2img]:not(:checked) ~ .tab-buttons .tab-button label[for='chk-img2img'] {
  background-color: hsl(0, 0%, 0%);
}

.script-list-dialog [data-chk-txt2img]:checked ~ .tab-buttons .tab-button label[for='chk-txt2img'],
.script-list-dialog [data-chk-img2img]:checked ~ .tab-buttons .tab-button label[for='chk-img2img'] {
  background-color: hsl(0, 0%, 15%);
}

.script-list-dialog [data-chk-txt2img]:checked ~ .tab-buttons .tab-button label[for='chk-txt2img']::after,
.script-list-dialog [data-chk-img2img]:checked ~ .tab-buttons .tab-button label[for='chk-img2img']::after {
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
  .script-list-dialog [data-chk-txt2img]:not(:checked) ~ .tab-buttons .tab-button label[for='chk-txt2img']:hover,
  .script-list-dialog [data-chk-img2img]:not(:checked) ~ .tab-buttons .tab-button label[for='chk-img2img']:hover {
    background-color: hsl(0, 0%, 15%);
  }
}

.script-list-dialog .tab-page {
  border-top: 1px solid hsla(0, 0%, 100%, 0.5);
  padding: 0.5rem;
  min-height: 20rem;
  max-height: 70vh;
  background-color: hsl(0, 0%, 15%);
  overflow-y: scroll;
}

.script-list-dialog .tab-page .list {
  display: flex;
  flex-flow: row wrap;
  justify-content: space-evenly;
  align-items: center;
  gap: 0.5rem;
}

.script-list-dialog .tab-page .list::after {
  content: '';
  flex-grow: 999;
}

.script-list-dialog .tab-page .list .item {
  border: 1px solid hsla(0, 0%, 100%, 0.5);
  border-radius: 0.5rem;
  background-color: hsl(0, 0%, 10%);
  color: hsl(0, 0%, 100%);
  padding: 0.5rem;
  cursor: pointer;
  flex-grow: 1;
}

@supports not (-webkit-touch-callout: none) {
  .script-list-dialog .tab-page .list .item:hover {
    background-color: hsl(0, 0%, 20%);
  }
}

.script-list-dialog [data-chk-txt2img]:checked ~ .tab-pages [data-txt2img-list],
.script-list-dialog [data-chk-img2img]:checked ~ .tab-pages [data-img2img-list] {
  display: block;
}

.script-list-dialog [data-chk-txt2img]:not(:checked) ~ .tab-pages [data-txt2img-list],
.script-list-dialog [data-chk-img2img]:not(:checked) ~ .tab-pages [data-img2img-list] {
  display: none;
}
`;

export default class ScriptListDialog extends Dialog {
  /** @type {ScriptListDialog} */
  static _instance;

  static get instance() {
    return ScriptListDialog._instance;
  }

  /** @type {HTMLButtonElement} */
  closeButton;
  /** @type {HTMLButtonElement} */
  refreshButton;

  /** @type {HTMLInputElement} */
  txt2imgRadio;
  /** @type {HTMLInputElement} */
  img2imgRadio;

  /** @type {HTMLDivElement} */
  txt2imgList;

  /** @type {HTMLDivElement} */
  img2imgList;

  _hasFilledLists = false;
  _isLoading = false;

  /** @type {(scriptName: string) => void} */
  _onSelectTxt2Img;
  /** @type {(scriptName: string) => void} */
  _onSelectImg2Img;

  /**
   * @param {HTMLElement} parent
   */
  constructor(parent) {
    super(parent, html, css, true);
    ScriptListDialog._instance = this;

    this.closeButton = this.root.querySelector('[data-btn-close]');
    this.refreshButton = this.root.querySelector('[data-btn-refresh]');

    this.txt2imgRadio = this.root.querySelector('[data-chk-txt2img]');
    this.img2imgRadio = this.root.querySelector('[data-chk-img2img]');

    this.txt2imgList = this.root.querySelector('[data-txt2img-list]');
    this.img2imgList = this.root.querySelector('[data-img2img-list]');

    this.closeButton.addEventListener('click', () => {
      this.hide();
    });

    this._onOverlayClick = this.hide.bind(this);

    this.refreshButton.addEventListener('click', async () => {
      this.setLoading(true);
      try {
        const hasRefreshedScripts = await Api.instance.refreshScripts();
        if (hasRefreshedScripts) {
          this._refillTxt2Img();
          this._refillImg2Img();
        }
      } finally {
        this.setLoading(false);
      }
    });
  }

  /**
   * @param {boolean} isImg2Img
   * @param {(scriptName: string) => void} onSelectTxt2Img
   * @param {(scriptName: string) => void} onSelectImg2Img
   */
  show(isImg2Img, onSelectTxt2Img, onSelectImg2Img) {
    this._show();

    this._onSelectTxt2Img = onSelectTxt2Img;
    this._onSelectImg2Img = onSelectImg2Img;

    if (!this._hasFilledLists) {
      this._refillTxt2Img();
      this._refillImg2Img();
      this._hasFilledLists = true;
    }

    if (isImg2Img) {
      this.img2imgRadio.checked = true;
    } else {
      this.txt2imgRadio.checked = true;
    }
  }

  hide() {
    if (this._isLoading) return;
    this._hide();
  }

  setLoading(isLoading) {
    this.refreshButton.disabled = isLoading;
    this.closeButton.disabled = isLoading;
    this._isLoading = isLoading;
  }

  _refillTxt2Img() {
    const container = this.txt2imgList.querySelector('.list');
    container.innerHTML = '';
    const itemHtml = /*html*/ `<button class="item"></button>`;
    AppConfig.instance.txt2imgScriptList.forEach((scriptName) => {
      const item = Component.fromHTML(itemHtml);
      item.innerText = scriptName;
      container.appendChild(item);
      item.addEventListener('click', () => {
        if (this._isLoading) return;
        this._onSelectTxt2Img(scriptName);
        this.hide();
      });
    });
  }

  _refillImg2Img() {
    const container = this.img2imgList.querySelector('.list');
    container.innerHTML = '';
    const itemHtml = /*html*/ `<button class="item"></button>`;
    AppConfig.instance.img2imgScriptList.forEach((scriptName) => {
      const item = Component.fromHTML(itemHtml);
      item.innerText = scriptName;
      container.appendChild(item);
      item.addEventListener('click', () => {
        if (this._isLoading) return;
        this._onSelectImg2Img(scriptName);
        this.hide();
      });
    });
  }
}
