import Api from '../api.mjs';
import AppConfig from '../types/app-config.mjs';
import Tab from './tab.mjs';

const html = /*html*/ `
<div id="settings-tab" class="app-tab" style="display: none">
  <div class="sections">
    <div class="section">
      <span class="title">Backend URL</span>
      <span>Enter your backend URL and press SAVE to start using the app:</span>
      <input type="url" class="w100p txt-url" />
      <input type="text" class="w50p txt-username" placeholder="username" />
      <input type="password" class="w50p txt-password" placeholder="password" />
      <button type="button" class="w100p btn-save">SAVE</button>
      <span class="clickable-text btn-instructions">Instructions</span>
    </div>
    <div class="section">
      <span class="title">Reload</span>
      <span>Reload the entire app to fetch updates:</span>
      <button type="button" class="w100p btn-reload">RELOAD APP</button>
    </div>
  </div>

  <style>
    #settings-tab .sections {
      width: 100%;
      display: flex;
      flex-flow: column nowrap;
      align-items: flex-start;
      justify-content: flex-start;
      row-gap: 0.5rem;
      max-width: 720px;
    }

    #settings-tab .section {
      position: relative;
      width: 100%;
      display: flex;
      flex-flow: row wrap;
      align-items: flex-start;
      justify-content: flex-start;
      row-gap: 0.5rem;
      padding: 1.5rem 0.5rem 0.5rem 0.5rem;
      margin-top: 1rem;
      border: 1px solid hsla(0, 0%, 100%, 0.5);
      border-radius: 0.5rem;
    }

    #settings-tab .section .title {
      position: absolute;
      left: 1rem;
      top: -1rem;
      height: 2rem;
      background-color: #000;
      border: 1px solid hsla(0, 0%, 100%, 0.5);
      border-radius: 0.5rem;
      padding: 0.5rem;
      display: flex;
      flex-flow: row nowrap;
      align-items: center;
    }

    #settings-tab .txt-username {
      border-top-right-radius: 0;
      border-bottom-right-radius: 0;
    }

    #settings-tab .txt-password {
      border-top-left-radius: 0;
      border-bottom-left-radius: 0;
    }

    #settings-tab .clickable-text {
      margin: 0 auto;
    }
  </style>
</div>
`;

export default class Settings extends Tab {
  /** @type {HTMLInputElement} */
  urlInput;
  /** @type {HTMLInputElement} */
  usernameInput;
  /** @type {HTMLInputElement} */
  passwordInput;

  /** @type {HTMLButtonElement} */
  saveButton;
  /** @type {HTMLButtonElement} */
  reloadButton;

  /** @type {()=>void} */
  onSave = null;
  /** @type {()=>void} */
  onRequestInstructions = null;

  get url() {
    return this.urlInput.value;
  }

  constructor(/** @type {HTMLElement} */ parent) {
    super(parent, html);
    this.title = 'SETTINGS';
    this.urlInput = this.root.querySelector('.txt-url');
    this.usernameInput = this.root.querySelector('.txt-username');
    this.passwordInput = this.root.querySelector('.txt-password');
    this.urlInput.value = AppConfig.instance.apiUrl;
    this.usernameInput.value = AppConfig.instance.username;
    this.passwordInput.value = AppConfig.instance.password;

    /** @type {HTMLButtonElement} */
    this.saveButton = this.root.querySelector('.btn-save');
    this.saveButton.addEventListener('click', async () => {
      this.setLoading(true);
      const err = await Api.instance.connect(
        this.urlInput.value,
        this.usernameInput.value,
        this.passwordInput.value
      );
      this.setLoading(false);
      if (err) {
        window.alert('Failed to connect.');
      } else {
        this.onSave();
      }
    });

    this.root.querySelector('.btn-instructions').addEventListener('click', () => {
      this.onRequestInstructions();
    });

    /** @type {HTMLButtonElement} */
    this.reloadButton = this.root.querySelector('.btn-reload');
    this.reloadButton.addEventListener('click', () => {
      window.location.reload();
    });
  }

  setLoading(isLoading) {
    this.urlInput.disabled = isLoading;
    this.usernameInput.disabled = isLoading;
    this.passwordInput.disabled = isLoading;
    this.saveButton.disabled = isLoading;
    this.reloadButton.disabled = isLoading;
  }
}
