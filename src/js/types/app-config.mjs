import Model from './model.mjs';

export default class AppConfig {
  static _inst;

  /** @type {AppConfig} */
  static get instance() {
    if (!AppConfig._inst) {
      AppConfig._inst = new AppConfig();
    }
    return AppConfig._inst;
  }

  apiUrl = '';
  username = '';
  password = '';

  /** @type {string[]} */
  samplerList = [];

  /** @type {string[]} */
  upscalerList = [];

  /** @type {Map<string, Model>} */
  modelDict = {};
  /** @type {Model[]} */
  modelList = [];

  /** @type {string[]} */
  loraList = [];
  /** @type {string[]} */
  tiList = [];

  selectedSampler = '';
  selectedModel = '';

  get hasUrl() {
    return this.apiUrl && this.apiUrl != '';
  }

  constructor() {
    this.apiUrl = localStorage.getItem('apiUrl') ?? '';
    this.username = localStorage.getItem('username') ?? '';
    this.password = localStorage.getItem('password') ?? '';
    this.samplerList = JSON.parse(localStorage.getItem('samplers') ?? '[]');
    this.upscalerList = JSON.parse(localStorage.getItem('upscalers') ?? '[]');
    this.modelDict = JSON.parse(localStorage.getItem('modelDict') ?? '{}');
    this.modelList = JSON.parse(localStorage.getItem('modelList') ?? '[]');
    this.loraList = JSON.parse(localStorage.getItem('loras') ?? '[]');
    this.tiList = JSON.parse(localStorage.getItem('tis') ?? '[]');
    this.selectedSampler = localStorage.getItem('selectedSampler') ?? '';
  }

  setApiUrl(url, username, password) {
    this.apiUrl = url;
    this.username = username;
    this.password = password;
    localStorage.setItem('apiUrl', this.apiUrl);
    localStorage.setItem('username', this.username);
    localStorage.setItem('password', this.password);
  }

  /**
   * @param {{ hide_samplers: string[], sd_model_checkpoint: string }} options
   * @param {Array<{ name: string }>} samplers
   * @param {Array<{ name: string }>} upscalers
   * @param {Array<{ title: string, model_name: string, hash: string }>} models
   * @param {Array<{ name: string }>} loras
   * @param {{ loaded: Object<string, any> }} tis
   */
  readOptions(options, samplers, upscalers, models, loras, tis) {
    this.samplerList = samplers
      .map((s) => s.name)
      .filter((s) => options.hide_samplers.indexOf(s) < 0);
    this.upscalerList = upscalers.map((us) => us.name);
    this.modelDict = {};
    this.modelList = [];
    models.forEach((m) => {
      const model = new Model();
      model.title = m.title;
      model.name = m.model_name;
      model.hash = m.hash;
      this.modelDict[model.hash] = model;
      this.modelList.push(model);
    });

    this.modelList.sort((a, b) => a.name.localeCompare(b.name));

    if (this.selectedSampler == '' && this.samplerList.length > 0) {
      this.selectedSampler = this.samplerList[0];
    } else if (this.selectedSampler != '' && !this.samplerList.includes(this.selectedSampler)) {
      this.selectedSampler = this.samplerList[0];
    }

    const sdModelCheckpoint = options.sd_model_checkpoint;
    this.trySelectModel(sdModelCheckpoint);

    this.loraList = loras.map((l) => l.name);
    this.loraList.sort((a, b) => a.localeCompare(b));

    this.tiList = Object.keys(tis.loaded);
    this.tiList.sort((a, b) => a.localeCompare(b));

    localStorage.setItem('samplers', JSON.stringify(this.samplerList));
    localStorage.setItem('upscalers', JSON.stringify(this.upscalerList));
    localStorage.setItem('modelDict', JSON.stringify(this.modelDict));
    localStorage.setItem('modelList', JSON.stringify(this.modelList));
    localStorage.setItem('loras', JSON.stringify(this.loraList));
    localStorage.setItem('tis', JSON.stringify(this.tiList));
    localStorage.setItem('selectedSampler', this.selectedSampler);
  }

  trySelectModel(sdModelCheckpoint) {
    const modelHash = sdModelCheckpoint.substring(
      sdModelCheckpoint.indexOf('[') + 1,
      sdModelCheckpoint.indexOf(']')
    );
    const model = this.modelDict[modelHash];
    if (model) {
      this.selectedModel = model.hash;
    }
  }

  selectSampler(samplerName) {
    this.selectedSampler = samplerName;
    localStorage.setItem('selectedSampler', this.selectedSampler);
  }

  selectModel(/** @type {Model} */ model) {
    this.selectedModel = model.hash;
  }

  /**
   * @param {Array<{ name: string }>} loras
   */
  refreshLORAs(loras) {
    this.loraList = loras.map((l) => l.name);
    this.loraList.sort((a, b) => a.localeCompare(b));
    localStorage.setItem('loras', JSON.stringify(this.loraList));
  }

  /**
   * @param {{ loaded: Object<string, any> }} tis
   */
  refreshTIs(tis) {
    this.tiList = Object.keys(tis.loaded);
    this.tiList.sort((a, b) => a.localeCompare(b));
    localStorage.setItem('tis', JSON.stringify(this.tiList));
  }
}
