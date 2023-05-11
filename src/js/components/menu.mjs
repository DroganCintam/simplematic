import Component from './component.mjs';
import AppConfig from '../types/app-config.mjs';
import friendlyModelNames from '../types/friendly-model-names.mjs';
import Api from '../api.mjs';
import version from '../version.mjs';

const html = /*html*/ `
<div id="menu">
  <div>
    <div class="top">
      <span>SIMPLEMATIC</span>
      <button type="button" class="icon-button btn-hide"><img src="/img/xmark-solid.svg" alt="hide menu"></button>
    </div>
    <div class="option with-padding">
      <label><img src="/img/square-poll-horizontal-solid.svg" title="Settings"/>Sampler:</label>
      <select class="sel-samplers"></select>
    </div>
    <div class="option with-padding">
      <label><img src="/img/cube-solid.svg" title="Settings"/>Model:</label>
      <select class="sel-model"></select>
    </div>
    <div class="option">
      <button type="button" class="btn-reload-config"><img src="/img/rotate-solid.svg" alt="Reload config">Reload config</button>
    </div>
    <div class="divider"></div>
    <div class="option">
      <button type="button" class="btn-upscale" title="Upscale image (Ctrl+U)"><img src="/img/up-right-and-down-left-from-center-solid.svg">Upscale</button>
    </div>
    <div class="option">
      <button type="button" class="btn-gallery" title="Open gallery (Ctrl+G)"><img src="/img/grip-solid.svg">Gallery</button>
    </div>
    <div class="bottom-bar">
      <button type="button" class="icon-button btn-settings" title="Settings (Ctrl+,)"><img src="/img/gear-solid.svg"/></button>
      <button type="button" class="icon-button btn-about" title="About"><img src="/img/circle-info-solid.svg" title="About"/></button>
      <a href="https://github.com/DroganCintam/simplematic" target="_blank"><img src="/img/github.svg" title="Github repository"/></a>
      <span class="version"></span>
    </div>
  </div>
  <div class="loader" style="display:none">
    <span class="spinning"></span>
    <span>Loading...</span>
  </div>
</div>
`;

const css = /*css*/ `
#menu {
  position: fixed;
  left: 0;
  top: 0;
  width: 0;
  height: 100vh;
  overflow-y: scroll;
  background-color: hsl(0, 0%, 20%);
  transition: width 0.2s ease-out;
  -ms-overflow-style: none;
  scrollbar-width: none;
  z-index: 9999;
}

#menu::-webkit-scrollbar {
  display: none;
}

#menu > div {
  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-start;
  align-items: flex-start;
  width: 100%;
}

#menu .top {
  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  height: 4rem;
  padding: 0 1rem;
  border-bottom: 1px solid hsla(0, 0%, 100%, 0.2);
  font-weight: bold;
}

#menu .divider {
  width: 100%;
  height: 1px;
  background-color: hsla(0, 0%, 100%, 0.15);
}

#menu .option {
  width: 100%;
  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-start;
  align-items: flex-start;
  row-gap: 0.5rem;
}

#menu .option.with-padding {
  padding: 1rem;
}

#menu .option label {
  display: inline-flex;
  flex-flow: row nowrap;
  justify-content: flex-start;
  align-items: center;
}

#menu .option button {
  background: none;
  border: none;
  width: 100%;
  height: auto;
  padding: 1rem;
  display: inline-flex;
  flex-flow: row nowrap;
  justify-content: flex-start;
  align-items: center;
  color: #fff;
  font-size: 1rem;
  font-weight: normal;
}

#menu .option button:disabled:hover {
  background: none;
}

#menu .option button:hover {
  background-color: hsla(0, 0%, 100%, 0.2);
}

#menu .option label > img,
#menu .option button > img {
  width: 1rem;
  height: 1rem;
  margin-left: 0.5rem;
  margin-right: 0.5rem;
}

#menu select {
  width: 100%;
}

#menu .bottom-bar {
  z-index: 999;
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  height: 4rem;
  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-start;
  align-items: center;
  column-gap: 0.5rem;
  padding: 1rem;
  background-color: hsla(0, 0%, 0%, 0.1);
}

#menu .bottom-bar a {
  display: inline-flex;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  padding: 0.5rem;
}

#menu .bottom-bar a:hover {
  background-color: hsla(0, 0%, 100%, 0.1);
}

#menu .bottom-bar a img {
  width: 1rem;
  height: 1rem;
}

#menu .version {
  flex-grow: 1;
  text-align: right;
  font-size: 0.75rem;
  margin-right: 0.5rem;
  color: hsla(0, 0%, 100%, 0.7);
}

#menu .loader {
  position: absolute;
  left: 0;
  bottom: 10rem;
  width: 100%;
  display: flex;
  flex-flow: column nowrap;
  justify-content: center;
  align-items: center;
  row-gap: 0.25rem;
  font-size: 0.75rem;
}

#menu .loader .spinning {
  border: 0.5rem solid #f3f3f3;
  border-top: 0.5rem solid #3498db;
  border-radius: 50%;
  width: 3rem;
  height: 3rem;
  animation: spin 2s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
`;

