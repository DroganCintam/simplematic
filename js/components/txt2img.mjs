import Tab from './tab.mjs';
import Settings from './settings.mjs';
import autoResize from '../utils/autoResize.mjs';
import ValueSelector from './value-selector.mjs';
import ImageInfo from '../types/image-info.mjs';
import Api from '../api.mjs';
import AppConfig from '../types/app-config.mjs';

const defaultParameters = {
  sampler: 'DPM++ 2M Karras v2',
  steps: 20,
  cfg: 7,
  width: 512,
  height: 512,
};

const html = /*html*/ `
<div id="txt2img-tab" class="app-tab">
  <div>
    <label>Prompt:</label>
    <textarea class="txt-prompt"></textarea>
    <label>Negative prompt:</label>
    <textarea class="txt-negative-prompt"></textarea>
    <label>Aspect ratio:</label>
    <span class="sel-aspectRatio"></span>
    <label>Steps:</label>
    <span class="sel-steps"></span>
    <label>CFG scale:</label>
    <span class="sel-cfg"></span>
    <label>Seed:</label>
    <div class="flexbox row justify-start align-center w100p" style="column-gap: 0.25rem">
      <input type="number" class="txt-seed" value="-1"/>
      <button type="button" class="button-with-icon btn-clear-seed">
        <img src="img/eraser-solid.svg" title="Erase seed"/>
      </button>
    </div>
  </div>

  <style>
    #txt2img-tab > div {
      width: 100%;
      display: flex;
      flex-flow: column nowrap;
      align-items: flex-start;
      justify-content: flex-start;
      row-gap: 0.5rem;
      max-width: 720px;
    }

    .txt-prompt,
    .txt-negative-prompt {
      width: 100%;
      min-height: 4rem;
      margin-bottom: 0.5rem;
      padding: 0.5rem;
      background-color: rgba(0, 0, 0, 0.5);
      color: hsl(0, 0%, 100%);
      font-family: 'Montserrat';
      font-size: 1rem;
      border: 1px solid rgba(255, 255, 255, 0.5);
      border-radius: 0.5rem;
      resize: none;
    }

    .txt-seed {
      padding: 0.5rem;
      background-color: rgba(0, 0, 0, 0.5);
      color: hsl(0, 0%, 100%);
      font-family: 'Montserrat';
      font-size: 1rem;
      border: 1px solid rgba(255, 255, 255, 0.5);
      border-radius: 0.5rem;
      max-width: 16ch;
    }

    .txt-prompt:focus-visible,
    .txt-negative-prompt:focus-visible,
    .txt-seed:focus-visible {
      outline: none;
    }
  </style>
</div>
`;

export default class Txt2Img extends Tab {
  /** @type {HTMLTextAreaElement} */
  prompt;
  /** @type {HTMLTextAreaElement} */
  negativePrompt;
  /** @type {ValueSelector} */
  aspectRatioSelector;
  /** @type {ValueSelector} */
  stepsSelector;
  /** @type {ValueSelector} */
  cfgSelector;
  /** @type {HTMLInputElement} */
  seed;
  /** @type {HTMLButtonElement} */
  clearSeedButton;

  /** @type {Settings} */
  settings;

  /** @type {()=>void} */
  onSubmit;

