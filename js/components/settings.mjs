import Api from '../api.mjs';
import AppConfig from '../types/app-config.mjs';
import Tab from './tab.mjs';

const html = /*html*/ `
<div id="settings-tab" class="app-tab" style="display: none">
  <div>
    <div>
      <span>Enter your backend URL and press SAVE to start using the app:</span>
      <input class="w100p" id="url-input" type="url" />
      <input class="w50p" id="username-input" type="text" placeholder="username" />
      <input class="w50p" id="password-input" type="password" placeholder="password" />
      <button class="w100p" id="save-button" type="button">SAVE</button>
      <span id="instructions-link" class="clickable-text">Instructions</span>
    </div>
    <div>
      <span>Reload the entire app to fetch updates:</span>
      <button class="w100p" id="reload-button" type="button">RELOAD APP</button>
    </div>
  </div>

  <style>
    #settings-tab > div {
      width: 100%;
      display: flex;
      flex-flow: column nowrap;
      align-items: flex-start;
      justify-content: flex-start;
      row-gap: 0.5rem;
      max-width: 720px;
    }

    #settings-tab > div > div {
      width: 100%;
      display: flex;
      flex-flow: row wrap;
      align-items: flex-start;
      justify-content: flex-start;
      row-gap: 0.5rem;
      margin-bottom: 1rem;
      padding-bottom: 1rem;
    }

    #settings-tab input {
      padding: 0.5rem;
      background-color: rgba(0, 0, 0, 0.5);
      color: hsl(0, 0%, 100%);
      font-family: 'Montserrat';
      font-size: 1rem;
      border: 1px solid rgba(255, 255, 255, 0.5);
      border-radius: 0.5rem;
      resize: none;
    }

    #settings-tab #username-input {
      border-top-right-radius: 0;
      border-bottom-right-radius: 0;
    }

    #settings-tab #password-input {
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
    this.urlInput = this.root.querySelector('#url-input');
    this.usernameInput = this.root.querySelector('#username-input');
    this.passwordInput = this.root.querySelector('#password-input');
    this.urlInput.value = AppConfig.instance.apiUrl;
    this.usernameInput.value = AppConfig.instance.username;
    this.passwordInput.value = AppConfig.instance.password;

    /** @type {HTMLButtonElement} */
    this.saveButton = this.root.querySelector('#save-button');
    this.saveButton.addEventListener('click', async () => {
      this.setLoading(true);
      const err = await Api.instance.connect(this.urlInput.value, this.usernameInput.value, this.passwordInput.value);
      this.setLoading(false);
      if (err) {
        window.alert('Failed to connect.');
      } else {
        this.onSave();
      }
    });

    this.root.querySelector('#instructions-link').addEventListener('click', () => {
      this.onRequestInstructions();
    });

    /** @type {HTMLButtonElement} */
    this.reloadButton = this.root.querySelector('#reload-button');
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
