import Api from '../api.mjs';
import AppConfig from '../types/app-config.mjs';
import Checkbox from './checkbox.mjs';
import Tab from './tab.mjs';

const html = /*html*/ `
<div id="upscale-tab" class="app-tab" style="display:none">
  <div>
    <div class="input-wrapper w100p">
      <input class="input-image-file" type="file" accept="image/png">
      <img class="input-image" alt="Input image" style="display: none">
    </div>
    <div class="option w50p">
      <span class="chk-scale-by"></span>
    </div>
    <div class="option w50p">
      <label class="heading">Scale by</label>
      <input type="number" class="txt-scale-by" value="4" min="1" max="8" step="0.5" onchange="validateInputRange(this)">
    </div>
    <div class="option w50p">
      <label class="heading">Width</label>
      <input type="number" class="txt-scale-width" value="512" min="1" step="32" onchange="validateInputRange(this)">
    </div>
    <div class="option w50p">
      <label class="heading">Height</label>
      <input type="number" class="txt-scale-height" value="512" min="1" step="32" onchange="validateInputRange(this)">
    </div>
    <div class="option w100p">
      <label class="heading">Upscaler</label>
      <select class="sel-upscaler"></select>
    </div>
    <div class="option w50p">
      <span class="chk-upscaler-2"></span>
    </div>
    <div class="option w50p">
      <label class="heading">Visibility</label>
      <input type="number" class="txt-upscaler-2-visibility" value="0" min="0" max="1" step="0.1" onchange="validateInputRange(this)">
    </div>
    <div class="option w100p">
      <label class="heading">Upscaler 2</label>
      <select class="sel-upscaler-2"></select>
    </div>
    <div class="option w50p">
      <label class="heading">CodeFormer Visibility</label>
      <input type="number" class="txt-codeformer-visibility" value="0" min="0" max="1" step="0.1" onchange="validateInputRange(this)">
    </div>
    <div class="option w50p">
      <label class="heading">CodeFormer Weight</label>
      <input type="number" class="txt-codeformer-weight" value="0" min="0" max="1" step="0.1" onchange="validateInputRange(this)">
    </div>
    <div class="option w50p">
      <span class="chk-upscale-first"></span>
    </div>
    <div class="option w50p">
      <label class="heading">GFPGAN Visibility</label>
      <input type="number" class="txt-gfpgan-visibility" value="0" min="0" max="1" step="0.1" onchange="validateInputRange(this)">
    </div>
    <div class="option w100p">
      <button class="btn-upscale" title="Upscale the input image">
        <img src="/img/up-right-and-down-left-from-center-solid.svg">
        UPSCALE
      </button>
    </div>
    <div class="output-wrapper w100p">
      <img class="output-image" alt="Upscaled image" style="display: none">
    </div>
  </div>

  <style>
    #upscale-tab > div {
      width: 100%;
      max-width: 1024px;
      display: flex;
      flex-flow: row wrap;
      justify-content: flex-start;
      align-items: center;
    }

    #upscale-tab .input-wrapper,
    #upscale-tab .output-wrapper {
      display: flex;
      flex-flow: column nowrap;
      justify-content: flex-start;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem;
    }

    #upscale-tab .input-image-file {
      color: transparent;
      width: 100%;
      padding: 1rem;
      border: 1px solid #ffffff;
      border-radius: 0.5rem;
    }

    #upscale-tab .input-image-file::before {
      display: block;
      width: 100%;
      height: 0;
      content: 'Select or drag PNG';
      font-family: 'Montserrat', sans-serif;
      font-size: 1rem;
      text-align: center;
      vertical-align: middle;
      color: #ffffff;
    }

    #upscale-tab .input-image-file::-webkit-file-upload-button {
      visibility: hidden;
    }

    #upscale-tab .input-image,
    #upscale-tab .output-image {
      width: 100%;
      border-radius: 0.5rem;
      border: 1px solid rgba(255, 255, 255, 0.5);
    }

    #upscale-tab .option {
      display: flex;
      flex-flow: row nowrap;
      justify-content: flex-start;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem;
    }

    #upscale-tab .heading {
      font-size: 0.9rem;
    }

    #upscale-tab .btn-upscale {
      width: 100%;
    }

    #upscale-tab input[type=text],
    #upscale-tab input[type=number],
    #upscale-tab select {
      flex-grow: 1;
      min-width: 0;
    }

    #upscale-tab input[type=text]:disabled,
    #upscale-tab input[type=number]:disabled,
    #upscale-tab select:disabled {
      color: hsla(0, 0%, 100%, 0.3);
    }
  </style>
</div>
`;

