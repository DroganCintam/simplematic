import AppConfig from './types/app-config.mjs';
import Model from './types/model.mjs';

export class Txt2ImgParameters {
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

export class Img2ImgParameters {
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

  /** @type {string[]} */
  init_images = [];
  resize_mode = 0;
  denoising_strength = 0.75;
  image_cfg_scale = 0;

  n_iter = 1;
  batch_size = 1;

  /** @type {string | undefined} */
  mask = undefined;
  mask_blur = 4;
  inpainting_mask_invert = 0;
  inpainting_fill = 0;
  inpaint_full_res = true;
  inpaint_full_res_padding = 0;
}

export class UpscaleParameters {
  resize_mode = 0;
  show_extras_results = true;
  gfpgan_visibility = 0;
  codeformer_visibility = 0;
  codeformer_weight = 0;
  upscaling_resize = 2;
  upscaling_resize_w = 512;
  upscaling_resize_h = 512;
  upscaling_crop = true;
  upscaler_1 = 'None';
  upscaler_2 = 'None';
  extras_upscaler_2_visibility = 0;
  upscale_first = false;
  image = '';
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
          headers,
        })
      ).json();

      const samplers = await (
        await fetch(url + 'samplers', {
          method: 'GET',
          headers,
        })
      ).json();

      const upscalers = await (
        await fetch(url + 'upscalers', {
          method: 'GET',
          headers,
        })
      ).json();

      const models = await (
        await fetch(url + 'sd-models', {
          method: 'GET',
          headers,
        })
      ).json();

      const loras = await (
        await fetch(url + 'loras', {
          method: 'GET',
          headers,
        })
      ).json();

      const tis = await (
        await fetch(url + 'embeddings', {
          method: 'GET',
          headers,
        })
      ).json();

      AppConfig.instance.setApiUrl(apiUrl, username, password);
      AppConfig.instance.readOptions(options, samplers, upscalers, models, loras, tis);
      this.baseUrl = apiUrl;
      return null;
    } catch (err) {
      return err;
    }
  }

  async refreshLORAs() {
    try {
      const headers = this.prepareHeaders(true);
      const loras = await (
        await fetch(this.baseUrl + 'sdapi/v1/loras', {
          method: 'GET',
          headers,
        })
      ).json();
      AppConfig.instance.refreshLORAs(loras);
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  }

  async refreshTIs() {
    try {
      const headers = this.prepareHeaders(true);
      const tis = await (
        await fetch(this.baseUrl + 'sdapi/v1/embeddings', {
          method: 'GET',
          headers,
        })
      ).json();
      AppConfig.instance.refreshTIs(tis);
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  }

  async getSelectedModel() {
    try {
      const headers = this.prepareHeaders(true);
      const options = await (
        await fetch(this.baseUrl + 'sdapi/v1/options', {
          method: 'GET',
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
    const headers = this.prepareHeaders(false);
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
    const headers = this.prepareHeaders(false);
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

  async img2img(/** @type {Img2ImgParameters} */ parameters) {
    const url = this.baseUrl + 'sdapi/v1/img2img';
    const headers = this.prepareHeaders(false);
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

  async upscale(/** @type {UpscaleParameters} */ parameters) {
    const url = this.baseUrl + 'sdapi/v1/extra-single-image';
    const headers = this.prepareHeaders(false);
    try {
      const json = await (
        await fetch(url, {
          method: 'POST',
          mode: 'cors',
          headers,
          body: JSON.stringify(parameters),
        })
      ).json();
      if (typeof json.image === 'string') {
        return json;
      } else {
        throw json;
      }
    } catch (err) {
      console.error(err);
    }
  }

  async getProgress() {
    try {
      const headers = this.prepareHeaders(true);
      const response = await (
        await fetch(this.baseUrl + 'sdapi/v1/progress?skip_current_image=true', {
          method: 'GET',
          headers,
        })
      ).json();
      if (response.state.job_count > 0) {
        return response.progress;
      } else {
        return null;
      }
    } catch (err) {
      console.error(err);
    }
  }

  prepareHeaders(isGet) {
    const headers = isGet
      ? {
          accept: 'application/json',
          'ngrok-skip-browser-warning': 'any',
        }
      : {
          'Content-Type': 'application/json',
        };

    if (AppConfig.instance.username != '' && AppConfig.instance.password != '') {
      headers['Authorization'] =
        'Basic ' + btoa(`${AppConfig.instance.username}:${AppConfig.instance.password}`);
    }
    return headers;
  }
}
