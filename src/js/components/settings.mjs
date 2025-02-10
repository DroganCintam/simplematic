import Api from '../api.mjs';
import BackgroundLoader from '../background-loader.mjs';
import AppConfig from '../types/app-config.mjs';
import Checkbox from './checkbox.mjs';
import ConfirmDialog from './confirm-dialog.mjs';
import ImageUpload from './image-upload.mjs';
import Tab from './tab.mjs';

const html = /*html*/ `
<div id="settings-tab" class="app-tab" style="display: none">
  <div class="sections">
    <div class="section">
      <span class="title">Backend URL</span>
      <span>Enter your backend URL and press SAVE to start using the app:</span>
      <input type="url" class="w100p" data-txt-url />
      <input type="text" class="w50p" data-txt-username placeholder="username" />
      <input type="password" class="w50p" data-txt-password placeholder="password" />
      <button type="button" class="w100p" data-btn-save>SAVE</button>
      <span class="clickable-text" data-btn-instructions>Instructions</span>
    </div>
    <div class="section bg">
      <span class="title">Background image</span>
      <span data-chk-use-default-bg></span>
      <span data-chk-use-custom-bg></span>
      <span data-chk-dimmed-bg></span>
      <span data-custom-bg-upload></span>
      <button type="button" class="w100p" data-btn-save-custom-bg>SAVE BACKGROUND</button>
    </div>
    <div class="section">
      <span class="title">Reload</span>
      <span>Reload the entire app to fetch updates:</span>
      <button type="button" class="w100p" data-btn-reload>RELOAD APP</button>
    </div>
  </div>
</div>
`;

const css = /*css*/ `
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

#settings-tab [data-txt-username] {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}

#settings-tab [data-txt-password]] {
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}

#settings-tab .clickable-text {
  margin: 0 auto;
}

#settings-tab .bg {
  gap: 0.5rem;
}

#settings-tab .bg .image-upload {
  max-height: 10rem;
}

#settings-tab .bg .image-upload img {
  object-fit: contain;
}
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

  /** @type {Checkbox} */
  useDefaultBgCheckbox;
  /** @type {Checkbox} */
  useCustomBgCheckbox;
  /** @type {Checkbox} */
  dimmedBgCheckbox;
  /** @type {ImageUpload} */
  customBgUpload;
  /** @type {HTMLButtonElement} */
  saveBgButton;

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
    super(parent, html, css);
    this.title = 'SETTINGS';
    this.urlInput = this.root.querySelector('[data-txt-url]');
    this.usernameInput = this.root.querySelector('[data-txt-username]');
    this.passwordInput = this.root.querySelector('[data-txt-password]');
    this.urlInput.value = AppConfig.instance.apiUrl;
    this.usernameInput.value = AppConfig.instance.username;
    this.passwordInput.value = AppConfig.instance.password;

    this.useDefaultBgCheckbox = new Checkbox(
      this.root.querySelector('[data-chk-use-default-bg]'),
      {
        assignedId: 'chk-use-default-bg',
        label: 'Use Default Background',
      },
      true
    );
    this.useCustomBgCheckbox = new Checkbox(
      this.root.querySelector('[data-chk-use-custom-bg]'),
      {
        assignedId: 'chk-use-custom-bg',
        label: 'Use Custom Background',
      },
      true
    );
    this.dimmedBgCheckbox = new Checkbox(
      this.root.querySelector('[data-chk-dimmed-bg]'),
      {
        assignedId: 'chk-dimmed-bg',
        label: 'Dimmed Background',
      },
      true
    );
    this.customBgUpload = new ImageUpload(
      this.root.querySelector('[data-custom-bg-upload]'),
      {
        extraClasses: ['w100p'],
      },
      true
    );
    this.customBgUpload.acceptedTypes = 'image/png,image/jpeg';
    this.saveBgButton = this.root.querySelector('[data-btn-save-custom-bg]');

    /** @type {HTMLButtonElement} */
    this.saveButton = this.root.querySelector('[data-btn-save]');
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

    this.root.querySelector('[data-btn-instructions]').addEventListener('click', () => {
      this.onRequestInstructions();
    });

    this.useDefaultBgCheckbox.onChange = (chk) => {
      this.useCustomBgCheckbox.checked = !chk.checked;
      this.customBgUpload.disabled = chk.checked;
    };
    this.useCustomBgCheckbox.onChange = (chk) => {
      this.useDefaultBgCheckbox.checked = !chk.checked;
      this.customBgUpload.disabled = !chk.checked;
    };
    this.dimmedBgCheckbox.onChange = (chk) => {
      BackgroundLoader.instance.setDimmedBackground(chk.checked);
    };
    this.saveBgButton.addEventListener('click', () => {
      if (this.useCustomBgCheckbox.checked && this.customBgUpload.hasImage) {
        const action = async () => {
          await BackgroundLoader.instance.setCustomBackgroundImage(this.customBgUpload.imageData);
          BackgroundLoader.instance.setUsingCustomBackground(true);
        };
        if (BackgroundLoader.instance.hasCustomBackground) {
          ConfirmDialog.instance.show(
            'Previous custom background will be overwritten.\nAre you sure?',
            action
          );
        } else {
          action();
        }
      } else if (this.useDefaultBgCheckbox.checked) {
        BackgroundLoader.instance.setUsingCustomBackground(false);
      }
    });

    /** @type {HTMLButtonElement} */
    this.reloadButton = this.root.querySelector('[data-btn-reload]');
    this.reloadButton.addEventListener('click', () => {
      window.location.reload();
    });

    if (
      BackgroundLoader.instance.isUsingCustomBackground &&
      BackgroundLoader.instance.hasCustomBackground
    ) {
      this.useCustomBgCheckbox.checked = true;
    } else {
      this.useCustomBgCheckbox.checked = false;
    }
    this.useDefaultBgCheckbox.checked = !this.useCustomBgCheckbox.checked;
    this.customBgUpload.disabled = !this.useCustomBgCheckbox.checked;

    if (BackgroundLoader.instance.hasCustomBackground) {
      this.customBgUpload.imageData = BackgroundLoader.instance.customBackgroundImage;
    }
    this.dimmedBgCheckbox.checked = BackgroundLoader.instance.isDimmedBackground;
  }

  setLoading(isLoading) {
    this.urlInput.disabled = isLoading;
    this.usernameInput.disabled = isLoading;
    this.passwordInput.disabled = isLoading;
    this.saveButton.disabled = isLoading;
    this.reloadButton.disabled = isLoading;
  }
}