export default class Upscale extends Tab {
  /** @type {HTMLInputElement} */
  inputImageFile;
  /** @type {HTMLImageElement} */
  inputImage;
  /** @type {Checkbox} */
  scaleByCheckbox;
  /** @type {HTMLInputElement} */
  scaleBy;
  /** @type {HTMLInputElement} */
  scaleWidth;
  /** @type {HTMLInputElement} */
  scaleHeight;
  /** @type {HTMLSelectElement} */
  upscaler;
  /** @type {Checkbox} */
  upscaler2Checkbox;
  /** @type {HTMLInputElement} */
  upscaler2Visibility;
  /** @type {HTMLSelectElement} */
  upscaler2;
  /** @type {HTMLInputElement} */
  codeFormerVisibility;
  /** @type {HTMLInputElement} */
  codeFormerWeight;
  /** @type {Checkbox} */
  upscaleFirst;
  /** @type {HTMLInputElement} */
  gfpganVisibility;

  /** @type {HTMLButtonElement} */
  upscaleButton;

  /** @type {HTMLImageElement} */
  outputImage;

  constructor(/** @type {HTMLElement} */ parent) {
    super(parent, html);
    this.title = 'UPSCALE';

    this.inputImageFile = this.root.querySelector('.input-image-file');
    this.inputImageFile.addEventListener('change', () => {
      if (this.inputImageFile.files.length == 0) return;
      const file = this.inputImageFile.files[0];
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        this.inputImage.src = reader.result;
        this.inputImage.style.display = '';
      });
      reader.readAsDataURL(file);
    });
    this.inputImage = this.root.querySelector('.input-image');
    this.scaleByCheckbox = new Checkbox(
      this.root.querySelector('.chk-scale-by'),
      { assignedId: 'chk-scale-by', label: 'Scale By', extraClasses: ['w100p'] },
      true
    );
    this.scaleBy = this.root.querySelector('.txt-scale-by');
    this.scaleWidth = this.root.querySelector('.txt-scale-width');
    this.scaleHeight = this.root.querySelector('.txt-scale-height');

    this.scaleByCheckbox.onChange = (chk) => {
      this.scaleBy.disabled = !chk.checked;
      this.scaleWidth.disabled = chk.checked;
      this.scaleHeight.disabled = chk.checked;
    };
    this.scaleByCheckbox.checked = true;
    this.scaleBy.disabled = false;
    this.scaleWidth.disabled = true;
    this.scaleHeight.disabled = true;

    this.upscaler = this.root.querySelector('.sel-upscaler');
    this.upscaler2Checkbox = new Checkbox(
      this.root.querySelector('.chk-upscaler-2'),
      { assignedId: 'chk-upscaler-2', label: 'Upscaler 2', extraClasses: ['w100p'] },
      true
    );
    this.upscaler2Visibility = this.root.querySelector('.txt-upscaler-2-visibility');
    this.upscaler2 = this.root.querySelector('.sel-upscaler-2');

    this.upscaler2Checkbox.onChange = (chk) => {
      this.upscaler2Visibility.disabled = !chk.checked;
      this.upscaler2.disabled = !chk.checked;
    };
    this.upscaler2Checkbox.checked = false;
    this.upscaler2Visibility.disabled = true;
    this.upscaler2.disabled = true;

    this.codeFormerVisibility = this.root.querySelector('.txt-codeformer-visibility');
    this.codeFormerWeight = this.root.querySelector('.txt-codeformer-weight');
    this.upscaleFirst = new Checkbox(
      this.root.querySelector('.chk-upscale-first'),
      { assignedId: 'chk-upscale-first', label: 'Upscale First', extraClasses: ['w100p'] },
      true
    );
    this.gfpganVisibility = this.root.querySelector('.txt-gfpgan-visibility');

    this.upscaleButton = this.root.querySelector('.btn-upscale');
    this.outputImage = this.root.querySelector('.output-image');

    this.upscaleButton.addEventListener('click', () => {
      this.upscale();
    });

    AppConfig.instance.upscalerList.forEach((s) => {
      this.upscaler.appendChild(
        Object.assign(document.createElement('option'), {
          value: s,
          innerText: s,
        })
      );
      this.upscaler2.appendChild(
        Object.assign(document.createElement('option'), {
          value: s,
          innerText: s,
        })
      );
    });
  }

  async upscale() {
    if (this.inputImage.src == '') return;
    const inputImageData = this.inputImage.src;
    this.upscaleButton.disabled = true;
    Api.instance
      .upscale({
        resize_mode: this.scaleByCheckbox.checked ? 0 : 1,
        gfpgan_visibility: this.gfpganVisibility.valueAsNumber,
        codeformer_visibility: this.codeFormerVisibility.valueAsNumber,
        codeformer_weight: this.codeFormerWeight.valueAsNumber,
        upscaling_resize: this.scaleBy.valueAsNumber,
        upscaling_resize_w: this.scaleWidth.valueAsNumber,
        upscaling_resize_h: this.scaleHeight.valueAsNumber,
        upscaler_1: this.upscaler.value,
        upscaler_2: this.upscaler2.value,
        extras_upscaler_2_visibility: this.upscaler2Visibility.valueAsNumber,
        upscaleFirst: this.upscaleFirst.checked,
        image: inputImageData,
      })
      .then((json) => {
        const imageData = json.image;
        this.outputImage.src = 'data:image/png;base64,' + imageData;
        this.outputImage.style.display = '';
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        this.upscaleButton.disabled = false;
      });
  }
}
