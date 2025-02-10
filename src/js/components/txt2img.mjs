import Tab from './tab.mjs';
import autoResize from '../utils/autoResize.mjs';
import ValueSelector from './value-selector.mjs';
import ImageInfo from '../types/image-info.mjs';
import Api, { Img2ImgParameters, Txt2ImgParameters } from '../api.mjs';
import AppConfig from '../types/app-config.mjs';
import Checkbox from './checkbox.mjs';
import ImageUpload from './image-upload.mjs';
import ConfirmDialog from './confirm-dialog.mjs';
import Component from './component.mjs';
import InpaintBox from './inpaint-box.mjs';
import ExtraNetworksDialog from './extra-networks-dialog.mjs';
import ScriptListDialog from './script-list-dialog.mjs';
import PromptClipboardDialog from './prompt-clipboard-dialog.mjs';

const defaultParameters = {
  sampler: 'DPM++ 2M Karras v2',
  steps: 20,
  cfg: 7,
  width: 512,
  height: 512,
};

const html = /*html*/ `
<div id="txt2img-tab" class="app-tab">
  <div class="parameter-pane">
    <label class="heading" for="">Prompt:<span class="options">
      <button class="icon-button" data-btn-prompt-clipboard title="Clipboard">
        <img src="/img/clipboard-list-solid.svg"/>
      </button>
      <button class="icon-button" data-btn-prompt-extra title="Extra networks">
        <img src="/img/rectangle-list-solid.svg"/>
      </button>
      <button class="icon-button" data-btn-clear-prompt title="Erase">
        <img src="/img/eraser-solid.svg"/>
      </button>
    </span></label>
    <textarea data-txt-prompt autocapitalize="off"></textarea>
    <label class="heading" for="">Negative prompt:<span class="options">
      <button class="icon-button" data-btn-negative-prompt-clipboard title="Clipboard">
        <img src="/img/clipboard-list-solid.svg"/>
      </button>
      <button class="icon-button" data-btn-negative-prompt-extra title="Extra networks">
        <img src="/img/rectangle-list-solid.svg"/>
      </button>
      <button class="icon-button" data-btn-clear-negative-prompt title="Erase">
        <img src="/img/eraser-solid.svg"/>
      </button>
    </span></label>
    <textarea data-txt-negative-prompt autocapitalize="off"></textarea>
    <label class="heading">Dimensions:</label>
    <input type="number" class="custom" data-txt-width value="512" min="32" max="4096" step="32" onchange="validateInputRange(this)"/>
    <input type="number" class="custom" data-txt-height value="512" min="32" max="4096" step="32" onchange="validateInputRange(this)"/>
    <span data-sel-aspect-ratio></span>
    <label class="heading">Steps:</label>
    <span data-sel-steps></span>
    <label class="heading">CFG scale:</label>
    <span data-sel-cfg></span>
    <label class="heading">Seed:</label>
    <div class="flexbox row justify-start align-center w100p" style="column-gap: 0.25rem">
      <input type="number" data-txt-seed value="-1" min="-1" onchange="validateInputRange(this)"/>
      <button type="button" class="icon-button" data-btn-clear-seed title="Erase">
        <img src="img/eraser-solid.svg"/>
      </button>
    </div>
    <label class="heading">Advanced:</label>
    <div class="advanced-parameters">
      <span data-chk-restore-faces></span>
      <span data-chk-hires></span>
      <span data-chk-img2img></span>
      <span data-chk-script></span>
    </div>
    <div class="advanced-box hires" style="display: none">
      <div class="title">HiRes options</div>
      <div class="options">
        <div class="option">
          <label>Denoising strength:</label>
          <input type="number" data-txt-hires-denoising-strength value="0.5" min="0" max="1" step="0.1" onchange="validateInputRange(this)">
        </div>
        <div class="option">
          <label>Scale:</label>
          <input type="number" data-txt-hires-scale value="2" min="1" max="4" step="0.5" onchange="validateInputRange(this)">
        </div>
        <div class="option">
          <label>Custom steps:</label>
          <input type="number" data-txt-hires-steps value="0" min="0" max="150" onchange="validateInputRange(this)">
        </div>
      </div>
    </div>
    <div class="advanced-box img2img" style="display: none">
      <div class="title">Image-to-Image</div>
      <div class="options">
        <label class="heading">Denoising strength:</label>
        <input type="number" data-txt-denoising-strength value="0.5" min="0" max="1" step="0.1" onchange="validateInputRange(this)">
        <label class="heading">Resize mode:</label>
        <span data-sel-resize-mode></span>
        <label class="heading">Input image:</label>
        <div data-img2img-input-image></div>
      </div>
    </div>
    <div class="advanced-box script" style="display: none">
      <div class="title">Script</div>
      <div class="options">
        <span class="w100p">Run extension script. Make sure you know what you are doing.</span>
        <label>Name:</label>
        <input type="text" data-txt-script-name>
        <label>Arguments (as a JSON array):</label>
        <input type="text" data-txt-script-args placeholder="[]" spellcheck="false">
        <button class="icon-button" data-btn-select-script title="Select script">
          <img src="/img/rectangle-list-solid.svg"/>
        </button>
      </div>
    </div>
  </div>
</div>
`;