  constructor(/** @type {HTMLElement} */ parent, /** @type {Settings} */ settings) {
    super(parent, html);
    this.prompt = this.root.querySelector('.txt-prompt');
    this.negativePrompt = this.root.querySelector('.txt-negative-prompt');
    this.seed = this.root.querySelector('.txt-seed');
    this.clearSeedButton = this.root.querySelector('.btn-clear-seed');
    this.settings = settings;

    const resizeOnInput = function () {
      autoResize(this);
    };

    const self = this;
    const submitOnEnter = function (/** @type {KeyboardEvent} */ e) {
      if (e.key === 'Enter' && e.ctrlKey) {
        self.onSubmit();
      }
    };

    this.prompt.addEventListener('input', resizeOnInput);
    this.prompt.addEventListener('keydown', submitOnEnter);

    this.negativePrompt.addEventListener('input', resizeOnInput);
    this.negativePrompt.addEventListener('keydown', submitOnEnter);

    this.prompt.value = sessionStorage.getItem('prompt') ?? '';
    autoResize(this.prompt);
    this.negativePrompt.value = sessionStorage.getItem('negativePrompt') ?? '';
    autoResize(this.negativePrompt);

    this.aspectRatioSelector = new ValueSelector(
      this.root.querySelector('.sel-aspectRatio'),
      {
        assignedId: 'aspectRatio',
        defaultValue: parseInt(localStorage.getItem('aspectRatio') ?? '1'),
        hasCustom: false,
        values: [
          { name: 'Square (512x512)', value: 1 },
          { name: 'Portrait (512x768)', value: 2 },
          { name: 'Landscape (768x512)', value: 3 },
        ],
      },
      true
    );

    this.stepsSelector = new ValueSelector(
      this.root.querySelector('.sel-steps'),
      {
        assignedId: 'steps',
        defaultValue: parseInt(localStorage.getItem('steps') ?? defaultParameters.steps.toString()),
        minValue: 1,
        maxValue: 100,
        isInteger: true,
        hasCustom: true,
        values: [
          { name: 'Fast (8)', value: 8 },
          { name: 'Low (20)', value: 20 },
          { name: 'Medium (40)', value: 40 },
          { name: 'High (80)', value: 80 },
          { name: 'Insane (100)', value: 100 },
        ],
      },
      true
    );

    this.cfgSelector = new ValueSelector(
      this.root.querySelector('.sel-cfg'),
      {
        assignedId: 'cfg',
        defaultValue: parseFloat(localStorage.getItem('cfg') ?? defaultParameters.cfg.toString()),
        minValue: 1,
        maxValue: 30,
        isInteger: false,
        hasCustom: true,
        values: [
          { name: 'Free (3)', value: 3 },
          { name: 'Normal (7)', value: 7 },
          { name: 'Strict (12)', value: 12 },
          { name: 'Very Strict (18)', value: 18 },
        ],
      },
      true
    );

    this.clearSeedButton.addEventListener('click', () => {
      this.seed.value = '-1';
    });
  }

  retrieveInfo(/** @type {ImageInfo} */ imageInfo, /** @type {Boolean} */ alsoSeed) {
    this.prompt.value = imageInfo.info.prompt;
    this.negativePrompt.value = imageInfo.info.negativePrompt;
    if (imageInfo.info.width == 768) {
      this.aspectRatioSelector.currentValue = 3;
    } else if (imageInfo.info.height == 768) {
      this.aspectRatioSelector.currentValue = 2;
    } else {
      this.aspectRatioSelector.currentValue = 1;
    }
    this.stepsSelector.currentValue = imageInfo.info.steps;
    this.cfgSelector.currentValue = imageInfo.info.cfg;
    if (alsoSeed) {
      this.seed.value = imageInfo.info.seed;
    }
  }

  resizePromptBoxes() {
    autoResize(this.prompt);
    autoResize(this.negativePrompt);
  }

  generate(onStart, onEnd, onSuccess, onFailure) {
    if (Api.instance.baseUrl == '') return;

    if (this.seed.value == '') {
      this.seed.value = '-1';
    }

    onStart();

    sessionStorage.setItem('prompt', this.prompt.value);
    sessionStorage.setItem('negativePrompt', this.negativePrompt.value);
    localStorage.setItem('aspectRatio', this.aspectRatioSelector.currentValue.toString());
    localStorage.setItem('steps', this.stepsSelector.currentValue.toString());
    localStorage.setItem('cfg', this.cfgSelector.currentValue.toString());

    let width = 512;
    let height = 512;
    switch (this.aspectRatioSelector.currentValue) {
      case 2:
        height = 768;
        break;
      case 3:
        width = 768;
        break;
    }

    Api.instance
      .txt2img({
        prompt: this.prompt.value,
        negative_prompt: this.negativePrompt.value,
        sampler_name: AppConfig.instance.selectedSampler ?? defaultParameters.sampler,
        steps: this.stepsSelector.currentValue,
        cfg_scale: this.cfgSelector.currentValue,
        seed: this.seed.value,
        width,
        height,
      })
      .then(onSuccess)
      .catch(onFailure)
      .finally(onEnd);
  }

  getSteps() {
    return this.stepsSelector.currentValue;
  }

  getResolution() {
    let width = 512;
    let height = 512;
    switch (this.aspectRatioSelector.currentValue) {
      case 2:
        height = 768;
        break;
      case 3:
        width = 768;
        break;
    }
    return width * height;
  }

  setLoading(isLoading) {
    this.prompt.disabled = isLoading;
    this.negativePrompt.disabled = isLoading;
    this.aspectRatioSelector.disabled = isLoading;
    this.stepsSelector.disabled = isLoading;
    this.cfgSelector.disabled = isLoading;
    this.seed.disabled = isLoading;
    this.clearSeedButton.disabled = isLoading;
  }
}
