import AppConfig from '../types/app-config.mjs';
import Component from './component.mjs';
import Dialog from './dialog.mjs';
import autoResize from '../utils/autoResize.mjs';
import ConfirmDialog from './confirm-dialog.mjs';

const html = /*html*/ `
<div class="prompt-clipboard-dialog dialog-overlay">
  <div class="dialog">
    <div class="title">
      <span>CLIPBOARD</span>
      <button data-btn-close class="icon-button" title="Close">
        <img src="/img/xmark-solid.svg"/>
      </button>
    </div>
    <div class="slots">
    </div>
    <button data-btn-add-current>
      <img src="/img/floppy-disk-solid.svg">
      ADD CURRENT
    </button>
  </div>
</div>
`;

const slotHtml = /*html*/ `
<div class="slot">
  <textarea readonly></textarea>
  <div class="buttons">
    <button data-btn-paste class="icon-button" title="Paste">
      <img src="/img/clipboard-list-solid.svg"/>
    </button>
    <button data-btn-save class="icon-button" title="Copy from current">
      <img src="/img/floppy-disk-solid-white.svg"/>
    </button>
    <button data-btn-delete class="icon-button" title="Delete">
      <img src="/img/trash-solid-white.svg"/>
    </button>
  </div>
</div>
`;

const css = /*css*/ `
.prompt-clipboard-dialog .title {
  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
  align-content: center;
  width: 100%;
  height: 2.5rem;
}

.prompt-clipboard-dialog .title span {
  margin: auto 0;
  padding-left: 1rem;
}

.prompt-clipboard-dialog .slots {
  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-start;
  align-items: center;
  gap: 0.5rem;
  max-height: 70vh;
  padding: 0.5rem;
  overflow-y: scroll;
}

.prompt-clipboard-dialog .slot {
  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-start;
  align-items: flex-start;
  gap: 0.5rem;
  width: 100%;
}

.prompt-clipboard-dialog .slot textarea {
  width: calc(100% - 3rem);
  border: 1px solid hsla(0, 0%, 100%, 0.5);
  min-height: 7.5rem;
  font-size: 0.8rem;
}

.prompt-clipboard-dialog .slot .buttons {
  width: 2.5rem;
  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-start;
  align-items: center;
}

.prompt-clipboard-dialog [data-btn-add-current] {
  margin: 0.5rem;
}
`;

class Slot extends Component {
  /** @type {HTMLTextAreaElement} */
  content;

  /** @type {HTMLButtonElement} */
  pasteButton;
  /** @type {HTMLButtonElement} */
  saveButton;
  /** @type {HTMLButtonElement} */
  deleteButton;

  /** @type {(value: string) => void} */
  onPaste;
  /** @type {(slot: Slot) => void} */
  onSave;
  /** @type {(slot: Slot) => void} */
  onDelete;

  index = -1;

  /**
   * @param {HTMLElement} parent
   * @param {string} value
   */
  constructor(parent, index, value) {
    super(parent, slotHtml, '', false);
    this.index = index;

    this.content = this.root.querySelector('textarea');
    this.pasteButton = this.root.querySelector('[data-btn-paste]');
    this.saveButton = this.root.querySelector('[data-btn-save]');
    this.deleteButton = this.root.querySelector('[data-btn-delete]');

    this.pasteButton.addEventListener('click', () => {
      this.onPaste(this.content.value);
    });

    this.saveButton.addEventListener('click', () => {
      this.onSave(this);
    });

    this.deleteButton.addEventListener('click', () => {
      this.onDelete(this);
    });

    this.updateContent(value);
  }

  updateContent(value) {
    this.content.value = value;
    setTimeout(() => {
      autoResize(this.content);
    }, 1);

    this.pasteButton.style.display = value != '' ? '' : 'none';
    this.deleteButton.style.display = value != '' ? '' : 'none';
  }
}

export default class PromptClipboardDialog extends Dialog {
  /** @type {PromptClipboardDialog} */
  static _instance;

  static get instance() {
    return PromptClipboardDialog._instance;
  }

  /** @type {HTMLButtonElement} */
  closeButton;

  /** @type {HTMLElement} */
  slotContainer;

  /** @type {HTMLButtonElement} */
  addCurrentButton;

  /** @type {Slot[]} */
  slots = [];

  _addCurrent;

  /**
   * @param {HTMLElement} parent
   */
  constructor(parent) {
    super(parent, html, css, true);
    PromptClipboardDialog._instance = this;

    this.closeButton = this.root.querySelector('[data-btn-close]');
    this.slotContainer = this.root.querySelector('.slots');
    this.addCurrentButton = this.root.querySelector('[data-btn-add-current]');

    this._onOverlayClick = this.hide.bind(this);
    this.closeButton.addEventListener('click', () => {
      this.hide();
    });

    this.addCurrentButton.addEventListener('click', () => {
      this._addCurrent();
    });
  }

  /**
   * @param {boolean} isNegative
   * @param {string} currentValue
   * @param {(value: string) => void} onPaste
   */
  show(isNegative, currentValue, onPaste) {
    this._show();

    this._isNegative = isNegative;
    this._currentValue = currentValue;

    const clipboard = isNegative
      ? AppConfig.instance.negativePromptClipboard
      : AppConfig.instance.promptClipboard;

    this.slotContainer.innerHTML = '';
    this.slots.splice(0);

    const createSlot = (value) => {
      const slot = new Slot(this.slotContainer, this.slots.length, value);
      this.slots.push(slot);

      slot.onPaste = (value) => {
        if (currentValue != '') {
          ConfirmDialog.instance.show('Overwrite current prompt?', () => {
            onPaste(value);
          });
        } else {
          onPaste(value);
        }
        this.hide();
      };
      slot.onSave = (slot) => {
        if (currentValue.trim() == '') return;

        const fSave = () => {
          if (isNegative) {
            AppConfig.instance.updateNegativePromptClipboard(slot.index, currentValue);
          } else {
            AppConfig.instance.updatePromptClipboard(slot.index, currentValue);
          }
          slot.updateContent(currentValue);
        };
        if (clipboard[slot.index] != '' && clipboard[slot.index] != currentValue) {
          ConfirmDialog.instance.show(
            'Current prompt will overwrite this slot.\nAre you sure?',
            fSave
          );
        } else {
          fSave();
        }
      };
      slot.onDelete = (slot) => {
        ConfirmDialog.instance.show('This slot will be permanently removed.\nAre you sure?', () => {
          if (isNegative) {
            AppConfig.instance.updateNegativePromptClipboard(slot.index, null);
          } else {
            AppConfig.instance.updatePromptClipboard(slot.index, null);
          }
          this.slotContainer.removeChild(slot.root);
          this.slots.splice(slot.index, 1);
          for (let i = slot.index; i < this.slots.length; ++i) {
            --this.slots[i].index;
          }
        });
      };
    };

    clipboard.forEach((value) => {
      createSlot(value);
    });

    this._addCurrent = () => {
      if (currentValue.trim() == '') return;

      if (isNegative) {
        AppConfig.instance.updateNegativePromptClipboard(this.slots.length, currentValue);
      } else {
        AppConfig.instance.updatePromptClipboard(this.slots.length, currentValue);
      }

      createSlot(currentValue);
    };
  }

  hide() {
    this._hide();
  }
}