const css = /*css*/ `
#txt2img-tab .parameter-pane {
  width: 100%;
  display: flex;
  flex-flow: column nowrap;
  align-items: flex-start;
  justify-content: flex-start;
  row-gap: 0.5rem;
  max-width: 720px;
}

#txt2img-tab [data-txt-prompt],
#txt2img-tab [data-txt-negative-prompt] {
  width: 100%;
  min-height: 4rem;
  margin-bottom: 0.5rem;
  resize: none;
}

#txt2img-tab [data-txt-seed] {
  max-width: 16ch;
}

#txt2img-tab label.heading {
  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
  align-items: flex-end;
  width: 100%;
}

#txt2img-tab label.heading .options {
  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-start;
  align-items: center;
}

#txt2img-tab .advanced-parameters {
  width: 100%;
  display: flex;
  flex-flow: row wrap;
  justify-content: flex-start;
  align-items: center;
  gap: 0.5rem;
}

#txt2img-tab .advanced-parameters > * {
  flex-grow: 1;
}

#txt2img-tab .advanced-box {
  width: 100%;
  padding: 0;
  border: 1px solid hsla(0, 0%, 100%, 0.5);
  border-radius: 0.5rem;
}

#txt2img-tab .advanced-box .title {
  padding: 0.5rem;
  border-radius: 0.5rem 0.5rem 0 0;
  border-bottom: 1px solid hsla(0, 0%, 100%, 0.5);
  background-color: hsla(0, 0%, 0%, 0.5);
  text-align: center;
}

#txt2img-tab .advanced-box .options {
  padding: 0.5rem;
  width: 100%;
  display: flex;
  flex-flow: row wrap;
  justify-content: stretch;
  align-items: center;
  gap: 1rem;
  position: relative;
}

#txt2img-tab .advanced-box .options .option {
  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-start;
  align-items: center;
  gap: 0.5rem;
  flex-grow: 1;
}

#txt2img-tab .advanced-box .options .option label {
  font-size: 1rem;
}

#txt2img-tab .advanced-box .options .option input {
  flex-grow: 1;
}

#txt2img-tab .advanced-box.script .options [data-btn-select-script] {
  position: absolute;
  right: 0rem;
  top: -2.5rem;
}

#txt2img-tab .img2img .options [data-txt-denoising-strength] {
  min-width: 16ch;
}

#txt2img-tab .img2img .options .image-upload {
  width: 100%;
}

#txt2img-tab .img2img .options .image-upload img {
  object-fit: contain;
}

#txt2img-tab .script input {
  width: 100%;
  font-family: monospace;
  font-size: 0.9rem;
}

#txt2img-tab .img2img .inpaint-canvas {
  width: 100%;
  height: 100%;
  border: 1px dashed hsla(0, 0%, 100%, 0.5);
  border-radius: 0.5rem;
  position: absolute;
  left: 0;
  top: 0;
}

#txt2img-tab .img2img .btn-inpaint-canvas-undo {
  position: absolute;
  right: 0.5rem;
  bottom: 0.5rem;
  z-index: 5;
  visibility: hidden;
}
`;

export default class Txt2Img extends Tab {
  /** @type {HTMLTextAreaElement} */
  prompt;
  /** @type {HTMLButtonElement} */
  clearPromptButton;
  /** @type {HTMLButtonElement} */
  promptExtraButton;
  /** @type {HTMLButtonElement} */
  promptClipboardButton;
  /** @type {HTMLTextAreaElement} */
  negativePrompt;
  /** @type {HTMLButtonElement} */
  clearNegativePromptButton;
  /** @type {HTMLButtonElement} */
  negativePromptExtraButton;
  /** @type {HTMLButtonElement} */
  negativePromptClipboardButton;
  /** @type {HTMLInputElement} */
  widthInput;
  /** @type {HTMLInputElement} */
  heightInput;
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

  /** @type {Checkbox} */
  restoreFacesCheckbox;
  /** @type {Checkbox} */
  hiresCheckbox;
  /** @type {Checkbox} */
  img2imgCheckbox;
  /** @type {Checkbox} */
  scriptCheckbox;

