import AppConfig from './types/app-config.mjs';
import Model from './types/model.mjs';

class Txt2ImgParameters {
  prompt = '';
  negative_prompt = '';
  sampler_name = '';
  steps = 20;
  cfg_scale = 7.0;
  seed = -1;
  width = 512;
  height = 512;

  restore_faces = false;
  tiling = false;

  enable_hr = false;
  denoising_strength = 0.5;
  hr_scale = 2;
  hr_upscaler = 'Latent';
  hr_second_pass_steps = 0;
  hr_resize_x = 0;
  hr_resize_y = 0;

  n_iter = 1;
  batch_size = 1;
}

export default class Api {
  static _inst;

  /** @type {Api} */
  static get instance() {
    if (!Api._inst) {
      Api._inst = new Api();
    }
    return Api._inst;
  }

  baseUrl = '';

  async reloadConfig() {
    return await this.connect(
      AppConfig.instance.apiUrl,
      AppConfig.instance.username,
      AppConfig.instance.password
    );
  }

  /**
   * @param {string} apiUrl
   * @param {string} username
   * @param {string} password
   */
  async connect(apiUrl, username, password) {
    if (apiUrl.endsWith('/') == false) {
      apiUrl += '/';
    }
    const url = apiUrl + 'sdapi/v1/';
    const headers = {
      accept: 'application/json',
      'ngrok-skip-browser-warning': 'any',
    };
    if (username != '' && password != '') {
      headers['Authorization'] = 'Basic ' + btoa(`${username}:${password}`);
    }
    try {
      const options = await (
        await fetch(url + 'options', {
          method: 'GET',
          mode: 'cors',
          headers,
        })
      ).json();

      const samplers = await (
        await fetch(url + 'samplers', {
          method: 'GET',
          mode: 'cors',
          headers,
        })
      ).json();

      const models = await (
        await fetch(url + 'sd-models', {
          method: 'GET',
          mode: 'cors',
          headers,
        })
      ).json();

      AppConfig.instance.setApiUrl(apiUrl, username, password);
      AppConfig.instance.readOptions(options, samplers, models);
      this.baseUrl = apiUrl;
      return null;
    } catch (err) {
      return err;
    }
  }

  async getSelectedModel() {
    try {
      const headers = {
        accept: 'application/json',
        'ngrok-skip-browser-warning': 'any',
      };
      if (AppConfig.instance.username != '' && AppConfig.instance.password != '') {
        headers['Authorization'] =
          'Basic ' + btoa(`${AppConfig.instance.username}:${AppConfig.instance.password}`);
      }
      const options = await (
        await fetch(this.baseUrl + 'sdapi/v1/options', {
          method: 'GET',
          mode: 'cors',
          headers,
        })
      ).json();
      const sdModelCheckpoint = options.sd_model_checkpoint;
      AppConfig.instance.trySelectModel(sdModelCheckpoint);
      return true;
    } catch (err) {
      console.log(err);
    }
  }

  async selectModel(/** @type {Model} */ model) {
    const url = this.baseUrl + 'sdapi/v1/options';
    const headers = {
      'Content-Type': 'application/json',
    };
    if (AppConfig.instance.username != '' && AppConfig.instance.password != '') {
      headers['Authorization'] =
        'Basic ' + btoa(`${AppConfig.instance.username}:${AppConfig.instance.password}`);
    }
    try {
      const result = await (
        await fetch(url, {
          method: 'POST',
          mode: 'cors',
          headers,
          body: JSON.stringify({
            sd_model_checkpoint: model.title,
          }),
        })
      ).text();
      if (result == 'null') {
        AppConfig.instance.selectModel(model);
        return true;
      } else {
        return false;
      }
    } catch (err) {
      console.log(err);
    }
  }

  async txt2img(/** @type {Txt2ImgParameters} */ parameters) {
    const url = this.baseUrl + 'sdapi/v1/txt2img';
    const headers = {
      'Content-Type': 'application/json',
    };
    if (AppConfig.instance.username != '' && AppConfig.instance.password != '') {
      headers['Authorization'] =
        'Basic ' + btoa(`${AppConfig.instance.username}:${AppConfig.instance.password}`);
    }
    try {
      const json = await (
        await fetch(url, {
          method: 'POST',
          mode: 'cors',
          headers,
          body: JSON.stringify(parameters),
        })
      ).json();
      if (Array.isArray(json.images) && json.images.length > 0) {
        return json;
      } else {
        throw json;
      }
    } catch (err) {
      console.error(err);
    }
  }
}