export default class Menu extends Component {
  /** @type {HTMLButtonElement} */
  hideMenuButton;
  /** @type {HTMLSelectElement} */
  samplers;
  /** @type {HTMLSelectElement} */
  models;
  /** @type {HTMLButtonElement} */
  reloadConfigButton;
  /** @type {HTMLButtonElement} */
  upscaleButton;
  /** @type {HTMLButtonElement} */
  galleryButton;
  /** @type {HTMLButtonElement} */
  settingsButton;
  /** @type {HTMLButtonElement} */
  aboutButton;

  /** @type {HTMLElement} */
  loader;

  /** @type {() => void} */
  onHide;

  /** @type {() => void} */
  onOpenUpscaler;

  /** @type {() => void} */
  onOpenGallery;

  /** @type {() => void} */
  onSettings;

  /** @type {() => void} */
  onAbout;

  isLoading = false;

  constructor(/** @type {HTMLElement} */ root) {
    super(root, html, css, true);

    this.hideMenuButton = this.root.querySelector('.btn-hide');
    this.hideMenuButton.addEventListener('click', () => {
      this.onHide();
    });

    this.upscaleButton = this.root.querySelector('.btn-upscale');
    this.upscaleButton.addEventListener('click', () => {
      this.onHide();
      this.onOpenUpscaler();
    });

    this.galleryButton = this.root.querySelector('.btn-gallery');
    this.galleryButton.addEventListener('click', () => {
      this.onHide();
      this.onOpenGallery();
    });

    this.settingsButton = this.root.querySelector('.btn-settings');
    this.settingsButton.addEventListener('click', () => {
      this.onHide();
      this.onSettings();
    });

    this.aboutButton = this.root.querySelector('.btn-about');
    this.aboutButton.addEventListener('click', () => {
      this.onHide();
      this.onAbout();
    });

    this.samplers = this.root.querySelector('.sel-samplers');
    this.samplers.addEventListener('change', () => {
      AppConfig.instance.selectSampler(this.samplers.value);
    });

    this.models = this.root.querySelector('.sel-model');
    this.models.addEventListener('change', async () => {
      const model = AppConfig.instance.modelDict[this.models.value];
      this.setLoading(true);
      const isSuccess = await Api.instance.selectModel(model);
      this.setLoading(false);
      if (!isSuccess) {
        this.models.value = AppConfig.instance.selectedModel;
      }
    });

    this.reloadConfigButton = this.root.querySelector('.btn-reload-config');
    this.reloadConfigButton.addEventListener('click', async () => {
      this.setLoading(true);
      await Api.instance.reloadConfig();
      this.setLoading(false);
      this.refreshOptions();
    });

    this.loader = this.root.querySelector('.loader');

    this.refreshOptions();

    if (AppConfig.instance.hasUrl) {
      Api.instance.getSelectedModel().then((isSuccess) => {
        if (isSuccess) {
          this.models.value = AppConfig.instance.selectedModel;
        }
      });
    }

    this.root.querySelector('.version').innerText = `v${version.version}`;
  }

  refreshOptions() {
    this.samplers.innerHTML = '';
    AppConfig.instance.samplerList.forEach((s) => {
      const opt = document.createElement('option');
      opt.value = s;
      opt.innerText = s;
      this.samplers.appendChild(opt);
      if (s == AppConfig.instance.selectedSampler) {
        opt.selected = true;
      }
    });

    this.models.innerHTML = '';
    AppConfig.instance.modelList.forEach((m) => {
      const opt = document.createElement('option');
      opt.value = m.hash;
      opt.innerText = friendlyModelNames[m.hash] ?? m.name;
      this.models.appendChild(opt);
      if (m.hash == AppConfig.instance.selectedModel) {
        opt.selected = true;
      }
    });
  }

  setLoading(isLoading) {
    this.isLoading = isLoading;
    this.hideMenuButton.disabled = isLoading;
    this.samplers.disabled = isLoading;
    this.models.disabled = isLoading;
    this.reloadConfigButton.disabled = isLoading;
    this.upscaleButton.disabled = isLoading;
    this.galleryButton.disabled = isLoading;
    this.settingsButton.disabled = isLoading;
    this.aboutButton.disabled = isLoading;
    this.loader.style.display = isLoading ? '' : 'none';
  }
}