  /** @type {HTMLElement} */
  hiresOptions;
  /** @type {HTMLInputElement} */
  hiresDenoisingStrength;
  /** @type {HTMLInputElement} */
  hiresScale;
  /** @type {HTMLInputElement} */
  hiresSteps;

  /** @type {HTMLElement} */
  img2img;
  /** @type {HTMLInputElement} */
  denoisingStrength;
  /** @type {ValueSelector} */
  resizeModeSelector;
  /** @type {ImageUpload} */
  img2imgInputImage;

  /** @type {HTMLCanvasElement} */
  inpaintCanvas;
  /** @type {InpaintBox} */
  inpaintBox;

  inpaintCanvasStates = [];
  inpaintCanvasStateIndex = -1;

  /** @type {HTMLElement} */
  scriptOptions;
  /** @type {HTMLInputElement} */
  scriptName;
  /** @type {HTMLInputElement} */
  scriptArgs;
  /** @type {HTMLButtonElement} */
  selectScriptButton;

  isLoading = false;

  /** @type {()=>void} */
  onSubmit;

  isHiRes() {
    return this.hiresCheckbox.checked;
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

  getHiResScale() {
    return this.hiresScale.valueAsNumber;
  }

  getHiResSteps() {
    return this.hiresSteps.valueAsNumber;
  }

  constructor(/** @type {HTMLElement} */ parent) {
    super(parent, html, css);

    this.prompt = this.root.querySelector('[data-txt-prompt]');
    this.clearPromptButton = this.root.querySelector('[data-btn-clear-prompt]');
    this.promptExtraButton = this.root.querySelector('[data-btn-prompt-extra]');
    this.promptClipboardButton = this.root.querySelector('[data-btn-prompt-clipboard]');

    this.negativePrompt = this.root.querySelector('[data-txt-negative-prompt]');
    this.clearNegativePromptButton = this.root.querySelector('[data-btn-clear-negative-prompt]');
    this.negativePromptExtraButton = this.root.querySelector('[data-btn-negative-prompt-extra]');
    this.negativePromptClipboardButton = this.root.querySelector(
      '[data-btn-negative-prompt-clipboard]'
    );

    this.seed = this.root.querySelector('[data-txt-seed]');
    this.clearSeedButton = this.root.querySelector('[data-btn-clear-seed]');

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

    this.prompt.value = localStorage.getItem('prompt') ?? '';
    autoResize(this.prompt);
    this.negativePrompt.value = localStorage.getItem('negativePrompt') ?? '';
    autoResize(this.negativePrompt);

    this.widthInput = this.root.querySelector('[data-txt-width]');
    this.heightInput = this.root.querySelector('[data-txt-height]');

    this.aspectRatioSelector = new ValueSelector(
      this.root.querySelector('[data-sel-aspect-ratio]'),
      {
        assignedId: 'aspectRatio',
        defaultValue: parseInt(localStorage.getItem('aspectRatio') ?? '1'),
        hasCustom: false,
        values: [
          { name: 'Square (512x512)', value: 1 },
          { name: 'Portrait (512x768)', value: 2 },
          { name: 'Landscape (768x512)', value: 3 },
          { name: 'Big Square (1024x1024)', value: 4 },
          { name: 'Big Portrait (1024x1536)', value: 5 },
          { name: 'Big Landscape (1536x1024)', value: 6 },
        ],
      },
      true
    );

    this.widthInput.parentElement.removeChild(this.widthInput);
    this.heightInput.parentElement.removeChild(this.heightInput);
    {
      const arList = this.aspectRatioSelector.root.querySelector('.value-list');
      arList.insertBefore(this.heightInput, arList.firstChild);
      arList.insertBefore(this.widthInput, this.heightInput);
    }

    this.widthInput.addEventListener('change', this.updateAspectRatioFromDimensions.bind(this));
    this.heightInput.addEventListener('change', this.updateAspectRatioFromDimensions.bind(this));
    this.aspectRatioSelector.addEventListener(
      'change',
      this.updateDimensionsFromAspectRatio.bind(this)
    );

    this.stepsSelector = new ValueSelector(
      this.root.querySelector('[data-sel-steps]'),
      {
        assignedId: 'steps',
        defaultValue: parseInt(localStorage.getItem('steps') ?? defaultParameters.steps.toString()),
        minValue: 1,
        maxValue: 150,
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
      this.root.querySelector('[data-sel-cfg]'),
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

    this.resizeModeSelector = new ValueSelector(this.root.querySelector('[data-sel-resize-mode]'), {
      assignedId: 'resizeMode',
      defaultValue: 0,
      minValue: 0,
      maxValue: 2,
      isInteger: true,
      hasCustom: false,
      values: [
        { name: 'Just resize', value: 0 },
        { name: 'Crop and resize', value: 1 },
        { name: 'Resize and fill', value: 2 },
      ],
    });

    this.restoreFacesCheckbox = new Checkbox(
      this.root.querySelector('[data-chk-restore-faces]'),
      {
        assignedId: 'chk-restore-faces',
        label: 'Restore faces',
      },
      true
    );

    this.hiresCheckbox = new Checkbox(
      this.root.querySelector('[data-chk-hires]'),
      {
        assignedId: 'chk-hires',
        label: 'HiRes',
      },
      true
    );

    this.img2imgCheckbox = new Checkbox(
      this.root.querySelector('[data-chk-img2img]'),
      {
        assignedId: 'chk-img2img',
        label: 'Img2Img',
      },
      true
    );

    this.scriptCheckbox = new Checkbox(
      this.root.querySelector('[data-chk-script]'),
      {
        assignedId: 'chk-script',
        label: 'Script',
      },
      true
    );

    this.hiresCheckbox.onChange = (chk) => {
      this.hiresOptions.style.display = chk.checked ? '' : 'none';
    };

    this.img2imgCheckbox.onChange = (chk) => {
      this.toggleImg2Img();
    };

    this.scriptCheckbox.onChange = (chk) => {
      this.scriptOptions.style.display = chk.checked ? '' : 'none';
    };

    this.hiresOptions = this.root.querySelector('.hires');
    this.hiresDenoisingStrength = this.hiresOptions.querySelector(
      '[data-txt-hires-denoising-strength]'
    );
    this.hiresScale = this.hiresOptions.querySelector('[data-txt-hires-scale]');
    this.hiresSteps = this.hiresOptions.querySelector('[data-txt-hires-steps]');

    this.img2img = this.root.querySelector('.img2img');
    this.denoisingStrength = this.img2img.querySelector('[data-txt-denoising-strength]');
    this.img2imgInputImage = new ImageUpload(
      this.img2img.querySelector('[data-img2img-input-image]'),
      {},
      true
    );
    this.img2imgInputImage.lockedClickToChange = true;

    this.inpaintCanvas = Component.fromHTML(/*html*/ `
      <canvas class="inpaint-options inpaint-canvas"/>
    `);
    this.img2imgInputImage.root.appendChild(this.inpaintCanvas);

    this.inpaintBox = new InpaintBox(this.img2imgInputImage.root);
    this.inpaintBox.onInpaintingChanged = (inpainting) => {
      this.showOrHideInpaintCanvas();
    };

    const checkViewportWidthToToggleInpaintCanvas = () => {
      if (window.innerWidth < 480) {
        Component.changeParent(this.inpaintBox.root, this.img2imgInputImage.root.parentElement);
        this.inpaintBox.toggleInsideCanvas(false);
      } else {
        Component.changeParent(this.inpaintBox.root, this.img2imgInputImage.root);
        this.inpaintBox.toggleInsideCanvas(true);
      }
    };

    window.addEventListener('resize', checkViewportWidthToToggleInpaintCanvas);
    checkViewportWidthToToggleInpaintCanvas();

    this.img2imgInputImage.addEventListener('imageData', () => {
      if (this.img2imgInputImage.hasImage) {
        this.inpaintBox.show();
        setTimeout(() => {
          const width = this.img2imgInputImage.image.naturalWidth;
          const height = this.img2imgInputImage.image.naturalHeight;
          this.inpaintCanvas.width = width;
          this.inpaintCanvas.height = height;
          this.clearInpaintCanvas();
        }, 100);
      } else {
        this.inpaintBox.hide();
        this.clearInpaintCanvas();
      }
      this.showOrHideInpaintCanvas();
    });

    this.scriptOptions = this.root.querySelector('.script');
    this.scriptName = this.scriptOptions.querySelector('[data-txt-script-name]');
    this.scriptArgs = this.scriptOptions.querySelector('[data-txt-script-args]');
    this.selectScriptButton = this.scriptOptions.querySelector('[data-btn-select-script]');

    this.scriptName.value = localStorage.getItem('script_name') ?? '';
    this.scriptArgs.value = localStorage.getItem('script_args') ?? '';

    /**
     * @param {HTMLInputElement} input
     * @param {string|null} lora
     * @param {string|null} ti
     */
    const addExtraToPrompt = (input, lora, ti) => {
      let value = input.value;
      if (lora) {
        if (value.length == 0) {
          value = lora;
        } else if (value.endsWith(' ')) {
          value += `<lora:${lora}:1>`;
        } else {
          value += ` <lora:${lora}:1>`;
        }
      }
      if (ti) {
        if (value.length == 0) {
          value = ti;
        } else {
          value += `, ${ti}`;
        }
      }
      input.value = value;
      this.resizePromptBoxes();
    };

    this.clearPromptButton.addEventListener('click', () => {
      ConfirmDialog.instance.show('The whole prompt will be cleared.\nAre you sure?', () => {
        this.prompt.value = '';
      });
    });
    this.promptExtraButton.addEventListener('click', () => {
      ExtraNetworksDialog.instance.show(
        (lora) => {
          addExtraToPrompt(this.prompt, lora, null);
        },
        (ti) => {
          addExtraToPrompt(this.prompt, null, ti);
        }
      );
    });
    this.promptClipboardButton.addEventListener('click', () => {
      PromptClipboardDialog.instance.show(false, this.prompt.value, (value) => {
        this.prompt.value = value;
      });
    });

    this.clearNegativePromptButton.addEventListener('click', () => {
      ConfirmDialog.instance.show('The whole prompt will be cleared.\nAre you sure?', () => {
        this.negativePrompt.value = '';
      });
    });
    this.negativePromptExtraButton.addEventListener('click', () => {
      ExtraNetworksDialog.instance.show(
        (lora) => {
          addExtraToPrompt(this.negativePrompt, lora, null);
        },
        (ti) => {
          addExtraToPrompt(this.negativePrompt, null, ti);
        }
      );
    });
    this.negativePromptClipboardButton.addEventListener('click', () => {
      PromptClipboardDialog.instance.show(true, this.negativePrompt.value, (value) => {
        this.negativePrompt.value = value;
      });
    });

    this.clearSeedButton.addEventListener('click', () => {
      this.seed.value = '-1';
    });

    this.selectScriptButton.addEventListener('click', () => {
      ScriptListDialog.instance.show(
        this.img2imgCheckbox.checked,
        (scriptName) => {
          this.scriptName.value = scriptName;
        },
        (scriptName) => {
          this.scriptName.value = scriptName;
        }
      );
    });

    this.widthInput.value = localStorage.getItem('width') ?? '512';
    this.heightInput.value = localStorage.getItem('height') ?? '512';
    this.updateAspectRatioFromDimensions();

    this.initInpaintCanvas();
    this.inpaintBox.hide();
    this.showOrHideInpaintCanvas();
  }

  retrieveInfo(/** @type {ImageInfo} */ imageInfo, /** @type {Boolean} */ alsoSeed) {
    this.prompt.value = imageInfo.info.prompt;
    this.negativePrompt.value = imageInfo.info.negativePrompt;
    this.widthInput.valueAsNumber = imageInfo.info.width;
    this.heightInput.valueAsNumber = imageInfo.info.height;
    this.updateAspectRatioFromDimensions();
    this.stepsSelector.currentValue = imageInfo.info.steps;
    this.cfgSelector.currentValue = imageInfo.info.cfg;
    if (alsoSeed) {
      this.seed.value = imageInfo.info.seed;
    } else {
      this.seed.value = '-1';
    }
    if (imageInfo.info.faceRestoration != '') {
      this.restoreFacesCheckbox.checked = true;
    } else {
      this.restoreFacesCheckbox.checked = false;
    }
    if (imageInfo.info.hiResScale > 0) {
      this.hiresCheckbox.checked = true;
      this.hiresDenoisingStrength.value = imageInfo.info.denoisingStrength;
      this.hiresScale.value = imageInfo.info.hiResScale;
      this.hiresSteps.value = imageInfo.info.hiResSteps;
      this.hiresOptions.style.display = '';
    } else {
      this.hiresCheckbox.checked = false;
      this.hiresOptions.style.display = 'none';
    }

    if (imageInfo.inputImage && imageInfo.inputImage !== '') {
      this.img2imgCheckbox.checked = true;
      this.denoisingStrength.valueAsNumber = imageInfo.info.denoisingStrength;
      this.resizeModeSelector.currentValue = imageInfo.inputResizeMode;
      this.img2imgInputImage.imageData = imageInfo.inputImage;
      this.inpaintBox.show();
      this.toggleImg2Img();
    } else {
      this.img2imgCheckbox.checked = false;
      this.toggleImg2Img();
    }
    this.showOrHideInpaintCanvas();

    if (imageInfo.scriptName && imageInfo.scriptArgs) {
      this.scriptCheckbox.checked = true;
      this.scriptName.value = imageInfo.scriptName;
      this.scriptArgs.value = imageInfo.scriptArgs;
      this.scriptOptions.style.display = '';
      this.processRetrievedScript(imageInfo);
    } else {
      this.scriptCheckbox.checked = false;
      this.scriptOptions.style.display = 'none';
    }
  }

  retrieveImg2Img(imageData) {
    this.img2imgCheckbox.checked = true;
    this.img2imgInputImage.imageData = imageData;
    this.inpaintBox.show();
    this.toggleImg2Img();
    this.showOrHideInpaintCanvas();
  }

  /**
   * @param {string} prompt
   * @param {string} negativePrompt
   */
  mayOverwritePrompts(prompt, negativePrompt) {
    if (this.prompt.value == '' && this.negativePrompt.value == '') {
      return false;
    }
    if (prompt != this.prompt.value || negativePrompt != this.negativePrompt.value) {
      return true;
    }
    return false;
  }

  resizePromptBoxes() {
    autoResize(this.prompt);
    autoResize(this.negativePrompt);
  }

  toggleImg2Img() {
    this.img2img.style.display = this.img2imgCheckbox.checked ? '' : 'none';
    this.hiresCheckbox.disabled = this.img2imgCheckbox.checked;
    if (this.img2imgCheckbox.checked) {
      this.hiresCheckbox.checked = false;
      this.hiresOptions.style.display = 'none';
    }
  }

  updateAspectRatioFromDimensions() {
    const width = this.widthInput.valueAsNumber;
    const height = this.heightInput.valueAsNumber;
    if (width === 512 && height === 512) {
      this.aspectRatioSelector.currentValue = 1;
    } else if (width === 512 && height === 768) {
      this.aspectRatioSelector.currentValue = 2;
    } else if (width === 768 && height === 512) {
      this.aspectRatioSelector.currentValue = 3;
    } else if (width === 1024 && height === 1024) {
      this.aspectRatioSelector.currentValue = 4;
    } else if (width === 1024 && height === 1536) {
      this.aspectRatioSelector.currentValue = 5;
    } else if (width === 1536 && height === 1024) {
      this.aspectRatioSelector.currentValue = 6;
    } else {
      this.aspectRatioSelector.currentValue = 0;
    }
  }

  updateDimensionsFromAspectRatio() {
    switch (this.aspectRatioSelector.currentValue) {
      case 1:
        this.widthInput.valueAsNumber = 512;
        this.heightInput.valueAsNumber = 512;
        break;
      case 2:
        this.widthInput.valueAsNumber = 512;
        this.heightInput.valueAsNumber = 768;
        break;
      case 3:
        this.widthInput.valueAsNumber = 768;
        this.heightInput.valueAsNumber = 512;
        break;
      case 4:
        this.widthInput.valueAsNumber = 1024;
        this.heightInput.valueAsNumber = 1024;
        break;
      case 5:
        this.widthInput.valueAsNumber = 1024;
        this.heightInput.valueAsNumber = 1536;
        break;
      case 6:
        this.widthInput.valueAsNumber = 1536;
        this.heightInput.valueAsNumber = 1024;
        break;
    }
  }

  processRetrievedScript(/** @type {ImageInfo} */ imageInfo) {
    if (imageInfo.scriptName === 'Ultimate SD upscale' && imageInfo.inputImage) {
      try {
        const args = JSON.parse(imageInfo.scriptArgs);
        if (Array.isArray(args) && args.length == 18) {
          const scaleFactor = args[17];
          if (typeof scaleFactor === 'number' && scaleFactor > 0) {
            const orgWidth = imageInfo.info.width / scaleFactor;
            const orgHeight = imageInfo.info.height / scaleFactor;
            this.widthInput.valueAsNumber = orgWidth;
            this.heightInput.valueAsNumber = orgHeight;
            this.updateAspectRatioFromDimensions();
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
  }

  initInpaintCanvas() {
    const ctx = this.inpaintCanvas.getContext('2d');
    ctx.fillStyle = '#000000';

    const states = this.inpaintCanvasStates;
    let isPainting = false;
    let brushSize = 1;

    let scaleFactor = 1;
    const onBegin = () => {
      isPainting = true;
      scaleFactor = this.img2imgInputImage.image.naturalWidth / this.img2imgInputImage.image.width;
      brushSize = this.inpaintBox.brushSizeValue * scaleFactor;
    };
    const onEnd = () => {
      if (isPainting) {
        isPainting = false;

        if (this.inpaintCanvasStateIndex < states.length - 1) {
          states.splice(this.inpaintCanvasStateIndex + 1);
        }
        states.push(this.inpaintCanvas.toDataURL());
        ++this.inpaintCanvasStateIndex;
      }
    };
    const onMove = (offsetX, offsetY) => {
      if (isPainting) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(offsetX * scaleFactor, offsetY * scaleFactor, brushSize, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    };

    this.inpaintCanvas.addEventListener('mousedown', (e) => {
      if (this.isLoading) return;
      if (!this.inpaintBox.isInpainting || !this.inpaintBox.isUsingBrush) return;

      if (e.button == 0) {
        e.preventDefault();
        onBegin();
      }
    });
    this.inpaintCanvas.addEventListener('mouseleave', onEnd);
    this.inpaintCanvas.addEventListener('mouseup', onEnd);
    this.inpaintCanvas.addEventListener('mousemove', (e) => {
      onMove(e.offsetX, e.offsetY);
    });

    let rect;
    this.inpaintCanvas.addEventListener('touchstart', (e) => {
      if (this.isLoading) return;
      if (!this.inpaintBox.isInpainting || !this.inpaintBox.isUsingBrush) return;

      e.preventDefault();
      rect = this.inpaintCanvas.getBoundingClientRect();
      onBegin();
    });
    this.inpaintCanvas.addEventListener('touchend', onEnd);
    this.inpaintCanvas.addEventListener('touchcancel', onEnd);
    this.inpaintCanvas.addEventListener('touchmove', (e) => {
      if (isPainting) {
        const touch = e.changedTouches[0];
        const offsetX = touch.clientX - rect.left;
        const offsetY = touch.clientY - rect.top;
        onMove(offsetX, offsetY);
      }
    });

    this.inpaintBox.onRedo = () => {
      if (this.inpaintCanvasStateIndex < states.length - 1) {
        const undoImage = new Image();
        undoImage.src = states[++this.inpaintCanvasStateIndex];
        undoImage.onload = () => {
          ctx.clearRect(0, 0, this.inpaintCanvas.width, this.inpaintCanvas.height);
          ctx.save();
          ctx.drawImage(undoImage, 0, 0, this.inpaintCanvas.width, this.inpaintCanvas.height);
          ctx.restore();
          undoImage.remove();
        };
      }
    };

    this.inpaintBox.onUndo = () => {
      if (this.inpaintCanvasStateIndex > 0) {
        const undoImage = new Image();
        undoImage.src = states[--this.inpaintCanvasStateIndex];
        undoImage.onload = () => {
          ctx.clearRect(0, 0, this.inpaintCanvas.width, this.inpaintCanvas.height);
          ctx.save();
          ctx.drawImage(undoImage, 0, 0, this.inpaintCanvas.width, this.inpaintCanvas.height);
          ctx.restore();
          undoImage.remove();
        };
      } else {
        this.inpaintCanvasStateIndex = -1;
        ctx.clearRect(0, 0, this.inpaintCanvas.width, this.inpaintCanvas.height);
      }
    };
  }

  getInpaintMask() {
    const canvas = document.createElement('canvas');
    canvas.width = this.img2imgInputImage.image.naturalWidth;
    canvas.height = this.img2imgInputImage.image.naturalHeight;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(this.inpaintCanvas, 0, 0, canvas.width, canvas.height);

    const result = canvas.toDataURL();
    canvas.remove();
    return result;
  }

  clearInpaintCanvas() {
    this.inpaintCanvasStates.splice(0);
    this.inpaintCanvasStateIndex = -1;
    const ctx = this.inpaintCanvas.getContext('2d');
    ctx.save();
    ctx.clearRect(0, 0, this.inpaintCanvas.width, this.inpaintCanvas.height);
    ctx.restore();
  }

  showOrHideInpaintCanvas() {
    if (this.inpaintBox.isInpainting && this.img2imgInputImage.hasImage) {
      this.inpaintCanvas.style.display = '';
    } else {
      this.inpaintCanvas.style.display = 'none';
    }
  }

  /**
   *
   * @param {() => void} onStart
   * @param {() => void} onEnd
   * @param {(json: any, scriptName: string | undefined, scriptArgs: string | undefined) => void} onSuccess
   * @param {(err: any) => void} onFailure
   * @returns
   */
  generate(onStart, onEnd, onSuccess, onFailure) {
    if (Api.instance.baseUrl == '') return;

    if (this.seed.value == '') {
      this.seed.value = '-1';
    }

    let scriptName = undefined;
    let scriptArgs = undefined;
    if (this.scriptCheckbox.checked) {
      scriptName = this.scriptName.value.trim();
      if (scriptName != '') {
        try {
          scriptArgs = JSON.parse(this.scriptArgs.value.trim());
        } catch {
          return;
        }
      }
    }

    onStart();

    localStorage.setItem('prompt', this.prompt.value);
    localStorage.setItem('negativePrompt', this.negativePrompt.value);
    localStorage.setItem('width', this.widthInput.value);
    localStorage.setItem('height', this.heightInput.value);
    localStorage.setItem('aspectRatio', this.aspectRatioSelector.currentValue.toString());
    localStorage.setItem('steps', this.stepsSelector.currentValue.toString());
    localStorage.setItem('cfg', this.cfgSelector.currentValue.toString());
    localStorage.setItem('script_name', this.scriptName.value);
    localStorage.setItem('script_args', this.scriptArgs.value);

    const width = this.widthInput.valueAsNumber;
    const height = this.heightInput.valueAsNumber;

    if (this.img2imgCheckbox.checked && this.img2imgInputImage.hasImage) {
      /** @type {Img2ImgParameters} */
      const parameters = {
        prompt: this.prompt.value,
        negative_prompt: this.negativePrompt.value,
        sampler_name: AppConfig.instance.selectedSampler ?? defaultParameters.sampler,
        steps: this.stepsSelector.currentValue,
        cfg_scale: this.cfgSelector.currentValue,
        seed: this.seed.value,
        width,
        height,
        restore_faces: this.restoreFacesCheckbox.checked,
        init_images: [this.img2imgInputImage.imageData],
        denoising_strength: this.denoisingStrength.valueAsNumber,
        resize_mode: this.resizeModeSelector.currentValue,
      };
      if (scriptName && scriptArgs) {
        parameters.script_name = scriptName;
        parameters.script_args = scriptArgs;
      }
      if (this.inpaintBox.isInpainting) {
        parameters.mask = this.getInpaintMask();
        parameters.mask_blur = 4;
        parameters.inpainting_mask_invert = !this.inpaintBox.isInpaintingInvert;
        parameters.inpainting_fill = 1;
        parameters.inpaint_full_res = true;
        parameters.inpaint_full_res_padding = 32;
        this.inpaintBox.switchToHandTool();
      }
      Api.instance
        .img2img(parameters)
        .then((json) => {
          onSuccess(json, scriptName, scriptArgs ? JSON.stringify(scriptArgs) : undefined);
        })
        .catch(onFailure)
        .finally(onEnd);
    } else {
      /** @type {Txt2ImgParameters} */
      const parameters = {
        prompt: this.prompt.value,
        negative_prompt: this.negativePrompt.value,
        sampler_name: AppConfig.instance.selectedSampler ?? defaultParameters.sampler,
        steps: this.stepsSelector.currentValue,
        cfg_scale: this.cfgSelector.currentValue,
        seed: this.seed.value,
        width,
        height,
        restore_faces: this.restoreFacesCheckbox.checked,
      };
      if (this.hiresCheckbox.checked) {
        parameters.enable_hr = true;
        parameters.denoising_strength = this.hiresDenoisingStrength.valueAsNumber;
        parameters.hr_scale = this.hiresScale.valueAsNumber;
        parameters.hr_second_pass_steps = this.hiresSteps.valueAsNumber;
      }
      if (scriptName && scriptArgs) {
        parameters.script_name = scriptName;
        parameters.script_args = scriptArgs;
      }
      Api.instance
        .txt2img(parameters)
        .then((json) => {
          onSuccess(json, scriptName, scriptArgs ? JSON.stringify(scriptArgs) : undefined);
        })
        .catch(onFailure)
        .finally(onEnd);
    }
  }

  setLoading(isLoading) {
    this.prompt.disabled = isLoading;
    this.negativePrompt.disabled = isLoading;
    this.widthInput.disabled = isLoading;
    this.heightInput.disabled = isLoading;
    this.aspectRatioSelector.disabled = isLoading;
    this.stepsSelector.disabled = isLoading;
    this.cfgSelector.disabled = isLoading;
    this.seed.disabled = isLoading;

    this.clearPromptButton.disabled = isLoading;
    this.clearNegativePromptButton.disabled = isLoading;
    this.promptExtraButton.disabled = isLoading;
    this.negativePromptExtraButton.disabled = isLoading;
    this.promptClipboardButton.disabled = isLoading;
    this.negativePromptClipboardButton.disabled = isLoading;

    this.clearSeedButton.disabled = isLoading;
    this.restoreFacesCheckbox.disabled = isLoading;
    this.hiresCheckbox.disabled = isLoading;
    this.img2imgCheckbox.disabled = isLoading;
    this.scriptCheckbox.disabled = isLoading;
    this.hiresDenoisingStrength.disabled = isLoading;
    this.hiresScale.disabled = isLoading;
    this.hiresSteps.disabled = isLoading;
    this.denoisingStrength.disabled = isLoading;
    this.resizeModeSelector.disabled = isLoading;
    this.img2imgInputImage.disabled = isLoading;
    this.inpaintBox.disabled = isLoading;
    this.scriptName.disabled = isLoading;
    this.scriptArgs.disabled = isLoading;
    this.selectScriptButton.disabled = isLoading;

    this.isLoading = isLoading;
  }
}
